<script setup>
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js';
import { computed, onMounted, reactive, ref, shallowRef } from 'vue';
import FilledButton from '@/views/components/FilledButton.vue';
import ModalDialog from '@/views/components/ModalDialog.vue';
import { useMutation } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const editor = ref();
const editorInstance = shallowRef();
const stateRef = reactive({
  stackName: '',
  stackConfig: '',
  verificationStatus: -1,
  message: '',
  error: '',
  deployedApplicationsResult: []
});

onMounted(() => {
  editorInstance.value = monaco.editor.create(editor.value, {
    language: 'yaml',
    minimap: {
      enabled: false
    },
    lineNumbersMinChars: 2,
    tabSize: 2
  });
});

const {
  mutate: cleanupStack,
  loading: cleanupStackLoading,
  onDone: onCleanupStackDone,
  onError: onCleanupStackError
} = useMutation(gql`
  mutation CleanupStack($input: StackInput!) {
    cleanupStack(input: $input)
  }
`);

onCleanupStackDone((res) => {
  let val = res?.data?.cleanupStack ?? '';
  if (val) {
    editorInstance.value.setValue(val);
    verifyStackConfigHelper();
  }
});

onCleanupStackError((err) => {
  stateRef.error = err.message;
  stateRef.message = '';
});

const {
  mutate: verifyStack,
  loading: verifyStackLoading,
  onDone: onVerifyStackDone,
  onError: onVerifyStackError
} = useMutation(gql`
  mutation VerifyStack($input: StackInput!) {
    verifyStack(input: $input) {
      success
      message
      error
    }
  }
`);

onVerifyStackDone((res) => {
  if (!res?.data?.verifyStack) return;
  stateRef.verificationStatus = res?.data?.verifyStack?.success ? 1 : 0;
  stateRef.message = res?.data?.verifyStack?.message ?? '';
  stateRef.error = res?.data?.verifyStack?.error ?? '';
});

onVerifyStackError((err) => {
  stateRef.verificationStatus = 0;
  stateRef.error = err.message;
  stateRef.message = '';
});

const cleanupStackConfigHelper = () => {
  stateRef.stackConfig = editorInstance.value.getValue();
  cleanupStack({
    input: {
      content: stateRef.stackConfig,
      variables: [
        {
          name: 'STACK_NAME',
          value: stateRef.stackName
        }
      ]
    }
  });
};

const verifyStackConfigHelper = () => {
  stateRef.stackConfig = editorInstance.value.getValue();
  verifyStack({
    input: {
      content: stateRef.stackConfig,
      variables: [
        {
          name: 'STACK_NAME',
          value: stateRef.stackName
        }
      ]
    }
  });
};

const isCleanupAndVerifyStackConfigLoading = computed(() => {
  return cleanupStackLoading.value || verifyStackLoading.value;
});

// Deploy Stack
const {
  mutate: deployStack,
  loading: deployStackLoading,
  onDone: onDeployStackDone,
  onError: onDeployStackError
} = useMutation(gql`
  mutation DeployStack($input: StackInput!) {
    deployStack(input: $input) {
      success
      message
      application {
        id
        name
      }
    }
  }
`);

onDeployStackDone((res) => {
  if (!res?.data?.deployStack) return;
  stateRef.deployedApplicationsResult = res?.data?.deployStack ?? [];
  isModalOpen.value = true;
});

onDeployStackError((err) => {
  toast.error(err.message);
});

const deployStackHelper = () => {
  deployStack({
    input: {
      content: stateRef.stackConfig,
      variables: [
        {
          name: 'STACK_NAME',
          value: stateRef.stackName
        }
      ]
    }
  });
};

// Result modal
const isModalOpen = ref(false);
const openUrlInNewPage = (url) => {
  window.open(url);
};
</script>

