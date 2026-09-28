import api from './axiosClient';

const vocabApi = {
  getProgress: async () => {
    const res = await api.get('/api/userprogress/vocab');
    return res.data;
  },

  saveProgress: async (data) => {
    const res = await api.post('/api/userprogress/vocab', data);
    return res.data;
  }
};

export default vocabApi;
