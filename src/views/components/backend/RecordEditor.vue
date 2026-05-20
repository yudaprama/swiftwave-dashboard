<script setup>
import { computed, reactive, watch } from 'vue'
import FormInput from '@/views/components/FormInput.vue'
import FormTextarea from '@/views/components/FormTextarea.vue'

const props = defineProps({
  record: {
    type: Object,
    default: () => ({})
  },
  fields: {
    type: Array,
    default: () => []
  },
  collections: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['submit'])

const values = reactive({})
const files = reactive({})

const editableFields = computed(() => props.fields.filter((field) => !['id', 'created', 'updated'].includes(field.name) && !field.system))

const resetValues = () => {
  Object.keys(values).forEach((key) => delete values[key])
  Object.keys(files).forEach((key) => delete files[key])
  editableFields.value.forEach((field) => {
    if (props.record[field.name] !== undefined) {
      if (field.type === 'json' || field.type === 'geoPoint') {
        values[field.name] = typeof props.record[field.name] === 'string' ? props.record[field.name] : JSON.stringify(props.record[field.name], null, 2)
      } else {
        values[field.name] = props.record[field.name]
      }
    } else if (field.type === 'bool') {
      values[field.name] = false
    } else if (field.type === 'json' || field.type === 'geoPoint') {
      values[field.name] = ''
    } else if (field.maxSelect > 1) {
      values[field.name] = []
    } else {
      values[field.name] = ''
    }
  })
}

watch(
  () => [props.record, props.fields],
  () => resetValues(),
  { immediate: true, deep: true }
)

const collectionName = (collectionId) => props.collections.find((collection) => collection.id === collectionId)?.name || collectionId

const submit = () => {
  const payload = { ...props.record }
  editableFields.value.forEach((field) => {
    if (field.type === 'file') return
    const value = values[field.name]
    if (field.type === 'number') {
      payload[field.name] = value === '' || value === null ? null : Number(value)
    } else if (field.type === 'bool') {
      payload[field.name] = !!value
    } else if (field.type === 'json' || field.type === 'geoPoint') {
      if (value === '') {
        payload[field.name] = null
      } else {
        payload[field.name] = typeof value === 'string' ? JSON.parse(value) : value
      }
    } else {
      payload[field.name] = value
    }
  })
  emit('submit', { record: payload, files })
}

defineExpose({ submit })
</script>

<template>
  <div class="space-y-4">
    <div v-if="editableFields.length === 0" class="rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
      This collection has no editable fields.
    </div>

    <div v-for="field in editableFields" :key="field.id || field.name">
      <label
        v-if="['bool', 'select', 'file'].includes(field.type)"
        class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ field.name }}
      </label>

      <label v-if="field.type === 'bool'" class="flex min-h-10 items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input v-model="values[field.name]" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" type="checkbox" />
        Enabled
      </label>

      <FormInput
        v-else-if="['text', 'email', 'url', 'password', 'editor', 'relation'].includes(field.type)"
        v-model="values[field.name]"
        :hint="field.type === 'relation' ? `Relation to ${collectionName(field.collectionId)}` : ''"
        :label="field.name"
        :placeholder="field.type === 'relation' ? 'record id' : field.type"
        :type="field.type === 'password' ? 'password' : field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'" />

      <FormInput
        v-else-if="field.type === 'number'"
        v-model="values[field.name]"
        :label="field.name"
        type="number" />

      <FormInput
        v-else-if="field.type === 'date' || field.type === 'autodate'"
        v-model="values[field.name]"
        :label="field.name"
        type="datetime-local" />

      <select
        v-else-if="field.type === 'select'"
        v-model="values[field.name]"
        :multiple="field.maxSelect > 1"
        class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-secondary-700 dark:text-gray-100">
        <option v-if="field.maxSelect <= 1" value="">Select value</option>
        <option v-for="value in field.values || []" :key="value" :value="value">{{ value }}</option>
      </select>

      <FormTextarea
        v-else-if="field.type === 'json' || field.type === 'geoPoint'"
        v-model="values[field.name]"
        :hint="field.type === 'geoPoint' ? 'JSON object, for example {&quot;lon&quot;: 106.8, &quot;lat&quot;: -6.2}' : 'Valid JSON'"
        :label="field.name"
        :rows="5" />

      <input
        v-else-if="field.type === 'file'"
        class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 file:mr-3 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100 dark:border-gray-600 dark:bg-secondary-700 dark:text-gray-100 dark:file:bg-secondary-800 dark:file:text-primary-300"
        :accept="(field.mimeTypes || []).join(',') || undefined"
        :multiple="field.maxSelect > 1"
        type="file"
        @change="files[field.name] = $event.target.files" />
    </div>
  </div>
</template>
