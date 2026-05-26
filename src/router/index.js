import { createRouter, createWebHistory } from 'vue-router'
import UnderMaintenancePage from '@/views/pages/UnderMaintenance.vue'
import LoginView from '@/views/pages/LoginView.vue'
import AuthCallbackView from '@/views/pages/AuthCallbackView.vue'
import DeployApplicationPage from '@/views/pages/DeployApplication.vue'
import DeployStackPage from '@/views/pages/DeployStack.vue'
import AppStorePage from '@/views/pages/AppStore.vue'
import AppInstallPage from '@/views/pages/AppInstall.vue'
import DeploymentPlansPage from '@/views/pages/DeploymentPlans.vue'
import ApplicationsPage from '@/views/pages/ApplicationManagement.vue'
import ApplicationDetailsPage from '@/views/pages/ApplicationDetails.vue'
import ApplicationDetailsDeploymentListPage from '@/views/pages/ApplicationDetails/DeploymentList.vue'
import ApplicationDetailsDeploymentDetailsPage from '@/views/pages/ApplicationDetails/DeploymentDetails.vue'
import ApplicationDetailsRuntimeLogsPage from '@/views/pages/ApplicationDetails/RuntimeLogs.vue'
import ApplicationDetailsIngressRulesPage from '@/views/pages/ApplicationDetails/IngressRules.vue'
import ApplicationDetailsUpdateSourcePage from '@/views/pages/ApplicationDetails/UpdateSourceCode.vue'
import ApplicationDetailsEnvironmentVariablesPage from '@/views/pages/ApplicationDetails/EnvironmentVariables.vue'
import ApplicationDetailsConfigMountsPage from '@/views/pages/ApplicationDetails/ConfigMounts.vue'
import ApplicationDetailsPersistentVolumesPage from '@/views/pages/ApplicationDetails/PersistentVolumes.vue'
import ApplicationDetailsDeploymentConfigPage from '@/views/pages/ApplicationDetails/DeploymentConfig.vue'
import ApplicationDetailsDangerZonePage from '@/views/pages/ApplicationDetails/Destroy.vue'
import ApplicationDetailsManagePage from '@/views/pages/ApplicationDetails/Manage.vue'
import ApplicationDetailsWebhookCIPage from '@/views/pages/ApplicationDetails/WebhookCI.vue'
import ApplicationDetailsResourceStatsPage from '@/views/pages/ApplicationDetails/ResourceStats.vue'
import PersistentVolumeManagementPage from '@/views/pages/PersistentVolumeManagement.vue'
import UserManagementPage from '@/views/pages/UsersManagement.vue'
import GitCredentialManagementPage from '@/views/pages/GitCredentialManagement.vue'
import ImageRegistryCredentialManagementPage from '@/views/pages/ImageRegistryCredentialManagement.vue'
import MCPApiKeyManagementPage from '@/views/pages/MCPApiKeyManagement.vue'
import DomainManagementPage from '@/views/pages/DomainManagement.vue'
import RedirectRuleManagementPage from '@/views/pages/RedirectRuleManagement.vue'
import IngressRuleManagementPage from '@/views/pages/IngressRuleManagement.vue'
import VerifyEmailView from '@/views/pages/VerifyEmailView.vue'
import PlanSelectionPage from '@/views/pages/PlanSelection.vue'
import BillingManagementPage from '@/views/pages/BillingManagement.vue'
import UsageOverviewPage from '@/views/pages/UsageOverview.vue'
import TestimonialSubmitPage from '@/views/pages/TestimonialSubmit.vue'
import TestimonialManagementPage from '@/views/pages/TestimonialManagement.vue'
import BackendServiceManagementPage from '@/views/pages/BackendServiceManagement.vue'
import BackendCollectionsPage from '@/views/pages/BackendCollections.vue'
import BackendRecordsPage from '@/views/pages/BackendRecords.vue'
import BackendUtilitiesPage from '@/views/pages/BackendUtilities.vue'

