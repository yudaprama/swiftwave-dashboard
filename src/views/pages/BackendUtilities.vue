<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import PageBar from '@/views/components/PageBar.vue'
import FilledButton from '@/views/components/FilledButton.vue'
import OutlinedButton from '@/views/components/OutlinedButton.vue'
import FormInput from '@/views/components/FormInput.vue'
import FormTextarea from '@/views/components/FormTextarea.vue'
import ModalDialog from '@/views/components/ModalDialog.vue'
import ConfirmDialog from '@/views/components/ConfirmDialog.vue'
import Table from '@/views/components/Table/Table.vue'
import TableHeader from '@/views/components/Table/TableHeader.vue'
import TableMessage from '@/views/components/Table/TableMessage.vue'
import { useConfirmDialog } from '@/composables/useConfirmDialog.js'
import { useBackendStore } from '@/store/backend.js'
import { useBackendPbStore } from '@/store/backendPb.js'

const route = useRoute()
const router = useRouter()
const backendId = route.params.id
const backendStore = useBackendStore()
const pbStore = useBackendPbStore()

const activeTab = ref('settings')
const isSaving = ref(false)
const loadingAction = ref('')
const settingsForm = ref(null)
const backupName = ref('')
const backupFile = ref(null)
const logPage = ref(1)
const logFilter = ref('')
const logSort = ref('-created')
const selectedLog = ref(null)
const isLogOpen = ref(false)
const importJson = ref('')
const deleteMissing = ref(false)

const {
  isOpen: isConfirmOpen,
  message: confirmMessage,
  confirmType,
  confirm: askConfirm,
  onConfirm,
  onCancel
} = useConfirmDialog()

const collections = computed(() => pbStore.collections)
const publicApiBase = computed(() => `/backend/${backendId}/proxy`)
const backend = computed(() => backendStore.currentBackend)
const isBackendRunning = computed(() => backend.value?.status === 'running')
const destructiveDisabled = computed(() => !isBackendRunning.value || !!loadingAction.value)

const tabs = [
  { id: 'settings', label: 'Settings' },
  { id: 'backups', label: 'Backups' },
  { id: 'logs', label: 'Logs' },
  { id: 'sync', label: 'Import / Export' },
  { id: 'api', label: 'API Preview' }
]

const exportJson = computed(() => {
  const payload = collections.value.map((collection) => {
    const clone = JSON.parse(JSON.stringify(collection))
    delete clone.created
    delete clone.updated
    if (clone.oauth2) delete clone.oauth2.providers
    return clone
  })
  return JSON.stringify(payload, null, 2)
})

const apiPreview = computed(() => {
  return collections.value
    .map((collection) => {
      const base = `${publicApiBase.value}/api/collections/${collection.name}/records`
      return [
        `# ${collection.name}`,
        `GET    ${base}`,
        `GET    ${base}/{id}`,
        collection.type !== 'view' ? `POST   ${base}` : '',
        collection.type !== 'view' ? `PATCH  ${base}/{id}` : '',
        collection.type !== 'view' ? `DELETE ${base}/{id}` : '',
        '',
        `Fields: ${(collection.fields || []).map((field) => `${field.name}:${field.type}`).join(', ') || '(none)'}`
      ]
        .filter((line) => line !== '')
        .join('\n')
    })
    .join('\n\n')
})

const loadSettings = async () => {
  const settings = await pbStore.fetchSettings(backendId)
  settingsForm.value = {
    meta: settings.meta || {},
    logs: settings.logs || {},
    backups: settings.backups || {}
  }
}

const loadBackups = async () => {
  await pbStore.fetchBackups(backendId)
}

const loadLogs = async () => {
  await pbStore.fetchLogs(backendId, {
    page: logPage.value,
    perPage: 40,
    filter: logFilter.value.trim(),
    sort: logSort.value.trim()
  })
}

const loadAll = async () => {
  try {
    await backendStore.fetchBackend(backendId)
    if (!isBackendRunning.value) {
      return
    }
    await pbStore.fetchCollections(backendId)
    await loadSettings()
    await loadBackups()
    await loadLogs()
  } catch (error) {
    toast.error(error.message || 'Failed to load backend utilities')
    router.push('/backends')
  }
}

