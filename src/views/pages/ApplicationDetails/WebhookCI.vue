<script setup>
import { useRouter } from 'vue-router';
import { useMutation, useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { computed } from 'vue';
import { toast } from 'vue-sonner';
import FilledButton from '@/views/components/FilledButton.vue';
import { useI18n } from 'vue-i18n';
import { useConfirmDialog } from '@/composables/useConfirmDialog.js';
import ConfirmDialog from '@/views/components/ConfirmDialog.vue';

const { t } = useI18n();
const router = useRouter();
const applicationId = router.currentRoute.value.params.id;

const {
  isOpen: isRegenerateWebhookConfirmOpen,
  message: regenerateWebhookMessage,
  confirmType: regenerateWebhookConfirmType,
  confirm: askRegenerateWebhookConfirm,
  onConfirm: onRegenerateWebhookConfirm,
  onCancel: onRegenerateWebhookCancel
} = useConfirmDialog();

const {
  result: applicationDetailsRaw,
  loading: applicationDetailsLoading,
  refetch: refetchApplicationDetails
} = useQuery(
  gql`
    query ($id: String!) {
      application(id: $id) {
        id
        webhookToken
      }
    }
  `,
  {
    id: applicationId
  },
  {
    fetchPolicy: 'no-cache',
    nextFetchPolicy: 'no-cache'
  }
);

const webhookTriggerLink = computed(() => {
  if (applicationDetailsLoading.value) return 'Loading...';
  if (applicationDetailsRaw.value?.application?.webhookToken) {
    let token = applicationDetailsRaw.value?.application?.webhookToken ?? '';
    return location.origin + '/webhook/redeploy-app/' + applicationId + '/' + token;
  } else {
    return 'Loading...';
  }
});

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  toast.success(t('applicationDetails.copyWebhookLink'));
};

// Regenerate Webhook Token
const {
  mutate: regenerateWebhookToken,
  loading: regenerateWebhookTokenLoading,
  onError: regenerateWebhookTokenError,
  onDone: regenerateWebhookTokenDone
} = useMutation(
  gql`
    mutation ($id: String!) {
      regenerateWebhookToken(id: $id)
    }
  `,
  {
    fetchPolicy: 'no-cache',
    nextFetchPolicy: 'no-cache'
  }
);

regenerateWebhookTokenError((error) => {
  toast.error(error.message);
});

regenerateWebhookTokenDone((result) => {
  if (result.data.regenerateWebhookToken) {
    toast.success(t('applicationDetails.regenerateWebhookSuccess'));
    refetchApplicationDetails();
  } else {
    toast.error(t('applicationDetails.somethingWentWrong'));
  }
});

const regenerateWebhookTokenWithConfirmation = async () => {
  if (await askRegenerateWebhookConfirm(t('applicationDetails.regenerateWebhookConfirm'), 'warning')) {
    regenerateWebhookToken({
      id: applicationId
    });
  }
};
</script>

<template>
  <!--  NOTE -->
  <div
    class="mb-8 rounded-md border-l-4 border-yellow-500 bg-yellow-100 p-3 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
    role="alert">
    <p class="font-bold">{{ $t('applicationDetails.webhookNote') }}</p>
    <p>{{ $t('applicationDetails.webhookNoteMessage') }}</p>
  </div>

  <p class="inline-flex items-center gap-2 text-lg font-medium">{{ $t('applicationDetails.webhookBasedCI') }}</p>
  <p class="text-secondary-700 text-sm">
    {{ $t('applicationDetails.webhookCIHint') }}
  </p>

  <!--  Link with a copy button -->
  <div class="mt-6">
    <div class="relative flex flex-row items-center gap-2">
      <input
        :value="webhookTriggerLink"
        class="dark:bg-secondary-700 w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:text-gray-200"
        readonly
        type="text" />
      <button
        type="button"
        class="bg-secondary-200 dark:bg-secondary-600 hover:bg-secondary-300 dark:hover:bg-secondary-500 absolute top-1 right-1 bottom-1 rounded-md px-3 text-sm font-bold dark:text-gray-200"
        @click="copyToClipboard(webhookTriggerLink)">
        {{ $t('applicationDetails.copyLabel') }}
        <font-awesome-icon icon="fa-solid fa-copy" aria-hidden="true" />
      </button>
    </div>
    <p class="text-secondary-700 mt-2 text-sm">
      {{ $t('applicationDetails.copyWebhookHint') }}
    </p>
  </div>

  <!-- Regenerate Webhook tolen -->
  <div class="mt-6 flex w-full flex-row items-center justify-between rounded-md">
    <div>
      <p class="inline-flex items-center gap-2 text-lg font-medium">
        {{ $t('applicationDetails.regenerateWebhookTokenTitle') }}
      </p>
      <p class="text-secondary-700 text-sm">{{ $t('applicationDetails.regenerateWebhookTokenHint') }}</p>
    </div>
    <FilledButton
      type="primary"
      :loading="regenerateWebhookTokenLoading"
      @click="regenerateWebhookTokenWithConfirmation">
      {{ $t('applicationDetails.regenerateToken') }}
    </FilledButton>
  </div>

  <ConfirmDialog
    :is-open="isRegenerateWebhookConfirmOpen"
    :message="regenerateWebhookMessage"
    :confirm-type="regenerateWebhookConfirmType"
    :on-confirm="onRegenerateWebhookConfirm"
    :on-cancel="onRegenerateWebhookCancel" />
</template>

<style scoped></style>
