<script setup>
import { reactive, ref } from 'vue'
import { useAuthStore } from '@/store/auth.js'
import router from '@/router/index.js'
import FilledButton from '@/views/components/FilledButton.vue'

const username = ref('')
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
    registrationStatus.message = 'Passwords do not match'
    return
  }
  if (password.value.length < 8) {
    registrationStatus.visible = true
    registrationStatus.success = false
    registrationStatus.message = 'Password must be at least 8 characters'
    return
  }

  const res = await authStore.Register(username.value, password.value)
  registrationStatus.success = res.success
  registrationStatus.message = res.message
  registrationStatus.visible = true
  if (res.success) {
    window.open(router.resolve({ name: 'Applications' }).href, '_self')
  }
}
</script>

<template>
  <div class="flex h-full w-full flex-row">
    <!-- Content -->
    <div class="relative flex h-full min-w-[60vw] select-none flex-col items-center bg-[#F9F8F8] pt-52">
      <div class="flex w-fit flex-row items-center justify-center gap-2">
        <img src="@/assets/images/logo.png" class="w-14" alt="swiftwave logo" />
        <div class="flex flex-col items-start justify-between">
          <p class="font-prompt text-3xl">swiftwave</p>
          <p class="font-prompt text-base">open source paas</p>
        </div>
      </div>
      <p class="mt-32 font-comfortaa text-5xl"><span class="text-primary-600">Create</span>&nbsp;your</p>
      <p class="mt-6 font-comfortaa text-5xl">account</p>
    </div>
    <!-- Registration form -->
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
        <form class="space-y-4" @keydown.enter.prevent="register">
          <div>
            <label class="block text-sm font-medium leading-6 text-gray-900" for="reg-username">Username</label>
            <div class="mt-1">
              <input
                id="reg-username"
                v-model="username"
                autocomplete="username"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Choose a username"
                required
                type="text" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium leading-6 text-gray-900" for="reg-password">Password</label>
            <div class="mt-1">
              <input
                id="reg-password"
                v-model="password"
                autocomplete="new-password"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="At least 8 characters"
                required
                type="password" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium leading-6 text-gray-900" for="reg-confirm-password">Confirm Password</label>
            <div class="mt-1">
              <input
                id="reg-confirm-password"
                v-model="confirmPassword"
                autocomplete="new-password"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Repeat your password"
                required
                type="password" />
            </div>
          </div>
          <div class="py-2">
            <FilledButton :click="register" class="w-full">Create Account</FilledButton>
          </div>
          <p class="text-center text-sm text-gray-500">
            Already have an account?
            <RouterLink to="/login" class="font-semibold text-primary-600 hover:text-primary-500">Sign in</RouterLink>
          </p>
        </form>
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
