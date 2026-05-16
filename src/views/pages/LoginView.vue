<script setup>
import { reactive, ref } from 'vue'
import { useAuthStore } from '@/store/auth.js'
import router from '@/router/index.js'
import FilledButton from '@/views/components/FilledButton.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import axios from 'axios'
import { getHttpBaseUrl } from '@/vendor/utils.js'

const email = ref('')
const password = ref('')
const totp = ref('')
const authenticationStatus = reactive({
  visible: false,
  success: false,
  message: '',
  totp_required: false,
  email_verification_required: false
})
const resendEmail = ref('')
const resendStatus = reactive({
  visible: false,
  success: false,
  message: ''
})
const authStore = useAuthStore()

const login = async () => {
  let res = await authStore.Login(email.value, password.value, totp.value)
  if (res.totp_required) {
    authenticationStatus.totp_required = res.totp_required
  } else if (res.email_verification_required) {
    authenticationStatus.email_verification_required = true
    authenticationStatus.success = false
    authenticationStatus.message = res.message
    authenticationStatus.visible = true
    resendEmail.value = email.value
  } else {
    authenticationStatus.success = res.success
    authenticationStatus.message = res.message
    authenticationStatus.visible = true
    authenticationStatus.totp_required = authenticationStatus.totp_required || res.totp_required
    if (res.success) {
      // check if `redirect` is in the query
      if (router.currentRoute.value.query.redirect) {
        await router.push(router.currentRoute.value.query.redirect)
        return
      }
      window.open(router.resolve({ name: 'Applications' }).href, '_self')
    }
  }
}

const resendVerification = async () => {
  if (!resendEmail.value) return
  const HTTP_BASE_URL = getHttpBaseUrl()
  try {
    await axios.post(`${HTTP_BASE_URL}/auth/resend-verification`, { email: resendEmail.value })
    resendStatus.visible = true
    resendStatus.success = true
    resendStatus.message = 'Verification email sent! Please check your inbox.'
  } catch (e) {
    resendStatus.visible = true
    resendStatus.success = false
    resendStatus.message = e.response?.data?.message || 'Failed to resend verification email.'
  }
}
</script>

