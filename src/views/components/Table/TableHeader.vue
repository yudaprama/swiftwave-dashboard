<script setup>
defineProps({
  align: {
    type: String,
    default: 'center',
    validator: (value) => {
      return ['left', 'center', 'right'].includes(value)
    }
  }
})
</script>

<template>
  <th
    :class="{
      'text-left': align === 'left',
      'text-center': align === 'center',
      'text-right': align === 'right'
    }"
    class="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
    scope="col">
    <span>
      <slot></slot>
    </span>
  </th>
</template>
