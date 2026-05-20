<script setup>
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBillingStore } from '@/store/billing.js'
import { useAuthStore } from '@/store/auth.js'
import { toast } from 'vue-sonner'
import { useConfirmDialog } from '@/composables/useConfirmDialog.js'
import ConfirmDialog from '@/views/components/ConfirmDialog.vue'

const { t } = useI18n()
const billingStore = useBillingStore()
const authStore = useAuthStore()
const { isOpen: isCancelSubConfirmOpen, message: cancelSubMessage, confirmType: cancelSubType, confirm: askCancelSub, onConfirm: onCancelSubConfirm, onCancel: onCancelSubCancel } = useConfirmDialog()

onMounted(async () => {
  await Promise.all([
    billingStore.fetchSubscription(),
    billingStore.fetchInvoices()
  ])
})

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatCurrency = (cents, currency = 'IDR') => {
  if (cents === 0) return t('billing.free')
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency }).format(cents / 100)
}

const statusColor = (status) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800'
    case 'past_due': return 'bg-yellow-100 text-yellow-800'
    case 'suspended': return 'bg-red-100 text-red-800'
    case 'cancelled': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const invoiceStatusColor = (status) => {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-800'
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'failed': return 'bg-red-100 text-red-800'
    case 'expired': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const cancelSub = async () => {
  if (!await askCancelSub(t('billing.cancelConfirm'), 'warning')) return
  const res = await billingStore.cancelSubscription()
  if (res.success) {
    toast.success(t('billing.cancelSuccess'))
  } else {
    toast.error(res.message || t('billing.cancelFailed'))
  }
}

const payInvoice = (url) => {
  if (url) window.open(url, '_blank')
}
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold text-gray-900">{{ $t('billing.title') }}</h1>

    <div class="mt-6 rounded-lg border bg-white p-6 shadow-sm">
      <h2 class="text-lg font-semibold text-gray-900">{{ $t('billing.subscription') }}</h2>
      <div v-if="billingStore.subscription" class="mt-4">
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-600">{{ $t('billing.plan') }}</span>
          <span class="font-semibold">{{ billingStore.currentPlan?.name || $t('billing.free') }}</span>
          <span :class="statusColor(billingStore.subscription.status)" class="rounded px-2 py-0.5 text-xs font-medium">
            {{ billingStore.subscription.status }}
          </span>
        </div>
        <div class="mt-2 text-sm text-gray-600">
          <p>{{ $t('billing.period') }} {{ formatDate(billingStore.subscription.currentPeriodStart) }} - {{ formatDate(billingStore.subscription.currentPeriodEnd) }}</p>
          <p v-if="billingStore.subscription.cancelAtPeriodEnd" class="mt-1 text-yellow-700">
            <font-awesome-icon icon="fa-solid fa-triangle-exclamation" class="mr-1" />
            {{ $t('billing.cancelAtPeriodEnd') }}
          </p>
        </div>
        <button
          v-if="!authStore.isAdmin && billingStore.isActive && !billingStore.subscription.cancelAtPeriodEnd"
          class="mt-4 rounded-md border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          @click="cancelSub">
          {{ $t('billing.cancelSubscription') }}
        </button>
      </div>
      <p v-else class="mt-4 text-sm text-gray-500">{{ $t('billing.noSubscription') }}</p>
    </div>

    <div class="mt-6 rounded-lg border bg-white shadow-sm">
      <div class="border-b p-6 pb-3">
        <h2 class="text-lg font-semibold text-gray-900">{{ $t('billing.invoices') }}</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th class="px-6 py-3">{{ $t('billing.date') }}</th>
              <th class="px-6 py-3">{{ $t('billing.description') }}</th>
              <th class="px-6 py-3">{{ $t('billing.amount') }}</th>
              <th class="px-6 py-3">{{ $t('billing.status') }}</th>
              <th class="px-6 py-3">{{ $t('billing.action') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inv in billingStore.invoices" :key="inv.id" class="border-b">
              <td class="px-6 py-4">{{ formatDate(inv.createdAt) }}</td>
              <td class="px-6 py-4">{{ inv.description }}</td>
              <td class="px-6 py-4">{{ formatCurrency(inv.amountCents, inv.currency) }}</td>
              <td class="px-6 py-4">
                <span :class="invoiceStatusColor(inv.status)" class="rounded px-2 py-0.5 text-xs font-medium">
                  {{ inv.status }}
                </span>
              </td>
              <td class="px-6 py-4">
                <button
                  v-if="inv.status === 'pending' && inv.xenditInvoiceUrl"
                  class="text-primary-600 hover:text-primary-800 text-sm font-medium"
                  @click="payInvoice(inv.xenditInvoiceUrl)">
                  {{ $t('billing.payNow') }}
                </button>
                <span v-else class="text-gray-400">-</span>
              </td>
            </tr>
            <tr v-if="billingStore.invoices.length === 0">
              <td colspan="5" class="px-6 py-8 text-center text-gray-500">{{ $t('billing.noInvoices') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <ConfirmDialog :is-open="isCancelSubConfirmOpen" :message="cancelSubMessage" :confirm-type="cancelSubType" :on-confirm="onCancelSubConfirm" :on-cancel="onCancelSubCancel" />
</template>
