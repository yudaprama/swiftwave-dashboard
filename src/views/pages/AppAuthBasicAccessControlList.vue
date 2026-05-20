<script setup>
import FilledButton from '@/views/components/FilledButton.vue';
import PageBar from '@/views/components/PageBar.vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import { computed, reactive, ref, watch } from 'vue';

const { t } = useI18n();

import Table from '@/views/components/Table/Table.vue';
import TableHeader from '@/views/components/Table/TableHeader.vue';
import TableMessage from '@/views/components/Table/TableMessage.vue';
import TableRow from '@/views/components/Table/TableRow.vue';
import TextButton from '@/views/components/TextButton.vue';
import ModalDialog from '@/views/components/ModalDialog.vue';
import { preventSpaceInput } from '@/vendor/utils.js';
import { useConfirmDialog } from '@/composables/useConfirmDialog.js';
import ConfirmDialog from '@/views/components/ConfirmDialog.vue';

const {
  isOpen: isAddAclConfirmOpen,
  message: addAclMessage,
  confirmType: addAclConfirmType,
  confirm: askAddAclConfirm,
  onConfirm: onAddAclConfirm,
  onCancel: onAddAclCancel
} = useConfirmDialog();

const {
  isOpen: isDeleteAclConfirmOpen,
  message: deleteAclMessage,
  confirmType: deleteAclConfirmType,
  confirm: askDeleteAclConfirm,
  onConfirm: onDeleteAclConfirm,
  onCancel: onDeleteAclCancel
} = useConfirmDialog();

const {
  isOpen: isAddUserConfirmOpen,
  message: addUserMessage,
  confirmType: addUserConfirmType,
  confirm: askAddUserConfirm,
  onConfirm: onAddUserConfirm,
  onCancel: onAddUserCancel
} = useConfirmDialog();

const {
  isOpen: isDeleteUserConfirmOpen,
  message: deleteUserMessage,
  confirmType: deleteUserConfirmType,
  confirm: askDeleteUserConfirm,
  onConfirm: onDeleteUserConfirm,
  onCancel: onDeleteUserCancel
} = useConfirmDialog();

const {
  isOpen: isChangePasswordConfirmOpen,
  message: changePasswordMessage,
  confirmType: changePasswordConfirmType,
  confirm: askChangePasswordConfirm,
  onConfirm: onChangePasswordConfirm,
  onCancel: onChangePasswordCancel
} = useConfirmDialog();

const {
  result: appBasicAuthAccessControlListsRaw,
  loading: isAppBasicAuthAccessControlListsLoading,
  onError: onAppBasicAuthAccessControlListsError,
  refetch: refetchAppBasicAuthAccessControlLists
} = useQuery(
  gql`
    query {
      appBasicAuthAccessControlLists {
        id
        name
        users {
          id
          username
        }
      }
    }
  `,
  null,
  {
    pollInterval: 30000
  }
);

const appBasicAuthAccessControlLists = computed(
  () => appBasicAuthAccessControlListsRaw.value?.appBasicAuthAccessControlLists ?? []
);

onAppBasicAuthAccessControlListsError((err) => {
  toast.error(err.message);
});

// add user list
const isAddAccessControlListModalOpen = ref(false);

const openAddAccessControlListModal = () => {
  isAddAccessControlListModalOpen.value = true;
};

const closeAddAccessControlListModal = () => {
  isAddAccessControlListModalOpen.value = false;
};

const newACLName = ref('');

watch(isAddAccessControlListModalOpen, () => {
  newACLName.value = '';
});

const {
  mutate: addAccessControlListRaw,
  loading: isAddAccessControlListLoading,
  onError: onAddAccessControlListError,
  onDone: onAddAccessControlListDone
} = useMutation(gql`
  mutation createAppBasicAuthAccessControlList($input: AppBasicAuthAccessControlListInput!) {
    createAppBasicAuthAccessControlList(input: $input) {
      id
    }
  }
`);

const addAccessControlList = async () => {
  if (!(await askAddAclConfirm(t('appAuth.operationWaitConfirm')))) {
    return;
  }
  addAccessControlListRaw({
    input: {
      name: newACLName.value
    }
  });
};

onAddAccessControlListError((err) => {
  toast.error(err.message);
});

onAddAccessControlListDone(() => {
  toast.success(t('appAuth.aclAddedSuccess'));
  refetchAppBasicAuthAccessControlLists();
  isAddAccessControlListModalOpen.value = false;
});

