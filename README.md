# QUẢN LÝ TÀI NGUYÊN VIỆN QUẢN LÝ CHẤT LƯỢNG VÀ KHẢO THÍ

Hệ thống quản lý và điều phối đặt lịch tài nguyên đa dịch vụ dành cho **Viện Quản lý chất lượng và Khảo thí**: quản lý **Phòng máy đa cơ sở (XT, HL)**, **Phòng họp**, **Xe công vụ**, cùng khả năng **tự mở rộng thêm bất kỳ dịch vụ mới nào** (mượn thiết bị, hội trường, phòng nghỉ...).

---

## 📊 Cơ Chế Bảng Sheet Offline (`sheet_data.js`) - Chống Mất Dữ Liệu Khi Copy Link

Hệ thống hoạt động theo cơ chế **Offline-First**, lấy tệp **`sheet_data.js`** làm nguồn dữ liệu gốc dùng chung cho toàn bộ dự án.

## ⚡ Tự Động Cập Nhật Tức Thì Vào File Dữ Liệu (`sheet_data.js`)

Để mọi thao tác thêm tài khoản, dịch vụ, phòng máy hoặc đặt lịch trên trang web **tự động ghi thẳng tức thì vào tệp dữ liệu trên ổ đĩa**, bạn có 2 cách cực kỳ tiện lợi:

### 🌟 Cách 1 (Khuyên dùng nhất - 1 nhấp chuột):
1. Trong thư mục `WebLich`, bạn chỉ cần **nhấp đúp vào tệp `start_server.bat`**.
2. Một cửa sổ máy chủ nội bộ nhỏ gọn sẽ chạy và tự động mở trang web tại địa chỉ: `http://localhost:8080`.
3. **Từ lúc này trở đi:** Bất kỳ thao tác thêm/sửa nào trên web đều được **tự động ghi tức thì vào file `sheet_data.js` trên ổ cứng** trong 0.1 giây mà không cần bấm nút tải file gì nữa!
4. Các máy tính khác trong cơ quan có thể truy cập qua địa chỉ IP của bạn (ví dụ `http://192.168.1.x:8080`) để cùng xem và cập nhật chung một nguồn dữ liệu thời gian thực.

---

### 🌟 Cách 2 (Khi mở file trực tiếp `file:///`):
1. Mở trang **`admin.html`** $\rightarrow$ chọn tab **"Quản Lý Bảng Sheet & Lưu Trữ"**.
2. Bấm nút: **`[⚡ Cấp Quyền Ghi Trực Tiếp sheet_data.js]`** $\rightarrow$ chọn tệp `sheet_data.js` trong thư mục `WebLich` một lần duy nhất.
3. Trình duyệt (Chrome/Edge/Cốc Cốc) sẽ nhớ quyền này và tự động ghi thẳng vào file mỗi khi bạn thực hiện bất kỳ thay đổi nào.

---

## 🌐 Đồng Bộ Với Google Sheets Trực Tuyến (Tùy Chọn)

Hệ thống đi kèm file mã nguồn **`google-sheet-sync.gs`** để bạn có thể kết nối với file Google Sheets trên Google Drive của Viện:
1. Mở file Google Sheets trên Drive $\rightarrow$ vào **Tiện ích mở rộng (Extensions)** $\rightarrow$ **Apps Script**.
2. Dán mã từ tệp **[google-sheet-sync.gs](file:///D:/Antigravity%20IDE/WebLich/google-sheet-sync.gs)** vào và bấm **Lưu**.
3. Bấm **Triển khai (Deploy)** $\rightarrow$ **Ứng dụng web (Web app)** $\rightarrow$ Chọn quyền truy cập: *"Bất kỳ ai (Anyone)"*.
4. Sao chép URL ứng dụng web và dán vào tab **Quản Lý Bảng Sheet** trên trang **[admin.html](file:///D:/Antigravity%20IDE/WebLich/admin.html)**.
5. Từ đó, mọi tài khoản, dịch vụ, tài nguyên và lịch đặt sẽ được tự động đồng bộ 2 chiều lên Google Sheets của Viện.

---

## 🖥️ Hướng Dẫn Sử Dụng Nhanh

1. Mở file **[index.html](file:///D:/Antigravity%20IDE/WebLich/index.html)** để xem lịch theo tháng (đủ 12 tháng) và chọn hiển thị theo từng bảng dịch vụ.
2. Truy cập **[admin.html](file:///D:/Antigravity%20IDE/WebLich/admin.html)** để quản trị hệ thống:
   - **Xác thực đăng nhập:** Yêu cầu đăng nhập bằng Email và Mật khẩu tài khoản ADMIN.
   - **Tài khoản quản trị mặc định:**
     + Email: `theanhnguyen1301@gmai.com` hoặc `admin@company.vn`
     + Mật khẩu mặc định: `123456`
   - **Đổi mật khẩu:** Sau khi đăng nhập, bấm nút **"Đổi Mật Khẩu"** ở góc trên thanh công cụ để đổi mật khẩu cá nhân (tự động lưu vĩnh viễn vào file `sheet_data.js`).
   - **Quản lý mật khẩu cán bộ:** Trong tab **Email Whitelist**, Quản trị viên có thể đổi hoặc đặt lại mật khẩu cho bất kỳ cán bộ nào.
   - **Quản trị đa dịch vụ:**
     + Thêm phòng máy mới (Cơ sở 3, 4...), thêm xe, thêm phòng họp.
     + Thêm dịch vụ mới kèm biểu mẫu trường động riêng.
     + Phê duyệt hoặc từ chối lịch đặt.
