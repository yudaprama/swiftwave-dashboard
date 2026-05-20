<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div
        v-if="open"
        class="fixed inset-0 z-40 md:hidden"
        @click="$emit('close')">
        <!-- Overlay -->
        <div class="fixed inset-0 bg-black/25 transition-opacity" />
        <!-- Drawer panel -->
        <div
          class="fixed inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto bg-primary-600 shadow-xl"
          @click.stop>
          <slot></slot>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from > :last-child,
.drawer-leave-to > :last-child {
  transform: translateX(-100%);
}

.drawer-enter-active > :last-child,
.drawer-leave-active > :last-child {
  transition: transform 0.3s ease;
}
</style>
