import React from 'react';

/**
 * Trình tải trang tinh tế chuẩn Apple / Modern Web:
 * - Đã loại bỏ hoàn toàn vòng tròn xoay loading (circular spinner) theo yêu cầu người dùng
 * - Thay bằng thanh tiến trình đỉnh màn hình (Top Progress Line) siêu mỏng, không làm giật trang hay che khuất giao diện
 */
export default function PageLoader() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      <div className="h-[2.5px] w-full bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-600 animate-pulse transition-opacity duration-300 shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
    </div>
  );
}
