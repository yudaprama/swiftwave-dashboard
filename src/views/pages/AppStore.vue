<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import ModalDialog from '@/views/components/ModalDialog.vue';
import OutlinedButton from '@/views/components/OutlinedButton.vue';
import DotLoader from '@/views/components/DotLoader.vue';
import { useRouter, useRoute } from 'vue-router';
import { getHttpBaseUrl } from '@/vendor/utils.js';
import { useAuthStore } from '@/store/auth.js';
import { toast } from 'vue-sonner';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const apps = ref([]);
const appsShown = ref([]);
const searchText = ref('');
const isOptionsModalOpen = ref(false);
const selectedApp = ref({});
const selectedCategory = ref('');
const isLoading = ref(false);
const isCheckoutModalOpen = ref(false);
const checkoutLoading = ref(false);
const checkoutPurchase = ref(null);
const checkoutStack = ref(null);
let checkoutPollTimer = null;
let checkoutPollErrorCount = 0;
const checkoutPollStartTime = ref(null);
const POLL_TIMEOUT_MS = 30 * 60 * 1000;
const idrPerUsd = 20000;

watch(apps, () => {
  if (!apps.value.length) return;
  searchApps();
});

onMounted(async () => {
  await fetchApps();
  // Auto-trigger renewal if query params present
  if (route.query.renew === 'true') {
    const catalogId = parseInt(route.query.catalog_id);
    const stackId = parseInt(route.query.stack_id);
    const groupId = route.query.group_id || null;
    const app = apps.value.find((a) => a.id === catalogId);
    const stack = app?.stacks?.find((s) => s.id === stackId);
    if (app && stack) {
      startCheckout(app, stack, groupId);
    }
  }
});

onBeforeUnmount(() => {
  if (checkoutPollTimer) {
    clearInterval(checkoutPollTimer);
    checkoutPollTimer = null;
  }
});

const closeModal = () => {
  isOptionsModalOpen.value = false;
};

const closeCheckoutModal = () => {
  isCheckoutModalOpen.value = false;
  if (checkoutPollTimer) {
    clearInterval(checkoutPollTimer);
    checkoutPollTimer = null;
  }
};

const openModal = () => {
  isOptionsModalOpen.value = true;
};

function fetchApps() {
  isLoading.value = true;
  return fetch(`${getHttpBaseUrl()}/api/app-catalog`, {
    headers: {
      Authorization: authStore.FetchBearerToken()
    }
  })
    .then((response) => response.json())
    .then((data) => {
      apps.value = data || [];
      isLoading.value = false;
    })
    .catch((error) => {
      console.log(error);
      isLoading.value = false;
    });
}

const categories = computed(() => {
  const appCategories = new Set();
  apps.value.forEach((app) => {
    appCategories.add(app.category);
  });
  return Array.from(appCategories).sort();
});

function searchApps() {
  // split search text by space and search for each word
  const searchWords = searchText.value.split(' ');
  appsShown.value = apps.value.filter((app) => {
    return (
      (selectedCategory.value === '' || app.category === selectedCategory.value) &&
      searchWords.every((word) => {
        return (
          app.title.toLowerCase().includes(word.toLowerCase()) ||
          app.description.toLowerCase().includes(word.toLowerCase())
        );
      })
    );
  });
}

const chooseApp = (app) => {
  if (!app) return;
  if (app.stacks.length === 1) {
    openStackFileForInstall(app.stacks[0], app);
    return;
  }
  selectedApp.value = app;
  openModal();
};

const chooseCategory = (category) => {
  selectedCategory.value = category;
  searchText.value = '';
  nextTick(() => {
    searchApps();
  });
};

const openStackFileForInstall = (stack, app = selectedApp.value, purchase = null) => {
  if (isPaid(app) && !purchase) {
    startCheckout(app, stack);
    return;
  }
  const query = purchase
    ? {
        stack_id: stack.id,
        catalog_id: app.id,
        purchase_id: purchase.id
      }
    : {
        stack: stack.stack_url
      };
  router.push({
    name: 'Install from App Store',
    query
  });
};

