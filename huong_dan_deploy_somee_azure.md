# HƯỚNG DẪN TRIỂN KHAI TRỌN GÓI (FRONTEND + BACKEND) LÊN SOMEE & AZURE
*(Chạy chung 1 Domain duy nhất cho dự án VBace English)*

---

## 🌟 1. CƠ CHẾ HOẠT ĐỘNG "2 TRONG 1" (ALL-IN-ONE DEPLOYMENT)

Dự án đã được thiết lập để **Frontend (React + Vite)** được đóng gói hoàn toàn vào bên trong thư mục `wwwroot` của **Backend (ASP.NET Core Web API)**:
- **Trang chủ (`/`)**: Trả về giao diện React SPA hiện đại.
- **Mọi đường dẫn con (`/bino`, `/toeic`, `/login`...)**: Tự động định tuyến qua `app.MapFallbackToFile("index.html")`, giúp người dùng F5 tải lại trang không bao giờ bị lỗi 404.
- **Các API (`/api/...`)**: Được ASP.NET Core Controller xử lý trực tiếp.
- **Tài liệu API (`/swagger`)**: Bật sẵn trên cả Production để bạn hoặc giáo viên/khách hàng kiểm tra API bất kỳ lúc nào.
- **Cùng 1 Origin**: Không lo bị lỗi chặn CORS giữa Frontend và Backend.

---

## ⚡ 2. CÁCH ĐÓNG GÓI TỰ ĐỘNG BẰNG 1-CLICK

Tớ đã tạo sẵn cho bạn 2 công cụ đóng gói tự động tại thư mục gốc:
- **Cách 1 (Khuyên dùng trên Windows)**: Nhấp đúp chuột vào file:
  ```
  deploy-pack.bat
  ```
- **Cách 2 (Chạy qua PowerShell)**:
  ```powershell
  .\deploy-pack.ps1
  ```

### Script sẽ tự động thực hiện:
1. Build toàn bộ mã nguồn Frontend React mới nhất.
2. Tự động đồng bộ các file tĩnh vào thư mục `Backend\VBaceEnglish.Api\wwwroot` (đồng thời giữ nguyên thư mục `uploads/` của bạn).
3. Biên dịch Backend sang chế độ `Release`.
4. Đóng gói ra thư mục `publish_output\` và nén sẵn thành file zip:
   ```
   VBaceEnglish_Deploy_Package.zip
   ```

---

## 🚀 3. HƯỚNG DẪN DEPLOY LÊN SOMEE (MIỄN PHÍ / GIÁ RẺ)

### Bước 3.1: Đăng ký tài khoản và tạo Website trên Somee
1. Truy cập [https://somee.com](https://somee.com) và đăng ký tài khoản miễn phí.
2. Vào mục **Websites** ➔ Chọn **Create new site**.
3. Nhập tên miền phụ (Subdomain), ví dụ: `vbaceenglish.somee.com`.
4. Chọn phiên bản ASP.NET Core: Chọn **.NET 10.0** (hoặc .NET phiên bản mới nhất trên Somee).

### Bước 3.2: Tạo Database MS SQL Server trên Somee
1. Tại trang quản trị Somee, chọn **Databases** ➔ **Create new database**.
2. Đặt tên database, ví dụ: `vbace_db`.
3. Sau khi tạo xong, Somee sẽ cung cấp cho bạn thông tin kết nối (Connection String) dạng:
   ```
   workstation id=vbace_db.mssql.somee.com;packet size=4096;user id=your_user;pwd=your_password;data source=vbace_db.mssql.somee.com;persist security info=False;initial catalog=vbace_db;TrustServerCertificate=True
   ```
4. Mở file `Backend\VBaceEnglish.Api\appsettings.json` (hoặc sửa trực tiếp trong file `publish_output\appsettings.json`):
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "workstation id=vbace_db.mssql.somee.com;packet size=4096;user id=your_user;pwd=your_password;data source=vbace_db.mssql.somee.com;persist security info=False;initial catalog=vbace_db;TrustServerCertificate=True"
   }
   ```
   *(Lưu ý thêm `;TrustServerCertificate=True` vào cuối connection string để tránh lỗi chứng chỉ SSL trên Somee).*

