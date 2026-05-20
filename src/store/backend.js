import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApolloClient } from '@vue/apollo-composable'
import gql from 'graphql-tag'

const BACKEND_SERVICE_FIELDS = gql`
  fragment BackendServiceFields on BackendService {
    id
    name
    status
    domain
    resourceLimit {
      maxCollections
      maxRecordsPerCollection
      maxStorageMb
      memoryMb
    }
    usageStats {
      collectionsCount
      totalRecords
      storageUsedMb
    }
    createdAt
    updatedAt
  }
`

export const useBackendStore = defineStore('backend', () => {
  const backends = ref([])
  const currentBackend = ref(null)
  const loading = ref(false)

  async function fetchBackends() {
    loading.value = true
    try {
      const { resolveClient } = useApolloClient()
      const client = resolveClient()
      const { data } = await client.query({
        query: gql`
          ${BACKEND_SERVICE_FIELDS}
          query {
            backendServices {
              ...BackendServiceFields
            }
          }
        `,
        fetchPolicy: 'network-only'
      })
      backends.value = data.backendServices ?? []
      return backends.value
    } finally {
      loading.value = false
    }
  }

  async function createBackend(name) {
    const { resolveClient } = useApolloClient()
    const client = resolveClient()
    const { data } = await client.mutate({
      mutation: gql`
        ${BACKEND_SERVICE_FIELDS}
        mutation ($input: BackendServiceInput!) {
          createBackendService(input: $input) {
            ...BackendServiceFields
          }
        }
      `,
      variables: { input: { name } }
    })
    await fetchBackends()
    return data.createBackendService
  }

  async function fetchBackend(id) {
    const { resolveClient } = useApolloClient()
    const client = resolveClient()
    const { data } = await client.query({
      query: gql`
        ${BACKEND_SERVICE_FIELDS}
        query ($id: Uint!) {
          backendService(id: $id) {
            ...BackendServiceFields
          }
        }
      `,
      variables: { id: Number(id) },
      fetchPolicy: 'network-only'
    })
    currentBackend.value = data.backendService
    return currentBackend.value
  }

  async function deleteBackend(id) {
    const { resolveClient } = useApolloClient()
    const client = resolveClient()
    const { data } = await client.mutate({
      mutation: gql`
        mutation ($id: Uint!) {
          deleteBackendService(id: $id)
        }
      `,
      variables: { id }
    })
    await fetchBackends()
    return data.deleteBackendService
  }

  async function restartBackend(id) {
    const { resolveClient } = useApolloClient()
    const client = resolveClient()
    const { data } = await client.mutate({
      mutation: gql`
        mutation ($id: Uint!) {
          restartBackendService(id: $id)
        }
      `,
      variables: { id }
    })
    await fetchBackends()
    return data.restartBackendService
  }

  return {
    backends,
    currentBackend,
    loading,
    fetchBackends,
    fetchBackend,
    createBackend,
    deleteBackend,
    restartBackend
  }
})
