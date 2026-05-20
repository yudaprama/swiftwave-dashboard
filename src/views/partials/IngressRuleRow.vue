<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import TableRow from '@/views/components/Table/TableRow.vue';
import Badge from '@/views/components/Badge.vue';
import FilledButton from '@/views/components/FilledButton.vue';
import { onBeforeUnmount, ref } from 'vue';

defineProps({
  ingressRule: {
    type: Object,
    required: true
  },
  deleteIngressRule: {
    type: Function,
    required: true
  },
  enableHttpsRedirect: {
    type: Function,
    required: true
  },
  disableHttpsRedirect: {
    type: Function,
    required: true
  },
  recreateIngressRule: {
    type: Function,
    required: true
  },
  setupAuthentication: {
    type: Function,
    required: true
  },
  disableAuthentication: {
    type: Function,
    required: true
  },
  restrictTableWidth: {
    type: Boolean,
    default: false
  }
});

const actionsBtnRef = ref(null);
const actionsMenuRef = ref(null);
const isActionsMenuOpen = ref(false);

const onClickActions = () => {
  if (actionsBtnRef.value === null || actionsBtnRef.value.$el === null) {
    return;
  }
  if (actionsMenuRef.value === null) {
    return;
  }
  if (actionsMenuRef.value.style.display === 'block') {
    actionsMenuRef.value.style.display = 'none';
    isActionsMenuOpen.value = false;
    return;
  }
  const rect = actionsBtnRef.value.$el.getBoundingClientRect();
  const menuEl = actionsMenuRef.value;
  menuEl.style.display = 'block';
  menuEl.style.minWidth = `${rect.width}px`;
  menuEl.style.top = `${rect.top + rect.height + 8}px`;
  menuEl.style.right = `${window.innerWidth - rect.left - rect.width}px`;
  isActionsMenuOpen.value = true;
};

const closeMenu = () => {
  if (!actionsMenuRef.value) {
    return;
  }
  actionsMenuRef.value.style.display = 'none';
  isActionsMenuOpen.value = false;
};

const runMenuAction = (action) => {
  closeMenu();
  action();
};

const onWindowClick = (e) => {
  if (!actionsMenuRef.value || !actionsBtnRef.value.$el) {
    return;
  }
  if (!actionsBtnRef.value.$el.contains(e.target)) {
    closeMenu();
  }
};

// on screen resize close the menu
window.addEventListener('resize', closeMenu);
// on click outside close the menu
window.addEventListener('click', onWindowClick);

onBeforeUnmount(() => {
  window.removeEventListener('resize', closeMenu);
  window.removeEventListener('click', onWindowClick);
});
</script>

