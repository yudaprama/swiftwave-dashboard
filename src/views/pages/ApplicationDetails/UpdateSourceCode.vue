<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.js';
import { useLazyQuery, useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { toast } from 'vue-sonner';
import FilledButton from '@/views/components/FilledButton.vue';
import createTar from '@swiftwave/tartplus';
import DockerfileEditor from '@/views/partials/DeployApplication/DockerfileEditor.vue';
import BuildArgInput from '@/views/partials/BuildArgInput.vue';
import { getHttpBaseUrl } from '@/vendor/utils.js';
import newApplicationUpdater from '@/store/applicationUpdater.js';
import { useRouter } from 'vue-router';
import CreateImageRegistryCredentialModal from '@/views/partials/CreateImageRegistryCredentialModal.vue';
import ChooseOtherDockerConfigurationModal from '@/views/partials/ChooseOtherDockerConfigurationModal.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const applicationUpdater = newApplicationUpdater(router.currentRoute.value.params.id)();

const applicationSourceType = computed(() => {
  if (applicationExistingDetailsResult.value) {
    return applicationExistingDetailsResult.value?.application?.latestDeployment?.upstreamType ?? '';
  } else {
    return null;
  }
});
const sourceCodeCompressedFileFieldRef = ref(null);
const stateRef = reactive({
  sourceCodeCompressedFileName: '',
  githubAppInstallationID: 0,
  githubRepositoryID: 0,
  repositoryOwner: '',
  repositoryName: '',
  gitBranch: '',
  codePath: '',
  command: '',
  imageRegistryCredentialID: 0,
  dockerImage: '',
  isUploadingSourceCode: false,
  detectedServiceName: '',
  dockerFile: '',
  dockerBuildArgs: [],
  buildArgs: {},
  isDockerFileEditorOpen: false,
  isDockerConfigurationGenerated: false
});
const availableGitBranches = ref([]);

watch(
  stateRef,
  () => {
    applicationUpdater.updateApplicationSource(stateRef);
  },
  { deep: true }
);

watch(
  () => applicationUpdater.isConfigurationUpdated,
  (updateStatus) => {
    if (updateStatus === false) {
      prefillDetails();
    }
  }
);

const applicationExistingDetailsResult = computed(() => {
  return applicationUpdater.applicationExistingDetailsResult ?? {};
});

// Fetch git branches
const {
  load: fetchGitBranchesRaw,
  refetch: refetchGitBranchesRaw,
  loading: fetchingGitBranches,
  onError: onFetchGitBranchesError,
  onResult: onFetchGitBranchesResult,
  variables: fetchGitBranchesVariables
} = useLazyQuery(
  gql`
    query ($input: GitBranchesQueryInput!) {
      gitBranches(input: $input)
    }
  `,
  null,
  {
    fetchPolicy: 'no-cache',
    nextFetchPolicy: 'no-cache'
  }
);

const fetchGitBranches = () => {
  const repo = githubRepositories.value.find((item) => item.id.toString() === stateRef.githubRepositoryID.toString());
  if (!repo || stateRef.githubAppInstallationID === 0) {
    return;
  }
  stateRef.repositoryOwner = repo.owner;
  stateRef.repositoryName = repo.name;
  fetchGitBranchesVariables.value = {
    input: {
      githubAppInstallationID: parseInt(stateRef.githubAppInstallationID.toString()),
      repositoryOwner: repo.owner,
      repositoryName: repo.name
    }
  };
  if (fetchGitBranchesRaw() === false) {
    refetchGitBranchesRaw();
  }
};

onFetchGitBranchesResult((d) => {
  if (d.data && d.data.gitBranches) {
    availableGitBranches.value = d.data.gitBranches;
    toast.success(t('applicationDetails.availableBranchesFetched'));
  }
});
onFetchGitBranchesError((err) => {
  toast.error(err.message);
  availableGitBranches.value = [];
  stateRef.gitBranch = '';
});

function prefillDetails() {
  if (applicationExistingDetailsResult.value && applicationExistingDetailsResult.value.application) {
    stateRef.command = applicationExistingDetailsResult.value.application.command;
    if (applicationExistingDetailsResult.value.application.latestDeployment.upstreamType === 'git') {
      stateRef.githubAppInstallationID =
        applicationExistingDetailsResult.value.application.latestDeployment.githubAppInstallationID;
      stateRef.githubRepositoryID =
        applicationExistingDetailsResult.value.application.latestDeployment.githubRepositoryID;
      stateRef.repositoryOwner = applicationExistingDetailsResult.value.application.latestDeployment.repositoryOwner;
      stateRef.repositoryName = applicationExistingDetailsResult.value.application.latestDeployment.repositoryName;
      stateRef.gitBranch = applicationExistingDetailsResult.value.application.latestDeployment.repositoryBranch;
      stateRef.codePath = applicationExistingDetailsResult.value.application.latestDeployment.codePath;
      fetchGithubRepositories();
    }
    stateRef.isDockerConfigurationGenerated = true;
    stateRef.detectedServiceName = t('applicationDetails.takenFromExistingDeployment');
    stateRef.dockerFile = applicationExistingDetailsResult.value.application.latestDeployment.dockerfile;
    const buildArgs = applicationExistingDetailsResult.value.application.latestDeployment.buildArgs;
    stateRef.buildArgs = {};
    stateRef.dockerBuildArgs = [];
    for (const buildArg of buildArgs) {
      stateRef.buildArgs[buildArg.key] = buildArg.value;
      stateRef.dockerBuildArgs.push({
        key: buildArg.key,
        description: '',
        value: buildArg.value
      });
    }
    stateRef.sourceCodeCompressedFileName =
      applicationExistingDetailsResult.value.application.latestDeployment.sourceCodeCompressedFileName;
    stateRef.dockerImage = applicationExistingDetailsResult.value.application.latestDeployment.dockerImage;
    stateRef.imageRegistryCredentialID =
      applicationExistingDetailsResult.value.application.latestDeployment.imageRegistryCredentialID;
  }
}

watch(applicationExistingDetailsResult, () => {
  prefillDetails();
});

onMounted(() => {
  prefillDetails();
  fetchGitBranches();
});

const openDockerFileEditor = () => {
  stateRef.isDockerFileEditorOpen = true;
};

const closeDockerFileEditor = () => {
  stateRef.isDockerFileEditorOpen = false;
};

const enableGenerateConfigurationButton = computed(() => {
  if (applicationSourceType.value === 'git') {
    return stateRef.githubAppInstallationID !== 0 && stateRef.githubRepositoryID !== 0 && stateRef.gitBranch !== '';
  } else if (applicationSourceType.value === 'sourceCode') {
    return stateRef.sourceCodeCompressedFileName !== '';
  } else if (applicationSourceType.value === 'image') {
    return stateRef.dockerImage !== '';
  } else {
    return false;
  }
});

// List Image Registry Credentials query
const {
  result: imageRegistryCredentialList,
  onError: onImageRegistryCredentialListError,
  refetch: refetchImageRegistryCredentialList
} = useQuery(
  gql`
    query {
      imageRegistryCredentials {
        id
        url
        username
      }
    }
  `,
  null,
  {
    pollInterval: 10000
  }
);
const imageRegistryCredentials = computed(() => imageRegistryCredentialList.value?.imageRegistryCredentials ?? []);

onImageRegistryCredentialListError((err) => toast.error(err.message));
// Fetch GitHub App installations
const { result: githubAppInstallationList, onError: onGithubAppInstallationListError } = useQuery(
  gql`
    query {
      githubAppInstallations {
        id
        installationID
        accountLogin
        accountType
      }
    }
  `,
  null,
  {
    pollInterval: 10000
  }
);
const githubAppInstallations = computed(() => githubAppInstallationList.value?.githubAppInstallations ?? []);

onGithubAppInstallationListError((err) => toast.error(err.message));

const {
  load: fetchGithubRepositoriesRaw,
  refetch: refetchGithubRepositoriesRaw,
  loading: fetchingGithubRepositories,
  onError: onFetchGithubRepositoriesError,
  onResult: onFetchGithubRepositoriesResult,
  variables: fetchGithubRepositoriesVariables
} = useLazyQuery(
  gql`
    query ($installationID: Uint!) {
      githubAppRepositories(installationID: $installationID) {
        id
        name
        owner
        fullName
        defaultBranch
      }
    }
  `,
  null,
  {
    fetchPolicy: 'no-cache',
    nextFetchPolicy: 'no-cache'
  }
);

const githubRepositories = ref([]);

const fetchGithubRepositories = () => {
  availableGitBranches.value = [];
  stateRef.gitBranch = '';
  if (stateRef.githubAppInstallationID === 0) {
    githubRepositories.value = [];
    return;
  }
  fetchGithubRepositoriesVariables.value = {
    installationID: parseInt(stateRef.githubAppInstallationID.toString())
  };
  if (fetchGithubRepositoriesRaw() === false) {
    refetchGithubRepositoriesRaw();
  }
};

onFetchGithubRepositoriesResult((d) => {
  githubRepositories.value = d.data?.githubAppRepositories ?? [];
  if (stateRef.githubRepositoryID !== 0) {
    fetchGitBranches();
  }
});

onFetchGithubRepositoriesError((err) => {
  toast.error(err.message);
  githubRepositories.value = [];
});

const HTTP_BASE_URL = getHttpBaseUrl();

async function uploadTarFile(fileblob) {
  try {
    var data = new FormData();
    data.append('file', fileblob, 'file.tar');
    const res = await axios({
      method: 'post',
      url: `${HTTP_BASE_URL}/upload/code`,
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: authStore.FetchBearerToken()
      },
      data: data
    });
    return {
      success: true,
      message: res.data.message,
      file: res.data.file
    };
  } catch (error) {
    return {
      success: false,
      message: error.response.data.message,
      file: null
    };
  }
}

