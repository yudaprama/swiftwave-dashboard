<script setup>
import { ref } from 'vue'

let isVisible = ref(false)

function toggleVisibility() {
  isVisible.value = !isVisible.value
}
</script>

<template>
  <div class="min-w-[100px] text-sm text-gray-900 dark:text-gray-100">
    <span v-if="isVisible" class="flex w-fit items-center">
      <slot></slot>
      <button
        type="button"
        class="ml-2 cursor-pointer"
        :aria-label="$t('common.hide')"
        @click="toggleVisibility">
        <font-awesome-icon icon="fa-solid fa-eye" aria-hidden="true" />
      </button>
    </span>
    <span v-else class="flex w-fit items-center">
      ********
      <button
        type="button"
        class="ml-2 cursor-pointer"
        :aria-label="$t('common.show')"
        @click="toggleVisibility">
        <font-awesome-icon icon="fa-solid fa-eye-slash" aria-hidden="true" />
      </button>
    </span>
  </div>
</template>
