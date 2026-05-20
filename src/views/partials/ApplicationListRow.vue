<script setup>
import TableRow from '@/views/components/Table/TableRow.vue';
import FilledButton from '@/views/components/FilledButton.vue';
import { computed } from 'vue';
import moment from 'moment';
import router from '@/router/index.js';
import { camelCaseToSpacedCapitalized } from '@/vendor/utils.js';
import StatusBadge from '@/views/components/StatusBadge.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const props = defineProps({
  application: {
    type: Object,
    required: true
  },
  isVisible: {
    type: Boolean,
    default: true
  }
});

const createdAtFormatted = computed(() => {
  return moment(props.application.latestDeployment.createdAt).format('DD/MM/YYYY HH:mm');
});
const viewApplicationDetails = () => {
  router.push(`/application/${props.application.id}/deployments`);
};
</script>

<template>
  <tr v-show="isVisible">
    <TableRow align="left">
      <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
        <span v-if="application.latestDeployment.upstreamType === 'git'">
          <font-awesome-icon icon="fa-solid fa-code-branch" class="me-2" />
          {{ application.name }}
        </span>
        <span v-else-if="application.latestDeployment.upstreamType === 'image'"
          ><font-awesome-icon class="me-2" icon="fa-brands fa-docker" />{{ application.name }}</span
        >
        <span v-else-if="application.latestDeployment.upstreamType === 'sourceCode'">
          <font-awesome-icon class="me-2" icon="fa-solid fa-upload" />
          {{ application.name }}</span
        >
      </div>
    </TableRow>
    <TableRow align="center" flex>
      <div v-if="application.isSleeping" class="flex flex-row items-center text-sm text-gray-700 dark:text-gray-300">
        <font-awesome-icon icon="fa-solid fa-bed" class="me-1 text-blue-600" />
        {{ $t('partials.sleeping') }}
      </div>
      <div
        v-else-if="application.realtimeInfo.HealthStatus === 'healthy'"
        class="flex flex-row items-center text-sm text-gray-700 dark:text-gray-300">
        <font-awesome-icon icon="fa-solid fa-heart-circle-check" class="text-success-500 me-1" />
        {{ $t('partials.healthy') }}
      </div>
      <div
        v-else-if="application.realtimeInfo.HealthStatus === 'unhealthy'"
        class="flex flex-row items-center text-sm text-gray-700 dark:text-gray-300">
        <font-awesome-icon icon="fa-solid fa-heart-circle-exclamation" class="text-danger-500 me-1" />
        {{ $t('partials.unhealthy') }}
      </div>
      <div v-else class="text-sm text-gray-700 dark:text-gray-300">----</div>
    </TableRow>
    <!-- Replicas -->
    <TableRow v-if="application.realtimeInfo.InfoFound" align="center">
      <div
        v-if="application.realtimeInfo.DeploymentMode === 'replicated'"
        class="text-sm text-gray-700 dark:text-gray-300">
        {{ application.realtimeInfo.RunningReplicas }} / {{ application.realtimeInfo.DesiredReplicas }}
      </div>
      <div
        v-else-if="application.realtimeInfo.DeploymentMode === 'global'"
        class="text-sm text-gray-700 dark:text-gray-300">
        {{ $t('partials.global') }}
      </div>
    </TableRow>
    <TableRow v-else align="center">
      <div class="text-sm text-gray-700 dark:text-gray-300">----</div>
    </TableRow>
    <!-- END Replicas -->
    <TableRow align="center" flex>
      <StatusBadge
        class="text-gray-700 dark:text-gray-300"
        v-if="application.latestDeployment.status === 'deployed'"
        type="success"
        small
        animate
        >{{ camelCaseToSpacedCapitalized(application.latestDeployment.status) }}
      </StatusBadge>
      <StatusBadge
        class="text-gray-700 dark:text-gray-300"
        v-else-if="application.latestDeployment.status === 'pending'"
        type="warning"
        small
        >{{ camelCaseToSpacedCapitalized(application.latestDeployment.status) }}
      </StatusBadge>
      <StatusBadge
        class="text-gray-700 dark:text-gray-300"
        v-else-if="application.latestDeployment.status === 'deployPending'"
        type="warning"
        small
        >{{ camelCaseToSpacedCapitalized(application.latestDeployment.status) }}
      </StatusBadge>
      <StatusBadge
        class="text-gray-700 dark:text-gray-300"
        v-else-if="application.latestDeployment.status === 'deploying'"
        type="warning"
        small
        >{{ camelCaseToSpacedCapitalized(application.latestDeployment.status) }}
      </StatusBadge>
      <StatusBadge
        class="text-gray-700 dark:text-gray-300"
        v-else-if="application.latestDeployment.status === 'failed'"
        type="danger"
        small
        >{{ camelCaseToSpacedCapitalized(application.latestDeployment.status) }}
      </StatusBadge>
      <StatusBadge
        class="text-gray-700 dark:text-gray-300"
        v-else-if="application.latestDeployment.status === 'stopped'"
        type="secondary"
        small
        >{{ camelCaseToSpacedCapitalized(application.latestDeployment.status) }}
      </StatusBadge>
      <StatusBadge
        class="text-gray-700 dark:text-gray-300"
        v-else-if="application.latestDeployment.status === 'stalled'"
        type="secondary"
        small
        >{{ camelCaseToSpacedCapitalized(application.latestDeployment.status) }}
      </StatusBadge>
    </TableRow>
    <TableRow align="center">
      <span class="text-sm text-gray-700 dark:text-gray-300"> {{ createdAtFormatted }} </span>
    </TableRow>
    <TableRow align="right" flex>
      <FilledButton :click="viewApplicationDetails" slim type="primary">{{ $t('partials.viewDetails') }}</FilledButton>
    </TableRow>
  </tr>
</template>

<style scoped></style>
