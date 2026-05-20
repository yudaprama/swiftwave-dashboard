<script setup>
import { ref, computed, watch } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const statusFilter = ref('pending');

const { result, loading, refetch } = useQuery(
  gql`
    query GetTestimonials($status: TestimonialStatus!) {
      testimonials(status: $status) {
        id
        rating
        text
        status
        createdAt
      }
    }
  `,
  {
    status: statusFilter.value
  },
  {
    fetchPolicy: 'network-only'
  }
);

watch(statusFilter, () => {
  refetch({ status: statusFilter.value });
});

const testimonials = computed(() => result.value?.testimonials || []);

const { mutate: updateStatus } = useMutation(gql`
  mutation UpdateTestimonialStatus($id: Uint!, $status: TestimonialStatus!) {
    updateTestimonialStatus(id: $id, status: $status)
  }
`);

const approve = async (id) => {
  const { data } = await updateStatus({ id, status: 'approved' });
  if (data?.updateTestimonialStatus) {
    toast.success(t('testimonial.approved'));
    refetch({ status: statusFilter.value });
  }
};

const reject = async (id) => {
  const { data } = await updateStatus({ id, status: 'rejected' });
  if (data?.updateTestimonialStatus) {
    toast.success(t('testimonial.rejected'));
    refetch({ status: statusFilter.value });
  }
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
};

const statusBadgeColor = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
</script>

<template>
  <div class="p-6">
    <h1 class="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">{{ t('testimonial.managementTitle') }}</h1>

    <!-- Filter -->
    <div class="mb-4 flex gap-2">
      <button
        v-for="s in ['pending', 'approved', 'rejected']"
        :key="s"
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        :class="
          statusFilter === s
            ? 'bg-primary-600 text-white'
            : 'dark:bg-secondary-700 dark:hover:bg-secondary-600 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:text-gray-300'
        "
        @click="statusFilter = s">
        {{ s.charAt(0).toUpperCase() + s.slice(1) }}
      </button>
    </div>

    <div v-if="loading" class="text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</div>

    <div v-else-if="testimonials.length === 0" class="text-gray-500 dark:text-gray-400">
      {{ t('testimonial.noTestimonials') }}
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="item in testimonials"
        :key="item.id"
        class="dark:bg-secondary-800 rounded-lg border bg-white p-5 shadow-sm dark:border-gray-700">
        <div class="mb-3 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-lg">{{ '★'.repeat(item.rating) }}{{ '☆'.repeat(5 - item.rating) }}</span>
            <span :class="['rounded-full px-3 py-1 text-xs font-medium', statusBadgeColor(item.status)]">
              {{ item.status }}
            </span>
          </div>
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(item.createdAt) }}</span>
        </div>
        <p class="mb-4 text-gray-700 dark:text-gray-300">{{ item.text }}</p>
        <div v-if="item.status === 'pending'" class="flex gap-2">
          <button
            type="button"
            class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            @click="approve(item.id)">
            {{ t('testimonial.approve') }}
          </button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            @click="reject(item.id)">
            {{ t('testimonial.rejectBtn') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
