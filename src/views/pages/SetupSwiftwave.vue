<script setup>
import Switch from '@/views/components/Switch.vue'
import { computed, onMounted, reactive, ref } from 'vue'
import FilledButton from '@/views/components/FilledButton.vue'
import ModalDialog from '@/views/components/ModalDialog.vue'
import { toast } from 'vue-sonner'
import { useRouter } from 'vue-router'
import { useSystemConfigStore } from '@/store/systemConfig.js'
import { preventSpaceInput } from '@/vendor/utils.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const router = useRouter()
const systemConfigStore = useSystemConfigStore()
const isUpdateRequired = router.currentRoute.value.query.update === '1'
const isSimple = ref(true)
const isAdvanced = computed(() => !isSimple.value)
const toggleMode = () => (isSimple.value = !isSimple.value)
const formState = reactive({
  new_admin_credential: {
    username: '',
    password: ''
  },
  network_name: 'swiftwave_network',
  extra_restricted_ports: '',
  lets_encrypt: {
    email_address: '',
    staging_env: false
  },
  image_registry: {
    type: 'local',
    endpoint: '',
    namespace: '',
    username: '',
    password: ''
  },
  haproxy_config: {
    image: 'ghcr.io/swiftwave-org/haproxy:2.9'
  },
  udpproxy_config: {
    image: 'ghcr.io/swiftwave-org/udpproxy:latest'
  },
  pv_backup_config: {
    s3_config: {
      enabled: false,
      endpoint: '',
      region: 'us-east-1',
      bucket_name: '',
      access_key_id: '',
      secret_key: '',
      force_path_style: false
    }
  },
  pubsub_config: {
    type: 'local',
    buffer_length: 2000,
    redis_config: {
      host: 'localhost',
      port: 6379,
      password: '',
      database: 0
    }
  },
  task_queue_config: {
    type: 'local',
    remote_task_queue_type: 'none',
    max_outstanding_messages_per_queue: 1000,
    no_of_workers_per_queue: 1,
    amqp_config: {
      protocol: 'amqps',
      host: '',
      port: 5671,
      username: '',
      password: '',
      vhost: ''
    },
    redis_config: {
      host: '',
      port: 6379,
      password: '',
      database: 0
    }
  }
})
const timeCount = ref(5)
const setupSuccessful = ref(false)
const toggleStagingEnv = () => (formState.lets_encrypt.staging_env = !formState.lets_encrypt.staging_env)
const toggleImageRegistry = () =>
  (formState.image_registry.type = formState.image_registry.type === 'local' ? 'remote' : 'local')
const isRemoteImageRegistry = computed(() => formState.image_registry.type === 'remote')
const toggleS3Backup = () =>
  (formState.pv_backup_config.s3_config.enabled = !formState.pv_backup_config.s3_config.enabled)
const toggleS3ForcePathStyle = () =>
  (formState.pv_backup_config.s3_config.force_path_style = !formState.pv_backup_config.s3_config.force_path_style)
const isRemoteS3Backup = computed(() => formState.pv_backup_config.s3_config.enabled)

const isLocalTaskQueue = computed(() => formState.task_queue_config.type === 'local')
const isRedisTaskQueue = computed(
  () => formState.task_queue_config.remote_task_queue_type === 'redis' && formState.task_queue_config.type === 'remote'
)
const isAMQPTaskQueue = computed(
  () => formState.task_queue_config.remote_task_queue_type === 'amqp' && formState.task_queue_config.type === 'remote'
)

const switchTaskQueueType = (type) => {
  if (type === 'local') {
    formState.task_queue_config.type = 'local'
    formState.task_queue_config.remote_task_queue_type = 'none'
  } else if (type === 'redis') {
    formState.task_queue_config.type = 'remote'
    formState.task_queue_config.remote_task_queue_type = 'redis'
  } else if (type === 'amqp') {
    formState.task_queue_config.type = 'remote'
    formState.task_queue_config.remote_task_queue_type = 'amqp'
  }
}

const togglePubSub = () =>
  (formState.pubsub_config.type = formState.pubsub_config.type === 'local' ? 'remote' : 'local')
