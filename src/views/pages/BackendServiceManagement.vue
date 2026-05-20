<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useI18n } from 'vue-i18n'
import PageBar from '@/views/components/PageBar.vue'
import FilledButton from '@/views/components/FilledButton.vue'
import OutlinedButton from '@/views/components/OutlinedButton.vue'
import ModalDialog from '@/views/components/ModalDialog.vue'
import FormInput from '@/views/components/FormInput.vue'
import ConfirmDialog from '@/views/components/ConfirmDialog.vue'
import Table from '@/views/components/Table/Table.vue'
import TableHeader from '@/views/components/Table/TableHeader.vue'
import TableMessage from '@/views/components/Table/TableMessage.vue'
import { useConfirmDialog } from '@/composables/useConfirmDialog.js'
import { useBackendStore } from '@/store/backend.js'

const router = useRouter()
const { t } = useI18n()
const backendStore = useBackendStore()

const isCreateModalOpen = ref(false)
const newBackendName = ref('')
const isCreating = ref(false)
const deletingBackendId = ref(null)
const restartingBackendId = ref(null)
let pollInterval = null

const backends = computed(() => backendStore.backends)

const {
  isOpen: isConfirmOpen,
  message: confirmMessage,
  confirmType,
  confirm: askConfirm,
  onConfirm,
  onCancel
} = useConfirmDialog()

const loadBackends = async (silent = false) => {
  try {
    await backendStore.fetchBackends()
  } catch (error) {
    if (!silent) toast.error(error.message || 'Failed to fetch backend services')
  }
}

const submitCreate = async () => {
  const name = newBackendName.value.trim()
  if (!name) {
    toast.error('Name is required')
    return
  }
  isCreating.value = true
  try {
    await backendStore.createBackend(name)
    toast.success('Backend service created')
    isCreateModalOpen.value = false
    newBackendName.value = ''
  } catch (error) {
    toast.error(error.message || 'Failed to create backend service')
  } finally {
    isCreating.value = false
  }
}

const deleteBackend = async (backend) => {
  if (!(await askConfirm(`Delete backend "${backend.name}"? This will destroy all data.`, 'danger'))) return
  deletingBackendId.value = backend.id
  try {
    await backendStore.deleteBackend(backend.id)
    toast.success('Backend service deletion requested')
  } catch (error) {
    toast.error(error.message || 'Failed to delete backend service')
  } finally {
    deletingBackendId.value = null
  }
}

const restartBackend = async (backend) => {
  if (!(await askConfirm(`Restart backend "${backend.name}"?`, 'warning'))) return
  restartingBackendId.value = backend.id
  try {
    await backendStore.restartBackend(backend.id)
    toast.success('Backend restart requested')
  } catch (error) {
    toast.error(error.message || 'Failed to restart backend service')
  } finally {
    restartingBackendId.value = null
  }
}

const openBackend = (backend) => {
  if (backend.status !== 'running') {
    toast.error('Backend must be running before it can be managed')
    return
  }
  router.push({ name: 'Backend Collections', params: { id: backend.id } })
}

const statusClass = (status) => {
  switch (status) {
    case 'running':
      return 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300'
    case 'pending':
    case 'provisioning':
      return 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-300'
    case 'error':
      return 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
}

onMounted(() => {
  loadBackends()
  pollInterval = setInterval(() => loadBackends(true), 10000)
})

onBeforeUnmount(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<template>
  <section class="mx-auto w-full max-w-7xl px-2 md:px-0">
    <PageBar>
      <template #title>{{ t('backends.title') }}</template>
      <template #subtitle>{{ t('backends.subtitle') }}</template>
      <template #buttons>
        <FilledButton type="button" @click="isCreateModalOpen = true">
          {{ t('backends.create') }}
        </FilledButton>
      </template>
    </PageBar>

    <Table>
      <template #header>
        <TableHeader class="w-1/5">{{ t('common.name') }}</TableHeader>
        <TableHeader class="w-1/6">{{ t('common.status') }}</TableHeader>
        <TableHeader class="w-1/6">{{ t('backends.collections') }}</TableHeader>
        <TableHeader class="w-1/6">{{ t('backends.storage') }}</TableHeader>
        <TableHeader class="w-1/6">{{ t('backends.records') }}</TableHeader>
        <TableHeader class="w-1/4 text-right">{{ t('common.actions') }}</TableHeader>
      </template>
      <template #body>
        <tr v-if="backendStore.loading">
          <td colspan="6" class="py-8 text-center text-gray-500">{{ t('common.loading') }}</td>
        </tr>
        <tr v-else-if="backends.length === 0">
          <td colspan="6">
            <TableMessage>{{ t('backends.empty') }}</TableMessage>
          </td>
        </tr>
        <tr
          v-for="backend in backends"
          :key="backend.id"
          class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
          <td class="px-4 py-3">
            <button
              class="text-left font-medium text-gray-900 hover:text-primary-700 disabled:cursor-not-allowed disabled:text-gray-500 dark:text-gray-100 dark:hover:text-primary-300"
              :disabled="backend.status !== 'running'"
              type="button"
              @click="openBackend(backend)">
              {{ backend.name }}
            </button>
            <div v-if="backend.domain" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ backend.domain }}</div>
          </td>
          <td class="px-4 py-3">
            <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium" :class="statusClass(backend.status)">
              {{ backend.status }}
            </span>
          </td>
          <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
            {{ backend.usageStats?.collectionsCount ?? 0 }} / {{ backend.resourceLimit?.maxCollections ?? '-' }}
          </td>
          <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
            {{ backend.usageStats?.storageUsedMb ?? 0 }} / {{ backend.resourceLimit?.maxStorageMb ?? '-' }} MB
          </td>
          <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
            {{ backend.usageStats?.totalRecords ?? 0 }}
          </td>
          <td class="px-4 py-3">
            <div class="flex justify-end gap-2">
              <OutlinedButton slim type="primary" :disabled="backend.status !== 'running'" :click="() => openBackend(backend)">
                {{ t('backends.openAdmin') }}
              </OutlinedButton>
              <OutlinedButton slim type="warning" :disabled="backend.status !== 'running' || restartingBackendId === backend.id" :loading="restartingBackendId === backend.id" :click="() => restartBackend(backend)">
                {{ restartingBackendId === backend.id ? 'Restarting...' : t('backends.restart') }}
              </OutlinedButton>
              <OutlinedButton slim type="danger" :disabled="deletingBackendId === backend.id" :loading="deletingBackendId === backend.id" :click="() => deleteBackend(backend)">
                {{ deletingBackendId === backend.id ? 'Deleting...' : t('common.delete') }}
              </OutlinedButton>
            </div>
          </td>
        </tr>
      </template>
    </Table>

    <ModalDialog :is-open="isCreateModalOpen" :close-modal="() => (isCreateModalOpen = false)" width="md">
      <template #header>{{ t('backends.create') }}</template>
      <template #body>
        <FormInput
          v-model="newBackendName"
          :hint="t('backends.nameHint')"
          :label="t('backends.name')"
          placeholder="my-backend" />
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <OutlinedButton type="secondary" :click="() => (isCreateModalOpen = false)">
            {{ t('common.cancel') }}
          </OutlinedButton>
          <FilledButton type="button" :disabled="isCreating" @click="submitCreate">
            {{ isCreating ? t('backends.creating') : t('common.create') }}
          </FilledButton>
        </div>
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
