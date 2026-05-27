<script setup>
import { useAuthStore } from '@/store/auth.js';
import { RouterLink, useRouter } from 'vue-router';
import Logo from '@/assets/images/logo-full-inverse-subtitle.png';
import ChangePasswordModal from '@/views/partials/ChangePasswordModal.vue';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { toast } from 'vue-sonner';
import ModalDialog from '@/views/components/ModalDialog.vue';
import LanguageSwitcher from '@/views/components/LanguageSwitcher.vue';
import ThemeToggle from '@/views/components/ThemeToggle.vue';
import { useI18n } from 'vue-i18n';
import { useConfirmDialog } from '@/composables/useConfirmDialog.js';
import ConfirmDialog from '@/views/components/ConfirmDialog.vue';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar
} from '@/components/ui/sidebar';

const { t } = useI18n();
const emit = defineEmits(['navigate']);
const authStore = useAuthStore();
const router = useRouter();
const { state, setOpenMobile } = useSidebar();

const isCollapsed = computed(() => state.value === 'collapsed');
const isChangePasswordModalOpen = ref(false);
const swVersion = ref('');
const openSections = ref(new Set());
const timeCount = ref(5);
const isSystemRestartModalOpen = ref(false);

const menuSections = computed(() => {
  const sections = [
    {
      key: 'deploy',
      label: t('sidebar.deployApplication'),
      icon: 'fa-solid fa-hammer',
      activeUrls: ['Deploy Application', 'Deploy Stack', 'App Store', 'Install from App Store', 'Deployment Plans'],
      items: [
        { label: t('sidebar.appStore'), icon: 'fa-solid fa-store', to: '/deploy/app-store' },
        { label: t('sidebar.deployApp'), icon: 'fa-solid fa-hammer', to: '/deploy/application' },
        { label: t('sidebar.deployStack'), icon: 'fa-solid fa-cubes-stacked', to: '/deploy/stack' },
        { label: t('sidebar.deploymentPlans'), icon: 'fa-solid fa-layer-group', to: '/deploy/deployment-plans' }
      ]
    },
    {
      key: 'applications',
      label: t('sidebar.applicationsVolumes'),
      icon: 'fa-solid fa-box',
      activeUrls: ['Applications', 'Persistent Volumes'],
      items: [
        { label: t('sidebar.applications'), icon: 'fa-solid fa-box', to: '/applications' },
        { label: t('sidebar.persistentVolumes'), icon: 'fa-solid fa-hard-drive', to: '/persistent-volumes' }
      ]
    },
    {
      key: 'routing',
      label: t('sidebar.manageRouting'),
      icon: 'fa-solid fa-route',
      activeUrls: ['Domains', 'Redirect Rules', 'Ingress Rules'],
      items: [
        { label: t('sidebar.domains'), icon: 'fa-solid fa-link', to: '/domains' },
        { label: t('sidebar.ingressRules'), icon: 'fa-solid fa-network-wired', to: '/ingress-rules' },
        { label: t('sidebar.redirectRules'), icon: 'fa-solid fa-location-arrow', to: '/redirect-rules' }
      ]
    },
    {
      key: 'credentials',
      label: t('sidebar.manageCredentials'),
      icon: 'fa-solid fa-vault',
      activeUrls: ['Git Credentials', 'Image Registry Credentials', 'MCP API Keys'],
      items: [
        { label: t('sidebar.gitCredentials'), icon: 'fa-solid fa-code-branch', to: '/git-credentials' },
        { label: t('sidebar.imageRegCredentials'), icon: 'fa-solid fa-cloud', to: '/image-registry-credentials' },
        { label: t('sidebar.mcpApiKeys'), icon: 'fa-solid fa-fingerprint', to: '/mcp-api-keys' }
      ]
    },
    {
      key: 'protection',
      label: t('sidebar.protectApplication'),
      icon: 'fa-solid fa-shield-halved',
      activeUrls: ['Application Auth Basic ACL'],
      items: [{ label: t('sidebar.basicAuthentication'), icon: 'fa-solid fa-user-shield', to: '/app_auth/basic_authentication' }]
    }
  ];

  if (!authStore.isAdmin) {
    sections.push({
      key: 'billing',
      label: t('sidebar.billing'),
      icon: 'fa-solid fa-credit-card',
      activeUrls: ['Plans', 'Billing', 'Usage'],
      items: [
        { label: t('plans.title'), icon: 'fa-solid fa-tags', to: '/plans' },
        { label: t('billing.title'), icon: 'fa-solid fa-file-invoice-dollar', to: '/billing' },
        { label: t('sidebar.usage'), icon: 'fa-solid fa-chart-bar', to: '/usage' },
        { label: t('sidebar.shareFeedback'), icon: 'fa-solid fa-comment-dots', to: '/testimonial' }
      ]
    });
  }

  if (authStore.isAdmin) {
    sections.push(
      {
        key: 'system',
        label: t('sidebar.manageSystem'),
        icon: 'fa-solid fa-gear',
        activeUrls: ['System Logs'],
        items: [
          { label: t('sidebar.systemLogs'), icon: 'fa-solid fa-file-waveform', to: '/logs' },
          { label: t('sidebar.systemConfiguration'), icon: 'fa-solid fa-wrench', to: '/setup?update=1' },
          { label: t('sidebar.systemRestart'), icon: 'fa-solid fa-power-off', action: systemRestart }
        ]
      },
      {
        key: 'admin',
        label: t('sidebar.administration'),
        icon: 'fa-solid fa-user-tie',
        activeUrls: ['Users'],
        items: [
          { label: t('plans.title'), icon: 'fa-solid fa-tags', to: '/plans' },
          { label: t('sidebar.manageUsers'), icon: 'fa-solid fa-users', to: '/users' },
          { label: t('sidebar.testimonials'), icon: 'fa-solid fa-quote-left', to: '/testimonials' },
          { label: t('sidebar.changePassword'), icon: 'fa-solid fa-key', action: openChangePasswordModal },
          { label: t('sidebar.logout'), icon: 'fa-solid fa-right-from-bracket', action: logoutWithConfirmation }
        ]
      }
    );
  }

  return sections;
});

