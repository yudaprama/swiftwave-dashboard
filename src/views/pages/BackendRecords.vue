<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import PageBar from '@/views/components/PageBar.vue'
import FilledButton from '@/views/components/FilledButton.vue'
import OutlinedButton from '@/views/components/OutlinedButton.vue'
import FormInput from '@/views/components/FormInput.vue'
import ModalDialog from '@/views/components/ModalDialog.vue'
import ConfirmDialog from '@/views/components/ConfirmDialog.vue'
import Table from '@/views/components/Table/Table.vue'
import TableHeader from '@/views/components/Table/TableHeader.vue'
import TableMessage from '@/views/components/Table/TableMessage.vue'
import RecordEditor from '@/views/components/backend/RecordEditor.vue'
import { useConfirmDialog } from '@/composables/useConfirmDialog.js'
import { useBackendPbStore } from '@/store/backendPb.js'

const route = useRoute()
const router = useRouter()
const backendId = route.params.id
const collectionName = route.params.collectionName
const pbStore = useBackendPbStore()

const page = ref(1)
const perPage = 40
const filter = ref('')
const sort = ref('-created')
const isEditorOpen = ref(false)
const isSaving = ref(false)
const deletingRecordId = ref(null)
const selectedRecord = ref({})
const recordEditor = ref(null)

const {
  isOpen: isConfirmOpen,
  message: confirmMessage,
  confirmType,
  confirm: askConfirm,
  onConfirm,
  onCancel
} = useConfirmDialog()

const collection = computed(() => pbStore.currentCollection)
const fields = computed(() => collection.value?.fields ?? collection.value?.schema ?? [])
const records = computed(() => pbStore.records)
const totalPages = computed(() => pbStore.totalPages)

const visibleFields = computed(() => {
  const preferred = fields.value.filter((field) => !['id', 'created', 'updated'].includes(field.name) && !field.hidden)
  return preferred.slice(0, 5)
})

const loadRecords = async () => {
  try {
    await pbStore.fetchRecords(backendId, collectionName, {
      page: page.value,
      perPage,
      filter: filter.value.trim(),
      sort: sort.value.trim()
    })
  } catch (error) {
    toast.error(error.message || 'Failed to fetch records')
  }
}

const loadInitial = async () => {
  try {
    await pbStore.fetchCollections(backendId)
    await pbStore.fetchCollection(backendId, collectionName)
    await loadRecords()
  } catch (error) {
    toast.error(error.message || 'Failed to load collection')
    router.push({ name: 'Backend Collections', params: { id: backendId } })
  }
}

const openCreate = () => {
  selectedRecord.value = {}
  isEditorOpen.value = true
}

const openEdit = (record) => {
  selectedRecord.value = JSON.parse(JSON.stringify(record))
  isEditorOpen.value = true
}

const saveRecord = async ({ record, files }) => {
  isSaving.value = true
  try {
    await pbStore.saveRecord(backendId, collectionName, record, files)
    toast.success(record.id ? 'Record updated' : 'Record created')
    isEditorOpen.value = false
    await loadRecords()
  } catch (error) {
    toast.error(error.message || 'Failed to save record')
  } finally {
    isSaving.value = false
  }
}

const submitRecord = () => {
  try {
    recordEditor.value?.submit()
  } catch (error) {
    toast.error(error.message || 'Invalid record data')
  }
}

const deleteRecord = async (record) => {
  if (!(await askConfirm('Delete this record?', 'danger'))) return
  deletingRecordId.value = record.id
  try {
    await pbStore.deleteRecord(backendId, collectionName, record.id)
    toast.success('Record deleted')
    await loadRecords()
  } catch (error) {
    toast.error(error.message || 'Failed to delete record')
  } finally {
    deletingRecordId.value = null
  }
}

const applySearch = async () => {
  page.value = 1
  await loadRecords()
}

const prevPage = async () => {
  if (page.value <= 1) return
  page.value--
  await loadRecords()
}

const nextPage = async () => {
  if (page.value >= totalPages.value) return
  page.value++
  await loadRecords()
}

