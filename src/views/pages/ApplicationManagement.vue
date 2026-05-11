<script setup>
import PageBar from '@/views/components/PageBar.vue'
import FilledButton from '@/views/components/FilledButton.vue'
import { useRouter } from 'vue-router'
import TableHeader from '@/views/components/Table/TableHeader.vue'
import TableMessage from '@/views/components/Table/TableMessage.vue'
import Table from '@/views/components/Table/Table.vue'
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { computed } from 'vue'
import { toast } from 'vue-sonner'
import ApplicationListRow from '@/views/partials/ApplicationListRow.vue'
import ProjectListRow from '@/views/partials/ProjectListRow.vue'

const router = useRouter()

const deployNewApplication = () => {
  router.push('/deploy/application')
}

const installApplicationFromAppStore = () => {
  router.push({ name: 'App Store' })
}

const {
  result: applicationsResult,
  refetch: refetchApplications,
  loading: isApplicationsLoading,
  onError: onApplicationsError
} = useQuery(
  gql`
    query {
      applications(includeGroupedApplications: false) {
        id
        name
        replicas
        isSleeping
        realtimeInfo {
          InfoFound
          DesiredReplicas
          RunningReplicas
          DeploymentMode
          HealthStatus
        }
        latestDeployment {
          status
          upstreamType
          createdAt
        }
      }
    }
  `,
  null,
  {
    pollInterval: 60000
  }
)

onApplicationsError((err) => {
  toast.error(err.message)
})

const {
  result: applicationGroupsResult,
  refetch: refetchApplicationGroups,
  loading: isApplicationGroupsLoading,
  onError: onApplicationGroupsError
} = useQuery(
  gql`
    query {
      applicationGroups {
        id
        name
        logo
        applications {
          realtimeInfo {
            InfoFound
            DeploymentMode
            DesiredReplicas
            RunningReplicas
            HealthStatus
          }
        }
      }
    }
  `,
  null,
  {
    pollInterval: 60000
  }
)

onApplicationGroupsError((err) => {
  toast.error(err.message)
})

const refreshData = () => {
  refetchApplications()
  refetchApplicationGroups()
}

const applications = computed(() => applicationsResult.value?.applications ?? [])
const applicationGroups = computed(() => applicationGroupsResult.value?.applicationGroups ?? [])
</script>

<template>
  <section class="mx-auto w-full max-w-7xl">
    <!-- Deploy Apps Page bar   -->
    <PageBar>
      <template v-slot:title>{{ $t('applications.deployedServices') }}</template>
      <template v-slot:subtitle>{{ $t('applications.manageServices') }}</template>
      <template v-slot:buttons>
        <FilledButton :click="deployNewApplication" type="primary">
          <font-awesome-icon icon="fa-solid fa-hammer" class="mr-2" />
          {{ $t('applications.deployApp') }}
        </FilledButton>
        <FilledButton :click="installApplicationFromAppStore" type="primary">
          <font-awesome-icon icon="fa-solid fa-store" class="mr-2" />
          {{ $t('applications.appStore') }}
        </FilledButton>
        <FilledButton type="ghost" :click="refreshData">
          <font-awesome-icon
            icon="fa-solid fa-arrows-rotate"
            :class="{
              'animate-spin ': isApplicationsLoading || isApplicationGroupsLoading
            }" />&nbsp;&nbsp; {{ $t('common.refreshList') }}
        </FilledButton>
      </template>
    </PageBar>

    <p class="mt-6 text-sm font-medium">
      <font-awesome-icon icon="fa-solid fa-hammer" class="me-1" />
      {{ $t('applications.deployedApplications') }}
    </p>

    <!-- Applications Table -->
    <Table class="mt-2">
      <template v-slot:header>
        <TableHeader align="left">{{ $t('applications.applicationName') }}</TableHeader>
        <TableHeader align="center">{{ $t('applications.healthStatus') }}</TableHeader>
        <TableHeader align="center">{{ $t('applications.replicas') }}</TableHeader>
        <TableHeader align="center">{{ $t('applications.deployStatus') }}</TableHeader>
        <TableHeader align="center">{{ $t('applications.lastDeployment') }}</TableHeader>
        <TableHeader align="right">{{ $t('applications.viewDetails') }}</TableHeader>
      </template>
      <template v-slot:message>
        <TableMessage v-if="applications.length === 0">
          {{ $t('applications.noApps') }}<br />
          {{ $t('applications.clickDeploy') }}
        </TableMessage>
        <TableMessage v-if="isApplicationsLoading && applications.length === 0">
          {{ $t('applications.loadingApps') }}
        </TableMessage>
      </template>
      <template v-slot:body>
        <ApplicationListRow v-for="application in applications" :key="application.id" :application="application" />
      </template>
    </Table>

    <!--  Deployed Projects Bar   -->
    <p class="mt-6 text-sm font-medium">
      <font-awesome-icon icon="fa-solid fa-layer-group" class="me-1" />
      {{ $t('applications.deployedProjects') }}
    </p>

    <!-- Projects Table -->
    <Table class="mt-2">
      <template v-slot:header>
        <TableHeader align="left">{{ $t('applications.projectName') }}</TableHeader>
        <TableHeader align="center">{{ $t('applications.healthStatus') }}</TableHeader>
        <TableHeader align="center">{{ $t('applications.totalServices') }}</TableHeader>
        <TableHeader align="center">{{ $t('applications.healthyServices') }}</TableHeader>
        <TableHeader align="center">{{ $t('applications.unhealthyServices') }}</TableHeader>
        <TableHeader align="right">{{ $t('applications.viewDetails') }}</TableHeader>
      </template>
      <template v-slot:message>
        <TableMessage v-if="applicationGroups.length === 0"> {{ $t('applications.noProjects') }}</TableMessage>
        <TableMessage v-if="isApplicationGroupsLoading && applicationGroups.length === 0">
          {{ $t('applications.loadingProjects') }}
        </TableMessage>
      </template>
      <template v-slot:body>
        <ProjectListRow v-for="group in applicationGroups" :key="group.id" :project="group" />
      </template>
    </Table>
  </section>
</template>

<style scoped></style>
