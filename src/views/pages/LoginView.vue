<script setup>
import { computed, reactive } from 'vue';
import { useAuthStore } from '@/store/auth.js';
import router from '@/router/index.js';
import FilledButton from '@/views/components/FilledButton.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const authenticationStatus = reactive({
  visible: false,
  success: false,
  message: ''
});
const authStore = useAuthStore();
const redirectPath = computed(() => router.currentRoute.value.query.redirect || '/applications');

const login = () => {
  authStore.LoginWithGitHub(redirectPath.value);
};
</script>

<template>
  <div
    class="dark:bg-secondary-900 flex min-h-dvh w-full flex-col overflow-y-auto bg-white md:h-full md:flex-row md:overflow-hidden">
    <!--  Content  -->
    <div
      class="dark:bg-secondary-900 relative flex min-h-[46dvh] min-w-0 flex-col items-center justify-between bg-[#F9F8F8] px-4 py-8 text-center select-none md:h-full md:min-w-[60vw] md:justify-start md:px-6 md:pt-52 md:text-left">
      <!--   Logo with title/subtitle   -->
      <div class="flex w-fit flex-row items-center justify-center gap-2">
        <img src="@/assets/images/logo.png" class="w-12 md:w-14" :alt="$t('brand.name') + ' logo'" />
        <div class="flex flex-col items-start justify-between">
          <p class="font-prompt text-2xl text-gray-900 md:text-3xl dark:text-gray-100">{{ $t('login.title') }}</p>
          <p class="font-prompt text-sm text-gray-700 md:text-base dark:text-gray-300">{{ $t('login.subtitle') }}</p>
        </div>
      </div>
      <!--    Heading  -->
      <div class="my-8 md:mt-32">
        <p class="font-comfortaa text-3xl leading-tight text-gray-900 sm:text-4xl md:text-5xl dark:text-gray-100">
          <span class="text-primary-600 dark:text-primary-400">{{ $t('login.heading1') }}</span
          >&nbsp;{{ $t('login.heading2') }}
        </p>
        <p
          class="font-comfortaa mt-3 text-3xl leading-tight text-gray-900 sm:text-4xl md:mt-6 md:text-5xl dark:text-gray-100">
          {{ $t('login.heading3') }}
        </p>
      </div>
      <!--   Button panel   -->
      <div
        v-if="false"
        class="flex w-full flex-row flex-wrap items-center justify-center gap-2 md:absolute md:right-0 md:bottom-0 md:left-0 md:gap-3 md:pb-6">
        <a class="action-btn" target="_blank" href="https://github.com/swiftwave-org/swiftwave">
          <font-awesome-icon icon="fa-brands fa-github" class="icon" aria-hidden="true" />
          {{ $t('login.github') }}
        </a>
        <a class="action-btn" target="_blank" href="https://github.com/swiftwave-org/swiftwave/issues/new/choose">
          <font-awesome-icon icon="fa-solid fa-bug" class="icon" aria-hidden="true" />
          {{ $t('login.reportBug') }}
        </a>
        <a class="action-btn" target="_blank" href="https://slack.swiftwave.org/">
          <font-awesome-icon icon="fa-solid fa-people-group" class="icon" aria-hidden="true" />
          {{ $t('login.joinCommunity') }}
        </a>
        <a class="action-btn" target="_blank" href="mailto:support@swiftwave.org">
          <font-awesome-icon icon="fa-solid fa-envelope" class="icon" aria-hidden="true" />
          {{ $t('login.reachTeam') }}
        </a>
        <a class="action-btn" target="_blank" href="https://swiftwave.org/docs/support_us/">
          <font-awesome-icon icon="fa-solid fa-handshake-angle" class="icon" aria-hidden="true" />
          {{ $t('login.support') }} <b>{{ $t('login.swiftwave') }}</b>
        </a>
      </div>
    </div>
    <!--   Login form -->
    <div
      class="dark:bg-secondary-800 flex min-h-[54dvh] w-full flex-col items-center justify-center bg-white px-6 py-10 md:h-full lg:px-8">
      <p class="text-primary-600 w-fit text-5xl">
        <font-awesome-icon icon="fa-solid fa-fingerprint" aria-hidden="true" />
      </p>
      <div class="mt-8 w-full max-w-sm sm:mx-auto md:mt-10">
        <!-- Alert  -->
        <div
          v-if="authenticationStatus.visible"
          :class="{
            'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20': !authenticationStatus.success,
            'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20': authenticationStatus.success
          }"
          class="mb-5 rounded-sm border-s-4 p-4"
          role="alert">
          <strong
            :class="{
              'text-red-800 dark:text-red-300': !authenticationStatus.success,
              'text-green-800 dark:text-green-300': authenticationStatus.success
            }"
            class="block font-medium"
            >{{ authenticationStatus.message }}</strong
          >
        </div>

        <!--   Login Form   -->
        <form class="space-y-4" @keydown.enter.prevent="login">
          <p class="text-center text-sm text-gray-600 dark:text-gray-400">{{ $t('login.signInHint') }}</p>
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

.action-btn {
  @apply border-secondary-300 font-prompt hover:bg-secondary-100 focus-visible:outline-primary-600 dark:bg-secondary-700 dark:hover:bg-secondary-600 min-h-9 cursor-pointer rounded-lg border bg-white px-3 py-1.5 text-sm text-gray-900 no-underline shadow-xs focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 md:px-4 md:py-1 md:text-base dark:border-gray-600 dark:text-gray-200;

  .icon {
    @apply mr-1 text-sm;
  }
}
</style>
