<script setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue';
</script>

<template>
  <div class="w-full">
    <div class="dark:bg-secondary-800 mx-auto w-full rounded-2xl bg-white">
      <Disclosure v-slot="{ open }" as="div" class="mt-2">
        <DisclosureButton
          class="bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus-visible:ring-secondary-500/75 dark:bg-secondary-700 dark:hover:bg-secondary-600 flex w-full justify-between rounded-lg px-4 py-2 text-left text-sm font-medium focus:outline-hidden focus-visible:ring-3 dark:text-gray-100">
          <span><slot name="title"></slot></span>
          <font-awesome-icon
            :class="{
              'rotate-180 transform': open
            }"
            class="text-secondary-500 h-5 w-5 dark:text-gray-300"
            icon="fa-solid fa-chevron-down" />
        </DisclosureButton>
        <DisclosurePanel class="px-4 pt-4 pb-2 text-sm text-gray-800 dark:text-gray-200">
          <slot name="body"></slot>
        </DisclosurePanel>
      </Disclosure>
    </div>
  </div>
</template>
