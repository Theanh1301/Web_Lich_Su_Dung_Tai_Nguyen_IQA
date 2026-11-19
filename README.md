# QUẢN LÝ TÀI NGUYÊN VIỆN QUẢN LÝ CHẤT LƯỢNG VÀ KHẢO THÍ

Hệ thống quản lý và điều phối đặt lịch tài nguyên đa dịch vụ dành cho **Viện Quản lý chất lượng và Khảo thí**: quản lý **Phòng máy đa cơ sở (XT, HL)**, **Phòng họp**, **Xe công vụ**, cùng khả năng **tự mở rộng thêm bất kỳ dịch vụ mới nào** (mượn thiết bị, hội trường, phòng nghỉ...).

---

## 📊 Cơ Chế Bảng Sheet Offline (`sheet_data.js`) - Chống Mất Dữ Liệu Khi Copy Link

Hệ thống hoạt động theo cơ chế **Offline-First**, lấy tệp **`sheet_data.js`** làm nguồn dữ liệu gốc dùng chung cho toàn bộ dự án.

## ⚡ Tự Động Cập Nhật Tức Thì Vào File Dữ Liệu (`sheet_data.js`)

Để mọi thao tác thêm tài khoản, dịch vụ, phòng máy hoặc đặt lịch trên trang web **tự động ghi thẳng tức thì vào tệp dữ liệu trên ổ đĩa**, bạn có 2 cách cực kỳ tiện lợi:

### 🌟 Cách 1 (Khuyên dùng nhất trên máy tính Windows - 1 nhấp chuột):
1. Trong thư mục dự án, bạn chỉ cần **nhấp đúp vào tệp `start_server.bat`**.
2. Một cửa sổ máy chủ nội bộ nhỏ gọn sẽ chạy và tự động mở trang web tại địa chỉ: `http://localhost:8080`.
3. **Từ lúc này trở đi:** Bất kỳ thao tác thêm/sửa nào trên web đều được **tự động ghi tức thì vào file `sheet_data.js` trên ổ cứng** trong 0.1 giây mà không cần bấm nút tải file gì nữa!
4. Các máy tính khác trong cơ quan có thể truy cập qua địa chỉ IP của bạn (ví dụ `http://192.168.1.x:8080`) để cùng xem và cập nhật chung một nguồn dữ liệu thời gian thực.

---

### 🌟 Cách 2 (Khi mở file trực tiếp `file:///` hoặc trên Web/GitHub Pages):
1. Mở trang **[admin.html](admin.html)** $\rightarrow$ chọn tab **"Quản Lý Bảng Sheet & Lưu Trữ"**.
2. Hệ thống hoạt động theo cơ chế **Offline-First**, toàn bộ dữ liệu được lưu an toàn trong trình duyệt (LocalStorage).
3. Bạn có thể bấm nút **`[⚡ Cấp Quyền Ghi Trực Tiếp sheet_data.js]`** để trình duyệt tự động ghi thẳng vào file mỗi khi thực hiện thay đổi, hoặc bấm **`[Tải File sheet_data.js]`** để sao lưu.

---

## 🌐 Đồng Bộ Với Google Sheets Trực Tuyến (Khuyên dùng khi đưa lên GitHub Pages / Web)

Hệ thống đi kèm file mã nguồn **[google-sheet-sync.gs](google-sheet-sync.gs)** để bạn có thể kết nối với file Google Sheets trên Google Drive của Viện:
1. Mở file Google Sheets trên Drive $\rightarrow$ vào **Tiện ích mở rộng (Extensions)** $\rightarrow$ **Apps Script**.
2. Dán mã từ tệp **[google-sheet-sync.gs](google-sheet-sync.gs)** vào và bấm **Lưu**.
3. Bấm **Triển khai (Deploy)** $\rightarrow$ **Ứng dụng web (Web app)** $\rightarrow$ Chọn quyền truy cập: *"Bất kỳ ai (Anyone)"*.
4. Sao chép URL ứng dụng web và dán vào tab **Quản Lý Bảng Sheet** trên trang **[admin.html](admin.html)**.
5. Từ đó, mọi tài khoản, dịch vụ, tài nguyên và lịch đặt sẽ được tự động đồng bộ 2 chiều lên Google Sheets của Viện.

---

## 🖥️ Hướng Dẫn Sử Dụng Nhanh

1. Mở file **[index.html](index.html)** để xem lịch theo tháng (đủ 12 tháng) và chọn hiển thị theo từng bảng dịch vụ.
2. Truy cập **[admin.html](admin.html)** để quản trị hệ thống:
   - **Xác thực đăng nhập:** Đăng nhập bằng Email và Mật khẩu tài khoản trong Whitelist.
   - **Tài khoản mặc định trong hệ thống:**
     + Email: `theanhnguyen1301@gmail.com` | Mật khẩu: `Theanh123` (ADMIN)
     + Email: `admin@company.vn` | Mật khẩu: `Iqavnu123@` (ADMIN)
     + Email: `theanhnguyenvdts@gmail.com` | Mật khẩu: `Theanh123` (EDITOR)
     + Email: `theanhttkt@vnu.edu.vn` | Mật khẩu: `123456` (VIEWER)
   - **Đổi mật khẩu:** Sau khi đăng nhập, bấm nút **"Đổi Mật Khẩu"** ở góc trên thanh công cụ để đổi mật khẩu cá nhân.
   - **Quản lý mật khẩu cán bộ:** Trong tab **Tài khoản**, Quản trị viên (ADMIN) có thể đổi hoặc đặt lại mật khẩu cho bất kỳ cán bộ nào.
   - **Quản trị đa dịch vụ:**
     + **Quản lý lịch dùng:** Xem, thêm, sửa, xóa lịch đặt; kiểm tra cảnh báo trùng lịch tự động.
     + **Danh mục tài nguyên:** Quản lý phòng máy, phòng họp, xe công vụ và dịch vụ mới.
     + **Phê duyệt yêu cầu:** Duyệt hoặc từ chối lịch đặt đang chờ.
     + **Quản lý bảng sheet & Lưu trữ:** Xuất CSV, tải `sheet_data.js`, đồng bộ Google Sheets, sao lưu/khôi phục toàn bộ hệ thống.
