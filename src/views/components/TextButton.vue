<script setup>
import DotLoader from '@/views/components/DotLoader.vue'

const props = defineProps({
  type: {
    type: String,
    default: 'primary',
    validator: (value) => {
      return ['primary', 'secondary', 'success', 'danger', 'warning'].includes(value)
    }
  },
  click: {
    type: Function,
    required: false,
    default: () => {}
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const onClick = () => {
  if (!props.disabled) {
    props.click()
  }
}
</script>

<template>
  <a
    :class="{
      'text-primary-600 dark:text-primary-400': type === 'primary',
      'text-secondary-600 dark:text-secondary-400': type === 'secondary',
      'text-success-600 dark:text-success-400': type === 'success',
      'text-danger-600 dark:text-danger-400': type === 'danger',
      'text-warning-600 dark:text-warning-400': type === 'warning',
      'cursor-not-allowed! text-gray-400!': disabled
    }"
    class="interactive cursor-pointer inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-md px-2 py-1.5 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:focus-visible:outline-primary-400"
    @click.prevent="onClick">
    <slot v-if="!loading"></slot>
    <DotLoader v-else />
  </a>
</template>
