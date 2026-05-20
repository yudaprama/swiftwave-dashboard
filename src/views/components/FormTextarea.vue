<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  id: {
    type: String,
    default: () => `textarea-${Math.random().toString(36).slice(2, 9)}`
  },
  placeholder: {
    type: String,
    default: ''
  },
  rows: {
    type: Number,
    default: 3
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  hint: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const hasHelperText = computed(() => props.error || props.hint)
const helperId = computed(() => `${props.id}-helper`)
</script>

<template>
  <div>
    <label
      v-if="label"
      :for="id"
      class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
      <span v-if="required" class="text-danger-500">*</span>
    </label>
    <textarea
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :required="required"
      :disabled="disabled"
      :readonly="readonly"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="hasHelperText ? helperId : undefined"
      :aria-required="required ? 'true' : undefined"
      class="block w-full rounded-md border px-3 py-2 text-sm shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
      :class="{
        'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-secondary-700 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-primary-400 dark:focus:ring-primary-400': !error,
        'border-danger-500 bg-white text-gray-900 placeholder-gray-400 focus:border-danger-500 focus:ring-danger-500 dark:border-danger-400 dark:bg-secondary-700 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-danger-400 dark:focus:ring-danger-400': error
      }"
      @input="emit('update:modelValue', $event.target.value)" />
    <p
      v-if="hasHelperText"
      :id="helperId"
      :role="error ? 'alert' : undefined"
      class="mt-1 text-sm"
      :class="{
        'text-danger-600 dark:text-danger-400': error,
        'text-gray-500 dark:text-gray-400': !error
      }">
      {{ error || hint }}
    </p>
  </div>
</template>
