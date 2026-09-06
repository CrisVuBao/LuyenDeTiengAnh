import axiosClient from './axiosClient';

const toeicApi = {
  getAllTests: () => axiosClient.get('/toeictest'),
  getTestById: (id) => axiosClient.get(`/toeictest/${id}`),
  getTestByCode: (code) => axiosClient.get(`/toeictest/by-code/${code}`),
  deleteTest: (id) => axiosClient.delete(`/toeictest/${id}`),
  bulkImport: (jsonContent) => axiosClient.post('/toeictest/bulk-import', jsonContent)
};

export default toeicApi;