// delete user list
const isDeleteAccessControlListModalOpen = ref(false);
const selectedACLForDeletion = ref(null);

const openDeleteAccessControlListModal = (acl) => {
  selectedACLForDeletion.value = acl;
  isDeleteAccessControlListModalOpen.value = true;
};

const closeDeleteAccessControlListModal = () => {
  isDeleteAccessControlListModalOpen.value = false;
  selectedACLForDeletion.value = null;
};

const {
  mutate: deleteAccessControlListRaw,
  loading: isDeleteAccessControlListLoading,
  onError: onDeleteAccessControlListError,
  onDone: onDeleteAccessControlListDone
} = useMutation(gql`
  mutation deleteAppBasicAuthAccessControlList($id: Uint!) {
    deleteAppBasicAuthAccessControlList(id: $id)
  }
`);

const deleteAccessControlList = async () => {
  if (!(await askDeleteAclConfirm(t('appAuth.operationWaitConfirm'), 'danger'))) {
    return;
  }
  deleteAccessControlListRaw({
    id: selectedACLForDeletion.value.id
  });
};

onDeleteAccessControlListError((err) => {
  toast.error(err.message);
});

onDeleteAccessControlListDone((res) => {
  if (res.data.deleteAppBasicAuthAccessControlList) {
    toast.success(t('appAuth.userListDeletedSuccess'));
  } else {
    toast.error(t('appAuth.userListDeleteFailed'));
  }
  refetchAppBasicAuthAccessControlLists();
  closeDeleteAccessControlListModal();
});

// add user
const isAddUserModalOpen = ref(false);
const selectedACLForAddingUser = ref(null);

const addUserInfo = reactive({
  username: '',
  password: '',
  confirmPassword: ''
});

const openAddUserModal = (acl) => {
  selectedACLForAddingUser.value = acl;
  isAddUserModalOpen.value = true;
};

const closeAddUserModal = () => {
  isAddUserModalOpen.value = false;
  selectedACLForAddingUser.value = null;
};

watch(isAddUserModalOpen, () => {
  addUserInfo.username = '';
  addUserInfo.password = '';
  addUserInfo.confirmPassword = '';
});

const {
  mutate: addUserRaw,
  loading: isAddUserLoading,
  onError: onAddUserError,
  onDone: onAddUserDone
} = useMutation(gql`
  mutation createAppBasicAuthAccessControlUser($input: AppBasicAuthAccessControlUserInput!) {
    createAppBasicAuthAccessControlUser(input: $input) {
      id
    }
  }
`);

const addUser = async () => {
  if (addUserInfo.confirmPassword !== addUserInfo.password) {
    toast.error(t('appAuth.passwordMismatch'));
    return;
  }
  if (!(await askAddUserConfirm(t('appAuth.operationWaitConfirm')))) {
    return;
  }
  addUserRaw({
    input: {
      username: addUserInfo.username,
      password: addUserInfo.password,
      appBasicAuthAccessControlListID: selectedACLForAddingUser.value.id
    }
  });
};

onAddUserError((err) => {
  toast.error(err.message);
});

onAddUserDone(() => {
  toast.success(t('appAuth.userAddedSuccess'));
  refetchAppBasicAuthAccessControlLists();
  closeAddUserModal();
});

// delete user
const isDeleteUserModalOpen = ref(false);
const selectedUserForDeletion = ref(null);

const openDeleteUserModal = (user) => {
  selectedUserForDeletion.value = user;
  isDeleteUserModalOpen.value = true;
};

const closeDeleteUserModal = () => {
  isDeleteUserModalOpen.value = false;
  selectedUserForDeletion.value = null;
};

const {
  mutate: deleteUserRaw,
  loading: isDeleteUserLoading,
  onError: onDeleteUserError,
  onDone: onDeleteUserDone
} = useMutation(gql`
  mutation deleteAppBasicAuthAccessControlUser($id: Uint!) {
    deleteAppBasicAuthAccessControlUser(id: $id)
  }
`);

const deleteUser = async () => {
  if (!(await askDeleteUserConfirm(t('appAuth.operationWaitConfirm'), 'danger'))) {
    return;
  }
  deleteUserRaw({
    id: selectedUserForDeletion.value.id
  });
};

onDeleteUserError((err) => {
  toast.error(err.message);
});

