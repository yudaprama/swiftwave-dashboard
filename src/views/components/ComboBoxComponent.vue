<script setup>
import { computed, ref, watch } from 'vue';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const props = defineProps({
  value: {
    type: String,
    required: true
  },
  options: {
    type: Array,
    required: true
  },
  newOptionData: {
    type: Function,
    required: false,
    default: (e) => e
  },
  valueFromOption: {
    type: Function,
    required: false,
    default: (e) => e
  },
  titleFromOption: {
    type: Function,
    required: false,
    default: (e) => e
  },
  onChange: {
    type: Function,
    required: false,
    default: () => {}
  },
  onNewOption: {
    type: Function,
    required: false,
    default: () => {}
  }
});

const selectedOptionValue = ref(props.value);
const query = ref('');
const optionsIncludingQuery = computed(() => {
  if (!query.value) return props.options;
  if (props.options.includes(query.value)) return props.options;
  return [props.newOptionData(query.value), ...props.options];
});

const filteredOptions = computed(() =>
  !query.value
    ? optionsIncludingQuery.value
    : optionsIncludingQuery.value.filter((op) => {
        return props.titleFromOption(op).toLowerCase().includes(query.value.toLowerCase());
      })
);
const getDisplayValue = (i) => {
  for (let j = 0; j < props.options.length; j++) {
    if (props.valueFromOption(props.options[j]) === i) return props.titleFromOption(props.options[j]);
  }
  if (query.value) {
    const data = props.newOptionData(query.value);
    if (props.valueFromOption(data) === i) return props.titleFromOption(data);
  }
  return '';
};

watch(selectedOptionValue, (newValue) => {
  props.onChange(newValue);
  if (newValue === 'new_group' && query.value) props.onNewOption(query.value);
});
</script>

<template>
  <Combobox v-model="selectedOptionValue">
    <div
      class="hover:border-primary-500 focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-700 relative w-full overflow-hidden rounded-md border border-gray-400 shadow-sm transition-all delay-75 sm:text-sm dark:border-gray-600">
      <ComboboxInput
        :display-value="(i) => getDisplayValue(i)"
        @change="query = $event.target.value"
        placeholder="Start typing to filter..."
        class="dark:bg-secondary-700 w-full border-none text-sm text-gray-900 focus:ring-0 dark:text-gray-100 dark:placeholder-gray-400" />
      <ComboboxButton class="absolute inset-y-0 right-0 flex items-center pr-2">
        <font-awesome-icon icon="fa-solid fa-caret-down" class="h-5 w-5 text-gray-400" aria-hidden="true" />
      </ComboboxButton>
    </div>

    <ComboboxOptions
      class="scrollbox border-secondary-200 dark:bg-secondary-800 mt-1 max-h-40 overflow-x-hidden overflow-y-auto rounded-md border-2 bg-white shadow-sm dark:border-gray-700">
      <ComboboxOption
        v-for="op in filteredOptions"
        :key="valueFromOption(op)"
        :value="valueFromOption(op)"
        class="hover:bg-primary-500 dark:hover:bg-primary-600 flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-900 hover:text-white dark:text-gray-100">
        <span>{{ titleFromOption(op) }}</span>
        <font-awesome-icon icon="fa-solid fa-check" v-show="valueFromOption(op) === selectedOptionValue" />
      </ComboboxOption>
    </ComboboxOptions>
  </Combobox>
</template>