import SystemLogsPage from '@/views/pages/SystemLogs.vue'
import AppAuthBasicAccessControlList from '@/views/pages/AppAuthBasicAccessControlList.vue'
import ApplicationGroupDetailsPage from '@/views/pages/ApplicationGroupDetails.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/maintenance',
      name: 'Maintenance',
      component: UnderMaintenancePage
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginView
    },
    {
      path: '/auth/callback',
      name: 'Auth Callback',
      component: AuthCallbackView
    },
    {
      path: '/register',
      redirect: '/login'
    },
    {
      path: '/verify-email',
      name: 'Verify Email',
      component: VerifyEmailView
    },
    {
      path: '',
      redirect: '/applications'
    },

    {
      path: '/deploy',
      meta: { breadcrumb: 'sidebar.deployApplication' },
      children: [
        {
          path: 'application',
          name: 'Deploy Application',
          component: DeployApplicationPage,
          meta: { breadcrumb: 'sidebar.deployApp' }
        },
        {
          path: 'stack',
          name: 'Deploy Stack',
          component: DeployStackPage,
          meta: { breadcrumb: 'sidebar.deployStack' }
        },
        {
          path: 'app-store',
          name: 'App Store',
          component: AppStorePage,
          meta: { breadcrumb: 'sidebar.appStore' }
        },
        {
          path: 'app-store/install',
          name: 'Install from App Store',
          component: AppInstallPage,
          meta: { breadcrumb: 'sidebar.appStore' }
        },
        {
          path: 'deployment-plans',
          name: 'Deployment Plans',
          component: DeploymentPlansPage,
          meta: { breadcrumb: 'sidebar.deploymentPlans' }
        }
      ]
    },
    {
      path: '/applications',
      name: 'Applications',
      component: ApplicationsPage,
      meta: { breadcrumb: 'sidebar.applications' }
    },
    {
      path: '/application/:id',
      name: 'Application Details',
      component: ApplicationDetailsPage,
      meta: { breadcrumb: 'applications.deployedServices' },
      children: [
        {
          path: 'deployments',
          name: 'Application Details Deployments',
          component: ApplicationDetailsDeploymentListPage,
          meta: { breadcrumb: 'applicationDetails.deployments' }
        },
        {
          path: 'deployment/:deployment_id',
          name: 'Application Deployment Details',
          component: ApplicationDetailsDeploymentDetailsPage,
          meta: { breadcrumb: 'applicationDetails.deployments' }
        },
        {
          path: 'runtime_logs',
          name: 'Application Details Runtime Logs',
          component: ApplicationDetailsRuntimeLogsPage,
          meta: { breadcrumb: 'applicationDetails.logs' }
        },
        {
          path: 'ingress_rules',
          name: 'Application Details Ingress Rules',
          component: ApplicationDetailsIngressRulesPage,
          meta: { breadcrumb: 'ingressRules.title' }
        },
        {
          path: 'update_source',
          name: 'Application Details Update Source',
          component: ApplicationDetailsUpdateSourcePage,
          meta: { breadcrumb: 'applicationDetails.updateSource' }
        },
        {
          path: 'environment_variables',
          name: 'Application Details Environment Variables',
          component: ApplicationDetailsEnvironmentVariablesPage,
          meta: { breadcrumb: 'deploy.environmentVariables' }
        },
        {
          path: 'persistent_volumes',
          name: 'Application Details Persistent Volumes',
          component: ApplicationDetailsPersistentVolumesPage,
          meta: { breadcrumb: 'persistentVolumes.title' }
        },
        {
          path: 'config_mounts',
          name: 'Application Details Config Mounts',
          component: ApplicationDetailsConfigMountsPage,
          meta: { breadcrumb: 'applicationDetails.configMounts' }
        },
        {
          path: 'deployment_config',
          name: 'Application Details Deployment Config',
          component: ApplicationDetailsDeploymentConfigPage,
          meta: { breadcrumb: 'deploy.dockerConfiguration' }
        },
        {
          path: 'danger_zone',
          name: 'Application Details Danger Zone',
          component: ApplicationDetailsDangerZonePage,
          meta: { breadcrumb: 'applicationDetails.destroy' }
        },
        {
          path: 'manage',
          name: 'Application Details Manage',
          component: ApplicationDetailsManagePage,
          meta: { breadcrumb: 'common.actions' }
        },
        {
          path: 'webhook_ci',
          name: 'Application Details Webhook CI',
          component: ApplicationDetailsWebhookCIPage,
          meta: { breadcrumb: 'applicationDetails.webhook' }
        },
        {
          path: 'resource_stats',
          name: 'Application Details Resource Stats',
          component: ApplicationDetailsResourceStatsPage,
          meta: { breadcrumb: 'servers.analytics' }
        }
      ]
    },
    {
      path: '/application_group/:id',
      name: 'Application Group Details',
      component: ApplicationGroupDetailsPage,
      meta: { breadcrumb: 'sidebar.applications' }
    },
    {
      path: '/app_auth',
      children: [
        {
          path: 'basic_authentication',
          name: 'Application Auth Basic ACL',
          component: AppAuthBasicAccessControlList,
          meta: { breadcrumb: 'sidebar.basicAuthentication' }
        }
      ]
    },
    {
      path: '/persistent-volumes',
      name: 'Persistent Volumes',
      component: PersistentVolumeManagementPage,
      meta: { breadcrumb: 'sidebar.persistentVolumes' }
    },
    {
      path: '/users',
      name: 'Users',
      component: UserManagementPage,
      meta: { breadcrumb: 'sidebar.manageUsers' }
    },
    {
      path: '/git-credentials',
      name: 'Git Credentials',
      component: GitCredentialManagementPage,
      meta: { breadcrumb: 'sidebar.gitCredentials' }
    },
    {
      path: '/image-registry-credentials',
      name: 'Image Registry Credentials',
      component: ImageRegistryCredentialManagementPage,
      meta: { breadcrumb: 'sidebar.imageRegCredentials' }
    },
    {
      path: '/mcp-api-keys',
      name: 'MCP API Keys',
      component: MCPApiKeyManagementPage,
      meta: { breadcrumb: 'sidebar.mcpApiKeys' }
    },
    {
      path: '/domains',
      name: 'Domains',
      component: DomainManagementPage,
      meta: { breadcrumb: 'sidebar.domains' }
    },
    {
      path: '/redirect-rules',
      name: 'Redirect Rules',
      component: RedirectRuleManagementPage,
      meta: { breadcrumb: 'sidebar.redirectRules' }
    },
    {
      path: '/ingress-rules',
      name: 'Ingress Rules',
      component: IngressRuleManagementPage,
      meta: { breadcrumb: 'sidebar.ingressRules' }
    },
    {
      path: '/logs',
      name: 'System Logs',
      component: SystemLogsPage,
      meta: { breadcrumb: 'sidebar.systemLogs' }
    },
    {
      path: '/plans',
      name: 'Plans',
      component: PlanSelectionPage,
      meta: { breadcrumb: 'plans.title' }
    },
    {
      path: '/billing',
      name: 'Billing',
      component: BillingManagementPage,
      meta: { breadcrumb: 'billing.title' }
    },
    {
      path: '/usage',
      name: 'Usage',
      component: UsageOverviewPage,
      meta: { breadcrumb: 'sidebar.usage' }
    },
    {
      path: '/testimonial',
      name: 'Testimonial',
      component: TestimonialSubmitPage,
      meta: { breadcrumb: 'sidebar.shareFeedback' }
    },
    {
      path: '/testimonials',
      name: 'Testimonials',
      component: TestimonialManagementPage,
      meta: { breadcrumb: 'sidebar.testimonials' }
    },
    {
      path: '/backends',
      name: 'Backend Services',
      component: BackendServiceManagementPage,
      meta: { breadcrumb: 'sidebar.backends' }
    },
    {
      path: '/backend/:id/collections',
      name: 'Backend Collections',
      component: BackendCollectionsPage,
      meta: { breadcrumb: 'backends.collections' }
    },
    {
      path: '/backend/:id/collections/:collectionName/records',
      name: 'Backend Records',
      component: BackendRecordsPage,
      meta: { breadcrumb: 'backends.records' }
    },
    {
      path: '/backend/:id/utilities',
      name: 'Backend Utilities',
      component: BackendUtilitiesPage,
      meta: { breadcrumb: 'backends.utilities' }
    }
  ]
})

export default router