<template>
  <div class="flex h-full w-full flex-row">
    <!--  Content  -->
    <div class="relative flex h-full min-w-[60vw] select-none flex-col items-center bg-[#F9F8F8] pt-52">
      <!--   Logo with title/subtitle   -->
      <div class="flex w-fit flex-row items-center justify-center gap-2">
        <img src="@/assets/images/logo.png" class="w-14" alt="swiftwave logo" />
        <div class="flex flex-col items-start justify-between">
          <p class="font-prompt text-3xl">swiftwave</p>
          <p class="font-prompt text-base">open source paas</p>
        </div>
      </div>
      <!--    Heading  -->
      <p class="mt-32 font-comfortaa text-5xl"><span class="text-primary-600">{{ $t('login.heading1') }}</span>&nbsp;{{ $t('login.heading2') }}</p>
      <p class="mt-6 font-comfortaa text-5xl">{{ $t('login.heading3') }}</p>
      <!--   Button panel   -->
      <div class="absolute bottom-0 left-0 right-0 flex flex-row flex-wrap items-center justify-center gap-3 pb-6">
        <!--        <p class="w-full text-center">Hemlo bro</p>-->
        <a class="action-btn" target="_blank" href="https://github.com/swiftwave-org/swiftwave">
          <font-awesome-icon icon="fa-brands fa-github" class="icon" />
          {{ $t('login.github') }}
        </a>
        <a class="action-btn" target="_blank" href="https://github.com/swiftwave-org/swiftwave/issues/new/choose">
          <font-awesome-icon icon="fa-soild fa-bug" class="icon" />
          {{ $t('login.reportBug') }}
        </a>
        <a class="action-btn" target="_blank" href="https://slack.swiftwave.org/">
          <font-awesome-icon icon="fa-solid fa-people-group" class="icon" />
          {{ $t('login.joinCommunity') }}
        </a>
        <a class="action-btn" target="_blank" href="mailto:support@swiftwave.org">
          <font-awesome-icon icon="fa-solid fa-envelope" class="icon" />
          {{ $t('login.reachTeam') }}
        </a>
        <a class="action-btn" target="_blank" href="https://swiftwave.org/docs/support_us/">
          <font-awesome-icon icon="fa-solid fa-handshake-angle" class="icon" />
          {{ $t('login.support') }} <b>{{ $t('login.swiftwave') }}</b>
        </a>
      </div>
    </div>
    <!--   Login form -->
    <div class="flex h-full w-full flex-col items-center justify-center px-6 py-12 lg:px-8">
      <p class="w-fit text-5xl text-primary-600">
        <font-awesome-icon icon="fa-solid fa-fingerprint" />
      </p>
      <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <!-- Alert  -->
        <div
          v-if="authenticationStatus.visible"
          :class="{
            'border-red-500 bg-red-50': !authenticationStatus.success,
            'border-green-500 bg-green-50': authenticationStatus.success
          }"
          class="mb-5 rounded-sm border-s-4 p-4"
          role="alert">
          <strong
            :class="{
              'text-red-800': !authenticationStatus.success,
              'text-green-800': authenticationStatus.success
            }"
            class="block font-medium"
            >{{ authenticationStatus.message }}</strong
          >
        </div>

        <!-- Email Verification Resend -->
        <div v-if="authenticationStatus.email_verification_required" class="mb-5 rounded-sm border-s-4 border-blue-500 bg-blue-50 p-4">
          <p class="mb-2 text-sm text-blue-800">Enter your email to resend the verification link:</p>
          <div class="flex gap-2">
            <input
              v-model="resendEmail"
              class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="your@email.com"
              type="email" />
            <button
              @click="resendVerification"
              class="whitespace-nowrap rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
              Resend
            </button>
          </div>
          <div v-if="resendStatus.visible" class="mt-2">
            <p :class="resendStatus.success ? 'text-green-700' : 'text-red-700'" class="text-sm">{{ resendStatus.message }}</p>
          </div>
        </div>

        <!--   Login Form   -->
        <form class="space-y-4" @keydown.enter.prevent="login">
          <div>
            <label class="block text-sm font-medium leading-6 text-gray-900" for="email">Email</label>
            <div class="mt-1">
              <input
                id="email"
                v-model="email"
                autocomplete="email"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                name="email"
                placeholder="Enter your email"
                required
                type="email" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium leading-6 text-gray-900" for="password">{{ $t('login.passwordLabel') }}</label>
            <div class="mt-1">
              <input
                id="password"
                v-model="password"
                autocomplete="current-password"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                :placeholder="$t('login.enterPassword')"
                required
                type="password" />
            </div>
          </div>
          <div v-if="authenticationStatus.totp_required">
            <label class="block text-sm font-medium leading-6 text-gray-900" for="2fa_code">{{ $t('login.provide2fa') }}</label>
            <div class="mt-2">
              <v-otp-input
                :num-inputs="6"
                input-classes="otp-input"
                :style="{ justifyContent: 'space-between' }"
                :placeholder="['*', '*', '*', '*', '*', '*']"
                v-model:value="totp"
                @on-change="(v) => (totp = v)" />
            </div>
          </div>
          <div class="py-2">
            <FilledButton :click="login" class="w-full"> {{ $t('login.signIn') }}</FilledButton>
          </div>
          <p class="text-center text-sm text-gray-500">
            Don't have an account?
            <RouterLink to="/register" class="font-semibold text-primary-600 hover:text-primary-500">Create one</RouterLink>
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

.action-btn {
  @apply cursor-pointer rounded-lg border border-secondary-300 bg-white px-4 py-1 font-prompt text-base no-underline shadow-xs hover:bg-secondary-100 focus:outline-none;

  .icon {
    @apply mr-1 text-sm;
  }
}
</style>
