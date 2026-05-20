<script setup>
defineProps({
  type: {
    type: String,
    default: 'success',
    validator: (value) => {
      return ['primary', 'secondary', 'success', 'danger', 'warning'].includes(value)
    }
  },
  small: {
    type: Boolean,
    default: false
  }
})
</script>
<template>
  <div
    class="flex items-center p-0"
    :class="{
      'gap-3': !small,
      'gap-2': small,
      'text-sm': small
    }">
    <div
      class="rounded-full"
      :class="{
        'h-3 w-3': !small,
        'h-2.5 w-2.5': small,
        'bg-primary-500 dark:bg-primary-400': type === 'primary',
        'bg-secondary-500 dark:bg-secondary-400': type === 'secondary',
        'bg-success-500 dark:bg-success-400': type === 'success',
        'bg-danger-500 dark:bg-danger-400': type === 'danger',
        'bg-warning-500 dark:bg-warning-400': type === 'warning'
      }"
      :aria-label="`${type} status`"
      role="status"></div>
    <slot />
  </div>
</template>

<style scoped></style>
