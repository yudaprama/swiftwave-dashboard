<script setup></script>

<template>
  <div class="navbar">
    <RouterLink
      class="nav-element"
      :to="{
        name: 'Application Details Deployments',
        params: { id: $route.params.id }
      }">
      {{ $t('applicationDetails.deployments') }}
    </RouterLink>
    <RouterLink
      class="nav-element"
      :to="{
        name: 'Application Details Resource Stats',
        params: { id: $route.params.id }
      }">
      {{ $t('servers.analytics') }}
    </RouterLink>
    <RouterLink
      class="nav-element"
      :to="{
        name: 'Application Details Runtime Logs',
        params: { id: $route.params.id }
      }">
      {{ $t('applicationDetails.logs') }}
    </RouterLink>
    <RouterLink
      class="nav-element"
      :to="{
        name: 'Application Details Ingress Rules',
        params: { id: $route.params.id }
      }">
      {{ $t('ingressRules.title') }}
    </RouterLink>
    <RouterLink
      class="nav-element"
      :to="{
        name: 'Application Details Persistent Volumes',
        params: { id: $route.params.id }
      }">
      {{ $t('persistentVolumes.title') }}
    </RouterLink>
    <RouterLink
      class="nav-element"
      :to="{
        name: 'Application Details Environment Variables',
        params: { id: $route.params.id }
      }">
      {{ $t('deploy.environmentVariables') }}
    </RouterLink>
    <RouterLink
      class="nav-element"
      :to="{
        name: 'Application Details Config Mounts',
        params: { id: $route.params.id }
      }">
      {{ $t('applicationDetails.configMounts') }}
    </RouterLink>
    <RouterLink
      class="nav-element"
      :to="{
        name: 'Application Details Update Source',
        params: { id: $route.params.id }
      }">
      {{ $t('applicationDetails.updateSource') }}
    </RouterLink>
    <RouterLink
      class="nav-element"
      :to="{
        name: 'Application Details Deployment Config',
        params: { id: $route.params.id }
      }">
      {{ $t('deploy.dockerConfiguration') }}
    </RouterLink>
    <RouterLink
      class="nav-element"
      :to="{
        name: 'Application Details Webhook CI',
        params: { id: $route.params.id }
      }">
      {{ $t('applicationDetails.webhook') }}
    </RouterLink>
    <RouterLink
      class="nav-element"
      :to="{
        name: 'Application Details Manage',
        params: { id: $route.params.id }
      }">
      {{ $t('common.actions') }}
    </RouterLink>
    <RouterLink
      class="nav-element text-red-500! dark:text-red-400!"
      :to="{
        name: 'Application Details Danger Zone',
        params: { id: $route.params.id }
      }">
      {{ $t('applicationDetails.destroy') }}
    </RouterLink>
  </div>
</template>

<style scoped>
@reference "../../assets/css/base.css";
.navbar {
  @apply flex select-none gap-1 overflow-x-auto rounded-lg border border-secondary-200 p-1.5 dark:border-gray-700;
}

.nav-element {
  @apply min-w-max rounded-md px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-100 dark:text-gray-300 dark:hover:bg-gray-700;
}

.router-link-exact-active {
  @apply bg-secondary-100 font-medium text-black dark:bg-gray-600 dark:text-gray-100;
}
</style>
