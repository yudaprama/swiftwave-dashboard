import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApolloClient } from '@vue/apollo-composable'
import gql from 'graphql-tag'

export const useBillingStore = defineStore('billing', () => {
  const subscription = ref(null)
  const plans = ref([])
  const invoices = ref([])
  const quotaUsage = ref(null)
  const usageHistory = ref([])
  const currentOverage = ref({ overageMemoryMb: 0, overageCents: 0 })
  const loading = ref(false)

  const currentPlan = computed(() => subscription.value?.plan ?? null)
  const isActive = computed(() => subscription.value?.status === 'active')
  const isPastDue = computed(() => subscription.value?.status === 'past_due')
  const isSuspended = computed(() => subscription.value?.status === 'suspended')

  async function fetchPlans() {
    try {
      const { resolveClient } = useApolloClient()
      const client = resolveClient()
      const { data } = await client.query({
        query: gql`
          query {
            plans {
              id
              name
              slug
              description
              priceCents
              isDefault
              isActive
              maxApplications
              maxDomains
              maxPVs
              maxGitCreds
              maxImageCreds
              maxAppGroups
              maxMemoryMb
              maxCPUShares
            }
          }
        `,
        fetchPolicy: 'network-only'
      })
      plans.value = data.plans
    } catch (e) {
      console.error('Failed to fetch plans:', e)
    }
  }

  async function fetchSubscription() {
    try {
      const { resolveClient } = useApolloClient()
      const client = resolveClient()
      const { data } = await client.query({
        query: gql`
          query {
            currentSubscription {
              id
              status
              currentPeriodStart
              currentPeriodEnd
              cancelAtPeriodEnd
              createdAt
              updatedAt
              plan {
                id
                name
                slug
                priceCents
                isDefault
                maxApplications
                maxDomains
                maxPVs
                maxGitCreds
                maxImageCreds
                maxAppGroups
                maxMemoryMb
                maxCPUShares
              }
            }
          }
        `,
        fetchPolicy: 'network-only'
      })
      subscription.value = data.currentSubscription
    } catch (e) {
      subscription.value = null
    }
  }

  async function fetchQuotaUsage() {
    try {
      const { resolveClient } = useApolloClient()
      const client = resolveClient()
      const { data } = await client.query({
        query: gql`
          query {
            quotaUsage {
              applications { current limit }
              domains { current limit }
              persistentVolumes { current limit }
              gitCredentials { current limit }
              imageRegistryCredentials { current limit }
              applicationGroups { current limit }
              totalMemoryMB { current limit }
            }
          }
        `,
        fetchPolicy: 'network-only'
      })
      quotaUsage.value = data.quotaUsage
    } catch (e) {
      quotaUsage.value = null
    }
  }

  async function fetchInvoices() {
    try {
      const { resolveClient } = useApolloClient()
      const client = resolveClient()
      const { data } = await client.query({
        query: gql`
          query {
            invoices {
              id
              amountCents
              currency
              status
              description
              xenditInvoiceUrl
              dueDate
              paidAt
              periodStart
              periodEnd
              createdAt
            }
          }
        `,
        fetchPolicy: 'network-only'
      })
      invoices.value = data.invoices
    } catch (e) {
      invoices.value = []
    }
  }

  async function fetchUsageHistory(limit = 30) {
    try {
      const { resolveClient } = useApolloClient()
      const client = resolveClient()
      const { data } = await client.query({
        query: gql`
          query($limit: Int) {
            usageHistory(limit: $limit) {
              id
              periodStart
              periodEnd
              applications
              domains
              persistentVolumes
              gitCredentials
              imageCreds
              appGroups
              usedMemoryMb
              overageMemoryMb
              overageCents
              createdAt
            }
          }
        `,
        variables: { limit },
        fetchPolicy: 'network-only'
      })
      usageHistory.value = data.usageHistory
    } catch (e) {
      usageHistory.value = []
    }
  }

  async function fetchCurrentOverage() {
    try {
      const { resolveClient } = useApolloClient()
      const client = resolveClient()
      const { data } = await client.query({
        query: gql`
          query {
            currentOverage {
              overageMemoryMb
              overageCents
            }
          }
        `,
        fetchPolicy: 'network-only'
      })
      currentOverage.value = data.currentOverage
    } catch (e) {
      currentOverage.value = { overageMemoryMb: 0, overageCents: 0 }
    }
  }

  async function upgradePlan(planId) {
    try {
      const { resolveClient } = useApolloClient()
      const client = resolveClient()
      const { data } = await client.mutate({
        mutation: gql`
          mutation($planId: Uint!) {
            upgradePlan(planId: $planId) {
              id
              xenditInvoiceUrl
              status
            }
          }
        `,
        variables: { planId }
      })
      await fetchSubscription()
      await fetchQuotaUsage()
      return { success: true, invoice: data.upgradePlan }
    } catch (e) {
      return { success: false, message: e.message }
    }
  }

  async function cancelSubscription() {
    try {
      const { resolveClient } = useApolloClient()
      const client = resolveClient()
      await client.mutate({
        mutation: gql`
          mutation {
            cancelSubscription
          }
        `
      })
      await fetchSubscription()
      return { success: true }
    } catch (e) {
      return { success: false, message: e.message }
    }
  }

  return {
    subscription,
    plans,
    invoices,
    quotaUsage,
    usageHistory,
    currentOverage,
    loading,
    currentPlan,
    isActive,
    isPastDue,
    isSuspended,
    fetchPlans,
    fetchSubscription,
    fetchQuotaUsage,
    fetchInvoices,
    fetchUsageHistory,
    fetchCurrentOverage,
    upgradePlan,
    cancelSubscription
  }
})
