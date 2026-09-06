import axiosClient from './axiosClient';

const authApi = {
  login: (data) => axiosClient.post('/account/login', data),
  register: (data) => axiosClient.post('/account/register', data),
  logout: () => axiosClient.post('/account/logout'),
  getProfile: () => axiosClient.get('/account/profile')
};

export default authApi;
