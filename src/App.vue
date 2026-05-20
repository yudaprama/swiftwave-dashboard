<script setup>
import { RouterView, useRouter } from 'vue-router'
import { computed, onBeforeMount, onMounted, ref } from 'vue'
import { useAuthStore } from '@/store/auth.js'
import { useThemeStore } from '@/store/theme.js'
import SideBar from '@/views/partials/SideBar.vue'
import MobileSidebarDrawer from '@/views/partials/MobileSidebarDrawer.vue'
import Breadcrumb from '@/views/components/Breadcrumb.vue'
import LoadingPage from '@/views/pages/LoadingPage.vue'
import GlobalWarning from '@/views/partials/GlobalWarning.vue'
import { Toaster } from 'vue-sonner'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const router = useRouter()

const isMobileSidebarOpen = ref(false)
const isSidebarCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
  localStorage.setItem('sidebar-collapsed', isSidebarCollapsed.value)
}

onBeforeMount(() => {
  const token = localStorage.getItem('token')
  if (token !== null) {
    authStore.SetCredential(token)
  }
})

onMounted(() => {
  authStore.StartAuthChecker(() => {
    authStore.Logout()
  })
})

const isLoginPage = computed(() => router.currentRoute.value.name === 'Login')
const isShowSideBar = computed(() => {
  if (!authStore.IsLoggedIn) {
    return false
  } else {
    return !['Download Persistent Volume Backup', 'Maintenance', 'Setup'].includes(router.currentRoute.value.name)
  }
})
</script>

<template>
  <Toaster position="top-center" :theme="themeStore.isDark ? 'dark' : 'light'" richColors />
  <LoadingPage :show="authStore.IsLoggingInProgress" />

  <!-- Skip to content link for keyboard users -->
  <a
    href="#main-content"
    class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg">
    {{ t('common.skipToContent') }}
  </a>

  <div class="app">
    <!-- Mobile top bar -->
    <header
      v-if="isShowSideBar"
      class="flex h-14 items-center justify-between border-b bg-white px-4 dark:border-gray-700 dark:bg-secondary-800 md:hidden">
      <button
        type="button"
        class="rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        aria-label="Open menu"
        @click="isMobileSidebarOpen = true">
        <font-awesome-icon icon="fa-solid fa-bars" class="text-lg" />
      </button>
      <RouterLink to="/">
        <img src="@/assets/images/logo.png" alt="SwiftWave" class="h-8" />
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
        class="absolute -right-3 top-8 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-secondary-700 dark:text-gray-400 dark:hover:bg-secondary-600"
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
      class="scrollbox flex max-h-screen w-full flex-col items-center overflow-y-auto"
      :class="{
        'p-4': !isLoginPage
      }">
      <Breadcrumb class="mb-4" />
      <RouterView />
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
  @apply rounded-full bg-primary-500;
}

.terminal {
  margin-right: calc(0.5rem + 9px);
}

.xterm-viewport {
  right: calc(-0.5rem - 9px)!;
  cursor: pointer!;
  overflow-y: auto!;
}

.xterm-viewport::-webkit-scrollbar {
  width: 9px!;
  height: 9px!;
}

.xterm-viewport::-webkit-scrollbar-track {
  @apply rounded-full bg-gray-200 dark:bg-gray-700;
}

.xterm-viewport::-webkit-scrollbar-thumb {
  @apply rounded-full bg-primary-500;
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
  @apply mx-1 h-10 w-10 rounded-md! border! border-gray-300! p-1! text-center! text-base! focus:border-primary-500! focus:ring-primary-500!;
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
  @apply absolute left-1/2 top-[calc(100%+15px)] z-50 hidden max-w-[300px] -translate-x-1/2 flex-col items-center gap-1.5 rounded-lg bg-primary-500 p-2.5 text-sm text-secondary-100 shadow-md;
}

.has-popover {
  @apply relative;

  &:hover .popover {
    @apply block;
  }
}
</style>
