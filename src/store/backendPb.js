import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'
import { getHttpBaseUrl } from '@/vendor/utils.js'
import { useAuthStore } from '@/store/auth.js'

function parseProxyJson(data) {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch {
      return data
    }
  }
  return data
}

function errorMessage(error, fallback = 'Request failed') {
  const data = parseProxyJson(error?.response?.data)
  const validation = data?.data || data?.details
  const validationMessages = validation && typeof validation === 'object'
    ? Object.entries(validation)
        .map(([field, value]) => {
          if (typeof value === 'string') return `${field}: ${value}`
          return `${field}: ${value?.message || value?.code || JSON.stringify(value)}`
        })
        .join('; ')
    : ''
  return validationMessages || data?.message || data?.error || error?.message || fallback
}

function normalizeCollection(collection) {
  if (!collection) return collection
  return {
    ...collection,
    fields: collection.fields ?? collection.schema ?? []
  }
}

export const useBackendPbStore = defineStore('backend_pb', () => {
  const tokens = ref({})
  const collections = ref([])
  const currentCollection = ref(null)
  const records = ref([])
  const settings = ref(null)
  const backups = ref([])
  const logs = ref([])
  const totalItems = ref(0)
  const totalPages = ref(1)
  const loading = ref(false)

  function baseUrl(backendId) {
    return `${getHttpBaseUrl()}/backend/${backendId}/proxy`
  }

  function fileUrl(backendId, collectionNameOrId, recordId, fileName) {
    return `${baseUrl(backendId)}/api/files/${collectionNameOrId}/${recordId}/${encodeURIComponent(fileName)}`
  }

  async function authenticate(backendId, force = false) {
    if (!force && tokens.value[backendId]) {
      return tokens.value[backendId]
    }
    const authStore = useAuthStore()
    const response = await axios.post(`${getHttpBaseUrl()}/backend/${backendId}/auth`, null, {
      headers: { Authorization: authStore.FetchBearerToken() }
    })
    const payload = parseProxyJson(response.data)
    const token = payload?.token || payload?.record?.token || payload?.authToken
    if (!token) {
      throw new Error('Backend authentication did not return a token')
    }
    tokens.value = { ...tokens.value, [backendId]: token }
    return token
  }

  async function request(backendId, config, retry = true) {
    const token = await authenticate(backendId)
    try {
      const response = await axios.request({
        ...config,
        url: `${baseUrl(backendId)}${config.url}`,
        headers: {
          ...(config.headers || {}),
          Authorization: `Bearer ${token}`
        }
      })
      return parseProxyJson(response.data)
    } catch (error) {
      if (retry && [401, 403].includes(error?.response?.status)) {
        await authenticate(backendId, true)
        return request(backendId, config, false)
      }
      throw new Error(errorMessage(error))
    }
  }

  async function rawRequest(backendId, config, retry = true) {
    const token = await authenticate(backendId)
    try {
      return await axios.request({
        ...config,
        url: `${baseUrl(backendId)}${config.url}`,
        headers: {
          ...(config.headers || {}),
          Authorization: `Bearer ${token}`
        }
      })
    } catch (error) {
      if (retry && [401, 403].includes(error?.response?.status)) {
        await authenticate(backendId, true)
        return rawRequest(backendId, config, false)
      }
      throw new Error(errorMessage(error))
    }
  }

  async function fetchCollections(backendId) {
    loading.value = true
    try {
      const payload = await request(backendId, {
        method: 'get',
        url: '/api/collections',
        params: { perPage: 500, sort: 'name' }
      })
      const items = Array.isArray(payload) ? payload : payload?.items ?? []
      collections.value = items.map(normalizeCollection).filter((collection) => !collection.name?.startsWith('_'))
      return collections.value
    } finally {
      loading.value = false
    }
  }

  async function fetchCollection(backendId, collectionNameOrId) {
    const payload = await request(backendId, {
      method: 'get',
      url: `/api/collections/${collectionNameOrId}`
    })
    currentCollection.value = normalizeCollection(payload)
    return currentCollection.value
  }

  async function saveCollection(backendId, collection) {
    const payload = {
      ...collection,
      fields: collection.fields ?? []
    }
    delete payload.schema

    const isNew = !payload.id
    const saved = await request(backendId, {
      method: isNew ? 'post' : 'patch',
      url: isNew ? '/api/collections' : `/api/collections/${payload.id}`,
      data: payload
    })
    await fetchCollections(backendId)
    return normalizeCollection(saved)
  }

  async function deleteCollection(backendId, collectionNameOrId) {
    await request(backendId, {
      method: 'delete',
      url: `/api/collections/${collectionNameOrId}`
    })
    await fetchCollections(backendId)
  }

  async function fetchRecords(backendId, collectionNameOrId, options = {}) {
    loading.value = true
    try {
      const payload = await request(backendId, {
        method: 'get',
        url: `/api/collections/${collectionNameOrId}/records`,
        params: {
          page: options.page || 1,
          perPage: options.perPage || 40,
          filter: options.filter || undefined,
          sort: options.sort || undefined,
          expand: options.expand || undefined
        }
      })
      records.value = payload?.items ?? []
      totalItems.value = payload?.totalItems ?? payload?.total ?? records.value.length
      totalPages.value = payload?.totalPages ?? Math.max(1, Math.ceil(totalItems.value / (options.perPage || 40)))
      return payload
    } finally {
      loading.value = false
    }
  }

  async function saveRecord(backendId, collectionNameOrId, record, files = {}) {
    const form = new FormData()
    Object.entries(record).forEach(([key, value]) => {
      if (['id', 'created', 'updated', 'collectionId', 'collectionName', 'expand'].includes(key)) return
      if (value === undefined) return
      if (value === null) {
        form.append(key, '')
      } else if (Array.isArray(value) || typeof value === 'object') {
        form.append(key, JSON.stringify(value))
      } else {
        form.append(key, value)
      }
    })
    Object.entries(files).forEach(([key, value]) => {
      const selectedFiles = Array.from(value || [])
      selectedFiles.forEach((file) => form.append(key, file))
    })
    const isNew = !record.id
    return request(backendId, {
      method: isNew ? 'post' : 'patch',
      url: isNew ? `/api/collections/${collectionNameOrId}/records` : `/api/collections/${collectionNameOrId}/records/${record.id}`,
      data: form
    })
  }

  async function deleteRecord(backendId, collectionNameOrId, recordId) {
    await request(backendId, {
      method: 'delete',
      url: `/api/collections/${collectionNameOrId}/records/${recordId}`
    })
  }

  async function fetchSettings(backendId) {
    settings.value = await request(backendId, {
      method: 'get',
      url: '/api/settings'
    })
    return settings.value
  }

  async function saveSettings(backendId, payload) {
    settings.value = await request(backendId, {
      method: 'patch',
      url: '/api/settings',
      data: payload
    })
    return settings.value
  }

  async function fetchBackups(backendId) {
    const payload = await request(backendId, {
      method: 'get',
      url: '/api/backups'
    })
    backups.value = Array.isArray(payload) ? payload : payload?.items ?? []
    return backups.value
  }

  async function createBackup(backendId, name) {
    await request(backendId, {
      method: 'post',
      url: '/api/backups',
      data: { name }
    })
    return fetchBackups(backendId)
  }

  async function deleteBackup(backendId, key) {
    await request(backendId, {
      method: 'delete',
      url: `/api/backups/${encodeURIComponent(key)}`
    })
    return fetchBackups(backendId)
  }

  async function restoreBackup(backendId, key) {
    await request(backendId, {
      method: 'post',
      url: `/api/backups/${encodeURIComponent(key)}/restore`
    })
  }

  async function uploadBackup(backendId, file) {
    const form = new FormData()
    form.append('file', file)
    await request(backendId, {
      method: 'post',
      url: '/api/backups/upload',
      data: form
    })
    return fetchBackups(backendId)
  }

  async function downloadBackup(backendId, key) {
    const response = await rawRequest(backendId, {
      method: 'get',
      url: `/api/backups/${encodeURIComponent(key)}`,
      responseType: 'blob'
    })
    const objectUrl = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = key
    link.click()
    URL.revokeObjectURL(objectUrl)
  }

  async function fetchLogs(backendId, options = {}) {
    const payload = await request(backendId, {
      method: 'get',
      url: '/api/logs',
      params: {
        page: options.page || 1,
        perPage: options.perPage || 40,
        filter: options.filter || undefined,
        sort: options.sort || '-created'
      }
    })
    logs.value = payload?.items ?? []
    totalItems.value = payload?.totalItems ?? payload?.total ?? logs.value.length
    totalPages.value = payload?.totalPages ?? Math.max(1, Math.ceil(totalItems.value / (options.perPage || 40)))
    return payload
  }

  async function fetchLog(backendId, id) {
    return request(backendId, {
      method: 'get',
      url: `/api/logs/${id}`
    })
  }

  async function importCollections(backendId, collectionsPayload, deleteMissing = false) {
    await request(backendId, {
      method: 'post',
      url: '/api/collections/import',
      data: {
        collections: collectionsPayload,
        deleteMissing
      }
    })
    return fetchCollections(backendId)
  }

  return {
    tokens,
    collections,
    currentCollection,
    records,
    settings,
    backups,
    logs,
    totalItems,
    totalPages,
    loading,
    authenticate,
    fetchCollections,
    fetchCollection,
    saveCollection,
    deleteCollection,
    fetchRecords,
    saveRecord,
    deleteRecord,
    fetchSettings,
    saveSettings,
    fetchBackups,
    createBackup,
    deleteBackup,
    restoreBackup,
    uploadBackup,
    downloadBackup,
    fetchLogs,
    fetchLog,
    importCollections,
    fileUrl
  }
})
