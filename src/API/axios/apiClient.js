import axios from 'axios'

class ApiClient {
  constructor (axiosInst) {
    this.axios = axiosInst
  }

  makeRequest = (url, method, data = {}) => this.axios({
    url,
    method,
    data
  })

  getRequest = (url) => this.makeRequest(url, 'GET')

  putRequest = (url, config) => this.makeRequest(url, 'PUT', config)

  patchRequest = (url, config) => this.makeRequest(url, 'PATCH', config)

  postRequest = (url, config) => this.makeRequest(url, 'POST', config)

  deleteRequest = (url, config) => this.makeRequest(url, 'DELETE', config)
}

// Create axios Instance
const axiosInst = axios.create({
  baseURL: process.env.REACT_APP_API_URL

})

// Adding axios request interceptor
axiosInst.interceptors.request.use(
  (request) => {
    const token = localStorage.getItem('authtoken')
    if (token) {
      request.headers.authorization = 'Bearer ' + token
    }
    request.headers['Content-Type'] = 'application/json'
    return request
  },
  (error) => {
    console.log(error)
    Promise.reject(error)
  }
)

// Adding axios request interceptor
axiosInst.interceptors.response.use(
  (res) => res.data,
  (error) => {
    console.log(error)
    Promise.reject(error)
  }
)

export default new ApiClient(axiosInst)
