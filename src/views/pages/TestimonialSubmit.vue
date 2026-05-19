<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { toast } from 'vue-sonner'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const rating = ref(0)
const hoverRating = ref(0)
const text = ref('')
const submitted = ref(false)
const existingTestimonial = ref(null)
const voucherCode = ref(null)
const loading = ref(true)

const { result: myResult, onResult } = useQuery(gql`
  query {
    myTestimonial {
      id
      rating
      text
      status
      voucherCode
      createdAt
    }
  }
`)

onResult(({ data }) => {
  loading.value = false
  if (data?.myTestimonial) {
    existingTestimonial.value = data.myTestimonial
    submitted.value = true
    if (data.myTestimonial.voucherCode) {
      voucherCode.value = data.myTestimonial.voucherCode
    }
  } else {
    loading.value = false
  }
})

const { mutate: submitTestimonial, loading: submitting, onDone, onError } = useMutation(gql`
  mutation SubmitTestimonial($input: TestimonialInput!) {
    submitTestimonial(input: $input) {
      id
      rating
      text
      status
      voucherCode
      createdAt
    }
  }
`)

onDone(({ data }) => {
  const result = data.submitTestimonial
  existingTestimonial.value = result
  submitted.value = true
  if (result.voucherCode) {
    voucherCode.value = result.voucherCode
    toast.success(t('testimonial.voucherReward', { code: result.voucherCode }))
  } else {
    toast.success(t('testimonial.submitSuccess'))
  }
})

onError((error) => {
  toast.error(error.message)
})

const handleSubmit = () => {
  if (rating.value < 1 || rating.value > 5) {
    toast.error(t('testimonial.ratingRequired'))
    return
  }
  if (text.value.trim().length < 10) {
    toast.error(t('testimonial.textTooShort'))
    return
  }
  submitTestimonial({
    input: {
      rating: rating.value,
      text: text.value.trim()
    }
  })
}

const statusLabel = computed(() => {
  if (!existingTestimonial.value) return ''
  switch (existingTestimonial.value.status) {
    case 'pending': return t('testimonial.statusPending')
    case 'approved': return t('testimonial.statusApproved')
    case 'rejected': return t('testimonial.statusRejected')
    default: return existingTestimonial.value.status
  }
})

const statusColor = computed(() => {
  if (!existingTestimonial.value) return ''
  switch (existingTestimonial.value.status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'approved': return 'bg-green-100 text-green-800'
    case 'rejected': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
})
</script>

<template>
  <div class="p-6">
    <h1 class="mb-6 text-2xl font-bold text-gray-900">{{ t('testimonial.title') }}</h1>

    <div v-if="loading" class="text-gray-500">{{ t('common.loading') }}</div>

    <!-- Already submitted -->
    <div v-else-if="submitted && existingTestimonial" class="space-y-4">
      <div class="rounded-lg border bg-white p-6 shadow-sm">
        <div class="mb-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-lg">
              {{ '★'.repeat(existingTestimonial.rating) }}{{ '☆'.repeat(5 - existingTestimonial.rating) }}
            </span>
            <span :class="['rounded-full px-3 py-1 text-xs font-medium', statusColor]">
              {{ statusLabel }}
            </span>
          </div>
          <span class="text-sm text-gray-500">
            {{ new Date(existingTestimonial.createdAt).toLocaleDateString() }}
          </span>
        </div>
        <p class="text-gray-700">{{ existingTestimonial.text }}</p>
      </div>

      <!-- Voucher code -->
      <div v-if="voucherCode" class="rounded-lg border-2 border-dashed border-green-300 bg-green-50 p-6">
        <p class="mb-2 text-sm font-medium text-green-800">{{ t('testimonial.voucherTitle') }}</p>
        <p class="mb-1 font-mono text-2xl font-bold text-green-900">{{ voucherCode }}</p>
        <p class="text-sm text-green-700">{{ t('testimonial.voucherExpires') }}</p>
      </div>
    </div>

    <!-- Submit form -->
    <div v-else class="rounded-lg border bg-white p-6 shadow-sm">
      <p class="mb-6 text-gray-600">{{ t('testimonial.description') }}</p>

      <!-- Star rating -->
      <div class="mb-6">
        <label class="mb-2 block text-sm font-medium text-gray-700">{{ t('testimonial.ratingLabel') }}</label>
        <div class="flex gap-1">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            class="text-3xl transition-colors"
            :class="(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-300'"
            @mouseenter="hoverRating = star"
            @mouseleave="hoverRating = 0"
            @click="rating = star">
            ★
          </button>
        </div>
      </div>

      <!-- Text -->
      <div class="mb-6">
        <label class="mb-2 block text-sm font-medium text-gray-700">{{ t('testimonial.textLabel') }}</label>
        <textarea
          v-model="text"
          rows="4"
          class="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          :placeholder="t('testimonial.textPlaceholder')"></textarea>
      </div>

      <!-- Incentive notice -->
      <div class="mb-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
        {{ t('testimonial.incentiveNotice') }}
      </div>

      <button
        class="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        :disabled="submitting"
        @click="handleSubmit">
        {{ submitting ? t('common.submitting') : t('testimonial.submit') }}
      </button>
    </div>
  </div>
</template>