<template>
  <tr :key="ingressRule.id">
    <TableRow align="left">
      <div class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ ingressRule.id }}</div>
    </TableRow>
    <TableRow align="center">
      <Badge v-if="ingressRule.status === 'pending'" type="warning">Pending</Badge>
      <Badge v-else-if="ingressRule.status === 'applied'" type="success">Applied</Badge>
      <Badge v-else-if="ingressRule.status === 'failed'" type="danger">Failed</Badge>
      <Badge v-else-if="ingressRule.status === 'deleting'" type="danger">Deleting</Badge>
    </TableRow>
    <TableRow align="center">
      <div
        class="text-sm text-gray-900 dark:text-gray-100"
        :class="{
          'max-w-[200px] overflow-hidden text-nowrap text-ellipsis': restrictTableWidth
        }">
        <a
          v-if="ingressRule.protocol === 'http' || ingressRule.protocol === 'https'"
          :href="ingressRule.protocol + '://' + ingressRule.domain.name + ':' + ingressRule.port.toString()"
          target="_blank"
          >{{ ingressRule.protocol }}://{{ ingressRule.domain.name }}:{{ ingressRule.port }}</a
        >
        <a v-else-if="ingressRule.protocol === 'tcp'" href="javascript:void(0);"
          >tcp://&lt;proxy-server-ip&gt;:{{ ingressRule.port }}</a
        >
        <a v-else-if="ingressRule.protocol === 'udp'" href="javascript:void(0);"
          >udp://&lt;proxy-server-ip&gt;:{{ ingressRule.port }}</a
        >
        <a v-else href="javascript:void(0);"><i>Unknown</i></a>
      </div>
    </TableRow>
    <TableRow align="center">
      <font-awesome-icon icon="fa-solid fa-arrow-right" aria-hidden="true" />
    </TableRow>
    <TableRow align="center">
      <div class="text-sm text-gray-900 dark:text-gray-100">
        <Badge v-if="ingressRule.targetType === 'externalService'" type="warning">External Service</Badge>
        <Badge v-else-if="ingressRule.targetType === 'application'" type="success">Application</Badge>
        &nbsp;&nbsp;
        <a v-if="ingressRule.targetType === 'application'" href="javascript:void(0);"
          >{{ ingressRule.application.name }}:{{ ingressRule.targetPort }}</a
        >
        <a v-else href="javascript:void(0);">{{ ingressRule.externalService }}:{{ ingressRule.targetPort }}</a>
      </div>
    </TableRow>
    <TableRow align="center" flex>
      <div
        v-if="ingressRule.protocol === 'https' || ingressRule.protocol === 'http'"
        class="text-sm text-gray-900 dark:text-gray-100">
        <div v-if="ingressRule.authenticationType === 'none'" class="italic">No Authentication</div>
        <div
          v-else-if="ingressRule.authenticationType === 'basic'"
          class="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
          <font-awesome-icon icon="fa-solid fa-shield-halved" class="text-success-600" />
          <p><span class="font-medium">ACL</span> - {{ ingressRule.basicAuthAccessControlListName }}</p>
        </div>
      </div>
      <div v-else class="text-sm text-gray-900 italic dark:text-gray-100">N/A</div>
    </TableRow>
    <TableRow align="center" flex v-if="ingressRule.protocol === 'https'">
      <Badge v-if="ingressRule.httpsRedirect" type="success">Active</Badge>
      <Badge v-else type="secondary">Disabled</Badge>
    </TableRow>
    <TableRow align="center" v-else>
      <p class="text-sm font-medium text-gray-900 italic dark:text-gray-100">N/A</p>
    </TableRow>
    <TableRow align="right" flex>
      <FilledButton
        ref="actionsBtnRef"
        type="ghost"
        slim
        :click="onClickActions"
        aria-haspopup="menu"
        :aria-expanded="isActionsMenuOpen">
        <font-awesome-icon icon="fa-solid fa-ellipsis-vertical" aria-hidden="true" />&nbsp;&nbsp;&nbsp;Show Actions
      </FilledButton>
    </TableRow>
  </tr>

  <div class="actions-menu z-1" ref="actionsMenuRef">
    <ul role="menu">
      <li v-if="ingressRule.httpsRedirect && ingressRule.protocol === 'https'" role="none">
        <button type="button" role="menuitem" @click="runMenuAction(disableHttpsRedirect)">
          <font-awesome-icon icon="fa-solid fa-location-arrow" aria-hidden="true" />&nbsp;&nbsp;&nbsp;Disable HTTPS
          Redirect
        </button>
      </li>
      <li v-else-if="ingressRule.protocol === 'https'" role="none">
        <button type="button" role="menuitem" @click="runMenuAction(enableHttpsRedirect)">
          <font-awesome-icon icon="fa-solid fa-location-arrow" aria-hidden="true" />&nbsp;&nbsp;&nbsp;Enable HTTPS
          Redirect
        </button>
      </li>
      <li v-if="ingressRule.authenticationType === 'none'" role="none">
        <button type="button" role="menuitem" @click="runMenuAction(setupAuthentication)">
          <font-awesome-icon icon="fa-solid fa-shield-halved" aria-hidden="true" />&nbsp;&nbsp;&nbsp;Setup
          Authentication
        </button>
      </li>
      <li v-if="ingressRule.authenticationType !== 'none'" role="none">
        <button type="button" role="menuitem" @click="runMenuAction(disableAuthentication)">
          <font-awesome-icon icon="fa-solid fa-shield-halved" aria-hidden="true" />&nbsp;&nbsp;&nbsp;Disable
          Authentication
        </button>
      </li>
      <li role="none">
        <button type="button" role="menuitem" @click="runMenuAction(recreateIngressRule)">
          <font-awesome-icon icon="fa-solid fa-hammer" aria-hidden="true" />&nbsp;&nbsp;&nbsp;Recreate & Fix
        </button>
      </li>
      <li role="none">
        <button
          type="button"
          role="menuitem"
          class="text-danger-500 font-medium"
          @click="runMenuAction(deleteIngressRule)">
          <font-awesome-icon icon="fa-solid fa-trash" aria-hidden="true" />&nbsp;&nbsp;&nbsp;Delete Ingress Rule
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
@reference "../../assets/css/base.css";
.actions-menu {
  @apply dark:bg-secondary-800 absolute hidden rounded-md border border-gray-200 bg-white shadow-md dark:border-gray-700;

  ul {
    button {
      @apply focus-visible:outline-primary-600 dark:hover:bg-secondary-700 dark:focus-visible:bg-secondary-700 w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-100 focus-visible:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-0 dark:text-gray-100;
    }
  }
}
</style>
