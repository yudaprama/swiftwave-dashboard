<script setup>
defineProps({
  icon: { type: String, default: 'fa-solid fa-box' },
  title: { type: String, default: '' },
  description: { type: String, default: '' }
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-secondary-700">
      <font-awesome-icon :icon="icon" class="text-2xl text-gray-400 dark:text-gray-500" aria-hidden="true" />
    </div>
    <p v-if="title" class="text-base font-medium text-gray-900 dark:text-gray-100">{{ title }}</p>
    <p v-if="description" class="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{{ description }}</p>
    <div class="mt-4">
      <slot name="action"></slot>
    </div>
  </div>
</template>