### Bước 3.3: Upload gói cài đặt lên Somee
1. Vào menu **Websites** ➔ Chọn website của bạn (ví dụ: `vbaceenglish.somee.com`).
2. Nhấp vào mục **File Manager**.
3. Tại thư mục gốc `public_html/` (hoặc thư mục gốc của website):
   - Nhấp **Upload**.
   - Chọn file `VBaceEnglish_Deploy_Package.zip` vừa được script tạo ra.
   - Sau khi upload xong, chọn file zip đó và bấm nút **Unzip** (Giải nén).
4. Khởi động lại ứng dụng: Vào mục **Website details** ➔ Nhấp **Restart website**.
5. Truy cập `http://vbaceenglish.somee.com` để xem thành quả!
   - Giao diện Web: `http://vbaceenglish.somee.com/`
   - Giao diện Swagger: `http://vbaceenglish.somee.com/swagger`

---

## ☁️ 4. HƯỚNG DẪN DEPLOY LÊN MICROSOFT AZURE

### Cách 1: Deploy nhanh bằng kéo thả file Zip (Kudu ZipDeploy)
1. Đăng nhập vào [Azure Portal](https://portal.azure.com).
2. Tạo một **App Service** (Linux hoặc Windows, Runtime stack: **.NET 10** hoặc .NET LTS).
3. Truy cập vào đường dẫn công cụ Kudu:
   ```
   https://<ten-app-cua-ban>.scm.azurewebsites.net/ZipDeploy
   ```
4. Kéo thả trực tiếp file `VBaceEnglish_Deploy_Package.zip` vào khung trình duyệt. Kudu sẽ tự động giải nén và kích hoạt ứng dụng.
5. Cấu hình Database:
   - Vào App Service trên Azure Portal ➔ **Configuration** (hoặc **Environment variables**).
   - Thêm Connection String `DefaultConnection` trỏ tới Azure SQL Database của bạn.

### Cách 2: Deploy trực tiếp từ Visual Studio (1-Click Publish)
1. Mở dự án trong Visual Studio.
2. Nhấp chuột phải vào dự án `VBaceEnglish.Api` ➔ Chọn **Publish**.
3. Chọn đích đến là **Azure** ➔ **Azure App Service**.
4. Đăng nhập tài khoản Microsoft và bấm **Publish**.

---

## 🛠️ 5. CÁC ĐIỂM KỸ THUẬT ĐÃ ĐƯỢC TỐI ƯU SẴN TRONG SOURCE CODE

1. **`web.config` chuẩn hóa sẵn**: Đã bao gồm các MIME Types (`.json`, `.woff`, `.woff2`, `.webp`, `.webm`, `.epub`), đảm bảo sách Bino (Epub), âm thanh và font chữ chạy trơn tru trên máy chủ IIS Somee.
2. **Bảo toàn dữ liệu Uploads**: Script đóng gói tự động giữ nguyên thư mục `wwwroot/uploads` (chứa các file ebook, âm thanh, ảnh do người dùng upload).
3. **Tự Động Tạo Dữ Liệu Ban Đầu (Auto Migration & Seeder)**: Khi Backend khởi động lần đầu trên Somee/Azure, hệ thống tự động chạy `DbInitializer.SeedAsync`:
   - Tự động tạo bảng trong cơ sở dữ liệu.
   - Tự động tạo tài khoản Admin mặc định (`admin@vbace.com` / `Admin@123`).
   - Tự động nạp sẵn 34 bài hội thoại và từ khóa của sách Bino từ file `bino_real_data.json`.
