<script setup>
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';

const { locale } = useI18n();
const isOpen = ref(false);

const languages = [
  { code: 'en', label: 'English' },
  { code: 'id', label: 'Bahasa Indonesia' }
];

const setLocale = (code) => {
  locale.value = code;
  localStorage.setItem('locale', code);
  isOpen.value = false;
};

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const closeDropdown = () => {
  isOpen.value = false;
};
</script>

<template>
  <div class="relative" v-click-outside="closeDropdown">
    <button
      type="button"
      @click="toggleDropdown"
      class="hover:bg-primary-700 flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      aria-haspopup="menu"
      :aria-expanded="isOpen">
      <font-awesome-icon icon="fa-solid fa-globe" class="text-sm" aria-hidden="true" />
      <span>{{ languages.find((l) => l.code === locale)?.label || 'English' }}</span>
      <font-awesome-icon
        :icon="isOpen ? 'fa-solid fa-angle-up' : 'fa-solid fa-angle-down'"
        class="text-xs"
        aria-hidden="true" />
    </button>
    <div
      v-if="isOpen"
      class="dark:bg-secondary-800 absolute bottom-full left-0 mb-1 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700"
      role="menu">
      <button
        v-for="lang in languages"
        :key="lang.code"
        type="button"
        @click="setLocale(lang.code)"
        class="focus-visible:outline-primary-600 dark:hover:bg-secondary-700 flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-0 dark:text-gray-200"
        role="menuitem"
        :class="{ 'dark:bg-secondary-700 bg-gray-50 font-medium': locale === lang.code }">
        <span v-if="locale === lang.code">
          <font-awesome-icon icon="fa-solid fa-check" class="text-primary-600" aria-hidden="true" />
        </span>
        <span v-else class="w-3.5"></span>
        {{ lang.label }}
      </button>
    </div>
  </div>
</template>
