<script setup>
import PageBar from '@/views/components/PageBar.vue'
import FilledButton from '@/views/components/FilledButton.vue'
import { toast } from 'vue-sonner'
import { computed, ref } from 'vue'
import Table from '@/views/components/Table/Table.vue'
import TableHeader from '@/views/components/Table/TableHeader.vue'
import gql from 'graphql-tag'
import { useMutation, useQuery } from '@vue/apollo-composable'
import GitCredentialListRow from '@/views/partials/GitCredentialListRow.vue'
import TableMessage from '@/views/components/Table/TableMessage.vue'
import CreateGitCredentialModal from '@/views/partials/CreateGitCredentialModal.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Create Git Credential
const createGitCredentialModalRef = ref(null)
const openCreateGitCredentialModal = computed(() => createGitCredentialModalRef.value?.openModal ?? (() => {}))

// Delete Git Credential mutation
const {
  mutate: deleteGitCredential,
  onError: onGitCredentialDeleteError,
  onDone: onGitCredentialDeleteSuccess
} = useMutation(
  gql`
    mutation ($id: Uint!) {
      deleteGitCredential(id: $id)
    }
  `,
  {
    variables: {
      id: ''
    }
  }
)

onGitCredentialDeleteError((err) => {
  toast.error(err.message)
})

onGitCredentialDeleteSuccess(() => {
  refetchGitCredentialList()
  toast.success(t('gitCreds.deleteSuccess'))
})

const deleteGitCredentialWithConfirmation = (gitCredential) => {
  if (
    confirm(
      t('gitCreds.deleteConfirm', { name: gitCredential.name })
    )
  ) {
    deleteGitCredential({ id: gitCredential.id })
  }
}

// List Git Credentials query
const {
  result: gitCredentialList,
  refetch: refetchGitCredentialList,
  loading: isGitCredentialListLoading,
  onError: onGitCredentialListError
} = useQuery(
  gql`
    query {
      gitCredentials {
        id
        name
        type
      }
    }
  `,
  null,
  {
    pollInterval: 30000
  }
)
const gitCredentials = computed(() => gitCredentialList.value?.gitCredentials ?? [])

onGitCredentialListError((err) => {
  toast.error(err.message)
})
</script>

<template>
  <section class="mx-auto w-full max-w-7xl">
    <!-- Modal for create -->
    <CreateGitCredentialModal ref="createGitCredentialModalRef" :callback-on-create="refetchGitCredentialList" />
    <!-- Top Page bar   -->
    <PageBar>
      <template v-slot:title>{{ $t('gitCreds.title') }}</template>
      <template v-slot:subtitle>{{ $t('gitCreds.subtitle') }}</template>
      <template v-slot:buttons>
        <FilledButton :click="openCreateGitCredentialModal" type="primary">
          <font-awesome-icon icon="fa-solid fa-plus" class="mr-2" />
          {{ $t('common.addNew') }}
        </FilledButton>
        <FilledButton type="ghost" :click="refetchGitCredentialList">
          <font-awesome-icon
            icon="fa-solid fa-arrows-rotate"
            :class="{
              'animate-spin ': isGitCredentialListLoading
            }" />&nbsp;&nbsp; {{ $t('common.refreshList') }}
        </FilledButton>
      </template>
    </PageBar>

    <!-- Table -->
    <Table class="mt-8">
      <template v-slot:header>
        <TableHeader align="left">{{ $t('gitCreds.identifierName') }}</TableHeader>
        <TableHeader align="center">{{ $t('gitCreds.type') }}</TableHeader>
        <TableHeader align="center">{{ $t('gitCreds.showDetails') }}</TableHeader>
        <TableHeader align="center">{{ $t('gitCreds.editDetails') }}</TableHeader>
        <TableHeader align="right">{{ $t('common.actions') }}</TableHeader>
      </template>
      <template v-if="gitCredentials.length === 0" v-slot:message>
        <TableMessage>
          {{ $t('gitCreds.noCredentials') }}<br />
          {{ $t('gitCreds.clickAdd') }}
        </TableMessage>
      </template>
      <template v-slot:body>
        <GitCredentialListRow
          v-for="gitCredential in gitCredentials"
          v-bind:key="gitCredential.id"
          :delete-git-credential="deleteGitCredentialWithConfirmation"
          :git-credential="gitCredential"
          :on-update-git-credential="refetchGitCredentialList" />
      </template>
    </Table>
  </section>
</template>

<style scoped></style>