const formatValue = (field, record) => {
  const value = record[field.name]
  if (value === null || value === undefined || value === '') return '-'
  if (field.type === 'bool') return value ? 'Yes' : 'No'
  if (field.type === 'file') return Array.isArray(value) ? `${value.length} file(s)` : value
  if (typeof value === 'object') return JSON.stringify(value)
  const text = String(value)
  return text.length > 64 ? `${text.slice(0, 64)}...` : text
}

const fileValues = (field, record) => {
  const value = record[field.name]
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

onMounted(loadInitial)
</script>

<template>
  <section class="mx-auto w-full max-w-7xl px-2 md:px-0">
    <PageBar>
      <template #title>{{ collectionName }}</template>
      <template #subtitle>Records</template>
      <template #buttons>
        <OutlinedButton type="secondary" :click="() => router.push({ name: 'Backend Collections', params: { id: backendId } })">Back</OutlinedButton>
        <FilledButton type="button" @click="openCreate">New Record</FilledButton>
      </template>
    </PageBar>

    <div class="mb-4 grid gap-3 rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-secondary-800 md:grid-cols-[1fr_220px_auto]">
      <FormInput v-model="filter" label="Filter" placeholder="status = 'published'" />
      <FormInput v-model="sort" label="Sort" placeholder="-created" />
      <div class="flex items-end">
        <FilledButton type="button" @click="applySearch">Apply</FilledButton>
      </div>
    </div>

    <Table>
      <template #header>
        <TableHeader class="w-1/6">ID</TableHeader>
        <TableHeader v-for="field in visibleFields" :key="field.name" class="w-1/6">
          {{ field.name }}
        </TableHeader>
        <TableHeader class="w-1/5 text-right">Actions</TableHeader>
      </template>
      <template #body>
        <tr v-if="pbStore.loading">
          <td :colspan="visibleFields.length + 2" class="py-8 text-center text-gray-500">Loading...</td>
        </tr>
        <tr v-else-if="records.length === 0">
          <td :colspan="visibleFields.length + 2">
            <TableMessage>No records found.</TableMessage>
          </td>
        </tr>
        <tr v-for="record in records" :key="record.id" class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
          <td class="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{{ record.id }}</td>
          <td v-for="field in visibleFields" :key="field.name" class="max-w-xs px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
            <div v-if="field.type === 'file'" class="space-y-1">
              <a
                v-for="fileName in fileValues(field, record)"
                :key="fileName"
                class="block truncate text-primary-700 hover:underline dark:text-primary-300"
                :href="pbStore.fileUrl(backendId, collection?.id || collectionName, record.id, fileName)"
                target="_blank">
                {{ fileName }}
              </a>
              <span v-if="fileValues(field, record).length === 0">-</span>
            </div>
            <span v-else>{{ formatValue(field, record) }}</span>
          </td>
          <td class="px-4 py-3">
            <div class="flex justify-end gap-2">
              <OutlinedButton slim type="secondary" :click="() => openEdit(record)">Edit</OutlinedButton>
              <OutlinedButton slim type="danger" :disabled="deletingRecordId === record.id" :loading="deletingRecordId === record.id" :click="() => deleteRecord(record)">
                {{ deletingRecordId === record.id ? 'Deleting...' : 'Delete' }}
              </OutlinedButton>
            </div>
          </td>
        </tr>
      </template>
    </Table>

    <div v-if="totalPages > 1" class="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
      <span>Page {{ page }} of {{ totalPages }}</span>
      <div class="flex gap-2">
        <OutlinedButton slim type="secondary" :disabled="page <= 1" :click="prevPage">Prev</OutlinedButton>
        <OutlinedButton slim type="secondary" :disabled="page >= totalPages" :click="nextPage">Next</OutlinedButton>
      </div>
    </div>

    <ModalDialog :is-open="isEditorOpen" :close-modal="() => (isEditorOpen = false)" width="3xl">
      <template #header>{{ selectedRecord.id ? 'Edit Record' : 'New Record' }}</template>
      <template #body>
        <RecordEditor
          ref="recordEditor"
          :collections="pbStore.collections"
          :fields="fields"
          :record="selectedRecord"
          @submit="saveRecord" />
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <OutlinedButton type="secondary" :click="() => (isEditorOpen = false)">Cancel</OutlinedButton>
          <FilledButton type="button" :disabled="isSaving" :loading="isSaving" @click="submitRecord">
            {{ isSaving ? 'Saving...' : 'Save' }}
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
