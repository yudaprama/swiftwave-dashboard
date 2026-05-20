<script setup>
import ModalDialog from '@/views/components/ModalDialog.vue'
import FilledButton from '@/views/components/FilledButton.vue'
import OutlinedButton from '@/views/components/OutlinedButton.vue'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  },
  confirmType: {
    type: String,
    default: 'primary'
  },
  onConfirm: {
    type: Function,
    required: true
  },
  onCancel: {
    type: Function,
    required: true
  }
})
</script>

<template>
  <ModalDialog :is-open="isOpen" :close-modal="onCancel" width="sm">
    <template #header>
      <span>{{ $t('common.confirmAction') }}</span>
    </template>
    <template #body>
      <p class="text-sm text-gray-600 dark:text-gray-400">{{ message }}</p>
    </template>
    <template #footer>
      <OutlinedButton :click="onCancel">{{ $t('common.cancel') }}</OutlinedButton>
      <FilledButton :type="confirmType" :click="onConfirm">
        {{ $t('common.confirm') }}
      </FilledButton>
    </template>
  </ModalDialog>
</template>
