<script setup>
defineProps({
  dividerBetweenRows: {
    type: Boolean,
    required: false,
    default: true
  }
});
</script>
<template>
  <div
    class="scrollbox w-full max-w-full overflow-x-auto overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm md:max-h-[80vh] dark:border-gray-700 dark:bg-secondary-800">
    <table class="w-full min-w-max divide-y divide-gray-200 dark:divide-gray-700">
      <thead class="dark:bg-secondary-800 bg-gray-50">
        <tr>
          <slot name="header"></slot>
        </tr>
      </thead>
      <tbody
        class="dark:bg-secondary-800 bg-white"
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
