<!-- This page is going to have global warning (which is going to take full screen to show)-->

<script setup>
import { useRoute } from 'vue-router'
import { computed, onMounted, watch } from 'vue'
import ModalDialog from '@/views/components/ModalDialog.vue'
import { useLazyQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useAuthStore } from '@/store/auth.js'

const route = useRoute()
const authStore = useAuthStore()

const {
  result: noOfPreparedServersResult,
  load: loadNoOfPreparedServersRaw,
  refetch: refetchNoOfPreparedServersRaw
} = useLazyQuery(gql`
  query {
    noOfPreparedServers
  }
`)

const showNoServerConfiguredWarning = computed(() => {
  if (!authStore.IsLoggedIn) return false
  if (['System Logs', 'Setup', 'Users'].includes(route.name)) return false
  if (!noOfPreparedServersResult.value) return false
  if (noOfPreparedServersResult.value.noOfPreparedServers === undefined) return false
  if (noOfPreparedServersResult.value.noOfPreparedServers === null) return false
  return noOfPreparedServersResult.value.noOfPreparedServers === 0
})

const loadNoOfPreparedServers = () => {
  if (!authStore.IsLoggedIn) return
  if (loadNoOfPreparedServersRaw() === false) {
    refetchNoOfPreparedServersRaw()
  }
}

watch(authStore, () => {
  if (!authStore.IsLoggedIn) return
  loadNoOfPreparedServers()
})

onMounted(() => {
  setInterval(loadNoOfPreparedServers, 10000)
})
</script>

<template>
  <teleport to="body">
    <ModalDialog :is-open="showNoServerConfiguredWarning" non-cancelable>
      <template #header>No Server Configured</template>
      <template #body>
        <p>You have not configured any server yet. Configure a server from the management node CLI before performing any other actions.</p>
        <p class="mt-2 font-mono text-sm">sudo swiftwave server add --ip &lt;server-ip&gt; --ssh-port 22 --user root</p>
      </template>
    </ModalDialog>
  </teleport>
</template>

<style scoped></style>
