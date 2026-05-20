<script setup>
defineProps({
  dividerBetweenRows: {
    type: Boolean,
    required: false,
    default: true
  }
})
</script>
<template>
  <div class="scrollbox max-h-[80vh] overflow-y-auto overflow-x-auto border border-gray-200 rounded-lg dark:border-gray-700">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead class="bg-gray-50 dark:bg-secondary-800">
        <tr>
          <slot name="header"></slot>
        </tr>
      </thead>
      <tbody
        class="bg-white dark:bg-secondary-800"
        :class="{
          'divide-y-0': dividerBetweenRows,
          'divide-y divide-gray-200 dark:divide-gray-700': dividerBetweenRows
        }">
        <slot name="body"></slot>
      </tbody>
    </table>
    <slot name="message"></slot>
  </div>
</template>
