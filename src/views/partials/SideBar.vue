<script setup>
import { useAuthStore } from '@/store/auth.js';
import { RouterLink, useRouter } from 'vue-router';
import Logo from '@/assets/images/logo-full-inverse-subtitle.png';
import ChangePasswordModal from '@/views/partials/ChangePasswordModal.vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import SideBarOption from '@/views/partials/SideBarOption.vue';
import { useMutation } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { toast } from 'vue-sonner';
import ModalDialog from '@/views/components/ModalDialog.vue';
import LanguageSwitcher from '@/views/components/LanguageSwitcher.vue';
import ThemeToggle from '@/views/components/ThemeToggle.vue';
import { useI18n } from 'vue-i18n';
import { useConfirmDialog } from '@/composables/useConfirmDialog.js';
import ConfirmDialog from '@/views/components/ConfirmDialog.vue';

const { t } = useI18n();
const emit = defineEmits(['navigate']);
const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
});
const authStore = useAuthStore();
const router = useRouter();

const isChangePasswordModalOpen = ref(false);
const swVersion = ref('');
const openChangePasswordModal = () => {
  isChangePasswordModalOpen.value = true;
};
const closeChangePasswordModal = () => {
  isChangePasswordModalOpen.value = false;
};
const isShowSideBar = computed(() => {
  if (!authStore.IsLoggedIn) {
    return false;
  } else {
    return !['Download Persistent Volume Backup', 'Maintenance', 'Setup'].includes(router.currentRoute.value.name);
  }
});

const {
  isOpen: isLogoutConfirmOpen,
  message: logoutMessage,
  confirmType: logoutConfirmType,
  confirm: askLogout,
  onConfirm: onLogoutConfirm,
  onCancel: onLogoutCancel
} = useConfirmDialog();

const logoutWithConfirmation = async () => {
  if (await askLogout(t('sidebar.logoutConfirm'), 'danger')) {
    authStore.Logout();
  }
};

const fetchSWVersion = () => {
  if (authStore.IsLoggedIn) {
    authStore.fetchSWVersion().then((v) => {
      swVersion.value = v;
    });
  }
};

onMounted(() => {
  fetchSWVersion();
  const intervalId = setInterval(() => {
    if (authStore.IsLoggedIn) {
      if (swVersion.value === '') {
        fetchSWVersion();
      } else {
        clearInterval(intervalId);
      }
    }
  }, 2000);
});

// Restart system
const timeCount = ref(5);

const isSystemRestartModalOpen = ref(false);
const {
  mutate: restartSystem,
  onDone: onRestartSystemDone,
  onError: onRestartSystemError
} = useMutation(gql`
  mutation {
    restartSystem
  }
`);

onRestartSystemError((error) => {
  toast.error(error.message);
});

onRestartSystemDone((val) => {
  if (val.data.restartSystem) {
    toast.success(t('sidebar.restartRequested'));
    isSystemRestartModalOpen.value = true;
    startCountDown();
  } else {
    toast.error(t('sidebar.restartFailed'));
  }
});

const {
  isOpen: isRestartConfirmOpen,
  message: restartMessage,
  confirmType: restartConfirmType,
  confirm: askRestart,
  onConfirm: onRestartConfirm,
  onCancel: onRestartCancel
} = useConfirmDialog();

const systemRestart = async () => {
  if (await askRestart(t('sidebar.restartConfirm'), 'warning')) {
    restartSystem();
  }
};

const startCountDown = () => {
  const interval = setInterval(() => {
    timeCount.value--;
    if (timeCount.value === 0) {
      clearInterval(interval);
      isSystemRestartModalOpen.value = false;
      router.push({ name: 'Maintenance', query: { redirect: router.currentRoute.value.path } });
    }
  }, 1000);
};

// Emit navigate event when clicking any router link (for mobile drawer close)
const removeAfterEachHook = router.afterEach(() => {
  emit('navigate');
});

onBeforeUnmount(() => {
  removeAfterEachHook();
});
</script>