const saveSettings = async () => {
  if (!isBackendRunning.value) return
  isSaving.value = true
  try {
    await pbStore.saveSettings(backendId, settingsForm.value)
    toast.success('Settings saved')
    await loadSettings()
  } catch (error) {
    toast.error(error.message || 'Failed to save settings')
  } finally {
    isSaving.value = false
  }
}

const createBackup = async () => {
  if (!isBackendRunning.value) return
  if (!backupName.value.trim()) {
    toast.error('Backup name is required')
    return
  }
  loadingAction.value = 'createBackup'
  try {
    await pbStore.createBackup(backendId, backupName.value.trim())
    toast.success('Backup created')
    backupName.value = ''
  } catch (error) {
    toast.error(error.message || 'Failed to create backup')
  } finally {
    loadingAction.value = ''
  }
}

const uploadBackup = async () => {
  if (!isBackendRunning.value) return
  if (!backupFile.value) {
    toast.error('Select a backup file first')
    return
  }
  loadingAction.value = 'uploadBackup'
  try {
    await pbStore.uploadBackup(backendId, backupFile.value)
    toast.success('Backup uploaded')
    backupFile.value = null
  } catch (error) {
    toast.error(error.message || 'Failed to upload backup')
  } finally {
    loadingAction.value = ''
  }
}

const deleteBackup = async (backup) => {
  if (!isBackendRunning.value) return
  if (!(await askConfirm(`Delete backup "${backup.key}"?`, 'danger'))) return
  loadingAction.value = `deleteBackup:${backup.key}`
  try {
    await pbStore.deleteBackup(backendId, backup.key)
    toast.success('Backup deleted')
  } catch (error) {
    toast.error(error.message || 'Failed to delete backup')
  } finally {
    loadingAction.value = ''
  }
}

const restoreBackup = async (backup) => {
  if (!isBackendRunning.value) return
  if (!(await askConfirm(`Restore backup "${backup.key}"? Current data will be replaced.`, 'danger'))) return
  loadingAction.value = `restoreBackup:${backup.key}`
  try {
    await pbStore.restoreBackup(backendId, backup.key)
    toast.success('Backup restore requested')
  } catch (error) {
    toast.error(error.message || 'Failed to restore backup')
  } finally {
    loadingAction.value = ''
  }
}

const downloadBackup = async (backup) => {
  if (!isBackendRunning.value) return
  loadingAction.value = `downloadBackup:${backup.key}`
  try {
    await pbStore.downloadBackup(backendId, backup.key)
  } catch (error) {
    toast.error(error.message || 'Failed to download backup')
  } finally {
    loadingAction.value = ''
  }
}

const openLog = async (log) => {
  try {
    selectedLog.value = await pbStore.fetchLog(backendId, log.id)
    isLogOpen.value = true
  } catch (error) {
    toast.error(error.message || 'Failed to load log')
  }
}

const importCollections = async () => {
  if (!isBackendRunning.value) return
  let payload
  try {
    payload = JSON.parse(importJson.value)
  } catch {
    toast.error('Import JSON is invalid')
    return
  }
  if (!Array.isArray(payload)) {
    toast.error('Import JSON must be an array of collections')
    return
  }
  if (!(await askConfirm('Import collections into this backend?', 'warning'))) return
  loadingAction.value = 'importCollections'
  try {
    await pbStore.importCollections(backendId, payload, deleteMissing.value)
    toast.success('Collections imported')
    importJson.value = ''
  } catch (error) {
    toast.error(error.message || 'Failed to import collections')
  } finally {
    loadingAction.value = ''
  }
}

