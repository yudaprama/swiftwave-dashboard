<script setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { useRouter } from 'vue-router'
import { ref, watch } from 'vue'

const props = defineProps({
  activeUrls: {
    type: Array,
    default: () => []
  },
  collapsed: {
    type: Boolean,
    default: false
  }
})
const router = useRouter()
const isOpen = ref(false)

watch(
  () => router.currentRoute.value,
  (currentRoute) => {
    if (props.activeUrls.includes(currentRoute.name)) {
      isOpen.value = true
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="mt-2.5">
    <Disclosure v-model:open="isOpen">
      <DisclosureButton
        as="button"
        class="flex w-full items-center justify-between rounded-lg bg-gray-200 bg-opacity-20 px-3 py-1.5 text-gray-200 backdrop-blur-xs backdrop-filter dark:bg-gray-700/30 dark:text-gray-300">
        <div class="flex items-center">
          <slot name="icon"></slot>
          <span v-if="!collapsed" class="mx-2 text-sm font-medium">
            <slot name="title"></slot>
          </span>
        </div>
        <font-awesome-icon
          v-if="!collapsed"
          icon="fa-solid fa-chevron-right"
          class="transform transition-all duration-200"
          :class="{
            'rotate-90': isOpen
          }" />
      </DisclosureButton>

      <div v-if="!collapsed" class="mt-2.5">
        <transition
          enter-active-class="transition duration-50 ease-in"
          enter-from-class="transform opacity-0"
          enter-to-class="transform opacity-100"
          leave-active-class="transition duration-50 ease-out"
          leave-from-class="transform opacity-100"
          leave-to-class="transform opacity-0">
          <DisclosurePanel class="mt-0">
            <div class="ml-4 mr-0 mt-0 transition-all">
              <slot name="content"></slot>
            </div>
          </DisclosurePanel>
        </transition>
      </div>
    </Disclosure>
  </div>
</template>

<style scoped>
@reference "../../assets/css/base.css";
.router-link-exact-active {
  @apply bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-100;
}
</style>
