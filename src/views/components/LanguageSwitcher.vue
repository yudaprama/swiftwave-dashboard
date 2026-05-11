<script setup>
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'

const { locale } = useI18n()
const isOpen = ref(false)

const languages = [
  { code: 'en', label: 'English' },
  { code: 'id', label: 'Bahasa Indonesia' }
]

const setLocale = (code) => {
  locale.value = code
  localStorage.setItem('locale', code)
  isOpen.value = false
}

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = () => {
  isOpen.value = false
}
</script>

<template>
  <div class="relative" v-click-outside="closeDropdown">
    <button
      @click="toggleDropdown"
      class="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-primary-700">
      <font-awesome-icon icon="fa-solid fa-globe" class="text-sm" />
      <span>{{ languages.find(l => l.code === locale)?.label || 'English' }}</span>
      <font-awesome-icon :icon="isOpen ? 'fa-solid fa-angle-up' : 'fa-solid fa-angle-down'" class="text-xs" />
    </button>
    <div
      v-if="isOpen"
      class="absolute bottom-full left-0 mb-1 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
      <button
        v-for="lang in languages"
        :key="lang.code"
        @click="setLocale(lang.code)"
        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
        :class="{ 'bg-gray-50 font-medium': locale === lang.code }">
        <span v-if="locale === lang.code">
          <font-awesome-icon icon="fa-solid fa-check" class="text-primary-600" />
        </span>
        <span v-else class="w-3.5"></span>
        {{ lang.label }}
      </button>
    </div>
  </div>
</template>
