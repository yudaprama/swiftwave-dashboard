<script setup>
import Table from '@/views/components/Table/Table.vue'
import TableMessage from '@/views/components/Table/TableMessage.vue'
import TableHeader from '@/views/components/Table/TableHeader.vue'
import FilledButton from '@/views/components/FilledButton.vue'
import { toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import EnvironmentVariableRow from '@/views/partials/DeployApplication/EnvironmentVariableRow.vue'

const { t } = useI18n()

const props = defineProps({
  environmentVariablesKeys: {
    type: Array,
    required: true
  },
  environmentVariablesMap: {
    type: Object,
    required: true,
    default: () => ({})
  },
  addEnvironmentVariable: {
    type: Function,
    required: true
  },
  deleteEnvironmentVariable: {
    type: Function,
    required: true
  },
  onVariableNameChange: {
    type: Function,
    required: true
  },
  onVariableValueChange: {
    type: Function,
    required: true
  }
})

const environmentVariablesKeys = toRef(props, 'environmentVariablesKeys')

const handlePaste = (event) => {
  const oldLength = props.environmentVariablesKeys.length
  const clipboardText = event.clipboardData.getData('text')
  const lines = clipboardText.split('\n').filter(line => line.trim())
  const env_variables = lines
    .map(line => line.split('='))
    .filter(parts => parts.length === 2 && parts[0].trim())

  env_variables.forEach(([name, value], index) => {
    props.addEnvironmentVariable()
    props.onVariableNameChange(props.environmentVariablesKeys[oldLength + index], name.trim())
    props.onVariableValueChange(props.environmentVariablesKeys[oldLength + index], value.trim())
  })
}
</script>

<template>
  <Table :divider-between-rows="false" @paste="handlePaste">
    <template v-slot:header>
      <TableHeader align="center">{{ t('partials.envVarName') }}</TableHeader>
      <TableHeader align="center">{{ t('partials.envVarValue') }}</TableHeader>
      <TableHeader align="right" class="w-[80px]">{{ t('common.delete') }}</TableHeader>
    </template>
    <template v-slot:message>
      <TableMessage v-if="environmentVariablesKeys.length === 0" class="flex flex-col items-center">
        {{ t('partials.noEnvVars') }}<br />
        {{ t('partials.envVarsHint') }}<br />
        <FilledButton class="mt-3 max-w-fit" @click="addEnvironmentVariable">{{ t('partials.addEnvVar') }}</FilledButton>
      </TableMessage>
      <div v-else class="flex flex-row gap-3 px-4 pb-4 pt-2 text-sm text-gray-600">
        <FilledButton slim @click="addEnvironmentVariable">{{ t('partials.addEnvVar') }}</FilledButton>
        {{ t('partials.wantMoreEnvVars') }}
      </div>
    </template>
    <template v-slot:body>
      <EnvironmentVariableRow v-for="key in environmentVariablesKeys" :key="key" :variable-key="key"
        :variable-name="environmentVariablesMap[key]?.name" :delete-variable="deleteEnvironmentVariable"
        :on-variable-value-change="onVariableValueChange" :on-variable-name-change="onVariableNameChange"
        :variable-value="environmentVariablesMap[key]?.value" />
    </template>
  </Table>
</template>

<style scoped></style>