onDeleteUserDone((res) => {
  if (res.data.deleteAppBasicAuthAccessControlUser) {
    toast.success(t('appAuth.userDeletedSuccess'));
  } else {
    toast.error(t('appAuth.userDeleteFailed'));
  }
  refetchAppBasicAuthAccessControlLists();
  closeDeleteUserModal();
});

// change user password
const isChangePasswordModalOpen = ref(false);
const selectedUserForChangePassword = ref(null);
const changePasswordInfo = reactive({
  password: '',
  confirmPassword: ''
});

watch(isChangePasswordModalOpen, () => {
  changePasswordInfo.password = '';
  changePasswordInfo.confirmPassword = '';
});

const openChangePasswordModal = (user) => {
  selectedUserForChangePassword.value = user;
  isChangePasswordModalOpen.value = true;
};

const closeChangePasswordModal = () => {
  isChangePasswordModalOpen.value = false;
  selectedUserForChangePassword.value = null;
};

const {
  mutate: changePasswordRaw,
  loading: isChangePasswordLoading,
  onError: onChangePasswordError,
  onDone: onChangePasswordDone
} = useMutation(gql`
  mutation updateAppBasicAuthAccessControlUserPassword($id: Uint!, $password: String!) {
    updateAppBasicAuthAccessControlUserPassword(id: $id, password: $password)
  }
`);

const changePassword = async () => {
  if (changePasswordInfo.password !== changePasswordInfo.confirmPassword) {
    toast.error(t('appAuth.passwordMismatch'));
    return;
  }
  if (!(await askChangePasswordConfirm(t('appAuth.operationWaitConfirm')))) {
    return;
  }
  changePasswordRaw({
    id: selectedUserForChangePassword.value.id,
    password: changePasswordInfo.password
  });
};

onChangePasswordError((err) => {
  toast.error(err.message);
});

onChangePasswordDone((res) => {
  if (res.data.updateAppBasicAuthAccessControlUserPassword) {
    toast.success(t('appAuth.passwordChangedSuccess'));
  } else {
    toast.error(t('appAuth.passwordChangeFailed'));
  }
  refetchAppBasicAuthAccessControlLists();
  closeChangePasswordModal();
});
</script>

