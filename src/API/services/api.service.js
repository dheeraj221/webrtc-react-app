import apiClient from '../axios/apiClient'

export const startStreamingApi = ()=>{
  return apiClient.getRequest('/demo-streaming')
}
