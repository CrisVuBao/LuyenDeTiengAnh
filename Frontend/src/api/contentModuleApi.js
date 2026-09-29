import axiosClient from './axiosClient';

const contentModuleApi = {
  // Lấy danh sách các module đang hoạt động kèm tiến độ học viên
  getActiveModules: () => axiosClient.get('/v1/content-modules'),

  // Lấy chi tiết module theo mã định danh (kèm danh sách bài học)
  getModuleByCode: (code) => axiosClient.get(`/v1/content-modules/${code}`),

  // Cập nhật tiến độ học tập của người dùng vào module
  trackProgress: (data) => axiosClient.post('/v1/content-modules/progress', data),

  // Admin APIs
  getAllModulesAdmin: () => axiosClient.get('/v1/content-modules/admin/all'),
  toggleModuleStatusAdmin: (id, payload) => axiosClient.patch(`/v1/content-modules/admin/${id}/status`, payload)
};

export default contentModuleApi;
