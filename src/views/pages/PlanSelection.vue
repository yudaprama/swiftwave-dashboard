<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useBillingStore } from '@/store/billing.js';
import { useAuthStore } from '@/store/auth.js';
import { toast } from 'vue-sonner';
import { useConfirmDialog } from '@/composables/useConfirmDialog.js';
import ConfirmDialog from '@/views/components/ConfirmDialog.vue';

const { t } = useI18n();
const billingStore = useBillingStore();
const authStore = useAuthStore();
const upgrading = ref(false);
const {
  isOpen: isUpgradeConfirmOpen,
  message: upgradeMessage,
  confirmType: upgradeType,
  confirm: askUpgrade,
  onConfirm: onUpgradeConfirm,
  onCancel: onUpgradeCancel
} = useConfirmDialog();

// Voucher state
const voucherCode = ref('');
const voucherStatus = ref(null); // null | 'valid' | 'invalid' | 'checking'
const voucherMessage = ref('');

onMounted(async () => {
  await Promise.all([billingStore.fetchPlans(), billingStore.fetchSubscription()]);
});

const formatPrice = (cents) => {
  if (cents === 0) return t('plans.free');
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(cents);
};

const isCurrentPlan = (plan) => {
  return billingStore.currentPlan?.id === plan.id;
};

const checkVoucher = async () => {
  if (!voucherCode.value.trim()) {
    voucherStatus.value = null;
    voucherMessage.value = '';
    return;
  }
  voucherStatus.value = 'checking';
  const res = await billingStore.validateVoucher(voucherCode.value.trim());
  if (res.success) {
    voucherStatus.value = 'valid';
    voucherMessage.value = t('plans.voucherValid');
  } else {
    voucherStatus.value = 'invalid';
    voucherMessage.value = res.message || t('plans.voucherInvalid');
  }
};

const clearVoucher = () => {
  voucherCode.value = '';
  voucherStatus.value = null;
  voucherMessage.value = '';
};

const upgrade = async (plan) => {
  if (isCurrentPlan(plan)) return;
  if (!(await askUpgrade(t('plans.upgradeConfirm', { name: plan.name }), 'warning'))) return;

  const code = voucherStatus.value === 'valid' ? voucherCode.value.trim() : null;

  upgrading.value = true;
  const res = await billingStore.upgradePlan(plan.id, code);
  upgrading.value = false;

  if (res.success) {
    clearVoucher();
    if (res.invoice?.xenditInvoiceUrl) {
      window.open(res.invoice.xenditInvoiceUrl, '_blank');
      toast.success(t('plans.invoiceCreated'));
    } else {
      toast.success(t('plans.planUpdated'));
    }
  } else {
    toast.error(res.message || t('plans.upgradeFailed'));
  }
};
</script>