const startCheckout = async (app, stack, applicationGroupID = null) => {
  checkoutLoading.value = true;
  checkoutPurchase.value = null;
  checkoutStack.value = stack;
  selectedApp.value = app;
  isCheckoutModalOpen.value = true;
  try {
    const body = {};
    if (applicationGroupID) {
      body.application_group_id = applicationGroupID;
    }
    const response = await fetch(`${getHttpBaseUrl()}/api/app-catalog/${app.id}/stacks/${stack.id}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authStore.FetchBearerToken()
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create checkout');
    }
    if (data.has_access && data.purchase) {
      openStackFileForInstall(stack, app, data.purchase);
      return;
    }
    checkoutPurchase.value = data.purchase;
    startCheckoutPolling(app, stack, data.purchase.id);
  } catch (error) {
    toast.error(error.message);
    closeCheckoutModal();
  } finally {
    checkoutLoading.value = false;
  }
};

const startCheckoutPolling = (app, stack, purchaseId) => {
  if (checkoutPollTimer) {
    clearInterval(checkoutPollTimer);
  }
  checkoutPollErrorCount = 0;
  checkoutPollStartTime.value = Date.now();
  checkoutPollTimer = setInterval(async () => {
    try {
      if (Date.now() - checkoutPollStartTime.value > POLL_TIMEOUT_MS) {
        clearInterval(checkoutPollTimer);
        checkoutPollTimer = null;
        checkoutPurchase.value = { ...checkoutPurchase.value, status: 'timeout' };
        toast.error('Payment timed out. Please try again.');
        return;
      }
      const response = await fetch(`${getHttpBaseUrl()}/api/app-catalog/purchases/${purchaseId}`, {
        headers: {
          Authorization: authStore.FetchBearerToken()
        }
      });
      const purchase = await response.json();
      if (!response.ok) return;
      checkoutPollErrorCount = 0;
      checkoutPurchase.value = purchase;
      if (purchase.status === 'paid') {
        closeCheckoutModal();
        openStackFileForInstall(stack, app, purchase);
      } else if (purchase.status === 'failed') {
        clearInterval(checkoutPollTimer);
        checkoutPollTimer = null;
        toast.error('Payment failed. Please try again.');
      } else if (purchase.status === 'expired') {
        clearInterval(checkoutPollTimer);
        checkoutPollTimer = null;
        toast.error('Payment link expired. Please start a new checkout.');
      }
    } catch (error) {
      checkoutPollErrorCount++;
      if (checkoutPollErrorCount >= 3) {
        toast.error('Having trouble checking payment status. Will keep trying...');
        checkoutPollErrorCount = 0;
      }
    }
  }, 3000);
};

const openCheckoutInvoice = () => {
  if (!checkoutPurchase.value?.xendit_invoice_url) return;
  window.open(checkoutPurchase.value.xendit_invoice_url, '_blank');
};

const formatUsd = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const formatIdr = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const isPaid = (app) => {
  return (app?.price_cents ?? 0) > 0;
};

const formatPrice = (app) => {
  const price = app?.price_cents ?? 0;
  if (price <= 0) return 'Free';

  const usdAmount = price / idrPerUsd;
  if ((app?.price_currency || 'IDR').toUpperCase() === 'USD') {
    return `${formatUsd(usdAmount)} / ${formatIdr(price)}`;
  }

  return `${formatIdr(price)} / ${formatUsd(usdAmount)}`;
};
</script>

<template>
  <!-- If loading   -->
  <div v-if="isLoading" class="flex h-full w-full items-center justify-center">
    <DotLoader />
  </div>
  <!-- Main -->
  <section v-else class="flex w-full flex-row items-start gap-2 overflow-hidden px-2 md:px-0">
    <div class="navbar">
      <input
        class="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 text-sm shadow-xs"
        :placeholder="$t('appStore.searchApps')"
        v-model="searchText"
        @keydown.enter="searchApps"
        v-debounce:200ms="searchApps"
        type="text" />
      <div class="w-full rounded-md px-2 py-2 text-sm font-medium text-black select-none">
        {{ $t('appStore.chooseCategory') }}
      </div>
      <div
        class="nav-element"
        @click="chooseCategory('')"
        :class="{
          'nav-active': selectedCategory === ''
        }">
        {{ $t('appStore.allApps') }}
      </div>
      <div
        v-for="category in categories"
        :key="category"
        class="nav-element"
        @click="chooseCategory(category)"
        :class="{
          'nav-active': selectedCategory === category
        }">
        {{ category }}
      </div>
    </div>
    <!-- Apps List -->
    <div class="scrollbox h-full w-full overflow-auto">
      <!--    No app available -->
      <div v-if="appsShown.length === 0" class="flex h-full w-full flex-col items-center justify-center">
        <p class="text-5xl">🤔</p>
        <p class="mt-10 ml-4 text-xl font-medium">{{ $t('appStore.noAppsFound') }}</p>
        <p class="mt-3">
          {{ $t('appStore.noAppsHint') }}
          <a href="https://github.com/swiftwave-org/app-store" target="_blank" class="text-primary-600 font-semibold">{{
            $t('appStore.swiftwaveAppStore')
          }}</a
          >.
        </p>
      </div>
      <!--    Apps List (If available) -->
      <div v-else class="grid grid-cols-5 gap-2 pr-2">
        <!-- Component  -->
        <div
          @click="() => chooseApp(app)"
          v-for="app in appsShown"
          :key="app.id"
          class="border-secondary-300 hover:border-primary-500 flex h-[200px] cursor-pointer flex-col overflow-hidden rounded-xl border p-2 hover:shadow-xs dark:border-gray-600">
          <!--    Header    -->
          <div class="flex flex-row gap-3 border-b pb-2 dark:border-gray-700">
            <div class="h-12 w-12 rounded-md p-1.5">
              <img :src="app.logo" class="h-full w-full" :alt="app.title" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-base font-semibold text-gray-800 dark:text-gray-200 truncate">{{ app.title }}</p>
              <p class="text-sm">{{ app.category }}</p>
            </div>
            <!--    Price Badge    -->
            <div
              :class="isPaid(app) ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'"
              class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold">
              {{ formatPrice(app) }}
            </div>
          </div>
          <!--    Description Body    -->
          <div
            class="text-secondary-800 mt-2 h-full overflow-hidden p-1 text-justify text-sm text-ellipsis dark:text-gray-300">
            {{ app.description }}
          </div>
        </div>
      </div>
    </div>
  </section>
  <!-- Modal to show options -->
  <ModalDialog :close-modal="closeModal" :is-open="isOptionsModalOpen">
    <template v-slot:header>
      {{ $t('appStore.install') }} {{ selectedApp.title }}
      <span
        :class="isPaid(selectedApp) ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'"
        class="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold">
        {{ formatPrice(selectedApp) }}
      </span>
    </template>
    <template v-slot:body>
      <p>{{ $t('appStore.chooseVersion') }}</p>
      <div class="mt-6 flex flex-col gap-2">
        <OutlinedButton
          :click="() => openStackFileForInstall(stack, selectedApp)"
          class="w-full"
          type="primary"
          v-for="stack in selectedApp.stacks"
          :key="stack.id">
          {{ stack.title }}
        </OutlinedButton>
      </div>
    </template>
  </ModalDialog>
  <ModalDialog :close-modal="closeCheckoutModal" :is-open="isCheckoutModalOpen">
    <template v-slot:header>
      Checkout {{ selectedApp.title }}
    </template>
    <template v-slot:body>
      <div class="flex flex-col gap-4">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-300">{{ checkoutStack?.title }}</p>
          <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ formatPrice(selectedApp) }}</p>
        </div>
        <div v-if="checkoutLoading" class="flex justify-center py-6">
          <DotLoader />
        </div>
        <template v-else>
          <p v-if="checkoutPurchase?.status === 'failed'" class="text-sm text-red-600 dark:text-red-400">
            {{ $t('appStore.paymentFailed') }}
          </p>
          <p v-else-if="checkoutPurchase?.status === 'expired'" class="text-sm text-amber-600 dark:text-amber-400">
            {{ $t('appStore.paymentExpired') }}
          </p>
          <p v-else-if="checkoutPurchase?.status === 'timeout'" class="text-sm text-amber-600 dark:text-amber-400">
            {{ $t('appStore.paymentTimedOut') }}
          </p>
          <template v-else>
            <p class="text-sm text-gray-700 dark:text-gray-200">
              {{ $t('appStore.paymentPending') }}
            </p>
            <OutlinedButton type="primary" class="w-full" :click="openCheckoutInvoice">
              {{ $t('appStore.payNow') }}
            </OutlinedButton>
          </template>
        </template>
      </div>
    </template>
  </ModalDialog>
</template>

<style scoped>
@reference "../../assets/css/base.css";
.scrollbox::-webkit-scrollbar {
  width: 6px;
}

.scrollbox::-webkit-scrollbar-track {
  @apply rounded-full bg-gray-200 dark:bg-gray-700;
}

.scrollbox::-webkit-scrollbar-thumb {
  @apply bg-primary-500 rounded-full;
}

.navbar {
  @apply border-secondary-300 flex h-min max-w-[200px] min-w-[200px] flex-col flex-wrap gap-1 rounded-lg border p-1.5 select-none dark:border-gray-600;
}

.nav-element {
  @apply text-secondary-700 hover:bg-secondary-100 dark:hover:bg-secondary-700 min-w-max cursor-pointer rounded-md px-3 py-2 text-sm dark:text-gray-300;
}

.nav-active {
  @apply bg-secondary-100 dark:bg-secondary-700 font-medium text-black dark:text-white;
}
</style>
