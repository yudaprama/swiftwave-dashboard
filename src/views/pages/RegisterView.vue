<script setup>
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/store/auth.js'
import FilledButton from '@/views/components/FilledButton.vue'

const { t } = useI18n()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const registrationStatus = reactive({
  visible: false,
  success: false,
  message: ''
})
const authStore = useAuthStore()

const register = async () => {
  if (password.value !== confirmPassword.value) {
    registrationStatus.visible = true
    registrationStatus.success = false
    registrationStatus.message = t('register.passwordMismatch')
    return
  }
  if (password.value.length < 8) {
    registrationStatus.visible = true
    registrationStatus.success = false
    registrationStatus.message = t('register.passwordMinLength')
    return
  }

  const res = await authStore.Register(email.value, password.value)
  registrationStatus.success = res.success
  registrationStatus.message = res.message
  registrationStatus.visible = true
}
</script>

<template>
  <div class="flex h-full w-full flex-row">
    <div class="relative flex h-full min-w-[60vw] select-none flex-col items-center bg-[#F9F8F8] pt-52 dark:bg-secondary-900">
      <div class="flex w-fit flex-row items-center justify-center gap-2">
        <img src="@/assets/images/logo.png" class="w-14" alt="swiftwave logo" />
        <div class="flex flex-col items-start justify-between">
          <p class="font-prompt text-3xl">{{ $t('login.title') }}</p>
          <p class="font-prompt text-base">{{ $t('login.subtitle') }}</p>
        </div>
      </div>
      <p class="mt-32 font-comfortaa text-5xl"><span class="text-primary-600">{{ $t('register.heading1') }}</span>&nbsp;{{ $t('register.heading2') }}</p>
      <p class="mt-6 font-comfortaa text-5xl">{{ $t('register.heading3') }}</p>
    </div>
    <div class="flex h-full w-full flex-col items-center justify-center px-6 py-12 lg:px-8">
      <p class="w-fit text-5xl text-primary-600">
        <font-awesome-icon icon="fa-solid fa-user-plus" />
      </p>
      <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <div
          v-if="registrationStatus.visible"
          :class="{
            'border-red-500 bg-red-50': !registrationStatus.success,
            'border-green-500 bg-green-50': registrationStatus.success
          }"
          class="mb-5 rounded-sm border-s-4 p-4"
          role="alert">
          <strong
            :class="{
              'text-red-800': !registrationStatus.success,
              'text-green-800': registrationStatus.success
            }"
            class="block font-medium"
            >{{ registrationStatus.message }}</strong>
        </div>
        <form v-if="!registrationStatus.success" class="space-y-4" @keydown.enter.prevent="register">
          <div>
            <label class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100" for="reg-email">{{ $t('register.email') }}</label>
            <div class="mt-1">
              <input
                id="reg-email"
                v-model="email"
                autocomplete="email"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-secondary-700 dark:text-gray-200 dark:ring-gray-600"
                :placeholder="$t('register.emailPlaceholder')"
                required
                type="email" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100" for="reg-password">{{ $t('register.password') }}</label>
            <div class="mt-1">
              <input
                id="reg-password"
                v-model="password"
                autocomplete="new-password"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-secondary-700 dark:text-gray-200 dark:ring-gray-600"
                :placeholder="$t('register.passwordPlaceholder')"
                required
                type="password" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100" for="reg-confirm-password">{{ $t('register.confirmPassword') }}</label>
            <div class="mt-1">
              <input
                id="reg-confirm-password"
                v-model="confirmPassword"
                autocomplete="new-password"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-secondary-700 dark:text-gray-200 dark:ring-gray-600"
                :placeholder="$t('register.confirmPasswordPlaceholder')"
                required
                type="password" />
            </div>
          </div>
          <div class="py-2">
            <FilledButton :click="register" class="w-full">{{ $t('register.createAccount') }}</FilledButton>
          </div>
          <p class="text-center text-sm text-gray-500 dark:text-gray-400">
            {{ $t('register.alreadyHaveAccount') }}
            <RouterLink to="/login" class="font-semibold text-primary-600 hover:text-primary-500">{{ $t('register.signIn') }}</RouterLink>
          </p>
        </form>
        <div v-else class="text-center">
          <p class="text-gray-600 dark:text-gray-400">
            <RouterLink to="/login" class="font-semibold text-primary-600 hover:text-primary-500">{{ $t('register.goToLogin') }}</RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "../../assets/css/base.css";
@font-face {
  font-family: 'Comfortaa';
  src: url('@/assets/fonts/Comfortaa-Regular.ttf');
}
@font-face {
  font-family: 'Prompt';
  src: url('@/assets/fonts/Prompt-Regular.ttf');
}
</style>
