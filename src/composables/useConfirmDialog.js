import { onScopeDispose, ref } from 'vue';

export function useConfirmDialog() {
  const isOpen = ref(false);
  const message = ref('');
  const confirmType = ref('primary');
  let resolvePromise = null;

  function confirm(msg, type = 'primary') {
    if (resolvePromise) {
      resolvePromise(false);
    }
    message.value = msg;
    confirmType.value = type;
    isOpen.value = true;
    return new Promise((resolve) => {
      resolvePromise = resolve;
    });
  }

  function onConfirm() {
    isOpen.value = false;
    if (resolvePromise) resolvePromise(true);
    resolvePromise = null;
  }

  function onCancel() {
    isOpen.value = false;
    if (resolvePromise) resolvePromise(false);
    resolvePromise = null;
  }

  onScopeDispose(() => {
    if (resolvePromise) {
      resolvePromise(false);
      resolvePromise = null;
    }
  });

  return { isOpen, message, confirmType, confirm, onConfirm, onCancel };
}
