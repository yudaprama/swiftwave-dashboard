<template>
  <div class="flex h-full flex-col">
    <PageBar>
      <template v-slot:title>{{ $t('deploymentPlans.title') }}</template>
      <template v-slot:subtitle>{{ $t('deploymentPlans.subtitle') }}</template>
    </PageBar>

    <div class="flex-1 overflow-y-auto p-6">
      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SkeletonLoader v-for="i in 3" :key="i" class="h-96" />
      </div>

      <!-- Error State -->
      <EmptyState
        v-else-if="error"
        :title="$t('deploymentPlans.errorTitle')"
        :description="error.message"
        icon="exclamation-triangle" />

      <!-- Empty State -->
      <EmptyState
        v-else-if="!plans || plans.length === 0"
        :title="$t('deploymentPlans.emptyTitle')"
        :description="$t('deploymentPlans.emptyDescription')"
        icon="box-open" />

      <!-- Plans Grid -->
      <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="plan in plans"
          :key="plan.id"
          class="flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <!-- Plan Header -->
          <div class="mb-4">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ plan.name }}</h3>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">{{ plan.description }}</p>
          </div>

          <!-- Price -->
          <div class="mb-4">
            <div class="flex items-baseline">
              <span class="text-3xl font-bold text-gray-900 dark:text-white">
                {{ formatPrice(plan.priceCents, plan.currency) }}
              </span>
              <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">/30 hari</span>
            </div>
          </div>

          <!-- Specs -->
          <div class="mb-6 flex-1 space-y-3">
            <div class="flex items-center text-sm">
              <font-awesome-icon icon="memory" class="mr-2 h-4 w-4 text-gray-500" />
              <span class="text-gray-700 dark:text-gray-300">{{ formatMemory(plan.memoryMb) }} Memory</span>
            </div>
            <div class="flex items-center text-sm">
              <font-awesome-icon icon="microchip" class="mr-2 h-4 w-4 text-gray-500" />
              <span class="text-gray-700 dark:text-gray-300">{{ plan.cpuShares }} CPU Shares</span>
            </div>
            <div class="flex items-center text-sm">
              <font-awesome-icon icon="hard-drive" class="mr-2 h-4 w-4 text-gray-500" />
              <span class="text-gray-700 dark:text-gray-300">{{ formatDisk(plan.diskMb) }} Disk</span>
            </div>
            <div class="flex items-center text-sm">
              <font-awesome-icon icon="server" class="mr-2 h-4 w-4 text-gray-500" />
              <span class="text-gray-700 dark:text-gray-300">Tier: {{ plan.nodeTier }}</span>
            </div>
            <div class="flex items-center text-sm">
              <font-awesome-icon icon="shield-alt" class="mr-2 h-4 w-4 text-green-500" />
              <span class="text-gray-700 dark:text-gray-300">SSL Otomatis</span>
            </div>
            <div class="flex items-center text-sm">
              <font-awesome-icon icon="sync-alt" class="mr-2 h-4 w-4 text-green-500" />
              <span class="text-gray-700 dark:text-gray-300">Zero-downtime Deploy</span>
            </div>
          </div>

          <!-- CTA Button -->
          <FilledButton type="primary" :click="() => openCheckoutModal(plan)" class="w-full">
            {{ $t('deploymentPlans.selectPlan') }}
          </FilledButton>
        </div>
      </div>
    </div>

    <!-- Checkout Modal -->
    <ModalDialog ref="checkoutModalRef" :on-close="closeCheckoutModal">
      <template v-slot:header>{{ $t('deploymentPlans.checkoutTitle') }}</template>
      <template v-slot:body>
        <div v-if="checkoutStep === 'select'" class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ $t('deploymentPlans.checkoutDescription') }}
          </p>

          <!-- Selected Plan Info -->
          <div v-if="selectedPlan" class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <h4 class="font-semibold text-gray-900 dark:text-white">{{ selectedPlan.name }}</h4>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">{{ selectedPlan.description }}</p>
            <div class="mt-2 text-lg font-bold text-gray-900 dark:text-white">
              {{ formatPrice(selectedPlan.priceCents, selectedPlan.currency) }} /30 hari
            </div>
          </div>

          <!-- Application Selection -->
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ $t('deploymentPlans.selectApplication') }}
            </label>
            <select
              v-model="selectedApplicationId"
              class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              <option value="">{{ $t('deploymentPlans.newApplication') }}</option>
              <option v-for="app in applications" :key="app.id" :value="app.id">
                {{ app.name }}
              </option>
            </select>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ $t('deploymentPlans.applicationHint') }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end space-x-3">
            <OutlinedButton :click="closeCheckoutModal">
              {{ $t('common.cancel') }}
            </OutlinedButton>
            <FilledButton type="primary" :click="proceedCheckout" :disabled="checkoutLoading">
              {{ checkoutLoading ? $t('common.processing') : $t('deploymentPlans.proceedCheckout') }}
            </FilledButton>
          </div>
        </div>

        <!-- Payment Step -->
        <div v-else-if="checkoutStep === 'payment'" class="space-y-4">
          <div class="text-center">
            <font-awesome-icon icon="credit-card" class="mb-4 h-16 w-16 text-blue-500" />
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ $t('deploymentPlans.paymentTitle') }}
            </h4>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {{ $t('deploymentPlans.paymentDescription') }}
            </p>
          </div>

          <div v-if="checkoutPurchase" class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Status:</span>
              <StatusBadge :status="checkoutPurchase.status" />
            </div>
            <div v-if="checkoutPurchase.xenditInvoiceUrl" class="mt-4">
              <a
                :href="checkoutPurchase.xenditInvoiceUrl"
                target="_blank"
                class="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                <font-awesome-icon icon="external-link-alt" class="mr-2" />
                {{ $t('deploymentPlans.openPayment') }}
              </a>
            </div>
          </div>

          <div class="flex justify-end">
            <OutlinedButton :click="closeCheckoutModal">
              {{ $t('common.close') }}
            </OutlinedButton>
          </div>
        </div>
      </template>
    </ModalDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useI18n } from 'vue-i18n'
