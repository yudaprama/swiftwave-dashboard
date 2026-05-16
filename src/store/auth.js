import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import axios from 'axios'
import { getHttpBaseUrl } from '@/vendor/utils.js'
import { jwtDecode } from 'jwt-decode'
import moment from 'moment'

export const useAuthStore = defineStore('auth_details', () => {
  const IsLoggedIn = ref(false)
  const AccessToken = ref('')
  const IsLoggingInProgress = ref(false)
  const currentEmail = ref('')
  const currentRole = ref('')
  let currentTime = ref(Date.now())

  const isAdmin = computed(() => currentRole.value === 'admin')

  function FetchBearerToken() {
    if (IsLoggedIn.value) {
      return 'Bearer ' + AccessToken.value
    }
    return ''
  }

  function SetCredential(token) {
    AccessToken.value = token
    localStorage.setItem('token', token)
    IsLoggedIn.value = true
    IsLoggingInProgress.value = true
    // Extract role from JWT
    try {
      const decoded = jwtDecode(token)
      currentRole.value = decoded.role ?? ''
      currentEmail.value = decoded.email ?? decoded.username ?? ''
    } catch (e) {
      currentRole.value = ''
    }
    setTimeout(() => {
      IsLoggingInProgress.value = false
    }, 1000)
  }

  async function Login(email, password, totp) {
    let data = new FormData()
    data.append('email', email)
    data.append('password', password)
    data.append('totp', totp)

    // environment variable
    const HTTP_BASE_URL = getHttpBaseUrl()

    let config = {
      method: 'post',
      url: `${HTTP_BASE_URL}/auth/login`,
      data: data
    }

    try {
      const res = await axios.request(config)
      const resData = res.data
      SetCredential(resData.token)
      return {
        success: true,
        message: 'Logged in successfully !',
        totp_required: false
      }
    } catch (e) {
      if (e.response) {
        return {
          success: false,
          message: e.response.data.message || 'Unexpected error',
          totp_required: e.response.data.totp_required || false,
          email_verification_required: e.response.data.email_verification_required || false
        }
      } else {
        return {
          success: false,
          message: 'Failed to send request',
          totp_required: false
        }
      }
    }
  }

  async function Register(email, password) {
    const HTTP_BASE_URL = getHttpBaseUrl()

    try {
      const res = await axios.request({
        method: 'post',
        url: `${HTTP_BASE_URL}/auth/register`,
        headers: { 'Content-Type': 'application/json' },
        data: { email, password }
      })
      const resData = res.data
      return {
        success: true,
        message: resData.message || 'Registration successful. Please check your email to verify your account.'
      }
    } catch (e) {
      if (e.response) {
        return {
          success: false,
          message: e.response.data.message || 'Registration failed'
        }
      } else {
        return {
          success: false,
          message: 'Failed to send request'
        }
      }
    }
  }

  function Logout() {
    // logout
    IsLoggedIn.value = false
    localStorage.clear()
    IsLoggingInProgress.value = true
    // redirect to /
    setTimeout(() => {
      this.$router.push({ name: 'Login' }).then(() => {
        this.$router.go(0)
      })
    }, 500)
  }

  async function CheckAuthStatus() {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const HTTP_BASE_URL = getHttpBaseUrl()
        let config = {
          method: 'get',
          url: `${HTTP_BASE_URL}/verify-auth`,
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
        const res = await axios.request(config)
        return res.status === 200
      }
    } catch (e) {
      if (e.isAxiosError) {
        if (e.message.includes('Network Error')) {
          return true
        }
      }
      return false
    }
  }

  async function logoutOnInvalidToken(callback) {
    if (!IsLoggedIn.value) {
      return
    }
    const isTokenValid = await CheckAuthStatus()
    if (!isTokenValid) {
      callback()
    }
  }

  function StartAuthChecker(callback) {
    setInterval(() => logoutOnInvalidToken(callback), 5000)
  }

  const sessionRelativeTimeoutStatus = computed(() => {
    if (IsLoggedIn.value) {
      try {
        const token = localStorage.getItem('token')
        if (token) {
          const decoded = jwtDecode(token)
          currentEmail.value = decoded.email ?? decoded.username ?? ''
          currentRole.value = decoded.role ?? ''
          const exp = moment(new Date(decoded.exp * 1000))
          return moment.duration(exp.diff(currentTime.value)).humanize(true)
        }
      } catch (e) {
        return 'N/A'
      }
    }
    return ''
  })

  async function fetchSWVersion() {
    if (!IsLoggedIn.value) return '...'
    try {
      const HTTP_BASE_URL = getHttpBaseUrl()
      let config = {
        method: 'get',
        url: `${HTTP_BASE_URL}/version`,
        headers: {
          Authorization: FetchBearerToken()
        }
      }
      const res = await axios.request(config)
      return res.data
    } catch (e) {
      return 'N/A'
    }
  }

  setInterval(() => {
    currentTime.value = Date.now()
  }, 10000)
  return {
    IsLoggedIn,
    IsLoggingInProgress,
    FetchBearerToken,
    Login,
    Register,
    Logout,
    SetCredential,
    StartAuthChecker,
    sessionRelativeTimeoutStatus,
    fetchSWVersion,
    currentEmail,
    currentRole,
    isAdmin
  }
})
