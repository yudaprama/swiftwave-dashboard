<script setup>
import { computed, reactive } from 'vue'
import { useAuthStore } from '@/store/auth.js'
import router from '@/router/index.js'
import FilledButton from '@/views/components/FilledButton.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const authenticationStatus = reactive({
  visible: false,
  success: false,
  message: ''
})
const authStore = useAuthStore()
const redirectPath = computed(() => router.currentRoute.value.query.redirect || '/applications')

const login = () => {
  authStore.LoginWithGitHub(redirectPath.value)
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

        <!--   Login Form   -->
        <form class="space-y-4" @keydown.enter.prevent="login">
          <p class="text-center text-sm text-gray-600">{{ $t('login.signInHint') }}</p>
          <div class="py-2">
            <FilledButton :click="login" class="w-full">
              <font-awesome-icon icon="fa-brands fa-github" class="mr-2" />
              {{ $t('login.continueWithGitHub') }}
            </FilledButton>
          </div>
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
