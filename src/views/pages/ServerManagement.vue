<script setup>
import Table from '@/views/components/Table/Table.vue'
import TableHeader from '@/views/components/Table/TableHeader.vue'
import FilledButton from '@/views/components/FilledButton.vue'
import PageBar from '@/views/components/PageBar.vue'
import { computed, ref } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { toast } from 'vue-sonner'
import TableMessage from '@/views/components/Table/TableMessage.vue'
import ServerRow from '@/views/partials/ServerRow.vue'
import CreateServerModal from '@/views/partials/CreateServerModal.vue'

const createServerModal = ref(null)

const {
  result: serversResult,
  loading: isServersLoading,
  refetch: refetchServers,
  onError: onServersError
} = useQuery(
  gql`
    query {
      servers {
        id
        ip
        hostname
        user
        ssh_port
        swarmMode
        swarmNodeStatus
        maintenanceMode
        scheduleDeployments
        dockerUnixSocketPath
        proxyEnabled
        proxyType
        status
      }
    }
  `,
  null,
  {
    pollInterval: 10000
  }
)

onServersError((err) => {
  toast.error(err.message)
})

const servers = computed(() => serversResult.value?.servers ?? [])
const openCreateServerModal = () => {
  if (createServerModal.value) createServerModal.value.openModal()
}
</script>

<template>
  <!-- Modal to create server  -->
  <CreateServerModal :callback-on-create="refetchServers" ref="createServerModal" />
  <section class="mx-auto w-full max-w-7xl">
    <!-- Top Page bar   -->
    <PageBar>
      <template v-slot:title>{{ $t('servers.title') }}</template>
      <template v-slot:subtitle>{{ $t('servers.subtitle') }}</template>
      <template v-slot:buttons>
        <FilledButton type="primary" :click="openCreateServerModal">
          <font-awesome-icon icon="fa-solid fa-plus" />
          &nbsp;&nbsp; {{ $t('servers.addServer') }}
        </FilledButton>
        <FilledButton type="ghost" :click="refetchServers">
          <font-awesome-icon
            icon="fa-solid fa-arrows-rotate"
            :class="{
              'animate-spin ': isServersLoading
            }" />&nbsp;&nbsp; {{ $t('common.refreshList') }}
        </FilledButton>
      </template>
    </PageBar>

    <!-- Table -->
    <Table class="mt-8">
      <template v-slot:header>
        <TableHeader align="left">{{ $t('servers.server') }}</TableHeader>
        <TableHeader align="center">{{ $t('servers.ssh') }}</TableHeader>
        <TableHeader align="center">{{ $t('servers.node') }}</TableHeader>
        <TableHeader align="center">{{ $t('common.status') }}</TableHeader>
        <TableHeader align="center">{{ $t('servers.maintenance') }}</TableHeader>
        <TableHeader align="center">{{ $t('servers.swarm') }}</TableHeader>
        <TableHeader align="center">{{ $t('servers.deployment') }}</TableHeader>
        <TableHeader align="center">{{ $t('servers.proxy') }}</TableHeader>
        <TableHeader align="center">{{ $t('servers.analytics') }}</TableHeader>
        <TableHeader align="center">{{ $t('servers.logs') }}</TableHeader>
        <TableHeader align="right">{{ $t('common.actions') }}</TableHeader>
      </template>
      <template v-slot:message>
        <TableMessage v-if="servers.length === 0">
          {{ $t('servers.noServers') }}<br />
          {{ $t('servers.clickAdd') }}
        </TableMessage>
        <TableMessage v-if="isServersLoading"> {{ $t('servers.loading') }}</TableMessage>
      </template>
      <template v-slot:body>
        <ServerRow v-for="server in servers" :key="server.id" :server="server" :refetch-servers="refetchServers" />
      </template>
    </Table>
  </section>
</template>

<style scoped></style>
