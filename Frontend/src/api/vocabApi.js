import api from './axiosClient';

const vocabApi = {
  getProgress: async () => {
    const res = await api.get('/userprogress/vocab');
    return res?.data ?? res;
  },

  saveProgress: async (data) => {
    const res = await api.post('/userprogress/vocab', data);
    return res?.data ?? res;
  }
};

export default vocabApi;
