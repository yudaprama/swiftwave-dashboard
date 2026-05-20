<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

const route = useRoute();
const { t } = useI18n();

const crumbs = computed(() => {
  return route.matched
    .filter((r) => r.meta?.breadcrumb)
    .map((r) => ({
      label: t(r.meta.breadcrumb),
      to: r.path,
      linkable: Boolean(r.name),
      current: false
    }))
    .map((crumb, index, arr) => ({
      ...crumb,
      current: index === arr.length - 1
    }));
});
</script>

<template>
  <nav v-if="crumbs.length > 0" aria-label="Breadcrumb" class="hidden md:flex">
    <ol class="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
      <li v-for="(crumb, index) in crumbs" :key="crumb.to" class="flex items-center gap-1.5">
        <font-awesome-icon
          v-if="index > 0"
          icon="fa-solid fa-chevron-right"
          class="h-3 w-3 text-gray-400 dark:text-gray-500" />
        <router-link
          v-if="!crumb.current && crumb.linkable"
          :to="crumb.to"
          class="hover:text-primary-600 dark:hover:text-primary-400">
          {{ crumb.label }}
        </router-link>
        <span
          v-else
          :aria-current="crumb.current ? 'page' : undefined"
          :class="crumb.current ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'">
          {{ crumb.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>
