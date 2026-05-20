<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import PageBar from '@/views/components/PageBar.vue'
import FilledButton from '@/views/components/FilledButton.vue'
import OutlinedButton from '@/views/components/OutlinedButton.vue'
import Table from '@/views/components/Table/Table.vue'
import TableHeader from '@/views/components/Table/TableHeader.vue'
import TableMessage from '@/views/components/Table/TableMessage.vue'
import ModalDialog from '@/views/components/ModalDialog.vue'
import FormInput from '@/views/components/FormInput.vue'
import FormTextarea from '@/views/components/FormTextarea.vue'
import ConfirmDialog from '@/views/components/ConfirmDialog.vue'
import FieldEditor from '@/views/components/backend/FieldEditor.vue'
import { useConfirmDialog } from '@/composables/useConfirmDialog.js'
import { useBackendPbStore } from '@/store/backendPb.js'

const route = useRoute()
const router = useRouter()
const backendId = route.params.id
const pbStore = useBackendPbStore()

const isEditorOpen = ref(false)
const isSaving = ref(false)
const deletingCollectionId = ref(null)
const editorTab = ref('fields')
const collectionForm = ref(null)

const emptyCollection = () => ({
  name: '',
  type: 'base',
  fields: [],
  indexes: [],
  listRule: '',
  viewRule: '',
  createRule: '',
  updateRule: '',
  deleteRule: '',
  passwordAuth: {
    enabled: true
  }
})

const {
  isOpen: isConfirmOpen,
  message: confirmMessage,
  confirmType,
  confirm: askConfirm,
  onConfirm,
  onCancel
} = useConfirmDialog()

const collections = computed(() => pbStore.collections)

const indexText = computed({
  get: () => (collectionForm.value?.indexes || []).join('\n'),
  set: (value) => {
    collectionForm.value.indexes = value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  }
})

const loadCollections = async () => {
  try {
    await pbStore.fetchCollections(backendId)
  } catch (error) {
    toast.error(error.message || 'Failed to fetch collections')
    router.push('/backends')
  }
}

const openCreate = () => {
  collectionForm.value = emptyCollection()
  editorTab.value = 'fields'
  isEditorOpen.value = true
}

const openEdit = (collection) => {
  collectionForm.value = JSON.parse(JSON.stringify(collection))
  collectionForm.value.fields = collectionForm.value.fields ?? collectionForm.value.schema ?? []
  collectionForm.value.indexes = collectionForm.value.indexes ?? []
  collectionForm.value.passwordAuth = collectionForm.value.passwordAuth ?? { enabled: true }
  editorTab.value = collectionForm.value.type === 'view' ? 'query' : 'fields'
  isEditorOpen.value = true
}

const saveCollection = async () => {
  if (!collectionForm.value?.name?.trim()) {
    toast.error('Collection name is required')
    return
  }
  isSaving.value = true
  try {
    await pbStore.saveCollection(backendId, collectionForm.value)
    toast.success(collectionForm.value.id ? 'Collection updated' : 'Collection created')
    isEditorOpen.value = false
  } catch (error) {
    toast.error(error.message || 'Failed to save collection')
  } finally {
    isSaving.value = false
  }
}

const deleteCollection = async (collection) => {
  if (!(await askConfirm(`Delete collection "${collection.name}"? This will destroy all records.`, 'danger'))) return
  deletingCollectionId.value = collection.id || collection.name
  try {
    await pbStore.deleteCollection(backendId, collection.id || collection.name)
    toast.success('Collection deleted')
  } catch (error) {
    toast.error(error.message || 'Failed to delete collection')
  } finally {
    deletingCollectionId.value = null
  }
}

const openRecords = (collection) => {
  router.push({ name: 'Backend Records', params: { id: backendId, collectionName: collection.name } })
}

