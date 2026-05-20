<script setup>
import '@xterm/xterm/css/xterm.css'

import { computed, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Terminal } from '@xterm/xterm'
import { useRouter } from 'vue-router'
import { useSubscription } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { FitAddon } from '@xterm/addon-fit'
import StatusPulse from '@/views/components/StatusPulse.vue'
import PageBar from '@/views/components/PageBar.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()

const showRuntimeLog = ref(false)
const statsTimeframe = ref('live')
const terminal = new Terminal({
  convertEol: true,
  rows: 35,
  scrollback: 9999999
})
const fitAddon = new FitAddon()
terminal.loadAddon(fitAddon)

const {
  result: deploymentLogRaw,
  onError: onRuntimeLogError,
  stop: stopRuntimeLogSubscription,
  start: startRuntimeLogSubscription
} = useSubscription(
  gql`
    subscription ($id: String!, $timeframe: RuntimeLogTimeframe!) {
      fetchRuntimeLog(applicationId: $id, timeframe: $timeframe) {
        content
      }
    }
  `,
  {
    id: router.currentRoute.value.params.id,
    timeframe: statsTimeframe
  },
  {
    enabled: showRuntimeLog
  }
)

onRuntimeLogError((err) => {
  toast.error(err.message)
})

const deploymentLog = computed(() => deploymentLogRaw.value?.fetchRuntimeLog.content ?? '')
watch(deploymentLog, (value) => {
  if (value) {
    terminal.write(value)
  }
})

onMounted(() => {
  terminal.open(document.getElementById('terminal_2'))
  fitAddon.fit()
  showRuntimeLog.value = true
})

const restartRuntimeLog = () => {
  stopRuntimeLogSubscription()
  terminal.clear()
  startRuntimeLogSubscription()
}
</script>

<template>
  <PageBar>
    <template v-slot:title>
      <span class="flex flex-row items-center gap-2">{{ $t('applicationDetails.runtimeLogs') }}<StatusPulse type="success" /></span>
    </template>
    <template v-slot:subtitle>{{ $t('applicationDetails.runtimeLogsHint') }}</template>
    <template v-slot:buttons>
      <select
        class="block rounded-md border-gray-300 shadow-xs focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:border-gray-600 dark:bg-secondary-800 dark:text-gray-200"
        v-model="statsTimeframe"
        @change="restartRuntimeLog">
        <option value="live">{{ $t('applicationDetails.live') }}</option>
        <option value="last_1_hour">{{ $t('applicationDetails.fromLast1Hour') }}</option>
        <option value="last_3_hours">{{ $t('applicationDetails.fromLast3Hours') }}</option>
        <option value="last_6_hours">{{ $t('applicationDetails.fromLast6Hours') }}</option>
        <option value="last_12_hours">{{ $t('applicationDetails.fromLast12Hours') }}</option>
        <option value="last_24_hours">{{ $t('applicationDetails.fromLast24Hours') }}</option>
        <option value="lifetime">{{ $t('applicationDetails.lifetime') }}</option>
      </select>
    </template>
  </PageBar>

  <div id="terminal_2" class="mt-3 w-full max-w-7xl overflow-hidden rounded-md bg-black p-2"></div>
</template>

<style scoped></style>
