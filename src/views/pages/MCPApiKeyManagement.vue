<script setup>
import PageBar from '@/views/components/PageBar.vue';
import FilledButton from '@/views/components/FilledButton.vue';
import { toast } from 'vue-sonner';
import { computed, ref } from 'vue';
import Table from '@/views/components/Table/Table.vue';
import TableHeader from '@/views/components/Table/TableHeader.vue';
import TableMessage from '@/views/components/Table/TableMessage.vue';
import ModalDialog from '@/views/components/ModalDialog.vue';
import { useI18n } from 'vue-i18n';
import { useConfirmDialog } from '@/composables/useConfirmDialog.js';
import ConfirmDialog from '@/views/components/ConfirmDialog.vue';
import { useAuthStore } from '@/store/auth.js';

const { t } = useI18n();
const authStore = useAuthStore();

const {
  isOpen: isDeleteConfirmOpen,
  message: deleteMessage,
  confirmType: deleteConfirmType,
  confirm: askDelete,
  onConfirm: onDeleteConfirm,
  onCancel: onDeleteCancel
} = useConfirmDialog();

// State
const apiKeys = ref([]);
const isLoading = ref(false);
const isCreateModalOpen = ref(false);
const newKeyName = ref('');
const newKeyExpiry = ref('');
const createdPlainKey = ref('');
const isShowKeyModalOpen = ref(false);

// Fetch API keys via REST
const fetchApiKeys = async () => {
  isLoading.value = true;
  try {
    const response = await fetch('/mcp/keys', {
      headers: {
        Authorization: authStore.FetchBearerToken()
      }
    });
    if (!response.ok) throw new Error(t('mcpApiKeys.fetchError'));
    apiKeys.value = await response.json();
  } catch (err) {
    toast.error(err.message);
  } finally {
    isLoading.value = false;
  }
};