const downloadExport = () => {
  const blob = new Blob([exportJson.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'pb_schema.json'
  link.click()
  URL.revokeObjectURL(url)
}

const copyApiPreview = async () => {
  await navigator.clipboard.writeText(apiPreview.value)
  toast.success('API preview copied')
}

onMounted(loadAll)
</script>

<template>
  <section class="mx-auto w-full max-w-7xl px-2 md:px-0">
    <PageBar>
      <template #title>Backend Utilities</template>
      <template #subtitle>Settings, backups, logs, schema sync, and API preview</template>
      <template #buttons>
        <OutlinedButton type="secondary" :click="() => router.push({ name: 'Backend Collections', params: { id: backendId } })">Collections</OutlinedButton>
      </template>
    </PageBar>

    <div class="mb-5 border-b border-gray-200 dark:border-gray-700">
      <nav class="-mb-px flex flex-wrap gap-4">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="border-b-2 px-1 py-2 text-sm font-medium"
          :class="activeTab === tab.id ? 'border-primary-600 text-primary-700 dark:text-primary-300' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'"
          type="button"
          @click="activeTab = tab.id">
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <div
      v-if="backend && !isBackendRunning"
      class="mb-5 rounded-md border border-warning-200 bg-warning-50 p-4 text-sm text-warning-800 dark:border-warning-800 dark:bg-warning-950 dark:text-warning-200">
      Backend "{{ backend.name }}" is {{ backend.status }}. Utilities are read-only until the backend is running.
    </div>

    <div v-if="activeTab === 'settings' && settingsForm" class="space-y-5">
      <div class="grid gap-4 md:grid-cols-2">
        <FormInput v-model="settingsForm.meta.appName" label="App name" placeholder="SwiftWave Backend" />
        <FormInput v-model="settingsForm.meta.appUrl" label="App URL" placeholder="https://backend.example.com" />
        <FormInput v-model="settingsForm.logs.maxDays" label="Logs retention days" type="number" />
        <FormInput v-model="settingsForm.logs.minLevel" label="Minimum log level" type="number" />
        <FormInput v-model="settingsForm.backups.cron" label="Backup cron" placeholder="0 0 * * *" />
        <FormInput v-model="settingsForm.backups.cronMaxKeep" label="Cron backups max keep" type="number" />
      </div>
      <div class="flex flex-wrap gap-4">
        <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input v-model="settingsForm.logs.logIP" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" type="checkbox" />
          Enable IP logging
        </label>
        <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input v-model="settingsForm.logs.logAuthId" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" type="checkbox" />
          Enable auth id logging
        </label>
      </div>
      <FilledButton type="button" :disabled="!isBackendRunning || isSaving" :loading="isSaving" @click="saveSettings">{{ isSaving ? 'Saving...' : 'Save Settings' }}</FilledButton>
    </div>

    <div v-else-if="activeTab === 'settings' && backend && !isBackendRunning" class="rounded-md border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
      Settings are unavailable while the backend is not running.
    </div>

    <div v-if="activeTab === 'backups'" class="space-y-5">
      <div class="grid gap-4 rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-secondary-800 md:grid-cols-[1fr_auto]">
        <FormInput v-model="backupName" label="Backup name" placeholder="manual-backup.zip" />
        <div class="flex items-end">
          <FilledButton type="button" :disabled="destructiveDisabled" :loading="loadingAction === 'createBackup'" @click="createBackup">Create Backup</FilledButton>
        </div>
      </div>
      <div class="grid gap-4 rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-secondary-800 md:grid-cols-[1fr_auto]">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Upload backup</label>
          <input
            class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 file:mr-3 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-700 dark:border-gray-600 dark:bg-secondary-700 dark:text-gray-100"
            type="file"
            @change="backupFile = $event.target.files?.[0] || null" />
        </div>
        <div class="flex items-end">
          <OutlinedButton type="primary" :disabled="destructiveDisabled" :loading="loadingAction === 'uploadBackup'" :click="uploadBackup">Upload</OutlinedButton>
        </div>
      </div>

      <Table>
        <template #header>
          <TableHeader>Name</TableHeader>
          <TableHeader>Modified</TableHeader>
          <TableHeader>Size</TableHeader>
          <TableHeader class="text-right">Actions</TableHeader>
        </template>
        <template #body>
          <tr v-if="pbStore.backups.length === 0">
            <td colspan="4"><TableMessage>No backups found.</TableMessage></td>
          </tr>
          <tr v-for="backup in pbStore.backups" :key="backup.key" class="border-b dark:border-gray-700">
            <td class="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{{ backup.key }}</td>
            <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ backup.modified || '-' }}</td>
            <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ backup.size || '-' }}</td>
            <td class="px-4 py-3">
              <div class="flex justify-end gap-2">
                <OutlinedButton slim type="primary" :disabled="destructiveDisabled" :loading="loadingAction === `downloadBackup:${backup.key}`" :click="() => downloadBackup(backup)">Download</OutlinedButton>
                <OutlinedButton slim type="warning" :disabled="destructiveDisabled" :loading="loadingAction === `restoreBackup:${backup.key}`" :click="() => restoreBackup(backup)">Restore</OutlinedButton>
                <OutlinedButton slim type="danger" :disabled="destructiveDisabled" :loading="loadingAction === `deleteBackup:${backup.key}`" :click="() => deleteBackup(backup)">Delete</OutlinedButton>
              </div>
            </td>
          </tr>
        </template>
      </Table>
    </div>

    <div v-if="activeTab === 'logs'" class="space-y-4">
      <div class="grid gap-3 rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-secondary-800 md:grid-cols-[1fr_220px_auto]">
        <FormInput v-model="logFilter" label="Filter" placeholder="data.status >= 500" />
        <FormInput v-model="logSort" label="Sort" placeholder="-created" />
        <div class="flex items-end">
          <FilledButton type="button" @click="() => { logPage = 1; loadLogs() }">Apply</FilledButton>
        </div>
      </div>
      <Table>
        <template #header>
          <TableHeader>Level</TableHeader>
          <TableHeader>Message</TableHeader>
          <TableHeader>Created</TableHeader>
          <TableHeader class="text-right">Actions</TableHeader>
        </template>
        <template #body>
          <tr v-if="pbStore.logs.length === 0">
            <td colspan="4"><TableMessage>No logs found.</TableMessage></td>
          </tr>
          <tr v-for="log in pbStore.logs" :key="log.id" class="border-b dark:border-gray-700">
            <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ log.level }}</td>
            <td class="max-w-xl truncate px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{{ log.message }}</td>
            <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ log.created }}</td>
            <td class="px-4 py-3 text-right">
              <OutlinedButton slim type="primary" :click="() => openLog(log)">View</OutlinedButton>
            </td>
          </tr>
        </template>
      </Table>
      <div v-if="pbStore.totalPages > 1" class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>Page {{ logPage }} of {{ pbStore.totalPages }}</span>
        <div class="flex gap-2">
          <OutlinedButton slim type="secondary" :disabled="logPage <= 1" :click="() => { logPage--; loadLogs() }">Prev</OutlinedButton>
          <OutlinedButton slim type="secondary" :disabled="logPage >= pbStore.totalPages" :click="() => { logPage++; loadLogs() }">Next</OutlinedButton>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'sync'" class="grid gap-5 lg:grid-cols-2">
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Export collections</h3>
          <OutlinedButton slim type="primary" :click="downloadExport">Download JSON</OutlinedButton>
        </div>
        <FormTextarea :model-value="exportJson" readonly :rows="18" />
      </div>
      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Import collections</h3>
        <FormTextarea v-model="importJson" label="Collections JSON" :rows="18" />
        <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input v-model="deleteMissing" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" type="checkbox" />
          Delete collections missing from import
        </label>
        <FilledButton type="button" :disabled="destructiveDisabled" :loading="loadingAction === 'importCollections'" @click="importCollections">Import Collections</FilledButton>
      </div>
    </div>

    <div v-if="activeTab === 'api'" class="space-y-3">
      <div class="flex justify-end">
        <OutlinedButton slim type="primary" :click="copyApiPreview">Copy</OutlinedButton>
      </div>
      <pre class="max-h-[70vh] overflow-auto rounded-md border border-gray-200 bg-gray-950 p-4 text-sm text-gray-100 dark:border-gray-700">{{ apiPreview }}</pre>
    </div>

    <ModalDialog :is-open="isLogOpen" :close-modal="() => (isLogOpen = false)" width="3xl">
      <template #header>Log Details</template>
      <template #body>
        <pre class="max-h-[60vh] overflow-auto rounded-md bg-gray-950 p-4 text-sm text-gray-100">{{ JSON.stringify(selectedLog, null, 2) }}</pre>
      </template>
      <template #footer>
        <OutlinedButton type="secondary" :click="() => (isLogOpen = false)">Close</OutlinedButton>
      </template>
    </ModalDialog>

    <ConfirmDialog
      :confirm-type="confirmType"
      :is-open="isConfirmOpen"
      :message="confirmMessage"
      @cancel="onCancel"
      @confirm="onConfirm" />
  </section>
</template>
