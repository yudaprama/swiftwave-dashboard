<script setup>
import { computed } from 'vue'
import { formatTimestampHumannize } from '@/vendor/utils.js'
import { useThemeStore } from '@/store/theme.js'

const themeStore = useThemeStore()

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  series: {
    type: Array,
    required: true
  },
  toolbar: {
    type: Boolean,
    required: false,
    default: true
  },
  yAxisFormatter: {
    type: Function,
    required: false,
    default: (value) => value
  },
  yAxisMinimumMax: {
    type: Number,
    default: 0,
    required: false
  }
})

const isDark = computed(() => themeStore.isDark)

const chartOptions = computed(() => ({
  theme: {
    mode: isDark.value ? 'dark' : 'light'
  },
  chart: {
    background: isDark.value ? '#1f2937' : 'transparent',
    toolbar: {
      show: props.toolbar
    }
  },
  grid: {
    borderColor: isDark.value ? '#374151' : '#e5e7eb'
  },
  tooltip: {
    x: {
      formatter: formatTimestampHumannize
    }
  },
  animations: {
    enabled: false,
    initialAnimation: {
      enabled: false
    }
  },
  zoom: {
    autoScaleYaxis: false
  },
  markers: {
    size: 0
  },
  dataLabels: {
    enabled: false
  },
  yaxis: {
    tickAmount: 1,
    min: 0,
    max: (val) => Math.max(val, props.yAxisMinimumMax),
    labels: {
      show: true,
      formatter: props.yAxisFormatter,
      style: {
        colors: isDark.value ? '#9ca3af' : '#6b7280'
      }
    }
  },
  xaxis: {
    type: 'datetime',
    tickAmount: 1,
    labels: {
      show: true,
      style: {
        colors: isDark.value ? '#9ca3af' : '#6b7280'
      }
    }
  },
  stroke: {
    curve: 'smooth',
    width: 2
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'light',
      shadeIntensity: 1,
      opacityFrom: 0.2,
      opacityTo: 0.6,
      stops: [0, 100]
    }
  }
}))
</script>

<template>
  <div class="w-full">
    <p class="wrap-break-word text-sm font-medium">{{ title }}</p>
    <apexchart
      class="w-full"
      height="200"
      type="area"
      :options="chartOptions"
      :series="series"></apexchart>
  </div>
</template>

<style scoped></style>