const isRemotePubSub = computed(() => formState.pubsub_config.type === 'remote')
const startCountDown = () => {
  const interval = setInterval(() => {
    timeCount.value--
    if (timeCount.value === 0) {
      clearInterval(interval)
      setupSuccessful.value = false
      router.push({ name: 'Maintenance' })
    }
  }, 1000)
}

const fetchDetails = async () => {
  if (!isUpdateRequired) return
  const { success, data } = await systemConfigStore.fetch()
  if (success) {
    Object.assign(formState, data)
  } else {
    toast.error(t('setup.fetchConfigError'))
  }
}
onMounted(() => {
  fetchDetails()
})

const submitConfig = async () => {
  if (!isUpdateRequired) {
    if (!formState.new_admin_credential.username || !formState.new_admin_credential.password) {
      toast.error(t('setup.adminCredentialsRequired'))
      return
    }
  }
  let res = await systemConfigStore.submit(formState)
  if (res.success) {
    setupSuccessful.value = true
    toast.success(res.message)
    startCountDown()
  } else {
    toast.error(res.message)
  }
}
const updateConfig = async () => {
  let res = await systemConfigStore.update(formState)
  if (res.success) {
    setupSuccessful.value = true
    startCountDown()
  } else {
    toast.error(res.message)
  }
}
</script>