const typeClass = (type) => {
  switch (type) {
    case 'auth':
      return 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300'
    case 'view':
      return 'bg-info-100 text-info-800 dark:bg-info-900 dark:text-info-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
}

onMounted(loadCollections)
</script>

<template>
  <section class="mx-auto w-full max-w-7xl px-2 md:px-0">
    <PageBar>
      <template #title>Collections</template>
      <template #subtitle>Manage backend collections, fields, and API rules</template>
      <template #buttons>
        <OutlinedButton type="secondary" :click="() => router.push('/backends')">Back</OutlinedButton>
        <OutlinedButton type="primary" :click="() => router.push({ name: 'Backend Utilities', params: { id: backendId } })">Utilities</OutlinedButton>
        <FilledButton type="button" @click="openCreate">New Collection</FilledButton>
      </template>
    </PageBar>

    <Table>
      <template #header>
        <TableHeader class="w-1/3">Name</TableHeader>
        <TableHeader class="w-1/6">Type</TableHeader>
        <TableHeader class="w-1/6">Fields</TableHeader>
        <TableHeader class="w-1/6">Rules</TableHeader>
        <TableHeader class="w-1/4 text-right">Actions</TableHeader>
      </template>
      <template #body>
        <tr v-if="pbStore.loading">
          <td colspan="5" class="py-8 text-center text-gray-500">Loading...</td>
        </tr>
        <tr v-else-if="collections.length === 0">
          <td colspan="5">
            <TableMessage>No collections yet. Create one to store data.</TableMessage>
          </td>
        </tr>
        <tr
          v-for="collection in collections"
          :key="collection.id"
          class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
          <td class="px-4 py-3">
            <button class="font-medium text-gray-900 hover:text-primary-700 dark:text-gray-100 dark:hover:text-primary-300" type="button" @click="openRecords(collection)">
              {{ collection.name }}
            </button>
          </td>
          <td class="px-4 py-3">
            <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium" :class="typeClass(collection.type)">
              {{ collection.type }}
            </span>
          </td>
          <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
            {{ collection.fields?.length ?? 0 }}
          </td>
          <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
            {{ [collection.listRule, collection.viewRule, collection.createRule, collection.updateRule, collection.deleteRule].filter((rule) => rule !== undefined && rule !== null && rule !== '').length }}
          </td>
          <td class="px-4 py-3">
            <div class="flex justify-end gap-2">
              <OutlinedButton slim type="primary" :click="() => openRecords(collection)">Records</OutlinedButton>
              <OutlinedButton slim type="secondary" :click="() => openEdit(collection)">Edit</OutlinedButton>
              <OutlinedButton
                slim
                type="danger"
                :disabled="deletingCollectionId === (collection.id || collection.name)"
                :loading="deletingCollectionId === (collection.id || collection.name)"
                :click="() => deleteCollection(collection)">
                {{ deletingCollectionId === (collection.id || collection.name) ? 'Deleting...' : 'Delete' }}
              </OutlinedButton>
            </div>
          </td>
        </tr>
      </template>
    </Table>

    <ModalDialog :is-open="isEditorOpen" :close-modal="() => (isEditorOpen = false)" width="5xl">
      <template #header>{{ collectionForm?.id ? 'Edit Collection' : 'New Collection' }}</template>
      <template #body>
        <div v-if="collectionForm" class="space-y-5">
          <div class="grid gap-4 md:grid-cols-3">
            <FormInput v-model="collectionForm.name" label="Collection Name" placeholder="posts" />
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
              <select
                v-model="collectionForm.type"
                class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-secondary-700 dark:text-gray-100">
                <option value="base">Base</option>
                <option value="auth">Auth</option>
                <option value="view">View</option>
              </select>
            </div>
            <FormInput v-model="collectionForm.id" disabled label="ID" placeholder="Generated after save" />
          </div>

          <div class="border-b border-gray-200 dark:border-gray-700">
            <nav class="-mb-px flex flex-wrap gap-4">
              <button
                v-if="collectionForm.type !== 'view'"
                class="border-b-2 px-1 py-2 text-sm font-medium"
                :class="editorTab === 'fields' ? 'border-primary-600 text-primary-700 dark:text-primary-300' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'"
                type="button"
                @click="editorTab = 'fields'">
                Fields
              </button>
              <button
                v-if="collectionForm.type === 'view'"
                class="border-b-2 px-1 py-2 text-sm font-medium"
                :class="editorTab === 'query' ? 'border-primary-600 text-primary-700 dark:text-primary-300' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'"
                type="button"
                @click="editorTab = 'query'">
                Query
              </button>
              <button
                class="border-b-2 px-1 py-2 text-sm font-medium"
                :class="editorTab === 'rules' ? 'border-primary-600 text-primary-700 dark:text-primary-300' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'"
                type="button"
                @click="editorTab = 'rules'">
                API Rules
              </button>
              <button
                class="border-b-2 px-1 py-2 text-sm font-medium"
                :class="editorTab === 'options' ? 'border-primary-600 text-primary-700 dark:text-primary-300' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'"
                type="button"
                @click="editorTab = 'options'">
                Options
              </button>
            </nav>
          </div>

          <FieldEditor
            v-if="editorTab === 'fields' && collectionForm.type !== 'view'"
            v-model="collectionForm.fields"
            :collections="collections" />

          <div v-if="editorTab === 'query' && collectionForm.type === 'view'" class="space-y-4">
            <FormTextarea
              v-model="collectionForm.viewQuery"
              hint="SQL SELECT query for this view collection."
              label="View query"
              :rows="10" />
          </div>

          <div v-if="editorTab === 'rules'" class="grid gap-4 md:grid-cols-2">
            <FormTextarea v-model="collectionForm.listRule" label="List rule" :rows="3" />
            <FormTextarea v-model="collectionForm.viewRule" label="View rule" :rows="3" />
            <FormTextarea v-if="collectionForm.type !== 'view'" v-model="collectionForm.createRule" label="Create rule" :rows="3" />
            <FormTextarea v-if="collectionForm.type !== 'view'" v-model="collectionForm.updateRule" label="Update rule" :rows="3" />
            <FormTextarea v-if="collectionForm.type !== 'view'" v-model="collectionForm.deleteRule" label="Delete rule" :rows="3" />
          </div>

          <div v-if="editorTab === 'options'" class="space-y-4">
            <FormTextarea v-model="indexText" hint="One index definition per line." label="Indexes" :rows="5" />
            <div v-if="collectionForm.type === 'auth'" class="rounded-md border border-gray-200 p-4 dark:border-gray-700">
              <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  v-model="collectionForm.passwordAuth.enabled"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  type="checkbox" />
                Enable password authentication
              </label>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <OutlinedButton type="secondary" :click="() => (isEditorOpen = false)">Cancel</OutlinedButton>
          <FilledButton type="button" :disabled="isSaving" :loading="isSaving" @click="saveCollection">
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
