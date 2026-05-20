<script setup>
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  collections: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const fieldTypes = ['text', 'number', 'bool', 'email', 'url', 'date', 'autodate', 'file', 'relation', 'select', 'json', 'geoPoint', 'password', 'editor']

const inputClass = 'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-secondary-700 dark:text-gray-100'

const cloneFields = () => JSON.parse(JSON.stringify(props.modelValue || []))

const defaultField = (type = 'text') => {
  const field = {
    name: '',
    type,
    required: false,
    hidden: false,
    presentable: false
  }
  if (type === 'autodate') {
    field.onCreate = true
    field.onUpdate = false
  }
  if (type === 'file' || type === 'select' || type === 'relation') {
    field.maxSelect = 1
  }
  if (type === 'file') {
    field.maxSize = 5242880
    field.mimeTypes = []
  }
  if (type === 'select') {
    field.values = []
  }
  if (type === 'relation') {
    field.collectionId = ''
    field.cascadeDelete = false
  }
  return field
}

const addField = () => {
  emit('update:modelValue', [...cloneFields(), defaultField()])
}

const removeField = (index) => {
  const fields = cloneFields()
  fields.splice(index, 1)
  emit('update:modelValue', fields)
}

const updateField = (index, key, value) => {
  const fields = cloneFields()
  fields[index] = { ...(fields[index] || defaultField()), [key]: value }
  emit('update:modelValue', fields)
}

const updateType = (index, type) => {
  const fields = cloneFields()
  const current = fields[index] || {}
  fields[index] = {
    ...defaultField(type),
    id: current.id,
    name: current.name,
    required: current.required ?? false,
    hidden: current.hidden ?? false,
    presentable: current.presentable ?? false
  }
  emit('update:modelValue', fields)
}

const updateCsv = (index, key, value) => {
  updateField(
    index,
    key,
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  )
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Fields</h3>
      <button
        type="button"
        class="rounded-md border border-primary-600 px-3 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 dark:border-primary-400 dark:text-primary-400 dark:hover:bg-secondary-800"
        @click="addField">
        Add Field
      </button>
    </div>

    <div v-if="modelValue.length === 0" class="rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
      No custom fields yet.
    </div>

    <div
      v-for="(field, index) in modelValue"
      :key="field.id || `${field.name}-${index}`"
      class="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-secondary-800">
      <div class="grid gap-3 md:grid-cols-12">
        <div class="md:col-span-4">
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input
            :class="inputClass"
            :value="field.name"
            placeholder="field_name"
            type="text"
            @input="updateField(index, 'name', $event.target.value)" />
        </div>
        <div class="md:col-span-3">
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
          <select :class="inputClass" :value="field.type" @change="updateType(index, $event.target.value)">
            <option v-for="type in fieldTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </div>
        <div class="flex items-end gap-3 md:col-span-4">
          <label class="flex min-h-10 items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              :checked="field.required"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              type="checkbox"
              @change="updateField(index, 'required', $event.target.checked)" />
            Required
          </label>
          <label class="flex min-h-10 items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              :checked="field.hidden"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              type="checkbox"
              @change="updateField(index, 'hidden', $event.target.checked)" />
            Hidden
          </label>
          <label class="flex min-h-10 items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              :checked="field.presentable"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              type="checkbox"
              @change="updateField(index, 'presentable', $event.target.checked)" />
            Presentable
          </label>
        </div>
        <div class="flex items-end justify-end md:col-span-1">
          <button
            type="button"
            class="min-h-10 rounded-md px-3 text-sm font-semibold text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-secondary-700"
            @click="removeField(index)">
            Delete
          </button>
        </div>
      </div>

      <div v-if="['text', 'password', 'editor'].includes(field.type)" class="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Min length</label>
          <input :class="inputClass" :value="field.min || ''" min="0" type="number" @input="updateField(index, 'min', Number($event.target.value) || 0)" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Max length</label>
          <input :class="inputClass" :value="field.max || ''" min="0" type="number" @input="updateField(index, 'max', Number($event.target.value) || 0)" />
        </div>
      </div>

      <div v-if="field.type === 'number'" class="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Min</label>
          <input :class="inputClass" :value="field.min ?? ''" type="number" @input="updateField(index, 'min', $event.target.value === '' ? null : Number($event.target.value))" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Max</label>
          <input :class="inputClass" :value="field.max ?? ''" type="number" @input="updateField(index, 'max', $event.target.value === '' ? null : Number($event.target.value))" />
        </div>
      </div>

      <div v-if="field.type === 'select'" class="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Values</label>
          <input :class="inputClass" :value="(field.values || []).join(', ')" placeholder="draft, published" type="text" @input="updateCsv(index, 'values', $event.target.value)" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Max select</label>
          <input :class="inputClass" :value="field.maxSelect || 1" min="1" type="number" @input="updateField(index, 'maxSelect', Number($event.target.value) || 1)" />
        </div>
      </div>

      <div v-if="field.type === 'file'" class="mt-3 grid gap-3 md:grid-cols-3">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Max select</label>
          <input :class="inputClass" :value="field.maxSelect || 1" min="1" type="number" @input="updateField(index, 'maxSelect', Number($event.target.value) || 1)" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Max size bytes</label>
          <input :class="inputClass" :value="field.maxSize || ''" min="0" type="number" @input="updateField(index, 'maxSize', Number($event.target.value) || 0)" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">MIME types</label>
          <input :class="inputClass" :value="(field.mimeTypes || []).join(', ')" placeholder="image/png, image/jpeg" type="text" @input="updateCsv(index, 'mimeTypes', $event.target.value)" />
        </div>
      </div>

      <div v-if="field.type === 'relation'" class="mt-3 grid gap-3 md:grid-cols-3">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Collection</label>
          <select :class="inputClass" :value="field.collectionId || ''" @change="updateField(index, 'collectionId', $event.target.value)">
            <option value="">Select collection</option>
            <option v-for="collection in collections" :key="collection.id" :value="collection.id">{{ collection.name }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Max select</label>
          <input :class="inputClass" :value="field.maxSelect || 1" min="1" type="number" @input="updateField(index, 'maxSelect', Number($event.target.value) || 1)" />
        </div>
        <label class="flex items-end gap-2 pb-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            :checked="field.cascadeDelete"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            type="checkbox"
            @change="updateField(index, 'cascadeDelete', $event.target.checked)" />
          Cascade delete
        </label>
      </div>

      <div v-if="field.type === 'autodate'" class="mt-3 flex flex-wrap gap-4">
        <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            :checked="field.onCreate"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            type="checkbox"
            @change="updateField(index, 'onCreate', $event.target.checked)" />
          On create
        </label>
        <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            :checked="field.onUpdate"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            type="checkbox"
            @change="updateField(index, 'onUpdate', $event.target.checked)" />
          On update
        </label>
      </div>
    </div>
  </div>
</template>
