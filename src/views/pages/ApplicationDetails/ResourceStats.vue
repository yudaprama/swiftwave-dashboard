<script setup>
import { useRouter } from 'vue-router'
import { onMounted, ref } from 'vue'
import { useLazyQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { toast } from 'vue-sonner'
import { humanizeMemoryMB, humanizeNetworkSpeed } from '@/vendor/utils.js'
import AreaChartTimeSeries from '@/views/components/AreaChartTimeSeries.vue'
import FilledButton from '@/views/components/FilledButton.vue'
import PageBar from '@/views/components/PageBar.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const applicationId = router.currentRoute.value.params.id
const statsTimeframe = ref('last_1_hour')

const cpuUsageSeries = ref([])
const memoryUsageSeries = ref([])
const networkUsageSeries = ref([])

const {
  load: loadResourceAnalyticsRaw,
  refetch: refetchResourceAnalyticsRaw,
  loading: isResourceAnalyticsLoading,
  onResult: onResourceAnalyticsResult,
  onError: onResourceAnalyticsError
} = useLazyQuery(
  gql`
    query ($id: String!, $timeframe: ApplicationResourceAnalyticsTimeframe!) {
      applicationResourceAnalytics(id: $id, timeframe: $timeframe) {
        cpu_usage_percent
        memory_used_mb
        network_sent_kbps
        network_recv_kbps
        timestamp
      }
    }
  `,
  {
    id: applicationId,
    timeframe: statsTimeframe
  }
)

onResourceAnalyticsError((error) => {
  toast.error(error)
})

onResourceAnalyticsResult((result) => {
  if (result.data.applicationResourceAnalytics.length !== 0) {
    let cpuUsagePercentStat = []
    let memoryUsedMbStat = []
    let networkSentKbpsStat = []
    let networkRecvKbpsStat = []
    result.data.applicationResourceAnalytics.forEach((d) => {
      cpuUsagePercentStat.push([new Date(d.timestamp).getTime(), d.cpu_usage_percent])
      memoryUsedMbStat.push([new Date(d.timestamp).getTime(), d.memory_used_mb])
      networkSentKbpsStat.push([new Date(d.timestamp).getTime(), d.network_sent_kbps])
      networkRecvKbpsStat.push([new Date(d.timestamp).getTime(), d.network_recv_kbps])
    })
    cpuUsageSeries.value = [
      {
        name: 'CPU Usage',
        data: cpuUsagePercentStat
      }
    ]
    memoryUsageSeries.value = [
      {
        name: 'Used Memory',
        data: memoryUsedMbStat
      }
    ]
    networkUsageSeries.value = [
      {
        name: 'Sent',
        data: networkSentKbpsStat
      },
      {
        name: 'Received',
        data: networkRecvKbpsStat
      }
    ]
  }
})

const loadResourceAnalytics = () => {
  if (loadResourceAnalyticsRaw() === false) {
    refetchResourceAnalyticsRaw()
  }
}

onMounted(() => {
  loadResourceAnalytics()
})
</script>

<template>
  <section class="mx-auto w-full">
    <div class="flex h-full w-full flex-col">
      <!-- Top Page bar   -->
      <PageBar>
        <template v-slot:title>{{ $t('applicationDetails.applicationAnalytics') }}</template>
        <template v-slot:subtitle>{{ $t('applicationDetails.monitorResourceAnalytics') }}</template>
        <template v-slot:buttons>
          <select
            class="block rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            v-model="statsTimeframe"
            @change="loadResourceAnalytics">
            <option value="last_1_hour">{{ $t('applicationDetails.last1Hour') }}</option>
            <option value="last_3_hours">{{ $t('applicationDetails.last3Hours') }}</option>
            <option value="last_6_hours">{{ $t('applicationDetails.last6Hours') }}</option>
            <option value="last_12_hours">{{ $t('applicationDetails.last12Hours') }}</option>
            <option value="last_24_hours">{{ $t('applicationDetails.last24Hours') }}</option>
            <option value="last_7_days">{{ $t('applicationDetails.last7Days') }}</option>
            <option value="last_30_days">{{ $t('applicationDetails.last30Days') }}</option>
          </select>
          <FilledButton type="primary" :click="loadResourceAnalytics" :loading="isResourceAnalyticsLoading">
            {{ $t('applicationDetails.refreshStats') }}
          </FilledButton>
        </template>
      </PageBar>
      <div class="mt-5 flex w-full flex-col gap-5 overflow-x-clip">
        <!--  Cpu usage series  -->
        <AreaChartTimeSeries
          :title="$t('applicationDetails.cpuUsageChart')"
          :series="cpuUsageSeries"
          :y-axis-formatter="
            (val) => {
              return val + ' %'
            }
          "
          :y-axis-minimum-max="100" />
        <!--  Memory usage series  -->
        <AreaChartTimeSeries :title="$t('applicationDetails.memoryUsage')" :series="memoryUsageSeries" :y-axis-formatter="humanizeMemoryMB" />
        <!--  Network usage series  -->
        <AreaChartTimeSeries
          :title="$t('applicationDetails.networkUsage')"
          :series="networkUsageSeries"
          :y-axis-formatter="humanizeNetworkSpeed" />
      </div>
    </div>
  </section>
</template>

<style scoped></style>
