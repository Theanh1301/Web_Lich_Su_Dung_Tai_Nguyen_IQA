/**
 * GOOGLE-SHEET-SYNC.GS
 * Mã Google Apps Script dành cho Google Sheets của Viện Quản lý chất lượng và Khảo thí
 * 
 * HƯỚNG DẪN CÀI ĐẶT TRONG 1 PHÚT:
 * 1. Tạo 1 file Google Sheets mới trên Google Drive (đặt tên: "DuLieu_WebLich_VQLCLKT")
 * 2. Trên thanh menu Google Sheets, chọn: Tiện ích mở rộng (Extensions) -> Apps Script
 * 3. Xóa hết mã cũ, dán toàn bộ nội dung file này vào và bấm biểu tượng Lưu (Save)
 * 4. Bấm "Triển khai" (Deploy) -> "Tùy chọn triển khai mới" (New deployment)
 * 5. Chọn loại: "Ứng dụng web" (Web app)
 *    - Mô tả: WebLich Sync API
 *    - Thực thi dưới dạng (Execute as): "Tôi" (Me)
 *    - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone)
 * 6. Bấm "Triển khai" (Deploy) -> Cấp quyền (Authorize) -> Sao chép URL Ứng dụng web (Web App URL)
 * 7. Dán URL này vào mục "Quản Lý Bảng Sheet" trên trang Quản Trị (admin.html) của WebLich!
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsExist(ss);

  var result = {
    whitelist: readSheetData(ss.getSheetByName("TaiKhoan_Whitelist")),
    categories: readSheetData(ss.getSheetByName("DichVu_Categories")),
    resources: readSheetData(ss.getSheetByName("TaiNguyen_Resources")),
    bookings: readSheetData(ss.getSheetByName("LichDat_Bookings"))
  };

  return ContentService.createTextOutput(JSON.stringify({ status: "success", data: result }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsExist(ss);

  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || "SYNC_ALL";

    if (action === "SYNC_ALL" && payload.data) {
      if (payload.data.whitelist) writeSheetData(ss.getSheetByName("TaiKhoan_Whitelist"), payload.data.whitelist);
      if (payload.data.categories) writeSheetData(ss.getSheetByName("DichVu_Categories"), payload.data.categories);
      if (payload.data.resources) writeSheetData(ss.getSheetByName("TaiNguyen_Resources"), payload.data.resources);
      if (payload.data.bookings) writeSheetData(ss.getSheetByName("LichDat_Bookings"), payload.data.bookings);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Đã lưu dữ liệu vào Google Sheet thành công!" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Khởi tạo 4 bảng Sheet nếu chưa có
function ensureSheetsExist(ss) {
  var sheets = ["TaiKhoan_Whitelist", "DichVu_Categories", "TaiNguyen_Resources", "LichDat_Bookings"];
  sheets.forEach(function(name) {
    var s = ss.getSheetByName(name);
    if (!s) {
      s = ss.insertSheet(name);
      if (name === "TaiKhoan_Whitelist") {
        s.appendRow(["Email", "Họ và tên", "Phòng ban", "Vai trò"]);
      } else if (name === "DichVu_Categories") {
        s.appendRow(["Mã dịch vụ", "Tên dịch vụ", "Icon", "Màu", "Cần duyệt", "Người duyệt", "Fields JSON"]);
      } else if (name === "TaiNguyen_Resources") {
        s.appendRow(["Mã tài nguyên", "Mã nhóm", "Tên tài nguyên", "Địa điểm", "Sức chứa", "Calendar ID"]);
      } else if (name === "LichDat_Bookings") {
        s.appendRow(["Mã đặt", "Mã tài nguyên", "Tên người đặt", "Email", "Ngày", "Giờ bắt đầu", "Giờ kết thúc", "Tiêu đề", "Trạng thái", "Chi tiết JSON"]);
      }
    }
  });
}

function readSheetData(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var headers = rows[0];
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = rows[i][j];
    }
    list.push(obj);
  }
  return list;
}

function writeSheetData(sheet, dataList) {
  if (!dataList || dataList.length === 0) return;
  var headers = Object.keys(dataList[0]);
  sheet.clearContents();
  sheet.appendRow(headers);

  var rows = [];
  dataList.forEach(function(item) {
    var row = [];
    headers.forEach(function(h) {
      var val = item[h];
      if (typeof val === 'object') val = JSON.stringify(val);
      row.push(val !== undefined ? val : "");
    });
    rows.push(row);
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