<template>
  <section class="mx-auto w-full max-w-7xl px-4 md:px-6 xl:px-0">
    <PageBar>
      <template v-slot:title>{{ $t('appAuth.aclTitle') }}</template>
      <template v-slot:subtitle>{{ $t('appAuth.aclSubtitle') }}</template>
      <template v-slot:buttons>
        <FilledButton type="primary" :click="openAddAccessControlListModal">
          <font-awesome-icon icon="fa-solid fa-plus" class="mr-2" />
          {{ $t('appAuth.addNewAcl') }}
        </FilledButton>
        <FilledButton type="ghost" :click="refetchAppBasicAuthAccessControlLists">
          <font-awesome-icon
            icon="fa-solid fa-arrows-rotate"
            :class="{
              'animate-spin': isAppBasicAuthAccessControlListsLoading
            }" />&nbsp;&nbsp; {{ $t('common.refreshList') }}
        </FilledButton>
      </template>
    </PageBar>

    <Table class="mt-8">
      <template v-slot:header>
        <TableHeader align="left">{{ $t('common.name') }}</TableHeader>
        <TableHeader align="center">{{ $t('appAuth.registeredUsers') }}</TableHeader>
        <TableHeader align="right">{{ $t('common.actions') }}</TableHeader>
      </template>
      <template v-if="appBasicAuthAccessControlLists.length === 0" v-slot:message>
        <TableMessage>
          {{ $t('appAuth.noAclFound') }}<br />
          <span v-html="$t('appAuth.clickAddAcl')"></span>
        </TableMessage>
      </template>
      <template v-slot:body>
        <tr
          v-for="appBasicAuthAccessControlList in appBasicAuthAccessControlLists"
          v-bind:key="appBasicAuthAccessControlList.id">
          <TableRow align="left">
            <div class="text-sm font-medium text-gray-900">
              {{ appBasicAuthAccessControlList.name }}
            </div>
          </TableRow>
          <TableRow align="center" flex>
            <div class="flex w-full flex-wrap items-center justify-center gap-1">
              <div>
                <FilledButton type="primary" slim :click="() => openAddUserModal(appBasicAuthAccessControlList)">
                  <font-awesome-icon icon="fa-solid fa-plus" class="mr-2" />
                  {{ $t('appAuth.addUser') }}
                </FilledButton>
              </div>
              <div
                v-for="user in appBasicAuthAccessControlList.users"
                v-bind:key="user.id"
                class="flex w-min flex-row items-center justify-center gap-2.5 rounded-md border px-2 py-1 text-sm">
                <p>{{ user.username }}</p>
                <TextButton slim class="has-tooltip" :click="() => openChangePasswordModal(user)">
                  <span class="tooltip">{{ $t('appAuth.changePassword') }}</span>
                  <font-awesome-icon icon="fa-solid fa-key" />
                </TextButton>
                <TextButton slim type="danger" class="has-tooltip" :click="() => openDeleteUserModal(user)">
                  <span class="tooltip">{{ $t('appAuth.deleteUser') }}</span>
                  <font-awesome-icon icon="fa-solid fa-trash" />
                </TextButton>
              </div>
            </div>
          </TableRow>
          <TableRow align="right">
            <TextButton type="danger" :click="() => openDeleteAccessControlListModal(appBasicAuthAccessControlList)">
              {{ $t('appAuth.deleteAcl') }}
            </TextButton>
          </TableRow>
        </tr>
      </template>
    </Table>

    <ModalDialog :close-modal="closeAddAccessControlListModal" :is-open="isAddAccessControlListModalOpen">
      <template v-slot:header>{{ $t('appAuth.createNewUserList') }}</template>
      <template v-slot:body>
        {{ $t('appAuth.newUserListHint') }} <br />{{ $t('appAuth.tryUniqueName') }}
        <form @submit.prevent="">
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700" for="name">{{ $t('appAuth.userListName') }}</label>
            <div class="mt-1">
              <input
                id="name"
                v-model="newACLName"
                autocomplete="off"
                class="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-xs sm:text-sm"
                :placeholder="$t('appAuth.userListNamePlaceholder')"
                type="text" />
            </div>
          </div>
        </form>
      </template>
      <template v-slot:footer>
        <FilledButton
          :click="addAccessControlList"
          :loading="isAddAccessControlListLoading"
          :disabled="!newACLName"
          type="primary"
          class="w-full">
          {{ $t('appAuth.confirmRegister') }}
        </FilledButton>
      </template>
    </ModalDialog>

    <ModalDialog :close-modal="closeDeleteAccessControlListModal" :is-open="isDeleteAccessControlListModalOpen">
      <template v-slot:header>{{ $t('appAuth.deleteAclUserList') }}</template>
      <template v-slot:body>
        {{ $t('appAuth.deleteAclConfirm') }} <b>{{ selectedACLForDeletion?.name ?? '' }}</b>
        {{ $t('appAuth.userListQuestion') }}
      </template>
      <template v-slot:footer>
        <FilledButton
          :click="deleteAccessControlList"
          :loading="isDeleteAccessControlListLoading"
          type="primary"
          class="w-full">
          {{ $t('appAuth.confirmDeleteAcl') }}
        </FilledButton>
      </template>
    </ModalDialog>

    <ModalDialog :close-modal="closeAddUserModal" :is-open="isAddUserModalOpen">
      <template v-slot:header>{{ $t('appAuth.addNewUser') }}</template>
      <template v-slot:body>
        {{ $t('appAuth.addToUserList') }} <b>{{ selectedACLForAddingUser?.name ?? '' }}</b>
        <form @submit.prevent="" class="mt-2">
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700" for="name">{{ $t('appAuth.username') }}</label>
            <div class="mt-1">
              <input
                id="name"
                v-model="addUserInfo.username"
                @keydown="preventSpaceInput"
                autocomplete="off"
                class="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-xs sm:text-sm"
                :placeholder="$t('appAuth.enterUsername')"
                type="text" />
            </div>
          </div>
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700" for="password">{{ $t('appAuth.password') }}</label>
            <div class="mt-1">
              <input
                id="password"
                v-model="addUserInfo.password"
                @keydown="preventSpaceInput"
                autocomplete="off"
                class="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-xs sm:text-sm"
                :placeholder="$t('appAuth.enterPassword')"
                type="password" />
            </div>
          </div>
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700" for="confirmPassword">{{
              $t('appAuth.confirmPassword')
            }}</label>
            <div class="mt-1">
              <input
                id="confirmPassword"
                v-model="addUserInfo.confirmPassword"
                @keydown="preventSpaceInput"
                autocomplete="off"
                class="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-xs sm:text-sm"
                :placeholder="$t('appAuth.confirmPassword')"
                type="password" />
            </div>
          </div>
        </form>
      </template>
      <template v-slot:footer>
        <FilledButton
          :click="addUser"
          :loading="isAddUserLoading"
          :disabled="!addUserInfo.username || !addUserInfo.password || !addUserInfo.confirmPassword"
          type="primary"
          class="w-full">
          {{ $t('appAuth.confirmRegister') }}
        </FilledButton>
      </template>
    </ModalDialog>

    <ModalDialog :close-modal="closeDeleteUserModal" :is-open="isDeleteUserModalOpen">
      <template v-slot:header>{{ $t('appAuth.deleteUserTitle') }}</template>
      <template v-slot:body>
        {{ $t('appAuth.deleteUserConfirm') }} <b>{{ selectedUserForDeletion?.username ?? '' }}</b>
        {{ $t('appAuth.userQuestion') }}
      </template>
      <template v-slot:footer>
        <FilledButton :click="deleteUser" :loading="isDeleteUserLoading" type="primary" class="w-full">
          {{ $t('appAuth.confirmDeleteUser') }}
        </FilledButton>
      </template>
    </ModalDialog>

    <ModalDialog :close-modal="closeChangePasswordModal" :is-open="isChangePasswordModalOpen">
      <template v-slot:header>{{ $t('appAuth.changePasswordTitle') }}</template>
      <template v-slot:body>
        {{ $t('appAuth.changePasswordHint') }} <b>{{ selectedUserForChangePassword?.username ?? '' }}</b>
        {{ $t('appAuth.userLabel') }}
        <form @submit.prevent="" class="mt-2">
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700" for="password">{{ $t('appAuth.password') }}</label>
            <div class="mt-1">
              <input
                id="password"
                v-model="changePasswordInfo.password"
                @keydown="preventSpaceInput"
                autocomplete="off"
                class="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-xs sm:text-sm"
                :placeholder="$t('appAuth.enterPassword')"
                type="password" />
            </div>
          </div>
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700" for="confirmPassword">{{
              $t('appAuth.confirmPassword')
            }}</label>
            <div class="mt-1">
              <input
                id="confirmPassword"
                v-model="changePasswordInfo.confirmPassword"
                @keydown="preventSpaceInput"
                autocomplete="off"
                class="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-xs sm:text-sm"
                :placeholder="$t('appAuth.confirmPassword')"
                type="password" />
            </div>
          </div>
        </form>
      </template>
      <template v-slot:footer>
        <FilledButton
          :click="changePassword"
          :loading="isChangePasswordLoading"
          :disabled="!changePasswordInfo.password || !changePasswordInfo.confirmPassword"
          type="primary"
          class="w-full">
          {{ $t('appAuth.confirmChangePassword') }}
        </FilledButton>
      </template>
    </ModalDialog>

    <ConfirmDialog
      :is-open="isAddAclConfirmOpen"
      :message="addAclMessage"
      :confirm-type="addAclConfirmType"
      :on-confirm="onAddAclConfirm"
      :on-cancel="onAddAclCancel" />
    <ConfirmDialog
      :is-open="isDeleteAclConfirmOpen"
      :message="deleteAclMessage"
      :confirm-type="deleteAclConfirmType"
      :on-confirm="onDeleteAclConfirm"
      :on-cancel="onDeleteAclCancel" />
    <ConfirmDialog
      :is-open="isAddUserConfirmOpen"
      :message="addUserMessage"
      :confirm-type="addUserConfirmType"
      :on-confirm="onAddUserConfirm"
      :on-cancel="onAddUserCancel" />
    <ConfirmDialog
      :is-open="isDeleteUserConfirmOpen"
      :message="deleteUserMessage"
      :confirm-type="deleteUserConfirmType"
      :on-confirm="onDeleteUserConfirm"
      :on-cancel="onDeleteUserCancel" />
    <ConfirmDialog
      :is-open="isChangePasswordConfirmOpen"
      :message="changePasswordMessage"
      :confirm-type="changePasswordConfirmType"
      :on-confirm="onChangePasswordConfirm"
      :on-cancel="onChangePasswordCancel" />
  </section>
</template>

<style scoped></style>
