<script setup>
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue';

defineProps({
  open: {
    type: Boolean,
    default: false
  }
});

defineEmits(['close']);
</script>

<template>
  <Teleport to="body">
    <TransitionRoot :show="open" as="template">
      <Dialog as="div" class="relative z-40 md:hidden" @close="$emit('close')">
        <TransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0">
          <div class="fixed inset-0 bg-black/25 dark:bg-black/50" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-hidden">
          <div class="absolute inset-0 overflow-hidden">
            <div class="pointer-events-none fixed inset-y-0 left-0 flex max-w-full pr-10">
              <TransitionChild
                as="template"
                enter="transform transition duration-300 ease-out"
                enter-from="-translate-x-full"
                enter-to="translate-x-0"
                leave="transform transition duration-200 ease-in"
                leave-from="translate-x-0"
                leave-to="-translate-x-full">
                <DialogPanel
                  class="bg-primary-600 dark:bg-secondary-900 pointer-events-auto w-80 max-w-[85vw] shadow-xl">
                  <slot></slot>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </Teleport>
</template>
