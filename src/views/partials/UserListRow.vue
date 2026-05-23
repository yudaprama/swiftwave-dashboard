<script setup>
import TableRow from '@/views/components/Table/TableRow.vue';
import Badge from '@/views/components/Badge.vue';
import TextButton from '@/views/components/TextButton.vue';
import { useAuthStore } from '@/store/auth.js';
import FilledButton from '@/views/components/FilledButton.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const currentEmail = useAuthStore().currentEmail;
defineProps({
  user: {
    type: Object,
    required: true
  },
  deleteUser: {
    type: Function,
    required: true
  },
  enableTotpCurrentUser: {
    type: Function,
    required: false,
    default: () => {}
  },
  disableTotpCurrentUser: {
    type: Function,
    required: false,
    default: () => {}
  },
  isRequestRunningForTotp: {
    required: false,
    default: false
  }
});
</script>

<template>
  <tr class="table-row-interactive">
    <TableRow align="left">
      <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
        {{ user.email }}
      </div>
    </TableRow>
    <TableRow align="center">
      <Badge type="success">{{ t('partials.activeUser') }}</Badge>
    </TableRow>
    <TableRow align="center">
      <span class="text-sm text-gray-700 dark:text-gray-300"> {{ t('partials.administrator') }} </span>
    </TableRow>
    <TableRow align="center" v-if="currentEmail === user.email" flex>
      <FilledButton
        type="primary"
        slim
        v-if="!user.totpEnabled"
        :loading="isRequestRunningForTotp"
        :click="enableTotpCurrentUser"
        >{{ t('partials.enableTOTP') }}
      </FilledButton>
      <FilledButton type="danger" slim v-else :loading="isRequestRunningForTotp" :click="disableTotpCurrentUser"
        >{{ t('partials.disableTOTP') }}
      </FilledButton>
    </TableRow>
    <TableRow align="center" v-else>
      <Badge type="success" v-if="user.totpEnabled">{{ t('partials.totpEnabled') }}</Badge>
      <Badge type="danger" v-else>{{ t('partials.totpDisabled') }}</Badge>
    </TableRow>
    <TableRow align="right">
      <TextButton :click="() => deleteUser(user)" type="danger" :disabled="currentEmail === user.email">
        {{ t('common.delete') }}
      </TextButton>
    </TableRow>
  </tr>
</template>

<style scoped></style>
