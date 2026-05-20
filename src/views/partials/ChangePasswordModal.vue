<script setup>

import FilledButton from '@/views/components/FilledButton.vue'
import ModalDialog from '@/views/components/ModalDialog.vue'
import { onMounted, reactive } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { toast } from 'vue-sonner'
import { useI18n } from 'vue-i18n'


const props = defineProps({
  isModalOpen: {
    type: Boolean,
    required: true
  },
  closeModal: {
    type: Function,
    required: true
  }
})

const { t } = useI18n()
const passwordDetails = reactive({
  newPassword: '',
  oldPassword: ''
})
const resetPasswordDetails = () => {
  passwordDetails.newPassword = ''
  passwordDetails.oldPassword = ''
}

onMounted(() => resetPasswordDetails())

const {
  mutate: changePassword,
  loading: isChangingPassword,
  onError: onPasswordChangeFail,
  onDone: onPasswordChangeSuccess
} = useMutation(gql`
mutation ($input: PasswordUpdateInput) {
  changePassword(input: $input)
}`, {
  fetchPolicy: 'no-cache',
  variables: {
    input: passwordDetails
  }
})

onPasswordChangeSuccess((e) => {
  if (e.data.changePassword === true) {
    toast.success(t('changePassword.success'))
    props.closeModal()
  } else {
    toast.error(t('changePassword.error'))
  }
  resetPasswordDetails()
})

onPasswordChangeFail((error) => {
  toast.error(error.message)
  resetPasswordDetails()
})

</script>

<template>
  <Teleport to="body">
    <ModalDialog
      :close-modal="closeModal"
      :is-open="isModalOpen">
      <template v-slot:header>
        {{ $t('changePassword.title') }}
      </template>
      <template v-slot:body>
        {{ $t('changePassword.hint') }}
        <form @submit.prevent="changePassword">
          <!-- Username Field -->
          <div class="mt-4">
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              for="oldPassword">
              {{ $t('partials.oldPassword') }}
            </label>
            <div class="mt-1">
              <input
                id="oldPassword"
                v-model="passwordDetails.oldPassword"
                autocomplete="off"
                class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-secondary-800 shadow-xs focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                :placeholder="$t('partials.oldPasswordPlaceholder')"
                type="password" />
            </div>
          </div>
          <!-- Password Field -->
          <div class="mt-4">
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              for="newPassword">
              {{ $t('partials.newPassword') }}
            </label>
            <div class="mt-1">
              <input
                id="newPassword"
                v-model="passwordDetails.newPassword"
                autocomplete="off"
                class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-secondary-800 shadow-xs focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                :placeholder="$t('partials.newPasswordPlaceholder')"
                type="password" />
            </div>
          </div>
        </form>
      </template>
      <template v-slot:footer>
        <FilledButton
          :click="changePassword"
          :loading="isChangingPassword"
          type="primary"
        >{{ $t('changePassword.title') }}
        </FilledButton>
      </template>
    </ModalDialog>
  </Teleport>
</template>

<style scoped>

</style>