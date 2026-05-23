<script setup>
defineProps({
  type: {
    type: String,
    default: 'success',
    validator: (value) => {
      return ['primary', 'secondary', 'success', 'danger', 'warning'].includes(value)
    }
  }
})
</script>

<template>
  <span
    :class="{
      'bg-primary-100 text-primary-800 border-primary-200 dark:bg-primary-900/50 dark:text-primary-200 dark:border-primary-800': type === 'primary',
      'bg-secondary-100 text-secondary-800 border-secondary-200 dark:bg-secondary-700 dark:text-secondary-200 dark:border-secondary-600': type === 'secondary',
      'bg-success-100 text-success-800 border-success-200 dark:bg-success-900/50 dark:text-success-200 dark:border-success-800': type === 'success',
      'bg-danger-100 text-danger-800 border-danger-200 dark:bg-danger-900/50 dark:text-danger-200 dark:border-danger-800': type === 'danger',
      'bg-warning-100 text-warning-800 border-warning-200 dark:bg-warning-900/50 dark:text-warning-200 dark:border-warning-800': type === 'warning'
    }"
    class="interactive inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-5">
    <slot></slot>
  </span>
</template>
