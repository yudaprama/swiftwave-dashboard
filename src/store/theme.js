import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false);

  function init() {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      isDark.value = true;
    } else if (stored === 'light') {
      isDark.value = false;
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyClass();

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        isDark.value = e.matches;
        applyClass();
      }
    });
  }

  function toggleTheme() {
    isDark.value = !isDark.value;
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
    applyClass();
  }

  function applyClass() {
    document.documentElement.classList.toggle('dark', isDark.value);
  }

  return { isDark, init, toggleTheme };
});
