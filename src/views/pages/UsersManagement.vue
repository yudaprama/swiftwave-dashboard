<script setup>
import { useMutation, useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { computed, reactive, ref } from 'vue'
import ModalDialog from '@/views/components/ModalDialog.vue'
import FilledButton from '@/views/components/FilledButton.vue'
import PageBar from '@/views/components/PageBar.vue'
import { toast } from 'vue-sonner'
import VueQrcode from 'vue-qrcode'
import { useI18n } from 'vue-i18n'
import { useConfirmDialog } from '@/composables/useConfirmDialog.js'
import ConfirmDialog from '@/views/components/ConfirmDialog.vue'

const { t } = useI18n()

import Table from '@/views/components/Table/Table.vue'
import TableHeader from '@/views/components/Table/TableHeader.vue'
import UserListRow from '@/views/partials/UserListRow.vue'
import TableMessage from '@/views/components/Table/TableMessage.vue'
import Code from '@/views/components/Code.vue'
import Divider from '@/views/components/Divider.vue'

const {
  isOpen: isDeleteUserConfirmOpen,
  message: deleteUserMessage,
  confirmType: deleteUserConfirmType,
  confirm: askDeleteUserConfirm,
  onConfirm: onDeleteUserConfirm,
  onCancel: onDeleteUserCancel
} = useConfirmDialog()

const {
  isOpen: isEnableTotpConfirmOpen,
  message: enableTotpMessage,
  confirmType: enableTotpConfirmType,
  confirm: askEnableTotpConfirm,
  onConfirm: onEnableTotpConfirm,
  onCancel: onEnableTotpCancel
} = useConfirmDialog()

const {
  isOpen: isDisableTotpConfirmOpen,
  message: disableTotpMessage,
  confirmType: disableTotpConfirmType,
  confirm: askDisableTotpConfirm,
  onConfirm: onDisableTotpConfirm,
  onCancel: onDisableTotpCancel
} = useConfirmDialog()

const isModalOpen = ref(false)
const openModal = () => {
  isModalOpen.value = true
}
const closeModal = () => {
  isModalOpen.value = false
}

// New user form state
const newUser = reactive({
  email: '',
  password: ''
})

const {
  mutate: createUser,
  loading: isUserCreating,
  onDone: onUserCreateSuccess,
  onError: onUserCreateFail
} = useMutation(
  gql`
    mutation ($input: UserInput!) {
      createUser(input: $input) {
        id
        email
        totpEnabled
      }
    }
  `,
  {
    variables: {
      input: newUser
    }
  }
)

onUserCreateSuccess(() => {
  closeModal()
  refetchUserList()
  newUser.email = ''
  newUser.password = ''
  toast.success(t('users.createSuccess'))
})

onUserCreateFail((err) => {
  toast.error(err.message)
})

// Delete user mutation
const {
  mutate: deleteUser,
  onDone: onUserDeleteSuccess,
  onError: onUserDeleteFail
} = useMutation(gql`
  mutation ($id: Uint!) {
    deleteUser(id: $id)
  }
`)

const deleteUserWithConfirmation = async (user) => {
  if (await askDeleteUserConfirm(t('users.deleteConfirm', { email: user.email }), 'danger')) {
    deleteUser({ id: user.id })
  }
}

onUserDeleteSuccess(() => {
  refetchUserList()
  toast.success(t('users.deleteSuccess'))
})

onUserDeleteFail((err) => {
  toast.error(err.message)
})

// User list query
const {
  result: userListResult,
  loading: isUserListLoading,
  refetch: refetchUserList,
  onError: onUserListFetchFailed
} = useQuery(
  gql`
    query {
      users {
        id
        email
        totpEnabled
      }
    }
  `,
  null,
  {
    pollInterval: 10000
  }
)
const users = computed(() => userListResult.value?.users)

onUserListFetchFailed((err) => {
  toast.error(err.message)
})

// TOTP Enable Related
const totpModalOpen = ref(false)
const enableTotpRequest = reactive({
  totpSecret: '',
  totpProvisioningUri: '',
  filledTotp: ''
})
const resetTotpRequest = () => {
  enableTotpRequest.totpSecret = ''
  enableTotpRequest.totpProvisioningUri = ''
  enableTotpRequest.filledTotp = ''
}
const closeTotpModal = () => {
  totpModalOpen.value = false
}

const {
  mutate: requestEnableTotp,
  loading: isRequestEnableTotpLoading,
  onDone: onRequestEnableTotpSuccess,
  onError: onRequestEnableTotpError
} = useMutation(gql`
  mutation {
    requestTotpEnable {
      totpSecret
      totpProvisioningUri
    }
  }
`)

onRequestEnableTotpSuccess((response) => {
  enableTotpRequest.totpSecret = response.data.requestTotpEnable.totpSecret
  enableTotpRequest.totpProvisioningUri = response.data.requestTotpEnable.totpProvisioningUri
  totpModalOpen.value = true
})

onRequestEnableTotpError((err) => {
  toast.error(err.message)
})

const requestEnableTotpWithConfirmation = async () => {
  if (await askEnableTotpConfirm(t('users.enableTotpConfirm'))) {
    resetTotpRequest()
    requestEnableTotp()
  }
}

const {
  mutate: enableTotpRaw,
  loading: isEnableTotpLoading,
  onDone: onEnableTotpSuccess,
  onError: onEnableTotpError
} = useMutation(gql`
  mutation ($totp: String!) {
    enableTotp(totp: $totp)
  }
`)

const enableTotp = () => {
  enableTotpRaw({ totp: enableTotpRequest.filledTotp })
}

onEnableTotpSuccess(() => {
  closeTotpModal()
  resetTotpRequest()
  toast.success(t('users.enableTotpSuccess'))
  refetchUserList()
})

onEnableTotpError((err) => {
  toast.error(err.message)
})

// Disable TOTP Related
const {
  mutate: disableTotpRaw,
  loading: isDisableTotpLoading,
  onDone: onDisableTotpSuccess,
  onError: onDisableTotpError
} = useMutation(gql`
  mutation {
    disableTotp
  }
`)

const disableTotpWithConfirmation = async () => {
  if (await askDisableTotpConfirm(t('users.disableTotpConfirm'), 'warning')) {
    disableTotpRaw()
  }
}

onDisableTotpSuccess((response) => {
  if (response.data.disableTotp) {
    toast.success(t('users.disableTotpSuccess'))
    refetchUserList()
  } else {
    toast.error(t('users.disableTotpFail'))
  }
})

onDisableTotpError((err) => {
  toast.error(err.message)
})
</script>

<template>
  <!-- Modal for totp -->
  <ModalDialog :close-modal="closeTotpModal" :is-open="totpModalOpen">
    <template v-slot:header>{{ $t('users.totp2fa') }}</template>
    <template v-slot:body>
      <div class="mt-6 flex flex-col items-center">
        <p class="font-medium">{{ $t('users.scanQr') }}</p>
        <VueQrcode class="my-4" :value="enableTotpRequest.totpProvisioningUri" />
        <p class="font-medium">{{ $t('users.orPasteSecret') }}</p>
        <Code :show-copy-button="false">{{ enableTotpRequest.totpSecret }}</Code>
      </div>
      <Divider />
      <div class="flex w-full flex-col items-center gap-4">
        <p class="font-medium">{{ $t('users.enterTotp') }}</p>
        <v-otp-input
          :num-inputs="6"
          input-classes="otp-input"
          :placeholder="['*', '*', '*', '*', '*', '*']"
          v-model:value="enableTotpRequest.filledTotp"
          @on-change="(v) => (enableTotpRequest.filledTotp = v)" />
      </div>
    </template>
    <template v-slot:footer>
      <FilledButton
        :click="enableTotp"
        :loading="isEnableTotpLoading"
        :disabled="enableTotpRequest.filledTotp.length !== 6"
        type="primary"
        class="w-full">
        {{ $t('users.verifyEnable') }}
      </FilledButton>
    </template>
  </ModalDialog>

  <section class="mx-auto w-full max-w-7xl">
    <!-- Modal for new user -->
    <ModalDialog :close-modal="closeModal" :is-open="isModalOpen">
      <template v-slot:header>{{ $t('users.createTitle') }}</template>
      <template v-slot:body>
        {{ $t('users.createHint') }}
        <form @submit.prevent="createUser">
          <!-- Email Field -->
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700" for="email"> {{ $t('common.email') }} </label>
            <div class="mt-1">
              <input
                id="email"
                v-model="newUser.email"
                autocomplete="email"
                class="block w-full rounded-md border-gray-300 shadow-xs focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                name="email"
                :placeholder="$t('common.email')"
                type="email" />
            </div>
          </div>
          <!-- Password Field -->
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700" for="password"> {{ $t('common.password') }} </label>
            <div class="mt-1">
              <input
                id="password"
                v-model="newUser.password"
                autocomplete="new-password"
                class="block w-full rounded-md border-gray-300 shadow-xs focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                name="password"
                :placeholder="$t('common.password')"
                type="password" />
            </div>
          </div>
        </form>
      </template>
      <template v-slot:footer>
        <FilledButton :click="createUser" :loading="isUserCreating" type="primary">{{ $t('common.create') }}</FilledButton>
      </template>
    </ModalDialog>

    <!-- Top Page bar   -->
    <PageBar>
      <template v-slot:title>{{ $t('users.title') }}</template>
      <template v-slot:subtitle>
        {{ $t('users.subtitle') }}
      </template>
      <template v-slot:buttons>
        <FilledButton :click="openModal" type="primary">
          <font-awesome-icon icon="fa-solid fa-plus" class="mr-2" />
          {{ $t('users.createUser') }}
        </FilledButton>
        <FilledButton type="ghost" :click="refetchUserList">
          <font-awesome-icon
            icon="fa-solid fa-arrows-rotate"
            :class="{
              'animate-spin ': isUserListLoading
            }" />&nbsp;&nbsp; {{ $t('common.refreshList') }}
        </FilledButton>
      </template>
    </PageBar>

    <!-- Tables -->
    <Table class="mt-8">
      <template v-slot:header>
        <TableHeader align="left">{{ $t('common.email') }}</TableHeader>
        <TableHeader align="center">{{ $t('common.status') }}</TableHeader>
        <TableHeader align="center">{{ $t('users.role') }}</TableHeader>
        <TableHeader align="center">{{ $t('users.twofa') }}</TableHeader>
        <TableHeader align="right">{{ $t('common.actions') }}</TableHeader>
      </template>
      <template v-slot:message>
        <TableMessage v-if="!users"> {{ $t('users.loadingUsers') }}</TableMessage>
        <TableMessage v-else-if="users.length === 0">
          {{ $t('users.noUsers') }}<br />
          {{ $t('users.clickCreate') }}
        </TableMessage>
      </template>
      <template v-slot:body>
        <UserListRow
          v-for="user in users"
          v-bind:key="user.id"
          :delete-user="deleteUserWithConfirmation"
          :user="user"
          :is-request-running-for-totp="isRequestEnableTotpLoading || isDisableTotpLoading"
          :enable-totp-current-user="requestEnableTotpWithConfirmation"
          :disable-totp-current-user="disableTotpWithConfirmation" />
      </template>
    </Table>

    <ConfirmDialog :is-open="isDeleteUserConfirmOpen" :message="deleteUserMessage" :confirm-type="deleteUserConfirmType" :on-confirm="onDeleteUserConfirm" :on-cancel="onDeleteUserCancel" />
    <ConfirmDialog :is-open="isEnableTotpConfirmOpen" :message="enableTotpMessage" :confirm-type="enableTotpConfirmType" :on-confirm="onEnableTotpConfirm" :on-cancel="onEnableTotpCancel" />
    <ConfirmDialog :is-open="isDisableTotpConfirmOpen" :message="disableTotpMessage" :confirm-type="disableTotpConfirmType" :on-confirm="onDisableTotpConfirm" :on-cancel="onDisableTotpCancel" />
  </section>
</template>
