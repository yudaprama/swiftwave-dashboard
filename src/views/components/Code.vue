<script setup>
import { toast } from 'vue-sonner';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps({
  showCopyButton: {
    type: Boolean,
    default: true
  }
});

const showCopyBorder = ref(false);
const textDivRef = ref(null);
const copyToClipboard = () => {
  if (textDivRef.value === null) {
    return;
  }
  let isSuccess;
  if ('clipboard' in navigator) {
    navigator.clipboard.writeText(textDivRef.value.innerText);
    isSuccess = true;
  } else {
    const textArea = document.createElement('textarea');
    textArea.value = textDivRef.value.innerText;
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      isSuccess = document.execCommand('copy');
    } catch (err) {
      isSuccess = false;
    }
    document.body.removeChild(textArea);
  }
  if (isSuccess) {
    toast.success(t('applicationDetails.copySuccess'));
    showCopyBorder.value = true;
    setTimeout(() => {
      showCopyBorder.value = false;
    }, 2000);
  } else {
    toast.error(t('applicationDetails.copyFail'));
  }
};
</script>

<template>
  <div
    class="border-secondary-300 bg-secondary-100 dark:bg-secondary-800 relative my-2 rounded-lg border-2 p-3 wrap-break-word text-gray-900 transition-all dark:border-gray-700 dark:text-gray-100"
    :class="{
      'ring-primary-300 ring-2': showCopyBorder
    }">
    <div ref="textDivRef" class="wrap-break-word whitespace-pre-wrap select-text">
      <slot></slot>
    </div>
    <div
      v-if="showCopyButton"
      @click="copyToClipboard"
      class="border-primary-300 dark:bg-secondary-700 dark:hover:bg-secondary-600 absolute top-0 right-0 m-3 flex h-10 w-10 cursor-copy items-center justify-center rounded-lg border-2 bg-white text-gray-900 transition-all hover:bg-gray-200 dark:text-gray-100">
      <font-awesome-icon icon="fa-solid fa-clipboard" class="text-xl" aria-hidden="true" />
    </div>
  </div>
</template>

<style scoped></style>
