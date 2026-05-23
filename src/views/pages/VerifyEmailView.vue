<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import { getHttpBaseUrl } from '@/vendor/utils.js'

const { t } = useI18n()
const status = ref('loading') // loading, success, error
const message = ref('')

onMounted(async () => {
  const token = new URLSearchParams(window.location.search).get('token')
  if (!token) {
    status.value = 'error'
    message.value = t('verifyEmail.noToken')
    return
  }

  try {
    const HTTP_BASE_URL = getHttpBaseUrl()
    const res = await axios.get(`${HTTP_BASE_URL}/auth/verify-email?token=${token}`)
    status.value = 'success'
    message.value = res.data.message || t('verifyEmail.defaultSuccess')
  } catch (e) {
    status.value = 'error'
    if (e.response && e.response.data && e.response.data.message) {
      message.value = e.response.data.message
    } else {
      message.value = t('verifyEmail.defaultError')
    }
  }
})
</script>

<template>
  <div class="flex h-full w-full items-center justify-center bg-[#F9F8F8] dark:bg-secondary-900">
    <div class="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-secondary-800">
      <div class="mb-6 text-center">
        <img src="@/assets/images/logo.png" class="mx-auto mb-4 w-14" :alt="t('brand.name') + ' logo'" />
        <h1 class="font-prompt text-2xl">{{ $t('login.title') }}</h1>
      </div>

      <div v-if="status === 'loading'" class="text-center">
        <div class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
        <p class="text-gray-600 dark:text-gray-400">{{ $t('verifyEmail.verifying') }}</p>
      </div>

      <div v-else-if="status === 'success'" class="text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <font-awesome-icon icon="fa-solid fa-check" class="text-2xl text-green-600" />
        </div>
        <h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">{{ $t('verifyEmail.successTitle') }}</h2>
        <p class="mb-6 text-gray-600 dark:text-gray-400">{{ message }}</p>
        <RouterLink
          to="/login"
          class="inline-block w-full rounded-md bg-primary-600 px-4 py-2 text-center text-white hover:bg-primary-700">
          {{ $t('verifyEmail.goToLogin') }}
        </RouterLink>
      </div>

      <div v-else class="text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <font-awesome-icon icon="fa-solid fa-xmark" class="text-2xl text-red-600" />
        </div>
        <h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">{{ $t('verifyEmail.failedTitle') }}</h2>
        <p class="mb-6 text-gray-600 dark:text-gray-400">{{ message }}</p>
        <RouterLink
          to="/login"
          class="inline-block w-full rounded-md bg-primary-600 px-4 py-2 text-center text-white hover:bg-primary-700">
          {{ $t('verifyEmail.goToLogin') }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "../../assets/css/base.css";
@font-face {
  font-family: 'Prompt';
  src: url('@/assets/fonts/Prompt-Regular.ttf');
}
</style>