<template>
  <p class="text-xl font-semibold">
    <font-awesome-icon icon="fa-solid fa-cubes-stacked" class="text-primary-600 mr-2" />
    {{ $t('deploy.deployStack') }}
  </p>
  <section class="mx-auto mt-8 flex h-full w-full max-w-7xl flex-col gap-8 px-4 md:px-6 lg:flex-row xl:px-0">
    <div class="h-[65dvh] w-full lg:h-full lg:w-1/2">
      <!--  Stack Name  -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >{{ $t('deploy.stackName') }}<span class="text-red-600"> *</span></label
        >
        <div class="mt-1">
          <input
            autocomplete="off"
            v-model="stateRef.stackName"
            class="dark:bg-secondary-700 focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-xs sm:text-sm dark:border-gray-600 dark:text-gray-200"
            :placeholder="$t('deploy.enterStackName')"
            type="text" />
        </div>
      </div>
      <!--   Stack Config (Yaml)   -->
      <div class="mt-3 h-[80%]">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >{{ $t('deploy.stackConfigYaml') }}<span class="text-red-600"> *</span></label
        >
        <div ref="editor" class="border-primary-300 mt-1 h-full w-full overflow-hidden rounded-md border-2" />
      </div>
    </div>
    <div class="w-full pt-4 lg:w-1/2">
      <p class="text-base font-semibold select-none">{{ '\u2699\uFE0F' }} {{ $t('deploy.actions') }}</p>
      <FilledButton
        class="mt-4 w-full"
        type="primary"
        :click="cleanupStackConfigHelper"
        :loading="isCleanupAndVerifyStackConfigLoading"
        >{{ $t('deploy.cleanupVerifyStack') }}
      </FilledButton>
      <!--   Verification Status   -->
      <div class="mt-2 p-3" v-if="stateRef.verificationStatus !== -1">
        <font-awesome-icon
          v-if="stateRef.verificationStatus === 1"
          icon="fa-solid fa-circle-check"
          class="text-success-500 mr-1 text-xl" />
        <font-awesome-icon
          v-else-if="stateRef.verificationStatus === 0"
          icon="fa-solid fa-circle-xmark"
          class="text-danger-500 mr-1 text-xl" />
        {{ stateRef.verificationStatus === 1 ? $t('deploy.verified') : $t('deploy.verificationFailed') }}
      </div>
      <!--    Verification Result  -->
      <div
        class="border-danger-300 bg-danger-50 mt-2 rounded-md border-2 p-3 whitespace-pre-line"
        v-if="stateRef.error !== ''">
        {{ stateRef.error }}
      </div>
      <div
        class="border-success-300 bg-success-50 mt-2 rounded-md border-2 p-3 whitespace-pre-line"
        v-if="stateRef.message !== ''">
        {{ stateRef.message }}
      </div>
      <!--   Deploy Button   -->
      <FilledButton
        v-if="stateRef.verificationStatus === 1"
        class="mt-6 w-full"
        type="primary"
        :loading="deployStackLoading"
        :click="deployStackHelper">
        <font-awesome-icon icon="fa-solid fa-hammer" class="mr-2" />
        {{ $t('deploy.deployStack') }}
      </FilledButton>
      <!--  Modal to show result    -->
      <ModalDialog :is-open="isModalOpen" non-cancelable>
        <template v-slot:header>{{ '\u{1F389}' }} {{ $t('deploy.deployedSuccessfully') }}</template>
        <template v-slot:body>
          <div class="flex flex-col space-y-3 pt-3">
            <div
              class="flex items-center space-x-2"
              v-for="result in stateRef.deployedApplicationsResult"
              :key="result.application.id">
              <font-awesome-icon
                v-if="result.success"
                icon="fa-solid fa-circle-check"
                class="text-success-500 text-base" />
              <font-awesome-icon v-else icon="fa-solid fa-circle-xmark" class="text-danger-500 text-base" />
              <p>
                {{ result.application?.name ?? 'N/A' }}
                <span v-if="result.message !== '' && !result.success"> - {{ result.message }}</span>
              </p>
              <FilledButton
                v-if="result.success"
                type="primary"
                slim
                :click="
                  () =>
                    openUrlInNewPage(
                      $router.resolve({
                        name: 'Application Details Deployments',
                        params: { id: result.application.id }
                      }).href
                    )
                ">
                {{ $t('deploy.view') }}
              </FilledButton>
            </div>
            <div
              v-if="stateRef.deployedApplicationsResult.length === 0"
              class="text-center text-gray-500 dark:text-gray-400">
              {{ $t('deploy.noApplicationsDeployed') }}
            </div>
          </div>
        </template>
        <template v-slot:footer>
          <FilledButton type="warning" class="w-full" :click="() => $router.replace('/applications')"
            >{{ $t('deploy.goToApplicationsList') }}
          </FilledButton>
        </template>
      </ModalDialog>
    </div>
  </section>
</template>

<style scoped></style>
