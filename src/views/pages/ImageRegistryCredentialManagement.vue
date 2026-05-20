<script setup>
import PageBar from '@/views/components/PageBar.vue'
import FilledButton from '@/views/components/FilledButton.vue'
import { toast } from 'vue-sonner'
import { computed, ref } from 'vue'
import Table from '@/views/components/Table/Table.vue'
import TableHeader from '@/views/components/Table/TableHeader.vue'
import gql from 'graphql-tag'
import { useMutation, useQuery } from '@vue/apollo-composable'
import TableMessage from '@/views/components/Table/TableMessage.vue'
import ImageRegistryCredentialListRow from '@/views/partials/ImageRegistryCredentialListRow.vue'
import CreateImageRegistryCredentialModal from '@/views/partials/CreateImageRegistryCredentialModal.vue'
import { useI18n } from 'vue-i18n'
import { useConfirmDialog } from '@/composables/useConfirmDialog.js'
import ConfirmDialog from '@/views/components/ConfirmDialog.vue'

const { t } = useI18n()
const { isOpen: isDeleteImageCredConfirmOpen, message: deleteImageCredMessage, confirmType: deleteImageCredType, confirm: askDeleteImageCred, onConfirm: onDeleteImageCredConfirm, onCancel: onDeleteImageCredCancel } = useConfirmDialog()

// Create Image Registry Credential
const createImageRegistryCredentialModalRef = ref(null)
const openCreateImageRegistryCredentialModal = computed(
  () => createImageRegistryCredentialModalRef.value?.openModal ?? (() => {})
)

// Delete Image Registry Credential mutation
const {
  mutate: deleteImageRegistryCredential,
  onError: onImageRegistryCredentialDeleteError,
  onDone: onImageRegistryCredentialDeleteSuccess
} = useMutation(
  gql`
    mutation ($id: Uint!) {
      deleteImageRegistryCredential(id: $id)
    }
  `,
  {
    variables: {
      id: ''
    }
  }
)

onImageRegistryCredentialDeleteError((err) => {
  toast.error(err.message)
})

onImageRegistryCredentialDeleteSuccess(() => {
  refetchImageRegistryCredentialList()
  toast.success(t('registryCreds.deleteSuccess'))
})

const deleteImageRegistryCredentialWithConfirmation = async (imageRegistryCredential) => {
  if (await askDeleteImageCred(t('registryCreds.deleteConfirm'), 'danger')) {
    deleteImageRegistryCredential({ id: imageRegistryCredential.id })
  }
}

// List Image Registry Credentials query
const {
  result: imageRegistryCredentialList,
  refetch: refetchImageRegistryCredentialList,
  loading: isImageRegistryCredentialListLoading,
  onError: onImageRegistryCredentialListError
} = useQuery(
  gql`
    query {
      imageRegistryCredentials {
        id
        url
        username
        password
      }
    }
  `,
  null,
  {
    pollInterval: 30000
  }
)
const imageRegistryCredentials = computed(() => imageRegistryCredentialList.value?.imageRegistryCredentials ?? [])

onImageRegistryCredentialListError((err) => {
  toast.error(err.message)
})
</script>

<template>
  <section class="mx-auto w-full max-w-7xl">
    <!-- Modal for create -->
    <CreateImageRegistryCredentialModal
      ref="createImageRegistryCredentialModalRef"
      :callback-on-create="refetchImageRegistryCredentialList" />

    <!-- Top Page bar   -->
    <PageBar>
      <template v-slot:title>{{ $t('registryCreds.title') }}</template>
      <template v-slot:subtitle>{{ $t('registryCreds.subtitle') }}</template>
      <template v-slot:buttons>
        <FilledButton :click="openCreateImageRegistryCredentialModal" type="primary">
          <font-awesome-icon icon="fa-solid fa-plus" class="mr-2" />
          {{ $t('common.addNew') }}
        </FilledButton>
        <FilledButton type="ghost" :click="refetchImageRegistryCredentialList">
          <font-awesome-icon
            icon="fa-solid fa-arrows-rotate"
            :class="{
              'animate-spin ': isImageRegistryCredentialListLoading
            }" />&nbsp;&nbsp; {{ $t('common.refreshList') }}
        </FilledButton>
      </template>
    </PageBar>

    <!-- Table -->
    <Table class="mt-8">
      <template v-slot:header>
        <TableHeader align="left">{{ $t('registryCreds.url') }}</TableHeader>
        <TableHeader align="center">{{ $t('common.username') }}</TableHeader>
        <TableHeader align="center">{{ $t('common.password') }}</TableHeader>
        <TableHeader align="center">{{ $t('registryCreds.editDetails') }}</TableHeader>
        <TableHeader align="right">{{ $t('common.actions') }}</TableHeader>
      </template>
      <template v-if="imageRegistryCredentials.length === 0" v-slot:message>
        <TableMessage>
          {{ $t('registryCreds.noCredentials') }}<br />
          {{ $t('registryCreds.clickAdd') }}
        </TableMessage>
      </template>
      <template v-slot:body>
        <ImageRegistryCredentialListRow
          v-for="imageRegistryCredential in imageRegistryCredentials"
          v-bind:key="imageRegistryCredential.id"
          :delete-image-registry-credential="deleteImageRegistryCredentialWithConfirmation"
          :image-registry-credential="imageRegistryCredential"
          :on-update-image-registry-credential="refetchImageRegistryCredentialList" />
      </template>
    </Table>
  </section>
  <ConfirmDialog :is-open="isDeleteImageCredConfirmOpen" :message="deleteImageCredMessage" :confirm-type="deleteImageCredType" :on-confirm="onDeleteImageCredConfirm" :on-cancel="onDeleteImageCredCancel" />
</template>

<style scoped></style>
