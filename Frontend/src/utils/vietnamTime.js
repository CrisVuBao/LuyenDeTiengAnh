// Chuyển đổi và định dạng thời gian chuẩn xác 100% theo giờ Việt Nam (GMT+7 - Asia/Ho_Chi_Minh)
export function formatVietnamDateTime(dateInput) {
  if (!dateInput) return null;
  try {
    let date;
    if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      let dateStr = String(dateInput).trim();
      if (
        (dateStr.includes('T') || dateStr.includes(' ')) &&
        !dateStr.endsWith('Z') &&
        !dateStr.includes('+') &&
        !dateStr.slice(10).includes('-')
      ) {
        dateStr = dateStr.replace(' ', 'T') + 'Z';
      }
      date = new Date(dateStr);
    }

    if (isNaN(date.getTime()) || date.getFullYear() < 2000) return null;

    // Nếu mốc thời gian bị lệch vượt quá hiện tại hơn 5 phút (do cộng lặp múi giờ +7h trước đó), tự động chuẩn hóa lại đúng giờ thực
    if (date.getTime() > Date.now() + 5 * 60 * 1000) {
      date = new Date(date.getTime() - 7 * 3600 * 1000);
    }

    const vnFormatter = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = vnFormatter.formatToParts(date);
    const getPart = (type) => parts.find((p) => p.type === type)?.value || '00';

    const day = getPart('day');
    const month = getPart('month');
    const year = getPart('year');
    const hour = getPart('hour');
    const minute = getPart('minute');
    const second = getPart('second');

    const datePart = `${day}/${month}/${year}`;
    const timePart = `${hour}:${minute}:${second}`;
    const timeShort = `${hour}:${minute}`;

    const nowMs = Date.now();
    const diffMs = nowMs - date.getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    let relativeText = '';
    if (diffSec < 60) {
      relativeText = 'Vừa xong';
    } else if (diffMin < 60) {
      relativeText = `${diffMin} phút trước`;
    } else if (diffHour < 24) {
      relativeText = `${diffHour} giờ trước`;
    } else if (diffDay === 1) {
      relativeText = 'Hôm qua';
    } else if (diffDay < 30) {
      relativeText = `${diffDay} ngày trước`;
    } else {
      relativeText = datePart;
    }

    return {
      datePart,
      timePart,
      timeShort,
      relativeText,
      isRecent: diffMin <= 10,
      fullText: `${timePart} - ${datePart} (GMT+7)`
    };
  } catch {
    return null;
  }
}
