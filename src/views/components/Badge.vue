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
      'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200': type === 'primary',
      'bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-200': type === 'secondary',
      'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200': type === 'success',
      'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-200': type === 'danger',
      'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200': type === 'warning'
    }"
    class="inline-flex rounded-full px-2 text-xs font-semibold leading-5">
    <slot></slot>
  </span>
</template>