const uploadSourceCode = async () => {
  stateRef.isUploadingSourceCode = true;
  try {
    const file = await createTar(sourceCodeCompressedFileFieldRef.value.files, ['.gitignore']);
    const res = await uploadTarFile(file);
    if (res.success) {
      stateRef.sourceCodeCompressedFileName = res.file;
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  } catch (e) {
    toast.error(t('applicationDetails.failedToUploadSourceCode'));
  }
  stateRef.isUploadingSourceCode = false;
};

// Generate Configuration
const {
  load: generateConfigurationLoad,
  refetch: generateConfigurationRefetch,
  loading: dockerConfigGeneratorGenerating,
  onError: onGenerateConfigurationError,
  onResult: onGenerateConfigurationSuccess,
  variables: generateConfigurationVariables
} = useLazyQuery(
  gql`
    query ($input: DockerConfigGeneratorInput!) {
      dockerConfigGenerator(input: $input) {
        detectedServiceName
        dockerFile
        dockerBuildArgs {
          key
          description
          defaultValue
        }
      }
    }
  `,
  {
    input: {}
  },
  {
    fetchPolicy: 'no-cache',
    nextFetchPolicy: 'no-cache'
  }
);

onGenerateConfigurationError((err) => toast.error(err.message));

onGenerateConfigurationSuccess((res) => {
  if (res.data && res.data.dockerConfigGenerator) {
    updateDockerConfiguration(res.data.dockerConfigGenerator);
    closeDockerFileEditor();
  }
});

const updateDockerConfiguration = (dockerConfig) => {
  stateRef.detectedServiceName = dockerConfig.detectedServiceName;
  stateRef.dockerFile = dockerConfig.dockerFile;
  stateRef.dockerBuildArgs = dockerConfig.dockerBuildArgs;
  // set default build args if not set
  for (const buildArg of stateRef.dockerBuildArgs) {
    stateRef.buildArgs[buildArg.key] = buildArg.defaultValue;
  }
  // delete build args if not present in dockerBuildArgs
  for (const buildArgKey in stateRef.buildArgs) {
    if (!stateRef.dockerBuildArgs.some((buildArg) => buildArg.key === buildArgKey)) {
      delete stateRef.buildArgs[buildArgKey];
    }
  }
  stateRef.isDockerConfigurationGenerated = true;
};

const updateBuildArg = (key, value) => {
  stateRef.buildArgs[key] = value;
};

const generateConfiguration = () => {
  if (applicationSourceType.value === 'image') {
    stateRef.detectedServiceName = t('applicationDetails.noConfigNeededForImage');
    stateRef.isDockerConfigurationGenerated = true;
  } else {
    generateConfigurationVariables.value.input = {
      sourceType: applicationSourceType.value,
      githubAppInstallationID:
        stateRef.githubAppInstallationID === 0 ? null : parseInt(stateRef.githubAppInstallationID.toString()),
      repositoryOwner: stateRef.repositoryOwner === '' ? null : stateRef.repositoryOwner,
      repositoryName: stateRef.repositoryName === '' ? null : stateRef.repositoryName,
      repositoryBranch: stateRef.gitBranch === '' ? null : stateRef.gitBranch,
      codePath: stateRef.codePath,
      customDockerFile: '',
      sourceCodeCompressedFileName:
        stateRef.sourceCodeCompressedFileName === '' ? null : stateRef.sourceCodeCompressedFileName
    };
    if (generateConfigurationLoad() === false) {
      generateConfigurationRefetch();
    }
  }
};

const generateConfigurationForCustomDockerFile = (customDockerFile) => {
  generateConfigurationVariables.value.input = {
    sourceType: 'custom',
    githubAppInstallationID: null,
    repositoryBranch: null,
    repositoryOwner: null,
    repositoryName: null,
    codePath: null,
    customDockerFile: customDockerFile,
    sourceCodeCompressedFileName: null
  };
  if (generateConfigurationLoad() === false) {
    generateConfigurationRefetch();
  }
};

// Create Image Registry Credential
const createImageRegistryCredentialModalRef = ref(null);
const openCreateImageRegistryCredentialModal = computed(
  () => createImageRegistryCredentialModalRef.value?.openModal ?? (() => {})
);

// Chose Other Docker Configuration
const chooseOtherDockerConfigurationModalRef = ref(null);
const openChooseOtherDockerConfigurationModal = computed(
  () => chooseOtherDockerConfigurationModalRef.value?.openModal ?? (() => {})
);
</script>

<template>
  <!--  Modals -->
  <CreateImageRegistryCredentialModal
    ref="createImageRegistryCredentialModalRef"
    :callback-on-create="refetchImageRegistryCredentialList" />
  <ChooseOtherDockerConfigurationModal
    ref="chooseOtherDockerConfigurationModalRef"
    :on-apply-configuration="updateDockerConfiguration" />

  <div :key="2" class="mb-5 flex w-full flex-row justify-between p-6 pt-0">
    <div class="w-1/2 max-w-md">
      <!--  Git as Source  -->
      <div v-if="applicationSourceType === 'git'" class="w-full">
        <p class="text-xl font-medium">{{ $t('applicationDetails.gitRepositoryInformation') }}</p>

        <!-- GitHub App Installation -->
        <div class="mt-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300" for="github_installation"
            >GitHub App Installation</label
          >
          <div class="mt-1">
            <select
              id="github_installation"
              v-model="stateRef.githubAppInstallationID"
              @change="fetchGithubRepositories"
              class="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-xs sm:text-sm">
              <option selected value="0">Select installation</option>
              <option v-for="installation in githubAppInstallations" :key="installation.id" :value="installation.id">
                {{ installation.accountLogin }} [{{ installation.accountType }}]
              </option>
            </select>
          </div>
        </div>

        <!-- Git Repository -->
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300" for="github_repository">
            GitHub Repository
            <span class="ml-2 italic" v-if="fetchingGithubRepositories"
              ><font-awesome-icon icon="fa-solid fa-spinner" class="animate-spin" />&nbsp;&nbsp;{{
                $t('applicationDetails.fetching')
              }}</span
            >
          </label>
          <div class="mt-1">
            <select
              id="github_repository"
              v-model="stateRef.githubRepositoryID"
              @change="fetchGitBranches"
              class="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-xs sm:text-sm"
              :disabled="stateRef.githubAppInstallationID === 0">
              <option selected disabled value="0">Select repository</option>
              <option v-for="repo in githubRepositories" :key="repo.id" :value="repo.id">{{ repo.fullName }}</option>
            </select>
          </div>
        </div>

        <!-- Git Branch -->
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300" for="name"
            >{{ $t('applicationDetails.gitBranch') }}
            <span class="ml-2 italic" v-if="fetchingGitBranches"
              ><font-awesome-icon icon="fa-solid fa-spinner" class="animate-spin" />&nbsp;&nbsp;{{
                $t('applicationDetails.fetching')
              }}</span
            ></label
          >
          <div class="mt-1">
            <select
              id="git_credential"
              v-model="stateRef.gitBranch"
              class="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-xs sm:text-sm">
              <option selected disabled value="">{{ $t('applicationDetails.selectBranch') }}</option>
              <option v-for="branch in availableGitBranches" :key="branch" :value="branch">
                {{ branch }}
              </option>
            </select>
          </div>
        </div>

        <!-- Code Path -->
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300" for="name">{{
            $t('applicationDetails.codePath')
          }}</label>
          <div class="mt-1">
            <input
              id="name"
              v-model="stateRef.codePath"
              autocomplete="off"
              class="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-xs sm:text-sm"
              name="name"
              :placeholder="$t('applicationDetails.codePathHint')"
              type="text" />
            <p class="mt-1 text-xs text-gray-800 dark:text-gray-300">
              {{ $t('applicationDetails.codePathNote') }}
            </p>
          </div>
        </div>
      </div>

      <!--  File upload source  -->
      <div v-else-if="applicationSourceType === 'sourceCode'" class="w-full">
        <p class="text-xl font-medium">{{ $t('applicationDetails.uploadSourceCodeTitle') }}</p>
        <!--    Source Code -->
        <div class="mt-4">
          <label class="mb-2 block text-sm font-medium text-gray-900 dark:text-white" for="source_code">{{
            $t('applicationDetails.selectFolder')
          }}</label>
          <div class="mx-auto max-w-md space-y-8">
            <input
              ref="sourceCodeCompressedFileFieldRef"
              class="dark:bg-secondary-800 w-full cursor-pointer rounded-md bg-gray-100 text-sm text-black file:mr-4 file:cursor-pointer file:border-0 file:bg-gray-800 file:px-4 file:py-2 file:text-white file:hover:bg-gray-700 focus:outline-hidden dark:text-gray-100"
              directory
              multiple
              type="file"
              webkitdirectory />
          </div>
        </div>

        <!-- Upload Code -->
        <FilledButton
          :loading="stateRef.isUploadingSourceCode"
          class="mt-4 w-full"
          type="secondary"
          @click="uploadSourceCode"
          >{{ $t('applicationDetails.uploadCode') }}
        </FilledButton>
      </div>
      <!--  Docker Source  -->
      <div v-else-if="applicationSourceType === 'image'" class="w-full">
        <!-- Docker Image URL-->
        <div class="mt-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300" for="docker_image"
            >{{ $t('applicationDetails.dockerImageLabel') }} <span class="text-red-600"> *</span>
          </label>
          <div class="mt-1">
            <input
              id="docker_image"
              v-model="stateRef.dockerImage"
              autocomplete="off"
              class="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-xs sm:text-sm"
              name="name"
              :placeholder="$t('applicationDetails.enterDockerImageUrl')"
              type="text" />
          </div>
        </div>
        <!-- Image Registry Credentials -->
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300" for="image_registry_credential"
            >{{ $t('applicationDetails.pickImageRegistryCredential') }}
          </label>
          <div class="mt-1">
            <select
              id="image_registry_credential"
              v-model="stateRef.imageRegistryCredentialID"
              class="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-xs sm:text-sm">
              <option selected value="0">{{ $t('applicationDetails.noCredential') }}</option>
              <option v-for="credential in imageRegistryCredentials" :key="credential.id" :value="credential.id">
                {{ credential.username }} - {{ credential.url }}
              </option>
            </select>
          </div>
          <p class="mt-2 flex items-center text-sm">
            {{ $t('applicationDetails.needCredentialForPrivateRegistry') }}
            <a
              @click="openCreateImageRegistryCredentialModal"
              class="text-primary-600 ml-1.5 cursor-pointer font-bold"
              >{{ $t('applicationDetails.clickHere') }}</a
            >
          </p>
        </div>
      </div>

      <FilledButton
        :disabled="!enableGenerateConfigurationButton"
        :loading="dockerConfigGeneratorGenerating"
        class="mt-6 w-full"
        type="primary"
        @click="generateConfiguration"
        >{{ $t('applicationDetails.reGenerateConfiguration') }}
      </FilledButton>
    </div>

    <!-- just for padding purpose -->
    <div></div>

    <div v-if="stateRef.isDockerConfigurationGenerated" class="w-1/2 max-w-md">
      <p class="text-xl font-medium">{{ $t('applicationDetails.generatedConfiguration') }}</p>
      <FilledButton
        class="mt-6 w-full"
        slim
        type="secondary"
        v-if="applicationSourceType !== 'image'"
        :click="openChooseOtherDockerConfigurationModal"
        >{{ $t('applicationDetails.incorrectServiceChangeConfig') }}
      </FilledButton>
      <p class="mt-4 font-medium text-gray-700 dark:text-gray-300">
        {{ $t('applicationDetails.detectedServiceName') }}
        <span class="text-primary-600 font-normal">{{ stateRef.detectedServiceName }}</span>
      </p>
      <FilledButton v-if="applicationSourceType !== 'image'" class="mt-4 w-full" @click="openDockerFileEditor"
        >{{ $t('applicationDetails.viewModifyDockerfile') }}
      </FilledButton>
      <!-- Docker Command-->
      <div class="mt-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300" for="docker_command"
          >{{ $t('applicationDetails.dockerImageCommand') }}
        </label>
        <div class="mt-1">
          <input
            id="docker_command"
            v-model="stateRef.command"
            autocomplete="off"
            class="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-xs sm:text-sm"
            name="docker_command"
            :placeholder="$t('applicationDetails.enterDockerCommand')"
            type="text" />
          <p class="mt-1 text-xs text-gray-800 dark:text-gray-300">{{ $t('applicationDetails.dockerCommandNote') }}</p>
        </div>
      </div>
      <div v-if="stateRef.dockerBuildArgs.length !== 0">
        <p class="mt-4 font-medium text-gray-700 dark:text-gray-300">
          {{ $t('applicationDetails.dockerBuildArgsLabel') }}
        </p>
        <div class="w-full">
          <BuildArgInput
            v-for="buildArg in stateRef.dockerBuildArgs"
            :key="buildArg.key"
            :arg-key="buildArg.key"
            :description="buildArg.description"
            :update-build-arg="(val) => updateBuildArg(buildArg.key, val)"
            :value="stateRef.buildArgs[buildArg.key]" />
        </div>
      </div>
    </div>

    <!-- Dockerfile Editor -->
    <DockerfileEditor
      :close-modal="closeDockerFileEditor"
      :code="stateRef.dockerFile"
      :docker-configuration-generating="dockerConfigGeneratorGenerating"
      :is-open="stateRef.isDockerFileEditorOpen"
      :submit="generateConfigurationForCustomDockerFile" />
  </div>
</template>

<style scoped></style>
