<script setup>
import { onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBillingStore } from '@/store/billing.js'

const { t } = useI18n()
const billingStore = useBillingStore()

onMounted(async () => {
  await Promise.all([
    billingStore.fetchQuotaUsage(),
    billingStore.fetchUsageHistory(30),
    billingStore.fetchCurrentOverage()
  ])
})

const quotaItems = computed(() => {
  if (!billingStore.quotaUsage) return []
  return [
    { label: t('usage.applications'), key: 'applications', icon: 'fa-solid fa-box' },
    { label: t('usage.domains'), key: 'domains', icon: 'fa-solid fa-link' },
    { label: t('usage.persistentVolumes'), key: 'persistentVolumes', icon: 'fa-solid fa-hard-drive' },
    { label: t('usage.gitCredentials'), key: 'gitCredentials', icon: 'fa-solid fa-code-branch' },
    { label: t('usage.imageCredentials'), key: 'imageRegistryCredentials', icon: 'fa-solid fa-cloud' },
    { label: t('usage.appGroups'), key: 'applicationGroups', icon: 'fa-solid fa-cubes-stacked' },
    { label: t('usage.memoryMb'), key: 'totalMemoryMB', icon: 'fa-solid fa-memory' }
  ]
})

const usagePercent = (item) => {
  if (!item || item.limit <= 0) return 0
  return Math.min(100, Math.round((item.current / item.limit) * 100))
}

const barColor = (percent) => {
  if (percent >= 90) return 'bg-red-500'
  if (percent >= 70) return 'bg-yellow-500'
  return 'bg-primary-500'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold text-gray-900">{{ $t('usage.title') }}</h1>

    <div v-if="billingStore.currentOverage.overageMemoryMb > 0" class="mt-4 rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4">
      <p class="text-sm text-yellow-800">
        <font-awesome-icon icon="fa-solid fa-triangle-exclamation" class="mr-1" />
        {{ $t('usage.memoryOverage', { mb: billingStore.currentOverage.overageMemoryMb, cents: billingStore.currentOverage.overageCents }) }}
      </p>
    </div>

    <div class="mt-6 rounded-lg border bg-white p-6 shadow-sm">
      <h2 class="text-lg font-semibold text-gray-900">{{ $t('usage.resourceQuotas') }}</h2>
      <div class="mt-4 space-y-4">
        <div v-for="item in quotaItems" :key="item.key">
          <div v-if="billingStore.quotaUsage[item.key]" class="flex items-center gap-4">
            <div class="flex w-48 items-center gap-2 text-sm text-gray-600">
              <font-awesome-icon :icon="item.icon" class="w-4" />
              {{ item.label }}
            </div>
            <div class="flex-1">
              <div class="h-3 w-full rounded-full bg-gray-100">
                <div
                  :class="barColor(usagePercent(billingStore.quotaUsage[item.key]))"
                  :style="{ width: usagePercent(billingStore.quotaUsage[item.key]) + '%' }"
                  class="h-3 rounded-full transition-all"></div>
              </div>
            </div>
            <div class="w-24 text-right text-sm text-gray-600">
              {{ billingStore.quotaUsage[item.key].current }} / {{ billingStore.quotaUsage[item.key].limit }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 rounded-lg border bg-white shadow-sm">
      <div class="border-b p-6 pb-3">
        <h2 class="text-lg font-semibold text-gray-900">{{ $t('usage.usageHistory') }}</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th class="px-4 py-3">{{ $t('usage.historyDate') }}</th>
              <th class="px-4 py-3">{{ $t('usage.historyApps') }}</th>
              <th class="px-4 py-3">{{ $t('usage.historyDomains') }}</th>
              <th class="px-4 py-3">{{ $t('usage.historyPvs') }}</th>
              <th class="px-4 py-3">{{ $t('usage.historyGitCreds') }}</th>
              <th class="px-4 py-3">{{ $t('usage.historyMemoryMb') }}</th>
              <th class="px-4 py-3">{{ $t('usage.historyOverage') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in billingStore.usageHistory" :key="record.id" class="border-b">
              <td class="px-4 py-3">{{ formatDate(record.createdAt) }}</td>
              <td class="px-4 py-3">{{ record.applications }}</td>
              <td class="px-4 py-3">{{ record.domains }}</td>
              <td class="px-4 py-3">{{ record.persistentVolumes }}</td>
              <td class="px-4 py-3">{{ record.gitCredentials }}</td>
              <td class="px-4 py-3">{{ record.usedMemoryMb }}</td>
              <td class="px-4 py-3">
                <span v-if="record.overageMemoryMb > 0" class="text-red-600">
                  {{ record.overageMemoryMb }} MB
                </span>
                <span v-else class="text-gray-400">-</span>
              </td>
            </tr>
            <tr v-if="billingStore.usageHistory.length === 0">
              <td colspan="7" class="px-4 py-8 text-center text-gray-500">{{ $t('usage.noData') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
