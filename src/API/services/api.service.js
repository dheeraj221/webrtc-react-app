import apiClient from '../axios/apiClient'

export const getActiveChannelsApi = ()=>{
  return apiClient.getRequest('/active-channels')
}
