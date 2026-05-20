<script setup>
import { useThemeStore } from '@/store/theme.js'

const themeStore = useThemeStore()
</script>

<template>
  <button
    type="button"
    class="rounded-md p-1.5 text-gray-200 transition-colors hover:bg-gray-200/20"
    :aria-label="themeStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="themeStore.toggleTheme()">
    <font-awesome-icon
      v-if="themeStore.isDark"
      icon="fa-solid fa-sun"
      class="text-sm"
      aria-hidden="true" />
    <font-awesome-icon
      v-else
      icon="fa-solid fa-moon"
      class="text-sm"
      aria-hidden="true" />
  </button>
</template>