<template>
  <div class="p-6 px-2 md:px-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ $t('plans.title') }}</h1>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ $t('plans.subtitle') }}</p>

    <!-- Current plan badge -->
    <div v-if="billingStore.currentPlan" class="bg-primary-50 mt-4 rounded-lg p-4">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ $t('plans.currentPlan') }}
        <span class="text-primary-700 font-semibold">{{ billingStore.currentPlan.name }}</span>
        <span v-if="billingStore.isPastDue" class="ml-2 rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">{{
          $t('plans.pastDue')
        }}</span>
        <span v-if="billingStore.isSuspended" class="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs text-red-800">{{
          $t('plans.suspended')
        }}</span>
      </p>
    </div>

    <!-- Voucher code input -->
    <div class="dark:bg-secondary-800 mt-4 rounded-lg border bg-white p-4 shadow-sm">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('plans.voucherLabel') }}</label>
      <div class="mt-2 flex items-center gap-2">
        <input
          v-model="voucherCode"
          type="text"
          :placeholder="$t('plans.voucherPlaceholder')"
          class="focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-700 w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none dark:border-gray-600 dark:text-gray-200"
          @keyup.enter="checkVoucher" />
        <button
          type="button"
          :disabled="!voucherCode.trim() || voucherStatus === 'checking'"
          class="bg-primary-600 hover:bg-primary-700 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          @click="checkVoucher">
          {{ voucherStatus === 'checking' ? $t('plans.checking') : $t('plans.apply') }}
        </button>
        <button
          v-if="voucherStatus"
          type="button"
          class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          @click="clearVoucher">
          {{ $t('plans.clear') }}
        </button>
      </div>
      <p v-if="voucherStatus === 'valid'" class="mt-2 text-sm text-green-600">
        <font-awesome-icon icon="fa-solid fa-check-circle" class="mr-1" />
        {{ voucherMessage }}
      </p>
      <p v-else-if="voucherStatus === 'invalid'" class="mt-2 text-sm text-red-600">
        <font-awesome-icon icon="fa-solid fa-times-circle" class="mr-1" />
        {{ voucherMessage }}
      </p>
    </div>

    <!-- Plan cards -->
    <div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="plan in billingStore.plans"
        :key="plan.id"
        :class="{
          'ring-primary-500 ring-2': isCurrentPlan(plan),
          'opacity-60': !plan.isActive
        }"
        class="dark:bg-secondary-800 rounded-lg border bg-white p-6 shadow-sm">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ plan.name }}</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ plan.description }}</p>
        <p class="mt-4 text-3xl font-bold text-gray-900 dark:text-gray-100">{{ formatPrice(plan.priceCents) }}</p>
        <p v-if="plan.priceCents > 0" class="text-sm text-gray-500 dark:text-gray-400">{{ $t('plans.perMonth') }}</p>

        <ul class="mt-6 space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <li class="flex items-center">
            <font-awesome-icon icon="fa-solid fa-box" class="text-primary-500 mr-2 w-4" />
            {{ $t('plans.maxApplications', { count: plan.maxApplications }) }}
          </li>
          <li class="flex items-center">
            <font-awesome-icon icon="fa-solid fa-link" class="text-primary-500 mr-2 w-4" />
            {{ $t('plans.maxDomains', { count: plan.maxDomains }) }}
          </li>
          <li class="flex items-center">
            <font-awesome-icon icon="fa-solid fa-hard-drive" class="text-primary-500 mr-2 w-4" />
            {{ $t('plans.maxPVs', { count: plan.maxPVs }) }}
          </li>
          <li class="flex items-center">
            <font-awesome-icon icon="fa-solid fa-code-branch" class="text-primary-500 mr-2 w-4" />
            {{ $t('plans.maxGitCreds', { count: plan.maxGitCreds }) }}
          </li>
          <li class="flex items-center">
            <font-awesome-icon icon="fa-solid fa-cloud" class="text-primary-500 mr-2 w-4" />
            {{ $t('plans.maxImageCreds', { count: plan.maxImageCreds }) }}
          </li>
          <li class="flex items-center">
            <font-awesome-icon icon="fa-solid fa-cubes-stacked" class="text-primary-500 mr-2 w-4" />
            {{ $t('plans.maxAppGroups', { count: plan.maxAppGroups }) }}
          </li>
          <li class="flex items-center">
            <font-awesome-icon icon="fa-solid fa-memory" class="text-primary-500 mr-2 w-4" />
            {{ $t('plans.maxMemory', { count: plan.maxMemoryMb }) }}
          </li>
        </ul>

        <button
          v-if="!authStore.isAdmin"
          type="button"
          :disabled="isCurrentPlan(plan) || upgrading || !plan.isActive"
          :class="{
            'cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400': isCurrentPlan(plan),
            'bg-primary-600 hover:bg-primary-700 text-white': !isCurrentPlan(plan),
            'cursor-not-allowed opacity-50': upgrading || !plan.isActive
          }"
          class="mt-6 w-full rounded-md px-4 py-2 text-sm font-medium transition-colors"
          @click="upgrade(plan)">
          {{
            isCurrentPlan(plan)
              ? $t('plans.currentPlanBtn')
              : plan.priceCents === 0
                ? $t('plans.downgrade')
                : $t('plans.upgrade')
          }}
        </button>
      </div>
    </div>
  </div>
  <ConfirmDialog
    :is-open="isUpgradeConfirmOpen"
    :message="upgradeMessage"
    :confirm-type="upgradeType"
    :on-confirm="onUpgradeConfirm"
    :on-cancel="onUpgradeCancel" />
</template>
