<script setup>
import { useRouter } from 'vue-router'
import FilledButton from '@/views/components/FilledButton.vue'
import { useMutation } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { toast } from 'vue-sonner'
import { getHttpBaseUrl } from '@/vendor/utils.js'
import { useI18n } from 'vue-i18n'
import { useConfirmDialog } from '@/composables/useConfirmDialog.js'
import ConfirmDialog from '@/views/components/ConfirmDialog.vue'

const { t } = useI18n()
const router = useRouter()

const {
  isOpen: isRestartConfirmOpen,
  message: restartMessage,
  confirmType: restartConfirmType,
  confirm: askRestartConfirm,
  onConfirm: onRestartConfirm,
  onCancel: onRestartCancel
} = useConfirmDialog()

const {
  isOpen: isRebuildConfirmOpen,
  message: rebuildMessage,
  confirmType: rebuildConfirmType,
  confirm: askRebuildConfirm,
  onConfirm: onRebuildConfirm,
  onCancel: onRebuildCancel
} = useConfirmDialog()

// Restart Application
const {
  mutate: restartApplication,
  loading: restartApplicationLoading,
  onError: restartApplicationError,
  onDone: restartApplicationDone
} = useMutation(
  gql`
    mutation ($id: String!) {
      restartApplication(id: $id)
    }
  `,
  {
    fetchPolicy: 'no-cache',
    variables: {
      id: router.currentRoute.value.params.id
    }
  }
)

restartApplicationDone((result) => {
  if (result.data.restartApplication) {
    toast.success(t('applicationDetails.restartSuccess'))
  } else {
    toast.error(t('applicationDetails.somethingWentWrong'))
  }
})

restartApplicationError((error) => {
  toast.error(error.message)
})

const restartApplicationWithConfirmation = async () => {
  if (await askRestartConfirm(t('applicationDetails.restartConfirm'), 'warning')) {
    restartApplication()
  }
}

// Rebuild Application
const {
  mutate: rebuildApplication,
  loading: rebuildApplicationLoading,
  onError: rebuildApplicationError,
  onDone: rebuildApplicationDone
} = useMutation(
  gql`
    mutation ($id: String!) {
      rebuildApplication(id: $id)
    }
  `,
  {
    fetchPolicy: 'no-cache',
    variables: {
      id: router.currentRoute.value.params.id
    }
  }
)

rebuildApplicationDone((result) => {
  if (result.data.rebuildApplication) {
    toast.success(t('applicationDetails.rebuildSuccess'))
  } else {
    toast.error(t('applicationDetails.somethingWentWrong'))
  }
  router.push({
    name: 'Application Details Deployments',
    params: {
      id: router.currentRoute.value.params.id
    }
  })
})

rebuildApplicationError((error) => {
  toast.error(error.message)
})

const rebuildApplicationWithConfirmation = async () => {
  if (await askRebuildConfirm(t('applicationDetails.rebuildConfirm'), 'warning')) {
    rebuildApplication()
  }
}

const openWebConsole = () => {
  const height = window.innerHeight * 0.7
  const width = window.innerWidth * 0.6
  const url = `${getHttpBaseUrl()}/console?application=${router.currentRoute.value.params.id}`
  window.open(url, '', `popup,height=${height},width=${width}`)
}
</script>

<template>
  <div class="flex flex-col items-start">
    <div class="flex w-full flex-row items-center justify-between rounded-md p-2">
      <div>
        <p class="inline-flex items-center gap-2 text-lg font-medium">{{ $t('applicationDetails.sshInApplication') }}</p>
        <p class="text-sm text-secondary-700 dark:text-gray-400">{{ $t('applicationDetails.sshInApplicationHint') }}</p>
      </div>
      <FilledButton type="primary" @click="openWebConsole">
        <font-awesome-icon icon="fa-solid fa-terminal" class="mr-2" />
        {{ $t('applicationDetails.openConsole') }}
      </FilledButton>
    </div>
    <div class="flex w-full flex-row items-center justify-between rounded-md p-2">
      <div>
        <p class="inline-flex items-center gap-2 text-lg font-medium">{{ $t('applicationDetails.restartApplication') }}</p>
        <p class="text-sm text-secondary-700 dark:text-gray-400">
          {{ $t('applicationDetails.restartApplicationHint') }}
        </p>
      </div>
      <FilledButton type="primary" @click="restartApplicationWithConfirmation" :loading="restartApplicationLoading">
        <font-awesome-icon icon="fa-solid fa-rotate-right" class="mr-2" />
        {{ $t('applicationDetails.clickToRestart') }}
      </FilledButton>
    </div>

    <div class="flex w-full flex-row items-center justify-between rounded-md p-2">
      <div>
        <p class="inline-flex items-center gap-2 text-lg font-medium">{{ $t('applicationDetails.redeployApplication') }}</p>
        <p class="text-sm text-secondary-700 dark:text-gray-400">{{ $t('applicationDetails.redeployApplicationHint') }}</p>
      </div>
      <FilledButton type="primary" @click="rebuildApplicationWithConfirmation" :loading="rebuildApplicationLoading">
        <font-awesome-icon icon="fa-solid fa-hammer" class="mr-2" />
        {{ $t('applicationDetails.clickToRedeploy') }}
      </FilledButton>
    </div>
  </div>

  <ConfirmDialog :is-open="isRestartConfirmOpen" :message="restartMessage" :confirm-type="restartConfirmType" :on-confirm="onRestartConfirm" :on-cancel="onRestartCancel" />
  <ConfirmDialog :is-open="isRebuildConfirmOpen" :message="rebuildMessage" :confirm-type="rebuildConfirmType" :on-confirm="onRebuildConfirm" :on-cancel="onRebuildCancel" />
</template>

<style scoped></style>
