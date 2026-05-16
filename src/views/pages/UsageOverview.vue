<script setup>
import { onMounted, computed } from 'vue'
import { useBillingStore } from '@/store/billing.js'

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
    { label: 'Applications', key: 'applications', icon: 'fa-solid fa-box' },
    { label: 'Domains', key: 'domains', icon: 'fa-solid fa-link' },
    { label: 'Persistent Volumes', key: 'persistentVolumes', icon: 'fa-solid fa-hard-drive' },
    { label: 'Git Credentials', key: 'gitCredentials', icon: 'fa-solid fa-code-branch' },
    { label: 'Image Credentials', key: 'imageRegistryCredentials', icon: 'fa-solid fa-cloud' },
    { label: 'App Groups', key: 'applicationGroups', icon: 'fa-solid fa-cubes-stacked' },
    { label: 'Memory (MB)', key: 'totalMemoryMB', icon: 'fa-solid fa-memory' }
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
    <h1 class="text-2xl font-bold text-gray-900">Usage</h1>

    <!-- Overage warning -->
    <div v-if="billingStore.currentOverage.overageMemoryMb > 0" class="mt-4 rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4">
      <p class="text-sm text-yellow-800">
        <font-awesome-icon icon="fa-solid fa-triangle-exclamation" class="mr-1" />
        Memory overage: {{ billingStore.currentOverage.overageMemoryMb }} MB
        ({{ billingStore.currentOverage.overageCents }} cents overage charge)
      </p>
    </div>

    <!-- Quota usage bars -->
    <div class="mt-6 rounded-lg border bg-white p-6 shadow-sm">
      <h2 class="text-lg font-semibold text-gray-900">Resource Quotas</h2>
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

    <!-- Usage history table -->
    <div class="mt-6 rounded-lg border bg-white shadow-sm">
      <div class="border-b p-6 pb-3">
        <h2 class="text-lg font-semibold text-gray-900">Usage History</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th class="px-4 py-3">Date</th>
              <th class="px-4 py-3">Apps</th>
              <th class="px-4 py-3">Domains</th>
              <th class="px-4 py-3">PVs</th>
              <th class="px-4 py-3">Git Creds</th>
              <th class="px-4 py-3">Memory MB</th>
              <th class="px-4 py-3">Overage</th>
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
              <td colspan="7" class="px-4 py-8 text-center text-gray-500">No usage data yet</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
