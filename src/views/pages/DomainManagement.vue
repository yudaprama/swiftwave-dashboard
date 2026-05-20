<script setup>
import PageBar from '@/views/components/PageBar.vue';
import FilledButton from '@/views/components/FilledButton.vue';
import { useLazyQuery, useMutation, useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { computed, ref } from 'vue';
import { toast } from 'vue-sonner'
import { useI18n } from 'vue-i18n'
import { useConfirmDialog } from '@/composables/useConfirmDialog.js'
import ConfirmDialog from '@/views/components/ConfirmDialog.vue'
import TableMessage from '@/views/components/Table/TableMessage.vue';
import Table from '@/views/components/Table/Table.vue';
import TableHeader from '@/views/components/Table/TableHeader.vue';
import ModalDialog from '@/views/components/ModalDialog.vue';
import DomainListRow from '@/views/partials/DomainListRow.vue';
import Disclosure from '@/views/components/Disclosure.vue';
import moment from 'moment';
import CreateDomainModal from '@/views/partials/CreateDomainModal.vue';
import DomainIssueSSLModal from '../partials/DomainIssueSSLModal.vue';

const { t } = useI18n()
const { isOpen: isDeleteDomainConfirmOpen, message: deleteDomainMessage, confirmType: deleteDomainType, confirm: askDeleteDomain, onConfirm: onDeleteDomainConfirm, onCancel: onDeleteDomainCancel } = useConfirmDialog()

const isDetailsModalOpen = ref(false);
const openDetailsModal = () => {
    isDetailsModalOpen.value = true;
};
const closeDetailsModal = () => {
    isDetailsModalOpen.value = false;
};

// Fetch domains from the server
const {
    result: domainListResult,
    refetch: refetchDomainList,
    loading: isDomainListLoading,
    onError: onDomainListError
} = useQuery(
    gql`
    query {
      domains {
        id
        name
        sslStatus
        sslIssuer
        sslAutoRenew
      }
    }
  `,
    null,
    {
        pollInterval: 10000
    }
);
const domains = computed(() => domainListResult.value?.domains ?? []);

onDomainListError(() => {
    toast.error(t('domains.fetchFail'));
});

// Delete domain
const {
    mutate: deleteDomain,
    onError: onDomainDeleteError,
    onDone: onDomainDeleteDone
} = useMutation(gql`
  mutation ($id: Uint!) {
    removeDomain(id: $id)
  }
`);

const deleteDomainWithConfirmation = async (domain) => {
    if (await askDeleteDomain(t('domains.deleteConfirm'), 'danger')) {
        deleteDomain({ id: domain.id });
    }
};

onDomainDeleteDone(() => {
    toast.success(t('domains.deleteSuccess'));
    refetchDomainList();
});

onDomainDeleteError((err) => {
    toast.error(err.message);
});

// View SSL Details
const {
    result: viewSslDetailsResultRaw,
    load: viewSslDetails,
    refetch: refetchSslDetails,
    onResult: onSslDetailsResult,
    variables: viewSslDetailsVars
} = useLazyQuery(
    gql`
    query ($id: Uint!) {
      domain(id: $id) {
        sslStatus
        sslIssuer
        sslIssuedAt
        sslFullChain
        sslPrivateKey
      }
    }
  `,
    {
        variables: {
            id: 0
        }
    },
    {
        fetchPolicy: 'no-cache',
        nextFetchPolicy: 'no-cache'
    }
);

const viewSslDetailsResult = computed(() => viewSslDetailsResultRaw.value?.domain ?? {});
const sslDetailsIssuedAt = computed(() => {
    if (!viewSslDetailsResultRaw.value?.domain ?? '') {
        return '';
    }
    if (viewSslDetailsResultRaw.value?.domain) {
        return moment(viewSslDetailsResultRaw.value?.domain.sslIssuedAt).format('YYYY-MM-DD HH:mm:ss');
    }
    return '';
});

onSslDetailsResult(() => {
    openDetailsModal();
});

const viewDomainSSLDetails = async (domain_id) => {
    viewSslDetailsVars.value.id = domain_id;
    let res = await viewSslDetails();
    if (res === false) await refetchSslDetails();
};

// Verify DNS
const {
    result: verifyDnsResult,
    load: verifyDns,
    refetch: refetchVerifyDns,
    variables: verifyDnsVars
} = useLazyQuery(
    gql`
    query ($name: String!) {
      verifyDomainConfiguration(name: $name)
    }
  `,
    {
        variables: {
            name: ''
        }
    },
    {
        fetchPolicy: 'no-cache',
        nextFetchPolicy: 'no-cache'
    }
);

const verifyDomainDNS = async (domain_name) => {
    verifyDnsVars.value.name = domain_name;
    const response = verifyDns();
    if ((typeof response) == 'boolean') {
        const result = await refetchVerifyDns({
            variables: {
                name: domain_name
            }
        });
        return result.data.verifyDomainConfiguration;
    } else {
        const result = await response;
        return result.verifyDomainConfiguration;
    }
};

// Create Domain
const createDomainModal = ref(null);
const openNewDomainModal = computed(() => createDomainModal.value?.openModal ?? (() => { }));

// Issue SSL
const issueSSLModal = ref(null);
const openIssueSSLModal = computed(() => issueSSLModal.value?.openModal ?? (() => { }));
</script>

<template>
    <section class="mx-auto w-full max-w-7xl">
        <!-- Modal for add domain -->
        <CreateDomainModal :callback-on-create="refetchDomainList" ref="createDomainModal" />
        <!-- Modal for issuing domain -->
        <DomainIssueSSLModal :callback-on-pop="refetchDomainList" ref="issueSSLModal" />
        <!-- Modal for show ssl details domain -->
        <ModalDialog :close-modal="closeDetailsModal" :is-open="isDetailsModalOpen">
            <template v-slot:header>{{ $t('domains.sslDetailsTitle') }}</template>
            <template v-slot:body>
                <div>
                    <p class="mt-0.5"><b>{{ $t('domains.sslStatus') }}</b> {{ (viewSslDetailsResult?.sslStatus ?? '').toUpperCase() }}
                    </p>
                    <p class="mt-0.5"><b>{{ $t('domains.sslIssuedBy') }}</b> {{ viewSslDetailsResult.sslIssuer }}</p>
                    <p class="mt-0.5"><b>{{ $t('domains.sslIssuedAt') }}</b> {{ sslDetailsIssuedAt }}</p>
                    <Disclosure class="mt-4">
                        <template v-slot:title>{{ $t('domains.sslFullChain') }}</template>
                        <template v-slot:body>
                            <textarea class="mt-2 w-full rounded-lg border-gray-200 align-top shadow-xs sm:text-sm"
                                readonly rows="5" v-bind:value="viewSslDetailsResult.sslFullChain"></textarea>
                        </template>
                    </Disclosure>
                    <Disclosure class="mt-3">
                        <template v-slot:title>{{ $t('domains.sslPrivateKey') }}</template>
                        <template v-slot:body>
                            <textarea class="mt-2 w-full rounded-lg border-gray-200 align-top shadow-xs sm:text-sm"
                                readonly rows="5" v-bind:value="viewSslDetailsResult.sslPrivateKey"></textarea>
                        </template>
                    </Disclosure>
                </div>
            </template>
        </ModalDialog>

        <!-- Top Page bar   -->
        <PageBar>
            <template v-slot:title>{{ $t('domains.title') }}</template>
            <template v-slot:subtitle>{{ $t('domains.subtitle') }}</template>
            <template v-slot:buttons>
                <FilledButton :click="openNewDomainModal" type="primary">
                    <font-awesome-icon icon="fa-solid fa-plus" class="mr-2" />
                    {{ $t('domains.registerNew') }}
                </FilledButton>
                <FilledButton type="ghost" :click="refetchDomainList">
                    <font-awesome-icon icon="fa-solid fa-arrows-rotate" :class="{
                        'animate-spin ': isDomainListLoading
                    }" />&nbsp;&nbsp; {{ $t('common.refreshList') }}
                </FilledButton>
            </template>
        </PageBar>

        <!-- Table -->
        <Table class="mt-8">
            <template v-slot:header>
                <TableHeader align="left">{{ $t('domains.domainName') }}</TableHeader>
                <TableHeader align="center">{{ $t('domains.sslStatusCol') }}</TableHeader>
                <TableHeader align="center">{{ $t('domains.sslDetailsCol') }}</TableHeader>
                <TableHeader align="center">{{ $t('domains.sslIssuerCol') }}</TableHeader>
                <TableHeader align="center">{{ $t('domains.issueSsl') }}</TableHeader>
                <TableHeader align="center">{{ $t('domains.sslAutoRenew') }}</TableHeader>
                <TableHeader align="center">{{ $t('domains.verifyDns') }}</TableHeader>
                <TableHeader align="right">{{ $t('common.actions') }}</TableHeader>
            </template>
            <template v-slot:message>
                <TableMessage v-if="domains.length === 0">
                    {{ $t('domains.noDomains') }}<br />
                    {{ $t('domains.clickRegister') }}
                </TableMessage>
            </template>
            <template v-slot:body>
                <DomainListRow v-for="domain in domains" v-bind:key="domain.id"
                    :delete-domain="deleteDomainWithConfirmation" :domain="domain"
                    :issue-ssl="() => openIssueSSLModal(domain.id)" :verify-dns="verifyDomainDNS"
                    :view-ssl="viewDomainSSLDetails" />
            </template>
        </Table>
    </section>
    <ConfirmDialog :is-open="isDeleteDomainConfirmOpen" :message="deleteDomainMessage" :confirm-type="deleteDomainType" :on-confirm="onDeleteDomainConfirm" :on-cancel="onDeleteDomainCancel" />
</template>

<style scoped>
textarea::-webkit-scrollbar {
    width: 0.5em;
}

textarea::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
}

textarea::-webkit-scrollbar-thumb {
    background-color: darkgrey;
    outline: 1px solid slategrey;
    border-radius: 15px;
}
</style>