const openChangePasswordModal = () => {
  isChangePasswordModalOpen.value = true;
};

const closeChangePasswordModal = () => {
  isChangePasswordModalOpen.value = false;
};

const isSectionActive = (section) => section.activeUrls.includes(router.currentRoute.value.name);
const isItemActive = (item) => item.to && router.currentRoute.value.path === item.to.split('?')[0];
const isSectionOpen = (section) => !isCollapsed.value && (openSections.value.has(section.key) || isSectionActive(section));

const toggleSection = (section) => {
  const next = new Set(openSections.value);
  if (next.has(section.key)) {
    next.delete(section.key);
  } else {
    next.add(section.key);
  }
  openSections.value = next;
};

const handleAction = (action) => {
  action();
  setOpenMobile(false);
  emit('navigate');
};

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

watch(
  () => router.currentRoute.value.name,
  () => {
    const next = new Set(openSections.value);
    menuSections.value.forEach((section) => {
      if (isSectionActive(section)) {
        next.add(section.key);
      }
    });
    openSections.value = next;
  },
  { immediate: true }
);

const removeAfterEachHook = router.afterEach(() => {
  setOpenMobile(false);
  emit('navigate');
});

onBeforeUnmount(() => {
  removeAfterEachHook();
});
</script>

<template>
  <Sidebar collapsible="icon" class="border-sidebar-border">
    <SidebarHeader class="px-3 pt-5 pb-3">
      <RouterLink to="/" class="flex items-center justify-center overflow-hidden rounded-md">
        <img v-if="!isCollapsed" :src="Logo" :alt="t('brand.name') + ' logo'" class="max-h-12 w-full max-w-40 object-contain" />
        <img v-else src="@/assets/images/logo.png" :alt="t('brand.name')" class="size-8 object-contain" />
      </RouterLink>
    </SidebarHeader>

    <SidebarContent class="px-2">
      <SidebarMenu>
        <SidebarMenuItem v-for="section in menuSections" :key="section.key">
          <SidebarMenuButton
            :tooltip="section.label"
            :is-active="isSectionActive(section)"
            class="cursor-pointer"
            @click="toggleSection(section)">
            <font-awesome-icon :icon="section.icon" />
            <span>{{ section.label }}</span>
            <font-awesome-icon
              icon="fa-solid fa-chevron-right"
              class="ml-auto transition-transform group-data-[collapsible=icon]:hidden"
              :class="{ 'rotate-90': isSectionOpen(section) }" />
          </SidebarMenuButton>

          <SidebarMenuSub v-if="isSectionOpen(section)">
            <SidebarMenuSubItem v-for="item in section.items" :key="item.label">
              <SidebarMenuSubButton v-if="item.to" as-child :is-active="isItemActive(item)">
                <RouterLink :to="item.to">
                  <font-awesome-icon :icon="item.icon" />
                  <span>{{ item.label }}</span>
                </RouterLink>
              </SidebarMenuSubButton>
              <SidebarMenuSubButton v-else as="button" class="w-full cursor-pointer" @click="handleAction(item.action)">
                <font-awesome-icon :icon="item.icon" />
                <span>{{ item.label }}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton :tooltip="$t('sidebar.backends')" as-child :is-active="router.currentRoute.value.name === 'Backends'">
            <RouterLink to="/backends">
              <font-awesome-icon icon="fa-solid fa-database" />
              <span>{{ $t('sidebar.backends') }}</span>
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarContent>

    <SidebarFooter class="text-sidebar-foreground/80">
      <div class="flex items-center justify-between gap-2 px-2 text-sm font-medium group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <LanguageSwitcher v-if="!isCollapsed" />
        <ThemeToggle />
        <span v-if="!isCollapsed"> v{{ swVersion }}</span>
      </div>
      <div v-if="!isCollapsed" class="px-2 text-sm font-medium">
        <span>{{ $t('sidebar.autoLogout') }} {{ authStore.sessionRelativeTimeoutStatus }}</span>
      </div>
    </SidebarFooter>

    <ChangePasswordModal :is-modal-open="isChangePasswordModalOpen" :close-modal="closeChangePasswordModal" />
    <Teleport to="body">
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
  </Sidebar>
</template>