// Create API key
const createApiKey = async () => {
  if (!newKeyName.value.trim()) {
    toast.error(t('mcpApiKeys.nameRequired'));
    return;
  }
  try {
    const body = { name: newKeyName.value.trim() };
    if (newKeyExpiry.value) {
      body.expires_in = newKeyExpiry.value;
    }
    const response = await fetch('/mcp/keys', {
      method: 'POST',
      headers: {
        Authorization: authStore.FetchBearerToken(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(t('mcpApiKeys.createError'));
    const result = await response.json();
    createdPlainKey.value = result.plain_key;
    isCreateModalOpen.value = false;
    isShowKeyModalOpen.value = true;
    newKeyName.value = '';
    newKeyExpiry.value = '';
    await fetchApiKeys();
  } catch (err) {
    toast.error(err.message);
  }
};

// Delete API key
const deleteApiKeyWithConfirmation = async (key) => {
  if (await askDelete(t('mcpApiKeys.deleteConfirm', { name: key.name }), 'danger')) {
    try {
      const response = await fetch(`/mcp/keys/${key.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: authStore.FetchBearerToken()
        }
      });
      if (!response.ok) throw new Error(t('mcpApiKeys.deleteError'));
      toast.success(t('mcpApiKeys.deleteSuccess'));
      await fetchApiKeys();
    } catch (err) {
      toast.error(err.message);
    }
  }
};

// Revoke API key
const revokeApiKey = async (key) => {
  try {
    const response = await fetch(`/mcp/keys/${key.id}/revoke`, {
      method: 'POST',
      headers: {
        Authorization: authStore.FetchBearerToken()
      }
    });
    if (!response.ok) throw new Error(t('mcpApiKeys.revokeError'));
    toast.success(t('mcpApiKeys.revokeSuccess'));
    await fetchApiKeys();
  } catch (err) {
    toast.error(err.message);
  }
};

// Copy key to clipboard
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  toast.success(t('mcpApiKeys.copied'));
};

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString();
};

// Load on mount
fetchApiKeys();
</script>

<template>
  <section class="mx-auto w-full max-w-7xl px-2 md:px-0">
    <!-- Create Modal -->
    <ModalDialog :is-open="isCreateModalOpen" @close="isCreateModalOpen = false">
      <template #header>{{ $t('mcpApiKeys.createTitle') }}</template>
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ $t('mcpApiKeys.keyName') }}
            </label>
            <input
              v-model="newKeyName"
              type="text"
              :placeholder="$t('mcpApiKeys.keyNamePlaceholder')"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ $t('mcpApiKeys.expiry') }}
            </label>
            <select
              v-model="newKeyExpiry"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              <option value="">{{ $t('mcpApiKeys.neverExpires') }}</option>
              <option value="720h">{{ $t('mcpApiKeys.30days') }}</option>
              <option value="2160h">{{ $t('mcpApiKeys.90days') }}</option>
              <option value="4320h">{{ $t('mcpApiKeys.180days') }}</option>
              <option value="8760h">{{ $t('mcpApiKeys.365days') }}</option>
            </select>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ $t('mcpApiKeys.createHint') }}
          </p>
        </div>
      </template>
      <template #footer>
        <FilledButton type="ghost" :click="() => (isCreateModalOpen = false)">
          {{ $t('common.cancel') }}
        </FilledButton>
        <FilledButton type="primary" :click="createApiKey">
          {{ $t('common.create') }}
        </FilledButton>
      </template>
    </ModalDialog>

    <!-- Show Key Modal (shown once after creation) -->
    <ModalDialog :is-open="isShowKeyModalOpen" @close="isShowKeyModalOpen = false">
      <template #header>{{ $t('mcpApiKeys.keyCreated') }}</template>
      <template #body>
        <div class="space-y-3">
          <p class="text-sm text-yellow-600 dark:text-yellow-400">
            {{ $t('mcpApiKeys.copyWarning') }}
          </p>
          <div class="flex items-center gap-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-700">
            <code class="flex-1 text-sm break-all text-gray-800 dark:text-gray-200">{{ createdPlainKey }}</code>
            <FilledButton type="ghost" :click="() => copyToClipboard(createdPlainKey)">
              <font-awesome-icon icon="fa-solid fa-copy" />
            </FilledButton>
          </div>
          <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
            <p class="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              {{ $t('mcpApiKeys.claudeCodeConfig') }}
            </p>
            <pre class="overflow-x-auto text-xs text-gray-700 dark:text-gray-300"><code>{
  "mcpServers": {
    "swiftwave": {
      "command": "swiftwave",
      "args": ["mcp"],
      "env": {
        "SWIFTWAVE_API_KEY": "{{ createdPlainKey }}"
      }
    }
  }
}</code></pre>
          </div>
        </div>
      </template>
      <template #footer>
        <FilledButton type="primary" :click="() => (isShowKeyModalOpen = false)">
          {{ $t('common.done') }}
        </FilledButton>
      </template>
    </ModalDialog>

    <!-- Top Page bar -->
    <PageBar>
      <template v-slot:title>{{ $t('mcpApiKeys.title') }}</template>
      <template v-slot:subtitle>{{ $t('mcpApiKeys.subtitle') }}</template>
      <template v-slot:buttons>
        <FilledButton :click="() => (isCreateModalOpen = true)" type="primary">
          <font-awesome-icon icon="fa-solid fa-plus" class="mr-2" />
          {{ $t('common.addNew') }}
        </FilledButton>
        <FilledButton type="ghost" :click="fetchApiKeys">
          <font-awesome-icon icon="fa-solid fa-arrows-rotate" :class="{ 'animate-spin': isLoading }" />&nbsp;&nbsp;
          {{ $t('common.refreshList') }}
        </FilledButton>
      </template>
    </PageBar>

    <!-- Table -->
    <Table class="mt-8">
      <template v-slot:header>
        <TableHeader align="left">{{ $t('mcpApiKeys.colName') }}</TableHeader>
        <TableHeader align="center">{{ $t('mcpApiKeys.colPrefix') }}</TableHeader>
        <TableHeader align="center">{{ $t('mcpApiKeys.colLastUsed') }}</TableHeader>
        <TableHeader align="center">{{ $t('mcpApiKeys.colExpires') }}</TableHeader>
        <TableHeader align="center">{{ $t('mcpApiKeys.colStatus') }}</TableHeader>
        <TableHeader align="right">{{ $t('common.actions') }}</TableHeader>
      </template>
      <template v-if="apiKeys.length === 0" v-slot:message>
        <TableMessage>
          {{ $t('mcpApiKeys.noKeys') }}<br />
          {{ $t('mcpApiKeys.clickAdd') }}
        </TableMessage>
      </template>
      <template v-slot:body>
        <tr
          v-for="key in apiKeys"
          :key="key.id"
          class="border-b transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
          <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
            {{ key.name }}
          </td>
          <td class="px-4 py-3 text-center font-mono text-sm text-gray-500 dark:text-gray-400">{{ key.prefix }}...</td>
          <td class="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
            {{ formatDate(key.last_used_at) }}
          </td>
          <td class="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
            {{ formatDate(key.expires_at) }}
          </td>
          <td class="px-4 py-3 text-center">
            <span
              v-if="key.revoked"
              class="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
              {{ $t('mcpApiKeys.revoked') }}
            </span>
            <span
              v-else
              class="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
              {{ $t('mcpApiKeys.active') }}
            </span>
          </td>
          <td class="px-4 py-3 text-right">
            <div class="flex items-center justify-end gap-2">
              <button
                v-if="!key.revoked"
                @click="revokeApiKey(key)"
                class="rounded p-1.5 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900"
                :title="$t('mcpApiKeys.revoke')">
                <font-awesome-icon icon="fa-solid fa-ban" />
              </button>
              <button
                @click="deleteApiKeyWithConfirmation(key)"
                class="rounded p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900"
                :title="$t('common.delete')">
                <font-awesome-icon icon="fa-solid fa-trash" />
              </button>
            </div>
          </td>
        </tr>
      </template>
    </Table>
  </section>
  <ConfirmDialog
    :is-open="isDeleteConfirmOpen"
    :message="deleteMessage"
    :confirm-type="deleteConfirmType"
    :on-confirm="onDeleteConfirm"
    :on-cancel="onDeleteCancel" />
</template>

<style scoped></style>
