<script setup>
import { onMounted, ref } from 'vue'
import { useBillingStore } from '@/store/billing.js'
import { useAuthStore } from '@/store/auth.js'
import { toast } from 'vue-sonner'

const billingStore = useBillingStore()
const authStore = useAuthStore()
const upgrading = ref(false)

onMounted(async () => {
  await Promise.all([billingStore.fetchPlans(), billingStore.fetchSubscription()])
})

const formatPrice = (cents) => {
  if (cents === 0) return 'Free'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(cents / 100)
}

const isCurrentPlan = (plan) => {
  return billingStore.currentPlan?.id === plan.id
}

const upgrade = async (plan) => {
  if (isCurrentPlan(plan)) return
  if (!confirm(`Upgrade to ${plan.name} plan?`)) return

  upgrading.value = true
  const res = await billingStore.upgradePlan(plan.id)
  upgrading.value = false

  if (res.success) {
    if (res.invoice?.xenditInvoiceUrl) {
      window.open(res.invoice.xenditInvoiceUrl, '_blank')
      toast.success('Invoice created. Please complete payment.')
    } else {
      toast.success('Plan updated successfully!')
    }
  } else {
    toast.error(res.message || 'Failed to upgrade plan')
  }
}
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold text-gray-900">Plans</h1>
    <p class="mt-1 text-sm text-gray-500">Choose the right plan for your needs</p>

    <!-- Current plan badge -->
    <div v-if="billingStore.currentPlan" class="mt-4 rounded-lg bg-primary-50 p-4">
      <p class="text-sm text-gray-600">
        Current plan: <span class="font-semibold text-primary-700">{{ billingStore.currentPlan.name }}</span>
        <span v-if="billingStore.isPastDue" class="ml-2 rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">Past Due</span>
        <span v-if="billingStore.isSuspended" class="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs text-red-800">Suspended</span>
      </p>
    </div>

    <!-- Plan cards -->
    <div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="plan in billingStore.plans"
        :key="plan.id"
        :class="{
          'ring-2 ring-primary-500': isCurrentPlan(plan),
          'opacity-60': !plan.isActive
        }"
        class="rounded-lg border bg-white p-6 shadow-sm">
        <h3 class="text-lg font-semibold text-gray-900">{{ plan.name }}</h3>
        <p class="mt-1 text-sm text-gray-500">{{ plan.description }}</p>
        <p class="mt-4 text-3xl font-bold text-gray-900">{{ formatPrice(plan.priceCents) }}</p>
        <p v-if="plan.priceCents > 0" class="text-sm text-gray-500">/month</p>

        <ul class="mt-6 space-y-3 text-sm text-gray-600">
          <li class="flex items-center">
            <font-awesome-icon icon="fa-solid fa-box" class="mr-2 w-4 text-primary-500" />
            {{ plan.maxApplications }} applications
          </li>
          <li class="flex items-center">
            <font-awesome-icon icon="fa-solid fa-link" class="mr-2 w-4 text-primary-500" />
            {{ plan.maxDomains }} domains
          </li>
          <li class="flex items-center">
            <font-awesome-icon icon="fa-solid fa-hard-drive" class="mr-2 w-4 text-primary-500" />
            {{ plan.maxPVs }} persistent volumes
          </li>
          <li class="flex items-center">
            <font-awesome-icon icon="fa-solid fa-code-branch" class="mr-2 w-4 text-primary-500" />
            {{ plan.maxGitCreds }} git credentials
          </li>
          <li class="flex items-center">
            <font-awesome-icon icon="fa-solid fa-cloud" class="mr-2 w-4 text-primary-500" />
            {{ plan.maxImageCreds }} image credentials
          </li>
          <li class="flex items-center">
            <font-awesome-icon icon="fa-solid fa-cubes-stacked" class="mr-2 w-4 text-primary-500" />
            {{ plan.maxAppGroups }} app groups
          </li>
          <li class="flex items-center">
            <font-awesome-icon icon="fa-solid fa-memory" class="mr-2 w-4 text-primary-500" />
            {{ plan.maxMemoryMb }} MB memory
          </li>
        </ul>

        <button
          v-if="!authStore.isAdmin"
          :disabled="isCurrentPlan(plan) || upgrading || !plan.isActive"
          :class="{
            'bg-gray-200 text-gray-500 cursor-not-allowed': isCurrentPlan(plan),
            'bg-primary-600 hover:bg-primary-700 text-white': !isCurrentPlan(plan),
            'opacity-50 cursor-not-allowed': upgrading || !plan.isActive
          }"
          class="mt-6 w-full rounded-md px-4 py-2 text-sm font-medium transition-colors"
          @click="upgrade(plan)">
          {{ isCurrentPlan(plan) ? 'Current Plan' : (plan.priceCents === 0 ? 'Downgrade' : 'Upgrade') }}
        </button>
      </div>
    </div>
  </div>
</template>