<template>
  <ModalDialog :is-open="setupSuccessful" non-cancelable>
    <template v-slot:header>
      <span v-show="!isUpdateRequired">🚀 {{ $t('setup.setupSuccessful') }}</span>
      <span v-show="isUpdateRequired">🚀 {{ $t('setup.configSaved') }}</span>
    </template>
    <template v-slot:body>
      <p class="mb-2">{{ $t('setup.allConfigSaved') }}</p>
      <p>
        {{ $t('setup.redirectingIn') }} <b>{{ timeCount }}</b> {{ $t('setup.seconds') }}
      </p>
    </template>
  </ModalDialog>
  <div class="flex w-full max-w-7xl flex-col items-center gap-6 sm:px-0">
    <!-- Setup bar  -->
    <!-- logo | name | --spacing-- | -- switch [simple/advanced] -- -->
    <div class="flex w-full items-center justify-between py-2">
      <img src="@/assets/images/logo-full.png" alt="logo" class="max-h-10" />
      <div class="flex items-center gap-2 font-medium">
        {{ $t('setup.simple') }}
        <Switch :enabled="!isSimple" :on-change="toggleMode" />
        {{ $t('setup.advanced') }}
      </div>
    </div>
    <!--  New Admin info  -->
    <div class="info-section" v-if="!isUpdateRequired">
      <!--   label   -->
      <div class="label">
        <p>{{ $t('setup.newAdminCredential') }}</p>
        <span />
      </div>
      <div class="content">
        <div class="input-label">
          <span>{{ $t('setup.usernameLabel') }}</span>
          <span>{{ $t('setup.usernameHint') }}</span>
        </div>
        <input type="text" v-model="formState.new_admin_credential.username" @keydown="preventSpaceInput" />
      </div>
      <div class="content">
        <div class="input-label">
          <span>{{ $t('setup.passwordLabel') }}</span>
          <span>{{ $t('setup.passwordHint') }}</span>
        </div>
        <input type="password" v-model="formState.new_admin_credential.password" />
      </div>
    </div>
    <!-- Networking section [advanced] -->
    <div class="info-section" v-if="isAdvanced">
      <!--   label   -->
      <div class="label">
        <p>{{ $t('setup.networking') }}</p>
        <span />
      </div>
      <div class="content">
        <div class="input-label">
          <span>{{ $t('setup.overlayNetworkName') }}</span>
          <span>{{ $t('setup.overlayNetworkHint') }}</span>
        </div>
        <input type="text" v-model="formState.network_name" @keydown="preventSpaceInput" />
      </div>
      <div class="content">
        <div class="input-label">
          <span>{{ $t('setup.extraRestrictedPorts') }}</span>
          <span>{{ $t('setup.extraRestrictedPortsHint') }}</span>
        </div>
        <input type="text" v-model="formState.extra_restricted_ports" @keydown="preventSpaceInput" />
      </div>
    </div>
    <!-- Lets Encrypt Info  -->
    <div class="info-section">
      <!--   label   -->
      <div class="label">
        <p>{{ $t('setup.letsEncryptInfo') }}</p>
        <span />
      </div>
      <div class="content">
        <div class="input-label">
          <span>{{ $t('setup.emailAddress') }}</span>
          <span>{{ $t('setup.emailHint') }}</span>
        </div>
        <input type="text" v-model="formState.lets_encrypt.email_address" @keydown="preventSpaceInput" />
      </div>
      <div class="content">
        <div class="input-label">
          <span>{{ $t('setup.productionEnv') }}</span>
          <span>{{ $t('setup.productionEnvHint') }}</span>
        </div>
        <div class="flex items-center gap-2 font-medium">
          <span>{{ $t('setup.yesRecommended') }}</span>
          <Switch :on-change="toggleStagingEnv" :enabled="formState.lets_encrypt.staging_env" />
          <span>{{ $t('setup.noStaging') }}</span>
        </div>
      </div>
    </div>
    <!-- Image Registry Config -->
    <div class="info-section">
      <!--   label   -->
      <div class="label">
        <p>{{ $t('setup.imageRegistryInfo') }}</p>
        <span />
      </div>
      <div class="content">
        <div class="input-label">
          <span>{{ $t('setup.registryType') }}</span>
          <span>{{ $t('setup.registryTypeHint') }}</span>
        </div>
        <div class="flex items-center gap-2 font-medium">
          <span>{{ $t('setup.local') }}</span>
          <Switch :on-change="toggleImageRegistry" :enabled="formState.image_registry.type === 'remote'" />
          <span>{{ $t('setup.remote') }}</span>
        </div>
      </div>
      <div class="content" v-if="isRemoteImageRegistry">
        <div class="input-label">
          <span>{{ $t('setup.registryEndpoint') }}</span>
          <span>{{ $t('setup.registryEndpointExample') }}</span>
        </div>
        <input type="text" v-model="formState.image_registry.endpoint" />
      </div>
      <div class="content" v-if="isRemoteImageRegistry">
        <div class="input-label">
          <span>{{ $t('setup.registryNamespace') }}</span>
          <span>{{ $t('setup.registryNamespaceHint') }}</span>
        </div>
        <input type="text" v-model="formState.image_registry.endpoint" />
      </div>
      <div class="content" v-if="isRemoteImageRegistry">
        <div class="input-label">
          <span>{{ $t('setup.registryUsername') }}</span>
          <span>{{ $t('setup.registryUsernameHint') }}</span>
        </div>
        <input type="text" v-model="formState.image_registry.username" />
      </div>
      <div class="content" v-if="isRemoteImageRegistry">
        <div class="input-label">
          <span>{{ $t('setup.registryPassword') }}</span>
          <span>{{ $t('setup.registryPasswordHint') }}</span>
        </div>
        <input type="password" v-model="formState.image_registry.password" />
      </div>
    </div>
    <!-- HAProxy config [advanced]  -->
    <div class="info-section" v-if="isAdvanced">
      <div class="label">
        <p>{{ $t('setup.haProxyConfig') }}</p>
        <span />
      </div>
      <div class="content">
        <div class="input-label">
          <span>{{ $t('setup.image') }}</span>
          <span
            >{{ $t('setup.availableImages') }}
            <a href="https://github.com/swiftwave-org/haproxy/pkgs/container/haproxy" target="_blank"
              >github.com/swiftwave-org/haproxy/pkgs/container/haproxy</a
            >
          </span>
        </div>
        <input type="text" v-model="formState.haproxy_config.image" />
      </div>
    </div>
    <!-- UDP Proxy Config [advanced] -->
    <div class="info-section" v-if="isAdvanced">
      <div class="label">
        <p>{{ $t('setup.udpProxyConfig') }}</p>
        <span />
      </div>
      <div class="content">
        <div class="input-label">
          <span>{{ $t('setup.image') }}</span>
          <span
            >{{ $t('setup.availableImages') }}
            <a href="https://github.com/swiftwave-org/udpproxy/pkgs/container/udpproxy" target="_blank"
              >github.com/swiftwave-org/udpproxy/pkgs/container/udpproxy</a
            >
          </span>
        </div>
        <input type="text" v-model="formState.udpproxy_config.image" />
      </div>
    </div>
    <!-- PV Backup Config -->
    <div class="info-section">
      <div class="label">
        <p>{{ $t('setup.volumeBackupConfig') }}</p>
        <span />
      </div>
      <div class="content">
        <div class="input-label">
          <span>{{ $t('setup.s3Enabled') }}</span>
          <span>{{ $t('setup.s3EnabledHint') }}</span>
        </div>
        <div class="flex items-center gap-2 font-medium">
          <span>{{ $t('setup.yesRecommended') }}</span>
          <Switch :on-change="toggleS3Backup" :enabled="!formState.pv_backup_config.s3_config.enabled" />
          <span>{{ $t('common.no') }}</span>
        </div>
      </div>
      <div class="content" v-if="isRemoteS3Backup">
        <div class="input-label">
          <span>{{ $t('setup.s3Endpoint') }}</span>
          <span>{{ $t('setup.s3EndpointExample') }}</span>
        </div>
        <input type="text" v-model="formState.pv_backup_config.s3_config.endpoint" />
      </div>
      <div class="content" v-if="isRemoteS3Backup">
        <div class="input-label">
          <span>{{ $t('setup.s3Region') }}</span>
          <span>{{ $t('setup.s3RegionExample') }}</span>
        </div>
        <input type="text" v-model="formState.pv_backup_config.s3_config.region" />
      </div>
      <div class="content" v-if="isRemoteS3Backup">
        <div class="input-label">
          <span>{{ $t('setup.s3BucketName') }}</span>
          <span>{{ $t('setup.s3BucketNameExample') }}</span>
        </div>
        <input type="text" v-model="formState.pv_backup_config.s3_config.bucket_name" />
      </div>
      <div class="content" v-if="isRemoteS3Backup">
        <div class="input-label">
          <span>{{ $t('setup.s3AccessKeyId') }}</span>
          <span>{{ $t('setup.s3AccessKeyIdHint') }}</span>
        </div>
        <input type="text" v-model="formState.pv_backup_config.s3_config.access_key_id" />
      </div>
      <div class="content" v-if="isRemoteS3Backup">
        <div class="input-label">
          <span>{{ $t('setup.s3SecretKey') }}</span>
          <span>{{ $t('setup.s3SecretKeyHint') }}</span>
        </div>
        <input type="password" v-model="formState.pv_backup_config.s3_config.secret_key" />
      </div>
      <div class="content" v-if="isRemoteS3Backup">
        <div class="input-label">
          <span>{{ $t('setup.forcePathStyle') }}</span>
          <span>{{ $t('setup.forcePathStyleHint') }}</span>
        </div>
        <div class="flex items-center gap-2 font-medium">
          <span>{{ $t('common.yes') }}</span>
          <Switch
            :on-change="toggleS3ForcePathStyle"
            :enabled="!formState.pv_backup_config.s3_config.force_path_style" />
          <span>{{ $t('common.no') }}</span>
        </div>
      </div>
    </div>
    <!-- PubSub config -->
    <div class="info-section">
      <div class="label">
        <p>{{ $t('setup.pubsubConfig') }}</p>
        <span />
      </div>
      <div class="content" v-if="isAdvanced">
        <div class="input-label">
          <span>{{ $t('setup.bufferLength') }}</span>
          <span>{{ $t('setup.bufferLengthHint') }}</span>
        </div>
        <input type="number" v-model="formState.pubsub_config.buffer_length" />
      </div>
      <div class="content">
        <div class="input-label">
          <span>{{ $t('setup.pubsubType') }}</span>
          <span>{{ $t('setup.pubsubTypeHint') }}</span>
        </div>
        <div class="flex items-center gap-2 font-medium">
          <span>{{ $t('setup.local') }}</span>
          <Switch :on-change="togglePubSub" :enabled="formState.pubsub_config.type === 'remote'" />
          <span>{{ $t('setup.remote') }}</span>
        </div>
      </div>
      <div class="rounded-md border border-success-600 bg-success-100 p-2 text-success-800" v-if="isRemotePubSub">
        {{ $t('setup.redisAsPubsub') }}
      </div>
      <div class="content" v-if="isRemotePubSub">
        <div class="input-label">
          <span>{{ $t('setup.redisHost') }}</span>
          <span>{{ $t('setup.redisHostExample') }}</span>
        </div>
        <input type="text" v-model="formState.pubsub_config.redis_config.host" />
      </div>
      <div class="content" v-if="isRemotePubSub">
        <div class="input-label">
          <span>{{ $t('setup.redisPort') }}</span>
          <span>{{ $t('setup.redisPortHint') }}</span>
        </div>
        <input type="text" v-model="formState.pubsub_config.redis_config.port" />
      </div>
      <div class="content" v-if="isRemotePubSub">
        <div class="input-label">
          <span>{{ $t('setup.redisPassword') }}</span>
          <span>{{ $t('setup.redisPasswordHint') }}</span>
        </div>
        <input type="password" v-model="formState.pubsub_config.redis_config.password" />
      </div>
      <div class="content" v-if="isRemotePubSub">
        <div class="input-label">
          <span>{{ $t('setup.redisDatabaseId') }}</span>
          <span>{{ $t('setup.redisDatabaseIdHint') }}</span>
        </div>
        <input type="number" v-model="formState.pubsub_config.redis_config.database" />
      </div>
    </div>
    <!-- Task Queue Config -->
    <div class="info-section">
      <div class="label">
        <p>{{ $t('setup.taskQueueConfig') }}</p>
        <span />
      </div>
      <div class="content" v-if="isAdvanced">
        <div class="input-label">
          <span>{{ $t('setup.noOfWorkersPerQueue') }}</span>
          <span>{{ $t('setup.noOfWorkersHint') }}</span>
        </div>
        <input type="number" v-model="formState.task_queue_config.no_of_workers_per_queue" />
      </div>
      <div class="content">
        <div class="input-label">
          <span>{{ $t('setup.queueType') }}</span>
          <span>{{ $t('setup.queueTypeHint') }}</span>
        </div>
        <div class="multi-select">
          <div
            @click="switchTaskQueueType('local')"
            :class="{
              active: isLocalTaskQueue
            }">
            {{ $t('setup.local') }}
          </div>
          <div
            @click="switchTaskQueueType('redis')"
            :class="{
              active: isRedisTaskQueue
            }">
            Redis
          </div>
          <div
            @click="switchTaskQueueType('amqp')"
            :class="{
              active: isAMQPTaskQueue
            }">
            AMQP
          </div>
        </div>
      </div>
      <div class="rounded-md border border-success-600 bg-success-100 p-2 text-success-800">
        <span v-if="isLocalTaskQueue"
          >{{ $t('setup.localPostgresHint') }}</span
        >
        <span v-else-if="isRedisTaskQueue">{{ $t('setup.redisTaskQueueHint') }}</span>
        <span v-else-if="isAMQPTaskQueue"
          >{{ $t('setup.amqpTaskQueueHint') }}</span
        >
      </div>

      <!--  Local Task Queue config    -->
      <div class="content" v-if="isAdvanced && isLocalTaskQueue">
        <div class="input-label">
          <span>{{ $t('setup.maxOutstandingMessages') }}</span>
          <span>{{ $t('setup.maxOutstandingMessagesHint') }}</span>
        </div>
        <input type="number" v-model="formState.task_queue_config.max_outstanding_messages_per_queue" />
      </div>

      <!--   Redis Task Queue Config   -->
      <div class="content" v-if="isRedisTaskQueue">
        <div class="input-label">
          <span>{{ $t('setup.taskRedisHost') }}</span>
          <span>{{ $t('setup.taskRedisHostExample') }}</span>
        </div>
        <input type="text" v-model="formState.task_queue_config.redis_config.host" />
      </div>
      <div class="content" v-if="isRedisTaskQueue">
        <div class="input-label">
          <span>{{ $t('setup.taskRedisPort') }}</span>
          <span>{{ $t('setup.taskRedisPortHint') }}</span>
        </div>
        <input type="text" v-model="formState.task_queue_config.redis_config.port" />
      </div>
      <div class="content" v-if="isRedisTaskQueue">
        <div class="input-label">
          <span>{{ $t('setup.taskRedisPassword') }}</span>
          <span>{{ $t('setup.taskRedisPasswordHint') }}</span>
        </div>
        <input type="password" v-model="formState.task_queue_config.redis_config.password" />
      </div>
      <div class="content" v-if="isRedisTaskQueue">
        <div class="input-label">
          <span>{{ $t('setup.taskRedisDatabaseId') }}</span>
          <span>{{ $t('setup.taskRedisDatabaseIdHint') }}</span>
        </div>
        <input type="number" v-model="formState.task_queue_config.redis_config.database" />
      </div>

      <!--   AMQP Config   -->

      <div class="content" v-if="isAMQPTaskQueue">
        <div class="input-label">
          <span>{{ $t('setup.queueProtocol') }}</span>
          <span>{{ $t('setup.queueProtocolExample') }}</span>
        </div>
        <select v-model="formState.task_queue_config.amqp_config.protocol">
          <option value="amqp">AMQP</option>
          <option value="amqps">AMQPS</option>
        </select>
      </div>
      <div class="content" v-if="isAMQPTaskQueue">
        <div class="input-label">
          <span>{{ $t('setup.queueHost') }}</span>
          <span>{{ $t('setup.queueHostExample') }}</span>
        </div>
        <input type="text" v-model="formState.task_queue_config.amqp_config.host" />
      </div>
      <div class="content" v-if="isAMQPTaskQueue">
        <div class="input-label">
          <span>{{ $t('setup.queuePort') }}</span>
          <span>{{ $t('setup.queuePortHint') }}</span>
        </div>
        <input type="number" v-model="formState.task_queue_config.amqp_config.port" />
      </div>
      <div class="content" v-if="isAMQPTaskQueue">
        <div class="input-label">
          <span>{{ $t('setup.queueUsername') }}</span>
          <span>{{ $t('setup.queueUsernameHint') }}</span>
        </div>
        <input type="text" v-model="formState.task_queue_config.amqp_config.username" />
      </div>
      <div class="content" v-if="isAMQPTaskQueue">
        <div class="input-label">
          <span>{{ $t('setup.queuePassword') }}</span>
          <span>{{ $t('setup.queuePasswordHint') }}</span>
        </div>
        <input type="password" v-model="formState.task_queue_config.amqp_config.password" />
      </div>
      <div class="content" v-if="isAMQPTaskQueue">
        <div class="input-label">
          <span>{{ $t('setup.queueVHost') }}</span>
          <span>{{ $t('setup.queueVHostHint') }}</span>
        </div>
        <input type="text" v-model="formState.task_queue_config.amqp_config.vhost" />
      </div>
    </div>
    <!--  Confirm btn  -->
    <FilledButton
      class="mt-8"
      :click="submitConfig"
      :loading="systemConfigStore.isSubmitting"
      v-show="!isUpdateRequired">
      <font-awesome-icon icon="fa-solid fa-rocket" class="mr-3" />
      {{ $t('setup.saveConfigStart') }}
    </FilledButton>
    <FilledButton class="mt-8" :click="updateConfig" :loading="systemConfigStore.isUpdating" v-show="isUpdateRequired">
      <font-awesome-icon icon="fa-solid fa-rocket" class="mr-3" />
      {{ $t('setup.updateConfigRestart') }}
    </FilledButton>
  </div>
</template>

<style scoped>
.info-section {
  @apply flex w-full flex-col gap-3;

  .label {
    @apply flex w-full items-center gap-5 text-lg font-medium;

    p {
      @apply whitespace-nowrap;
    }

    span {
      @apply h-0.5 w-full bg-gray-300;
    }
  }

  .content {
    @apply grid grid-cols-2 gap-4;

    .input-label {
      @apply flex flex-col;

      span:first-child {
        @apply text-base font-medium text-gray-800;
      }

      span:last-child {
        @apply text-sm text-gray-500;
      }
    }

    select {
      @apply block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500;
    }

    input {
      @apply w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500;
    }
  }

  .multi-select {
    @apply flex h-fit w-min overflow-hidden rounded-md border border-secondary-400;

    div {
      @apply cursor-pointer border-r border-secondary-400 bg-secondary-100 px-5 py-2 transition-all hover:bg-secondary-400 hover:text-white;
    }

    div:last-child {
      @apply border-0;
    }

    .active {
      @apply bg-primary-600  text-white;
    }
  }
}
</style>
