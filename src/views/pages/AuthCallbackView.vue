<script setup>
import { onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/store/auth.js'
import router from '@/router/index.js'

const { t } = useI18n()
const authStore = useAuthStore()
const status = reactive({
  message: t('authCallback.completing'),
  success: true
})

onMounted(async () => {
  const query = new URLSearchParams(window.location.search)
  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const error = query.get('error')
  const token = fragment.get('token')
  const redirectParam = fragment.get('redirect') || '/applications'
  const redirect = redirectParam.startsWith('/') && !redirectParam.startsWith('//') ? redirectParam : '/applications'

  if (error) {
    status.success = false
    status.message = error
    return
  }

  if (!token) {
    status.success = false
    status.message = t('authCallback.noToken')
    return
  }

  authStore.SetCredential(token)
  window.history.replaceState({}, document.title, '/auth/callback')
  await router.push(redirect)
})
</script>

<template>
  <div class="flex h-full w-full items-center justify-center px-6">
    <div
      :class="{
        'border-red-500 bg-red-50 text-red-800': !status.success,
        'border-green-500 bg-green-50 text-green-800': status.success
      }"
      class="w-full max-w-md rounded-sm border-s-4 p-4 text-center font-medium"
      role="alert">
      {{ status.message }}
      <div v-if="!status.success" class="mt-4">
        <RouterLink to="/login" class="font-semibold text-primary-600 hover:text-primary-500">{{ $t('authCallback.backToLogin') }}</RouterLink>
      </div>
    </div>
  </div>
</template>