import gql from 'graphql-tag'
import PageBar from '@/views/components/PageBar.vue'
import EmptyState from '@/views/components/EmptyState.vue'
import SkeletonLoader from '@/views/components/SkeletonLoader.vue'
import FilledButton from '@/views/components/FilledButton.vue'
import OutlinedButton from '@/views/components/OutlinedButton.vue'
import ModalDialog from '@/views/components/ModalDialog.vue'
import StatusBadge from '@/views/components/StatusBadge.vue'

const { t } = useI18n()
const router = useRouter()

// Fetch deployment plans
const { result, loading, error } = useQuery(gql`
  query DeploymentPlans {
    deploymentPlans {
      id
      name
      slug
      description
      priceCents
      currency
      cpuShares
      memoryMb
      diskMb
      nodeTier
      isActive
    }
  }
`)

const plans = computed(() => result.value?.deploymentPlans ?? [])

// Fetch user applications for renewal
const { result: appsResult } = useQuery(gql`
  query Applications {
    applications {
      id
      name
    }
  }
`)

const applications = computed(() => appsResult.value?.applications ?? [])

// Checkout state
const checkoutModalRef = ref(null)
const selectedPlan = ref(null)
const selectedApplicationId = ref('')
const checkoutStep = ref('select')
const checkoutLoading = ref(false)
const checkoutPurchase = ref(null)

// Checkout mutation
const { mutate: checkoutMutation } = useMutation(gql`
  mutation CheckoutDeploymentPlan($input: CheckoutDeploymentPlanInput!) {
    checkoutDeploymentPlan(input: $input) {
      purchaseId
      invoiceUrl
      status
    }
  }
`)

function openCheckoutModal(plan) {
  selectedPlan.value = plan
  selectedApplicationId.value = ''
  checkoutStep.value = 'select'
  checkoutPurchase.value = null
  checkoutModalRef.value?.openModal()
}

function closeCheckoutModal() {
  checkoutModalRef.value?.closeModal()
  selectedPlan.value = null
  selectedApplicationId.value = ''
  checkoutStep.value = 'select'
  checkoutPurchase.value = null
}

async function proceedCheckout() {
  if (!selectedPlan.value) return

  checkoutLoading.value = true
  try {
    const input = {
      deploymentPlanId: selectedPlan.value.id
    }

    if (selectedApplicationId.value) {
      input.applicationId = selectedApplicationId.value
    } else {
      toast.info(t('deploymentPlans.newAppRedirect'))
      router.push({
        name: 'deploy-application',
        query: { deploymentPlanId: selectedPlan.value.id }
      })
      closeCheckoutModal()
      return
    }

    const result = await checkoutMutation({ input })
    if (result?.data?.checkoutDeploymentPlan) {
      checkoutPurchase.value = result.data.checkoutDeploymentPlan
      checkoutStep.value = 'payment'
      toast.success(t('deploymentPlans.checkoutSuccess'))
    }
  } catch (err) {
    toast.error(t('deploymentPlans.checkoutError') + ': ' + err.message)
  } finally {
    checkoutLoading.value = false
  }
}

function formatPrice(cents, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(cents)
}

function formatMemory(mb) {
  if (mb >= 1024) return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`
  return `${mb} MB`
}

function formatDisk(mb) {
  if (mb >= 1024) return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`
  return `${mb} MB`
}
</script>