<template>
  <aside
    v-if="isShowSideBar"
    class="scrollbox bg-primary-600 dark:bg-secondary-900 flex h-screen flex-col overflow-y-auto border-r px-2 pt-6 pb-2 transition-all duration-300 dark:border-gray-700"
    :class="collapsed ? 'w-16 items-center' : 'w-80'">
    <div :class="collapsed ? 'px-0' : 'px-3'">
      <RouterLink to="/" class="flex items-center justify-center">
        <img v-if="!collapsed" :src="Logo" :alt="t('brand.name') + ' logo'" class="w-full max-w-40" />
        <img v-else src="@/assets/images/logo.png" :alt="t('brand.name')" class="h-8 w-8" />
      </RouterLink>
    </div>
    <div class="mt-6 flex flex-1 flex-col justify-between">
      <nav>
        <SideBarOption
          :collapsed="collapsed"
          :label="$t('sidebar.deployApplication')"
          :active-urls="['Deploy Application', 'Deploy Stack', 'App Store', 'Install from App Store']">
          <template #icon>
            <font-awesome-icon icon="fa-solid fa-hammer" />
          </template>
          <template #title> {{ $t('sidebar.deployApplication') }}</template>
          <template #content>
            <div class="space-y-2">
              <RouterLink
                class="flex transform items-center rounded-lg px-3 py-2 text-gray-200 transition-colors duration-300 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                to="/deploy/app-store">
                <font-awesome-icon icon="fa-solid fa-store" />
                <span class="mx-2 text-sm font-medium">{{ $t('sidebar.appStore') }}</span>
              </RouterLink>
              <RouterLink
                class="flex transform items-center rounded-lg px-3 py-2 text-gray-200 transition-colors duration-300 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                to="/deploy/application">
                <font-awesome-icon icon="fa-solid fa-hammer" />
                <span class="mx-2 text-sm font-medium">{{ $t('sidebar.deployApp') }}</span>
              </RouterLink>
              <RouterLink
                class="flex transform items-center rounded-lg px-3 py-2 text-gray-200 transition-colors duration-300 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                to="/deploy/stack">
                <font-awesome-icon icon="fa-solid fa-cubes-stacked" />
                <span class="mx-2 text-sm font-medium">{{ $t('sidebar.deployStack') }}</span>
              </RouterLink>
            </div>
          </template>
        </SideBarOption>

        <SideBarOption
          :collapsed="collapsed"
          :label="$t('sidebar.applicationsVolumes')"
          :active-urls="['Applications', 'Persistent Volumes']">
          <template #icon>
            <font-awesome-icon icon="fa-solid fa-box" />
          </template>
          <template #title> {{ $t('sidebar.applicationsVolumes') }}</template>
          <template #content>
            <div class="space-y-2">
              <RouterLink
                class="flex transform items-center rounded-lg px-3 py-2 text-gray-200 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                to="/applications">
                <font-awesome-icon icon="fa-solid fa-box" />
                <span class="mx-2 text-sm font-medium">{{ $t('sidebar.applications') }}</span>
              </RouterLink>
              <RouterLink
                class="flex transform items-center rounded-lg px-3 py-2 text-gray-200 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                to="/persistent-volumes">
                <font-awesome-icon icon="fa-solid fa-hard-drive" />
                <span class="mx-2 text-sm font-medium">{{ $t('sidebar.persistentVolumes') }}</span>
              </RouterLink>
            </div>
          </template>
        </SideBarOption>

        <SideBarOption
          :collapsed="collapsed"
          :label="$t('sidebar.manageRouting')"
          :active-urls="['Domains', 'Redirect Rules', 'Ingress Rules']">
          <template #icon>
            <font-awesome-icon icon="fa-solid fa-route" />
          </template>
          <template #title>{{ $t('sidebar.manageRouting') }}</template>
          <template #content>
            <div class="space-y-2">
              <RouterLink
                class="flex transform items-center rounded-lg px-3 py-2 text-gray-200 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                to="/domains">
                <font-awesome-icon icon="fa-solid fa-link" />
                <span class="mx-2 text-sm font-medium">{{ $t('sidebar.domains') }}</span>
              </RouterLink>
              <RouterLink
                class="flex transform items-center rounded-lg px-3 py-2 text-gray-200 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                to="/ingress-rules">
                <font-awesome-icon icon="fa-solid fa-network-wired" />
                <span class="mx-2 text-sm font-medium">{{ $t('sidebar.ingressRules') }}</span>
              </RouterLink>
              <RouterLink
                class="flex transform items-center rounded-lg px-3 py-2 text-gray-200 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                to="/redirect-rules">
                <font-awesome-icon icon="fa-solid fa-location-arrow" />
                <span class="mx-2 text-sm font-medium">{{ $t('sidebar.redirectRules') }}</span>
              </RouterLink>
            </div>
          </template>
        </SideBarOption>

        <RouterLink
          class="flex transform items-center rounded-lg px-3 py-2 text-gray-200 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
          to="/backends">
          <font-awesome-icon icon="fa-solid fa-database" />
          <span class="mx-2 text-sm font-medium">{{ $t('sidebar.backends') }}</span>
        </RouterLink>

        <SideBarOption
          :collapsed="collapsed"
          :label="$t('sidebar.manageCredentials')"
          :active-urls="['Git Credentials', 'Image Registry Credentials', 'MCP API Keys']">
          <template #icon>
            <font-awesome-icon icon="fa-solid fa-vault" />
          </template>
          <template #title>{{ $t('sidebar.manageCredentials') }}</template>
          <template #content>
            <div class="space-y-2">
              <RouterLink
                class="flex transform items-center rounded-lg px-3 py-2 text-gray-200 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                to="/git-credentials">
                <font-awesome-icon icon="fa-solid fa-code-branch" />
                <span class="mx-2 text-sm font-medium">{{ $t('sidebar.gitCredentials') }}</span>
              </RouterLink>
              <RouterLink
                class="flex transform items-center rounded-lg px-3 py-2 text-gray-200 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                to="/image-registry-credentials">
                <font-awesome-icon icon="fa-solid fa-cloud" />
                <span class="mx-2 text-sm font-medium">{{ $t('sidebar.imageRegCredentials') }}</span>
              </RouterLink>
              <RouterLink
                class="flex transform items-center rounded-lg px-3 py-2 text-gray-200 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                to="/mcp-api-keys">
                <font-awesome-icon icon="fa-solid fa-fingerprint" />
                <span class="mx-2 text-sm font-medium">{{ $t('sidebar.mcpApiKeys') }}</span>
              </RouterLink>
            </div>
          </template>
        </SideBarOption>

        <SideBarOption
          :collapsed="collapsed"
          :label="$t('sidebar.protectApplication')"
          :active-urls="['Application Auth Basic ACL']">
          <template #icon>
            <font-awesome-icon icon="fa-solid fa-shield-halved" />
          </template>
          <template #title>{{ $t('sidebar.protectApplication') }}</template>
          <template #content>
            <div class="space-y-2">
              <RouterLink
                class="flex transform items-center rounded-lg px-3 py-2 text-gray-200 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                to="/app_auth/basic_authentication">
                <font-awesome-icon icon="fa-solid fa-user-shield" />
                <span class="mx-2 text-sm font-medium">{{ $t('sidebar.basicAuthentication') }}</span>
              </RouterLink>
            </div>
          </template>
        </SideBarOption>

        <SideBarOption
          v-if="!authStore.isAdmin"
          :collapsed="collapsed"
          :label="$t('sidebar.billing')"
          :active-urls="['Plans', 'Billing', 'Usage']">
          <template #icon>
            <font-awesome-icon icon="fa-solid fa-credit-card" />
          </template>
          <template #title>{{ $t('sidebar.billing') }}</template>
          <template #content>
            <div class="space-y-2">
              <RouterLink
                class="flex transform items-center rounded-lg px-3 py-2 text-gray-200 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                to="/plans">
                <font-awesome-icon icon="fa-solid fa-tags" />
                <span class="mx-2 text-sm font-medium">{{ $t('plans.title') }}</span>
              </RouterLink>
              <RouterLink
                class="flex transform items-center rounded-lg px-3 py-2 text-gray-200 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                to="/billing">
                <font-awesome-icon icon="fa-solid fa-file-invoice-dollar" />
                <span class="mx-2 text-sm font-medium">{{ $t('billing.title') }}</span>
              </RouterLink>
              <RouterLink
                class="flex transform items-center rounded-lg px-3 py-2 text-gray-200 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                to="/usage">
                <font-awesome-icon icon="fa-solid fa-chart-bar" />
                <span class="mx-2 text-sm font-medium">{{ $t('sidebar.usage') }}</span>
              </RouterLink>
              <RouterLink
                class="flex transform items-center rounded-lg px-3 py-2 text-gray-200 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                to="/testimonial">
                <font-awesome-icon icon="fa-solid fa-comment-dots" />
                <span class="mx-2 text-sm font-medium">{{ $t('sidebar.shareFeedback') }}</span>
              </RouterLink>
            </div>
          </template>
        </SideBarOption>

        <SideBarOption
          v-if="authStore.isAdmin"
          :collapsed="collapsed"
          :label="$t('sidebar.manageSystem')"
          :active-urls="['System Logs']">
          <template #icon>
            <font-awesome-icon icon="fa-solid fa-gear" />
          </template>
          <template #title> {{ $t('sidebar.manageSystem') }}</template>
          <template #content>
            <div class="space-y-2">
              <RouterLink
                class="flex transform items-center rounded-lg px-3 py-2 text-gray-200 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                to="/logs">
                <font-awesome-icon icon="fa-solid fa-file-waveform" />
                <span class="mx-2 text-sm font-medium">{{ $t('sidebar.systemLogs') }}</span>
              </RouterLink>
              <RouterLink
                class="flex transform items-center rounded-lg px-3 py-2 text-gray-200 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                to="/setup?update=1">
                <font-awesome-icon icon="fa-solid fa-wrench" />
                <span class="mx-2 text-sm font-medium">{{ $t('sidebar.systemConfiguration') }}</span>
              </RouterLink>
              <button
                type="button"
                class="flex w-full transform cursor-pointer items-center rounded-lg px-3 py-2 text-left text-gray-200 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                @click="systemRestart">
                <font-awesome-icon icon="fa-solid fa-power-off" />
                <span class="mx-2 text-sm font-medium">{{ $t('sidebar.systemRestart') }}</span>
              </button>
            </div>
          </template>
        </SideBarOption>

        <SideBarOption
          v-if="authStore.isAdmin"
          :collapsed="collapsed"
          :label="$t('sidebar.administration')"
          :active-urls="['Users']">
          <template #icon>
            <font-awesome-icon icon="fa-solid fa-user-tie" />
          </template>
          <template #title> {{ $t('sidebar.administration') }}</template>
          <template #content>
            <div class="space-y-2">
              <RouterLink
                class="flex transform items-center rounded-lg px-3 py-2 text-gray-200 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                to="/plans">
                <font-awesome-icon icon="fa-solid fa-tags" />
                <span class="mx-2 text-sm font-medium">{{ $t('plans.title') }}</span>
              </RouterLink>
              <RouterLink
                class="flex transform items-center rounded-lg px-3 py-2 text-gray-200 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                to="/users">
                <font-awesome-icon icon="fa-solid fa-users" />
                <span class="mx-2 text-sm font-medium">{{ $t('sidebar.manageUsers') }}</span>
              </RouterLink>
              <RouterLink
                class="flex transform items-center rounded-lg px-3 py-2 text-gray-200 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                to="/testimonials">
                <font-awesome-icon icon="fa-solid fa-quote-left" />
                <span class="mx-2 text-sm font-medium">{{ $t('sidebar.testimonials') }}</span>
              </RouterLink>
              <button
                type="button"
                class="flex w-full transform cursor-pointer items-center rounded-lg px-3 py-2 text-left text-gray-200 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                @click="openChangePasswordModal">
                <font-awesome-icon icon="fa-solid fa-key" />
                <span class="mx-2 text-sm font-medium">{{ $t('sidebar.changePassword') }}</span>
              </button>
              <button
                type="button"
                class="flex w-full transform cursor-pointer items-center rounded-lg px-3 py-2 text-left text-gray-200 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                @click="logoutWithConfirmation">
                <font-awesome-icon icon="fa-solid fa-right-from-bracket" />
                <span class="mx-2 text-sm font-medium">{{ $t('sidebar.logout') }}</span>
              </button>
            </div>
          </template>
        </SideBarOption>
      </nav>
    </div>
    <div v-if="!collapsed" class="flex items-center justify-between px-2 text-sm font-medium text-white">
      <LanguageSwitcher />
      <ThemeToggle />
      <span> v{{ swVersion }}</span>
    </div>
    <div v-if="!collapsed" class="px-2 text-sm font-medium text-white">
      <span>{{ $t('sidebar.autoLogout') }} {{ authStore.sessionRelativeTimeoutStatus }}</span>
    </div>
    <div v-else class="flex flex-col items-center gap-2 px-0 pt-2">
      <ThemeToggle />
    </div>
    <ChangePasswordModal :is-modal-open="isChangePasswordModalOpen" :close-modal="closeChangePasswordModal" />
    <Teleport to="body">
      <!-- Modal for restart system -->
      <ModalDialog :is-open="isSystemRestartModalOpen" non-cancelable>
        <template v-slot:header>
          <span>Restarting System</span>
        </template>
        <template v-slot:body>
          <p class="mb-2">System restart has been requested.</p>
          <p>
            Redirecting to Maintenance Page in <b>{{ timeCount }}</b> seconds
          </p>
        </template>
      </ModalDialog>
    </Teleport>

    <!-- Confirm dialogs -->
    <ConfirmDialog
      :is-open="isLogoutConfirmOpen"
      :message="logoutMessage"
      :confirm-type="logoutConfirmType"
      :on-confirm="onLogoutConfirm"
      :on-cancel="onLogoutCancel" />
    <ConfirmDialog
      :is-open="isRestartConfirmOpen"
      :message="restartMessage"
      :confirm-type="restartConfirmType"
      :on-confirm="onRestartConfirm"
      :on-cancel="onRestartCancel" />
  </aside>
</template>

<style scoped>
@reference "../../assets/css/base.css";
.router-link-exact-active {
  @apply bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-100;
}

.scrollbox::-webkit-scrollbar {
  width: 12px;
}

.scrollbox::-webkit-scrollbar-thumb {
  @apply rounded-full shadow-[inset_0_0_10px_10px_white];
  border: solid 3px transparent;
}
</style>
