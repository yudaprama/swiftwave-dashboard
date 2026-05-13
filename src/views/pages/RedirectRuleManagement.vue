<script setup>
import PageBar from '@/views/components/PageBar.vue'
import FilledButton from '@/views/components/FilledButton.vue'
import { toast } from 'vue-sonner'
import { useMutation, useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import Table from '@/views/components/Table/Table.vue'
import TableHeader from '@/views/components/Table/TableHeader.vue'
import TableMessage from '@/views/components/Table/TableMessage.vue'
import TableRow from '@/views/components/Table/TableRow.vue'
import { computed, reactive, ref } from 'vue'
import TextButton from '@/views/components/TextButton.vue'
import ModalDialog from '@/views/components/ModalDialog.vue'
import Badge from '@/views/components/Badge.vue'
import CreateDomainModal from '@/views/partials/CreateDomainModal.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const isModalOpen = ref(false)
const openModal = () => {
  isModalOpen.value = true
}
const closeModal = () => {
  isModalOpen.value = false
}

// Create redirect rule
const newRedirectRuleDetails = reactive({
  domainId: 0,
  protocol: 'http',
  redirectURL: ''
})

const {
  mutate: createRedirectRule,
  loading: isRedirectRuleCreating,
  onDone: onRedirectRuleCreateSuccess,
  onError: onRedirectRuleCreateFail
} = useMutation(
  gql`
    mutation ($input: RedirectRuleInput!) {
      createRedirectRule(input: $input) {
        id
      }
    }
  `,
  {
    variables: {
      input: newRedirectRuleDetails
    }
  }
)

onRedirectRuleCreateSuccess(() => {
  closeModal()
  newRedirectRuleDetails.name = ''
  refetchRedirectRules()
})

onRedirectRuleCreateFail((err) => {
  toast.error(err.message)
})

// Fetch domains from the server
const { result: domainListResult, refetch: refetchDomains } = useQuery(
  gql`
    query {
      domains {
        id
        name
      }
    }
  `,
  null,
  {
    pollInterval: 10000
  }
)
const domains = computed(() => domainListResult.value?.domains ?? [])

// Delete redirect rule
const {
  mutate: deleteRedirectRule,
  onDone: onRedirectDeleteSuccess,
  onError: onRedirectRuleDeleteFail
} = useMutation(
  gql`
    mutation ($id: Uint!) {
      deleteRedirectRule(id: $id)
    }
  `,
  {
    variables: {
      id: 0
    }
  }
)

const deleteRedirectRulesWithConfirmation = (redirect_rules) => {
  if (confirm(t('redirectRules.deleteConfirm'))) {
    deleteRedirectRule({
      id: redirect_rules.id
    })
  }
}

onRedirectDeleteSuccess(() => {
  toast.success(t('redirectRules.deleteSuccess'))
  refetchRedirectRules()
})

onRedirectRuleDeleteFail((err) => {
  toast.error(err.message)
})

// Fetch redirect rules
const {
  result: redirectRulesRaw,
  refetch: refetchRedirectRules,
  loading: isRedirectRulesLoading,
  onError: onRedirectRulesError
} = useQuery(
  gql`
    query {
      redirectRules {
        id
        domain {
          name
        }
        protocol
        redirectURL
        status
      }
    }
  `,
  null,
  {
    pollInterval: 10000
  }
)

const redirectRules = computed(() => redirectRulesRaw.value?.redirectRules ?? [])

onRedirectRulesError((err) => {
  toast.error(err.message)
})

const redirectRuleFrontURL = (redirectRule) => {
  return `${redirectRule.protocol}://${redirectRule.domain.name}`
}

// Create Domain
const createDomainModalRef = ref(null)
const openNewDomainModal = () => {
  if (!createDomainModalRef.value?.openModal) return
  isModalOpen.value = false
  createDomainModalRef.value.openModal()
}

const openRedirectRuleRegistrationModal = () => {
  isModalOpen.value = true
}
</script>

<template>
  <CreateDomainModal
    ref="createDomainModalRef"
    :callback-on-create="refetchDomains"
    :callback-on-pop="openRedirectRuleRegistrationModal" />
  <section class="mx-auto w-full max-w-7xl">
    <!-- Modal for create redirect rules -->
    <ModalDialog :close-modal="closeModal" :is-open="isModalOpen">
      <template v-slot:header>{{ $t('redirectRules.createTitle') }}</template>
      <template v-slot:body>
        {{ $t('redirectRules.createHint') }}
        <form @submit.prevent="createRedirectRule">
          <!-- Domains -->
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700" for="domain">{{ $t('redirectRules.selectDomainProtocol') }}</label>
            <div class="mt-2 flex space-x-2">
              <select
                class="block w-4/12 rounded-md border-gray-300 shadow-xs focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                v-model="newRedirectRuleDetails.protocol">
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
              </select>
              <select
                id="domain"
                v-model="newRedirectRuleDetails.domainId"
                class="block w-full rounded-md border-gray-300 shadow-xs focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                <option value="0">{{ $t('redirectRules.selectDomain') }}</option>
                <option v-for="domain in domains" :key="domain.id" :value="domain.id">{{ domain.name }}</option>
              </select>
            </div>
            <p class="mt-2 flex items-center text-sm">
              {{ $t('redirectRules.needDomain') }}
              <a @click="openNewDomainModal" class="ml-1.5 cursor-pointer font-bold text-primary-600"
                >{{ $t('redirectRules.registerNewDomain') }}</a
              >
            </p>
          </div>

          <!--  Redirected URL   -->
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700" for="name">{{ $t('redirectRules.redirectedUrl') }}</label>
            <div class="mt-1">
              <input
                id="name"
                v-model="newRedirectRuleDetails.redirectURL"
                autocomplete="off"
                class="block w-full rounded-md border-gray-300 shadow-xs focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                name="name"
                :placeholder="$t('redirectRules.redirectedUrlPlaceholder')"
                type="text" />
            </div>
          </div>
        </form>
      </template>
      <template v-slot:footer>
        <FilledButton :click="createRedirectRule" :loading="isRedirectRuleCreating" type="primary"
          >{{ $t('redirectRules.register') }}
        </FilledButton>
      </template>
    </ModalDialog>

    <!-- Top Page bar   -->
    <PageBar>
      <template v-slot:title>{{ $t('redirectRules.title') }}</template>
      <template v-slot:subtitle>{{ $t('redirectRules.subtitle') }}</template>
      <template v-slot:buttons>
        <FilledButton :click="openModal" type="primary">
          <font-awesome-icon icon="fa-solid fa-plus" class="mr-2" />
          {{ $t('common.addNew') }}
        </FilledButton>
        <FilledButton type="ghost" :click="refetchRedirectRules">
          <font-awesome-icon
            icon="fa-solid fa-arrows-rotate"
            :class="{
              'animate-spin ': isRedirectRulesLoading
            }" />&nbsp;&nbsp; {{ $t('common.refreshList') }}
        </FilledButton>
      </template>
    </PageBar>

    <!-- Table -->
    <Table class="mt-8">
      <template v-slot:header>
        <TableHeader align="left">ID</TableHeader>
        <TableHeader align="center">{{ $t('common.status') }}</TableHeader>
        <TableHeader align="center">{{ $t('redirectRules.rule') }}</TableHeader>
        <TableHeader align="right">{{ $t('common.actions') }}</TableHeader>
      </template>
      <template v-slot:message>
        <TableMessage v-if="redirectRules.length === 0">
          {{ $t('redirectRules.noRules') }}<br />
          {{ $t('redirectRules.clickAdd') }}
        </TableMessage>
      </template>
      <template v-slot:body>
        <tr v-for="redirectRule in redirectRules" :key="redirectRule.id">
          <TableRow align="left">
            <div class="text-sm font-medium text-gray-900">{{ redirectRule.id }}</div>
          </TableRow>
          <TableRow align="center">
            <Badge v-if="redirectRule.status === 'pending'" type="warning">{{ $t('redirectRules.pending') }}</Badge>
            <Badge v-else-if="redirectRule.status === 'applied'" type="success">{{ $t('redirectRules.applied') }}</Badge>
            <Badge v-else-if="redirectRule.status === 'failed'" type="danger">{{ $t('redirectRules.failed') }}</Badge>
            <Badge v-else-if="redirectRule.status === 'deleting'" type="danger">{{ $t('redirectRules.deleting') }}</Badge>
          </TableRow>
          <TableRow align="center">
            <div class="text-sm text-gray-900">
              <a :href="redirectRuleFrontURL(redirectRule)" target="_blank">{{ redirectRuleFrontURL(redirectRule) }}</a
              >&nbsp;&nbsp; <font-awesome-icon icon="fa-solid fa-arrow-right" />&nbsp;&nbsp;
              <a :href="redirectRule.redirectURL" target="_blank">{{ redirectRule.redirectURL }}</a>
            </div>
          </TableRow>
          <TableRow align="right">
            <TextButton :click="() => deleteRedirectRulesWithConfirmation(redirectRule)" type="danger"
              >{{ $t('common.delete') }}
            </TextButton>
          </TableRow>
        </tr>
      </template>
    </Table>
  </section>
</template>

<style scoped></style>
