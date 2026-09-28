import axiosClient from './axiosClient';

/**
 * Chuẩn hóa số điện thoại Việt Nam về định dạng 10 số (VD: 0912345678).
 */
export function normalizeVietnamPhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  let cleaned = rawPhone
    .trim()
    .replace(/[\s.\-()]/g, '');

  if (!cleaned) return '';

  if (cleaned.startsWith('+840')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('00840')) {
    cleaned = '0' + cleaned.slice(5);
  } else if (cleaned.startsWith('0084')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.length === 11 && cleaned.startsWith('84') && '235789'.includes(cleaned[2])) {
    cleaned = '0' + cleaned.slice(2);
  }

  return cleaned;
}

/**
 * Kiểm tra tính hợp lệ của số điện thoại Việt Nam.
 * @returns {{ valid: boolean, normalized: string, error: string | null }}
 */
export function validateVietnamPhone(rawPhone, isRequired = true) {
  const normalized = normalizeVietnamPhone(rawPhone);

  if (!normalized) {
    if (isRequired) {
      return {
        valid: false,
        normalized: '',
        error: 'Vui lòng nhập số điện thoại (dùng để đăng nhập bằng Email hoặc SĐT).'
      };
    }
    return { valid: true, normalized: '', error: null };
  }

  if (!/^[0-9]+$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: 'Số điện thoại chỉ được chứa chữ số (VD: 0912345678 hoặc +84912345678).'
    };
  }

  if (!normalized.startsWith('0')) {
    return {
      valid: false,
      normalized,
      error: 'Số điện thoại phải bắt đầu bằng số 0 hoặc +84 (VD: 0912345678).'
    };
  }

  if (!normalized.startsWith('02') && normalized.length !== 10) {
    return {
      valid: false,
      normalized,
      error: `Số điện thoại di động phải gồm đúng 10 chữ số (hiện tại: ${normalized.length} số).`
    };
  }

  if (!/^(0(3|5|7|8|9)[0-9]{8}|02[0-9]{8,9})$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: 'Đầu số không hợp lệ. Vui lòng nhập đầu số nhà mạng Việt Nam (03, 05, 07, 08, 09).'
    };
  }

  return { valid: true, normalized, error: null };
}

const authApi = {
  login: (data) => axiosClient.post('/account/login', data),
  register: (data) => axiosClient.post('/account/register', data),
  logout: () => axiosClient.post('/account/logout'),
  getProfile: () => axiosClient.get('/account/profile'),
  updateProfile: (data) => axiosClient.put('/account/profile', data),
  checkAvailability: (params) =>
    axiosClient.get('/account/check-availability', { params, skipDedup: true })
};

export default authApi;

