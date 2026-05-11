<script setup>
import { useRouter } from 'vue-router'
import FilledButton from '@/views/components/FilledButton.vue'
import DeleteApplicationsModal from '@/views/partials/DeleteApplicationsModal.vue'
import { ref } from 'vue'

const router = useRouter()
const deleteApplicationsModal = ref(null)

function deleteApplicationWithConfirmation() {
  if (deleteApplicationsModal.value) {
    deleteApplicationsModal.value.openModal()
  }
}
</script>

<template>
  <DeleteApplicationsModal ref="deleteApplicationsModal" :application-ids="[router.currentRoute.value.params.id]" />
  <div class="w-full rounded-md border border-warning-200 bg-warning-100 p-2">
    {{ $t('applicationDetails.destroyWarning') }}
  </div>
  <div class="mt-3 flex flex-col items-start">
    <p class="font-bold text-danger-500">{{ $t('applicationDetails.deleteApplicationQuestion') }}</p>
    <p class="mt-2">{{ $t('applicationDetails.deleteWillRemove') }}</p>
    <ul class="list-inside list-disc">
      <li>{{ $t('applicationDetails.deleteWillRemoveApp') }}</li>
      <li>{{ $t('applicationDetails.deleteWillRemoveIngress') }}</li>
      <li>{{ $t('applicationDetails.deleteWillRemoveDeployments') }}</li>
      <li>{{ $t('applicationDetails.deleteWillRemoveDeploymentLogs') }}</li>
      <li>{{ $t('applicationDetails.deleteWillRemoveEnvVars') }}</li>
      <li>{{ $t('applicationDetails.deleteWillRemoveVolumeBindings') }}</li>
      <li>{{ $t('applicationDetails.deleteWillRemoveSourceCode') }}</li>
    </ul>

    <FilledButton class="mt-6" type="danger" :click="deleteApplicationWithConfirmation"
      >{{ $t('applicationDetails.deleteIngressAndApp') }}
    </FilledButton>
  </div>
</template>

<style scoped></style>
