<script setup>
import { RouterView, useRouter } from 'vue-router';
import { computed, onBeforeMount, onMounted, ref, watchEffect } from 'vue';
import { useAuthStore } from '@/store/auth.js';
import { useThemeStore } from '@/store/theme.js';
import SideBar from '@/views/partials/SideBar.vue';
import MobileSidebarDrawer from '@/views/partials/MobileSidebarDrawer.vue';
import Breadcrumb from '@/views/components/Breadcrumb.vue';
import LoadingPage from '@/views/pages/LoadingPage.vue';
import GlobalWarning from '@/views/partials/GlobalWarning.vue';
import { Toaster } from 'vue-sonner';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const router = useRouter();

const isMobileSidebarOpen = ref(false);
const isSidebarCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true');

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
  localStorage.setItem('sidebar-collapsed', isSidebarCollapsed.value);
};

onBeforeMount(() => {
  const token = localStorage.getItem('token');
  if (token !== null) {
    authStore.SetCredential(token);
  }
});

onMounted(() => {
  authStore.StartAuthChecker(() => {
    authStore.Logout();
  });
});

watchEffect(() => {
  document.title = t('brand.name');
});

const isLoginPage = computed(() => router.currentRoute.value.name === 'Login');
const isShowSideBar = computed(() => {
  if (!authStore.IsLoggedIn) {
    return false;
  } else {
    return !['Download Persistent Volume Backup', 'Maintenance', 'Setup'].includes(router.currentRoute.value.name);
  }
});
</script>

<template>
  <Toaster position="top-center" :theme="themeStore.isDark ? 'dark' : 'light'" richColors />
  <LoadingPage :show="authStore.IsLoggingInProgress" />

  <!-- Skip to content link for keyboard users -->
  <a
    href="#main-content"
    class="focus:bg-primary-600 sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:px-4 focus:py-2 focus:text-white focus:shadow-lg">
    {{ t('common.skipToContent') }}
  </a>

  <div class="app">
    <!-- Mobile top bar -->
    <header
      v-if="isShowSideBar"
      class="dark:bg-secondary-800 flex h-14 items-center justify-between border-b bg-white px-4 md:hidden dark:border-gray-700">
      <button
        type="button"
        class="rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        aria-label="Open menu"
        @click="isMobileSidebarOpen = true">
        <font-awesome-icon icon="fa-solid fa-bars" class="text-lg" />
      </button>
      <RouterLink to="/">
        <img src="@/assets/images/logo.png" :alt="t('brand.name')" class="h-8" />
      </RouterLink>
      <div class="w-10" />
    </header>

    <!-- Mobile sidebar drawer -->
    <MobileSidebarDrawer :open="isMobileSidebarOpen" @close="isMobileSidebarOpen = false">
      <SideBar @navigate="isMobileSidebarOpen = false" />
    </MobileSidebarDrawer>

    <!-- Desktop sidebar -->
    <div v-if="isShowSideBar" class="relative hidden md:flex">
      <SideBar :collapsed="isSidebarCollapsed" />
      <button
        type="button"
        class="interactive dark:bg-secondary-700 dark:hover:bg-secondary-600 absolute top-8 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400"
        :aria-label="isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="toggleSidebar">
        <font-awesome-icon
          :icon="isSidebarCollapsed ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left'"
          class="text-xs" />
      </button>
    </div>

    <!-- Main content -->
    <main
      id="main-content"
      tabindex="-1"
      class="scrollbox dark:bg-secondary-900 flex max-h-screen w-full flex-col items-center overflow-y-auto bg-white text-gray-900 dark:text-gray-100"
      :class="{
        'p-4': !isLoginPage
      }">
      <Breadcrumb class="mb-4" />
      <RouterView v-slot="{ Component, route }">
        <Transition
          mode="out-in"
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>
    <GlobalWarning />
  </div>
</template>

<style>
@reference "./assets/css/base.css";
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
}

@media (min-width: 768px) {
  .app {
    flex-direction: row;
  }
}

.scrollbox::-webkit-scrollbar {
  width: 9px;
  height: 9px;
}

.scrollbox::-webkit-scrollbar-track {
  @apply rounded-full bg-gray-200 dark:bg-gray-700;
}

.scrollbox::-webkit-scrollbar-thumb {
  @apply bg-primary-500 rounded-full;
}

.terminal {
  margin-right: calc(0.5rem + 9px);
}

.xterm-viewport {
  right: calc(-0.5rem - 9px) !important;
  cursor: pointer !important;
  overflow-y: auto !important;
}

.xterm-viewport::-webkit-scrollbar {
  width: 9px !important;
  height: 9px !important;
}

.xterm-viewport::-webkit-scrollbar-track {
  @apply rounded-full bg-gray-200 dark:bg-gray-700;
}

.xterm-viewport::-webkit-scrollbar-thumb {
  @apply bg-primary-500 rounded-full;
}

.bg-color-1 {
  @apply bg-amber-300!;
}

.border-color-1 {
  @apply border-amber-400!;
}

.bg-color-2 {
  @apply bg-green-300!;
}

.border-color-2 {
  @apply border-green-400!;
}

.bg-color-3 {
  @apply bg-blue-300!;
}

.border-color-3 {
  @apply border-blue-400!;
}

.bg-color-4 {
  @apply bg-gray-300!;
}

.border-color-4 {
  @apply border-gray-400!;
}

/* v-otp-input custom class */
.otp-input-container {
  @apply flex flex-row justify-center;
}

.otp-input {
  @apply focus:border-primary-500! focus:ring-primary-500! mx-1 h-10 w-10 rounded-md! border! border-gray-300! p-1! text-center! text-base!;
}

.otp-input::-webkit-inner-spin-button,
.otp-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* tooltip */
.tooltip {
  @apply invisible absolute -ms-12 -mt-9 rounded bg-black px-2 py-1 text-sm text-white shadow-sm;
}

.has-tooltip:hover .tooltip {
  @apply visible z-50;
}

/* popover */
.popover {
  @apply bg-primary-500 text-secondary-100 absolute top-[calc(100%+15px)] left-1/2 z-50 hidden max-w-[300px] -translate-x-1/2 flex-col items-center gap-1.5 rounded-lg p-2.5 text-sm shadow-md;
}

.has-popover {
  @apply relative;

  &:hover .popover {
    @apply block;
  }
}
</style>
