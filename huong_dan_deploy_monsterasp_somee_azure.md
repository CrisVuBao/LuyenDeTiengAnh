# Hướng Dẫn Deploy Dự Án VBaceEnglish (Frontend + Backend Chung Root)

Dự án đã được thiết lập kiến trúc **Monolith Single-Host**: Toàn bộ ứng dụng Frontend (React 19 + Vite) được đóng gói trực tiếp vào thư mục `wwwroot` của ASP.NET Core Web API (.NET 10).

---

## ⚡ Bước 1: Đóng Gói Dự Án Tự Động (1 Click)

Ở thư mục gốc dự án:
- Click đúp vào file **`deploy-pack.bat`** (hoặc chạy PowerShell: `.\deploy-pack.ps1`).
- Script sẽ tự động thực hiện:
  1. Biên dịch Frontend Vite xuất thẳng vào `Backend/VBaceEnglish.Api/wwwroot/`.
  2. Publish ASP.NET Core Release.
  3. Sinh ra gói nén: **`VBaceEnglish_Deploy_Package.zip`** ở ngay thư mục gốc.

---

## 🌐 Bước 2: Lựa Chọn Nơi Deploy

### 🌟 Lựa chọn 1: MonsterASP.net (Khuyên Dùng Số 1 — Miễn phí 100%, có sẵn SQL Server, có HTTPS)
1. **Đăng ký tài khoản**: Truy cập [https://www.monsterasp.net/](https://www.monsterasp.net/) (không cần thẻ Visa).
2. **Tạo Website mới**:
   - Chọn mục **Websites** -> **Create Website**.
   - Chọn phiên bản .NET: **.NET 10 / .NET 9 / .NET 8 (Core)**.
3. **Tạo Database SQL Server**:
   - Chọn mục **MS SQL Databases** -> **Create Database**.
   - Lưu lại: *Server Name, Database Name, User, Password*.
4. **Cập nhật Connection String**:
   - Trong file `appsettings.json` của gói publish, sửa chuỗi `ConnectionStrings:DefaultConnection` trỏ tới Database vừa tạo trên MonsterASP.
5. **Upload & Giải nén**:
   - Vào mục **File Manager** của Website trên MonsterASP.
   - Xóa các file mặc định trong thư mục `site/wwwroot` (nếu có).
   - Bấm **Upload** -> chọn file `VBaceEnglish_Deploy_Package.zip`.
   - Bấm **Unzip / Extract** ngay tại thư mục gốc của website.
6. **Hoàn thành**: Truy cập vào domain của MonsterASP (ví dụ `https://vbaceenglish.monsterasp.net`), trang web và API sẽ chạy ngay lập tức!

---

### 🌟 Lựa chọn 2: Somee.com (Miễn phí truyền thống)
1. **Đăng ký tài khoản**: Vào [https://somee.com](https://somee.com).
2. **Tạo Site & Database**:
   - Tạo Package **Free .NET Core**.
   - Tạo **MS SQL Database** miễn phí đi kèm.
3. **Upload File Zip**:
   - Vào **File Manager** trên Somee -> Thư mục gốc website.
   - Upload file `VBaceEnglish_Deploy_Package.zip`.
   - Giải nén (Unzip) toàn bộ nội dung ra thư mục gốc.
4. Dự án đã có sẵn file `web.config` hỗ trợ cấu hình ASP.NET Core và MIME Types cho Somee.

---

### 🌟 Lựa chọn 3: Azure App Service (Dành cho tài khoản Azure Student / Enterprise)
1. Tạo **App Service (Windows hoặc Linux)** với runtime **.NET 10**.
2. Tạo **Azure SQL Database** (gói Free tier 32MB / Serverless).
3. Trong App Service -> **Deployment Center** -> Chọn **Zip Deploy** hoặc dùng lệnh Azure CLI:
   ```bash
   az webapp deploy --resource-group MyGroup --name MyVBaceApp --src-path VBaceEnglish_Deploy_Package.zip --type zip
   ```
4. Vào mục **Configuration** trên Azure Portal -> Thêm biến môi trường `ConnectionStrings__DefaultConnection` trỏ vào Azure SQL.

---

## 🔍 Kiểm Tra Sau Khi Deploy

- **Trang chủ & Học tập**: Truy cập `https://your-domain.com/` (tự động tải Single Page App React).
- **Điều hướng SPA**: Thử truy cập `https://your-domain.com/bino` hoặc `/toeic` hoặc `/auth` -> ASP.NET Core fallback về `index.html` mượt mà.
- **Swagger API Docs**: Truy cập `https://your-domain.com/swagger` để xem và kiểm tra toàn bộ API RESTful.
- **API Endpoints**: Gọi thử `https://your-domain.com/api/bino/book` -> trả về JSON dữ liệu sách học.
