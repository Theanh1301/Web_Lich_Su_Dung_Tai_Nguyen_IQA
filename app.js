/**
 * APP.JS - Quản lý tài nguyên Viện Quản lý chất lượng và Khảo thí
 * Hỗ trợ: Xem Lịch Cả Tháng (12 Tháng), Chọn Bảng Dịch Vụ, Xem Chi Tiết Ngày
 */

// Cấu hình Kích thước
const CONFIG = {
    MONTH_DAY_WIDTH: 78, // px mỗi ngày trong chế độ tháng
    DAY_HOUR_WIDTH: 90,  // px mỗi giờ trong chế độ ngày
    START_HOUR: 7,       // 07:00
    END_HOUR: 19,        // 19:00
    RESOURCE_COL_WIDTH: 280
};

// Trạng thái ứng dụng
let appState = {
    viewMode: 'MONTH',          // 'MONTH' (mặc định) hoặc 'DAY'
    selectedYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth(), // 0 = Tháng 1, 10 = Tháng 11
    selectedDay: new Date().getDate(),
    selectedService: 'ALL',     // 'ALL' hoặc category.id (cat_lab, cat_meeting, cat_car...)
    categories: [],
    resources: [],
    bookings: [],
    currentUser: null
};

// Tên các ngày trong tuần
const DOW_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

// Khởi chạy khi tải trang
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // 1. Tải dữ liệu từ DataService
    appState.categories = DataService.getCategories();
    appState.resources = DataService.getEffectiveResources();
    appState.bookings = DataService.getBookings();
    appState.currentUser = DataService.getCurrentUser();

    // 2. Đồng bộ các điều khiển giao diện
    populateServiceDropdown();
    syncMonthYearSelectors();

    // 3. Render giao diện lịch
    renderCalendar();

    // 4. Lắng nghe sự kiện
    setupEventListeners();

    // 5. Lắng nghe cập nhật tự động từ máy chủ nội bộ
    window.onExternalDataUpdate = () => {
        appState.categories = DataService.getCategories();
        appState.resources = DataService.getEffectiveResources();
        appState.bookings = DataService.getBookings();
        populateServiceDropdown();
        renderCalendar();
        DataService.showSaveNotification('Lịch đã tự động đồng bộ thời gian thực!');
    };
}

// ---------------- Dropdown & Selectors ----------------
function populateServiceDropdown() {
    const select = document.getElementById('serviceTableSelect');
    if (!select) return;
    select.innerHTML = `<option value="ALL">📋 Tất Cả Các Tài Nguyên (${appState.resources.length})</option>`;

    appState.categories.forEach(cat => {
        const count = appState.resources.filter(r => r.categoryId === cat.id).length;
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = `${cat.name} (${count})`;
        select.appendChild(opt);
    });
}

function syncMonthYearSelectors() {
    const monthSel = document.getElementById('monthSelector');
    const yearSel = document.getElementById('yearSelector');

    if (monthSel) monthSel.value = appState.selectedMonth;
    if (yearSel) yearSel.value = appState.selectedYear;
}

function onMonthChange(monthVal) {
    appState.selectedMonth = parseInt(monthVal, 10);
    renderCalendar();
}

function onYearChange(yearVal) {
    appState.selectedYear = parseInt(yearVal, 10);
    renderCalendar();
}

function navigateMonth(delta) {
    let newMonth = appState.selectedMonth + delta;
    if (newMonth < 0) {
        newMonth = 11;
        appState.selectedYear -= 1;
    } else if (newMonth > 11) {
        newMonth = 0;
        appState.selectedYear += 1;
    }
    appState.selectedMonth = newMonth;
    syncMonthYearSelectors();
    renderCalendar();
}

function goToCurrentMonth() {
    const now = new Date();
    appState.selectedYear = now.getFullYear();
    appState.selectedMonth = now.getMonth();
    appState.selectedDay = now.getDate();
    syncMonthYearSelectors();
    renderCalendar();
}

function switchViewMode(mode) {
    appState.viewMode = mode;
    document.getElementById('btnViewMonth').classList.toggle('active', mode === 'MONTH');
    document.getElementById('btnViewDay').classList.toggle('active', mode === 'DAY');
    renderCalendar();
}

function onServiceTableChange(serviceId) {
    appState.selectedService = serviceId;
    updateServiceBanner();
    renderCalendar();
}

function updateServiceBanner() {
    const banner = document.getElementById('activeServiceInfoBanner');
    if (!banner) return;
    if (appState.selectedService === 'ALL') {
        banner.style.display = 'none';
    } else {
        const cat = appState.categories.find(c => c.id === appState.selectedService);
        const resCount = appState.resources.filter(r => r.categoryId === appState.selectedService).length;
        if (cat) {
            banner.style.display = 'flex';
            banner.innerHTML = `
                <div>
                    <i class="fa-solid ${cat.icon || 'fa-cubes'}" style="color: ${cat.color || '#2563eb'}; font-size: 16px; margin-right: 8px;"></i>
                    <b>Đang xem: ${cat.name}</b> (${cat.catalogType || 'Tài nguyên'} - ${cat.quantity || '1'}) • <i>${cat.managingDept || ''}</i>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="onServiceTableChange('ALL'); document.getElementById('serviceTableSelect').value='ALL';">
                    Xem Tất Cả
                </button>
            `;
        }
    }
}

// ---------------- Master Render: Điều phối Month View & Day View ----------------
function renderCalendar() {
    if (appState.viewMode === 'MONTH') {
        renderMonthView();
    } else {
        renderDayView();
    }
}

// ==============================================================================
// 1. CHẾ ĐỘ XEM CẢ THÁNG (MONTH TIMELINE MATRIX - ĐỦ 12 THÁNG)
// ==============================================================================
function renderMonthView() {
    const headerTrack = document.getElementById('columnsTrack');
    const gridBody = document.getElementById('timelineBody');
    const titleHeader = document.getElementById('resourceHeaderTitle');

    headerTrack.innerHTML = '';
    gridBody.innerHTML = '';

    const year = appState.selectedYear;
    const month = appState.selectedMonth; // 0-indexed
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    titleHeader.innerHTML = `<i class="fa-solid fa-cubes-stacked"></i> TÀI NGUYÊN / ĐỊA ĐIỂM (${daysInMonth} Ngày)`;

    const today = new Date();
    const isCurrentYearMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = today.getDate();

    // 1. Render Header: Toàn bộ ngày trong tháng (1 đến 28/30/31)
    for (let day = 1; day <= daysInMonth; day++) {
        const cellDate = new Date(year, month, day);
        const dowIndex = cellDate.getDay();
        const dowText = DOW_NAMES[dowIndex];
        const isWeekend = dowIndex === 0 || dowIndex === 6;
        const isToday = isCurrentYearMonth && day === todayDate;

        const cell = document.createElement('div');
        cell.className = `day-header-cell ${isWeekend ? 'day-weekend' : ''} ${isToday ? 'day-today' : ''}`;
        cell.style.width = `${CONFIG.MONTH_DAY_WIDTH}px`;
        cell.innerHTML = `
            <div class="day-header-dow">${dowText}</div>
            <div class="day-header-num">${day < 10 ? '0' + day : day}</div>
        `;
        headerTrack.appendChild(cell);
    }

    const totalWidthPx = daysInMonth * CONFIG.MONTH_DAY_WIDTH;

    // 2. Lọc danh mục theo Bảng Dịch Vụ được chọn
    const categoriesToRender = appState.selectedService === 'ALL'
        ? appState.categories
        : appState.categories.filter(c => c.id === appState.selectedService);

    categoriesToRender.forEach(cat => {
        const resourcesInCat = appState.resources.filter(r => r.categoryId === cat.id);
        if (resourcesInCat.length === 0) return;

        // Service Table Header Row
        const groupRow = document.createElement('div');
        groupRow.className = 'category-group-row';
        groupRow.style.width = `calc(${CONFIG.RESOURCE_COL_WIDTH}px + ${totalWidthPx}px)`;
        groupRow.innerHTML = `
            <i class="fa-solid ${cat.icon || 'fa-cubes'}" style="color: ${cat.color || '#2563eb'}"></i>
            <span>${cat.name.toUpperCase()} (${cat.catalogType || 'Tài nguyên'} - ${cat.quantity || '1'})</span>
            <span style="font-weight: normal; font-size: 11.5px; color: #64748b; margin-left: auto;">
                <i class="fa-solid fa-building"></i> ${cat.managingDept || 'Phòng phụ trách'}
            </span>
        `;
        gridBody.appendChild(groupRow);

        // Duyệt từng tài nguyên trong bảng dịch vụ
        resourcesInCat.forEach(res => {
            const row = document.createElement('div');
            row.className = 'resource-row';
            row.style.width = `calc(${CONFIG.RESOURCE_COL_WIDTH}px + ${totalWidthPx}px)`;

            // Cột thông tin tài nguyên bên trái
            const infoCell = document.createElement('div');
            infoCell.className = 'resource-info-cell';
            infoCell.innerHTML = `
                <div class="resource-name" title="${res.name}">
                    <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10b981"></span>
                    ${res.name}
                </div>
                <div class="resource-meta">
                    <span><i class="fa-solid fa-location-dot" style="color:#ef4444;"></i> ${res.location}</span>
                </div>
                <div class="resource-meta">
                    <span><i class="fa-solid fa-circle-info"></i> ${res.capacity}</span>
                </div>
            `;
            row.appendChild(infoCell);

            // Cột các ngày trong tháng (Lưới tháng)
            const daysTrack = document.createElement('div');
            daysTrack.className = 'month-cells-track';
            daysTrack.style.width = `${totalWidthPx}px`;

            for (let day = 1; day <= daysInMonth; day++) {
                const cellDate = new Date(year, month, day);
                const dowIndex = cellDate.getDay();
                const isWeekend = dowIndex === 0 || dowIndex === 6;
                const isToday = isCurrentYearMonth && day === todayDate;

                const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                const dayCell = document.createElement('div');
                dayCell.className = `month-day-cell ${isWeekend ? 'day-weekend' : ''} ${isToday ? 'day-today' : ''}`;
                dayCell.style.width = `${CONFIG.MONTH_DAY_WIDTH}px`;

                // Tìm các booking của tài nguyên này trong ngày dayStr
                const bookingsOnDay = appState.bookings.filter(b => (b.resourceId === res.id || (res.id === cat.id && b.resourceId === cat.id)) && b.date === dayStr && b.status !== 'REJECTED' && b.status !== 'CANCELLED');

                bookingsOnDay.forEach(booking => {
                    const chip = document.createElement('div');
                    chip.className = `month-event-chip ${booking.status === 'PENDING' ? 'status-pending' : ''}`;
                    chip.style.borderLeftColor = cat.color;
                    chip.title = `${booking.startTime} - ${booking.endTime}: ${booking.title} (${booking.userName})`;
                    chip.innerHTML = `
                        <span class="event-time">${booking.startTime}</span>
                        <span class="event-title">${booking.title}</span>
                    `;
                    chip.onclick = (e) => {
                        e.stopPropagation();
                        openBookingDetailModal(booking, cat);
                    };
                    dayCell.appendChild(chip);
                });

                daysTrack.appendChild(dayCell);
            }

            row.appendChild(daysTrack);
            gridBody.appendChild(row);
        });
    });
}

// ==============================================================================
// 2. CHẾ ĐỘ XEM CHI TIẾT NGÀY (DAY TIMELINE: 07:00 - 19:00)
// ==============================================================================
function renderDayView() {
    const headerTrack = document.getElementById('columnsTrack');
    const gridBody = document.getElementById('timelineBody');
    const titleHeader = document.getElementById('resourceHeaderTitle');

    headerTrack.innerHTML = '';
    gridBody.innerHTML = '';

    const year = appState.selectedYear;
    const month = appState.selectedMonth;
    const day = appState.selectedDay;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    titleHeader.innerHTML = `<i class="fa-solid fa-cubes-stacked"></i> TÀI NGUYÊN (${day}/${month + 1}/${year})`;

    // Header giờ: 07:00 -> 19:00
    for (let h = CONFIG.START_HOUR; h <= CONFIG.END_HOUR; h++) {
        const cell = document.createElement('div');
        cell.className = 'hour-header-cell';
        cell.style.width = `${CONFIG.DAY_HOUR_WIDTH}px`;
        cell.textContent = `${h.toString().padStart(2, '0')}:00`;
        headerTrack.appendChild(cell);
    }

    const totalHours = CONFIG.END_HOUR - CONFIG.START_HOUR + 1;
    const totalWidthPx = totalHours * CONFIG.DAY_HOUR_WIDTH;

    // Lọc danh mục
    const categoriesToRender = appState.selectedService === 'ALL'
        ? appState.categories
        : appState.categories.filter(c => c.id === appState.selectedService);

    categoriesToRender.forEach(cat => {
        const resourcesInCat = appState.resources.filter(r => r.categoryId === cat.id);
        if (resourcesInCat.length === 0) return;

        // Group Header Row
        const groupRow = document.createElement('div');
        groupRow.className = 'category-group-row';
        groupRow.style.width = `calc(${CONFIG.RESOURCE_COL_WIDTH}px + ${totalWidthPx}px)`;
        groupRow.innerHTML = `
            <i class="fa-solid ${cat.icon || 'fa-cubes'}" style="color: ${cat.color || '#2563eb'}"></i>
            <span>${cat.name.toUpperCase()} (${cat.catalogType || 'Tài nguyên'} - ${cat.quantity || '1'})</span>
            <span style="font-weight: normal; font-size: 11.5px; color: #64748b; margin-left: auto;">
                <i class="fa-solid fa-building"></i> ${cat.managingDept || 'Phòng phụ trách'}
            </span>
        `;
        gridBody.appendChild(groupRow);

        resourcesInCat.forEach(res => {
            const row = document.createElement('div');
            row.className = 'resource-row';
            row.style.width = `calc(${CONFIG.RESOURCE_COL_WIDTH}px + ${totalWidthPx}px)`;

            const infoCell = document.createElement('div');
            infoCell.className = 'resource-info-cell';
            infoCell.innerHTML = `
                <div class="resource-name">${res.name}</div>
                <div class="resource-meta"><span><i class="fa-solid fa-location-dot"></i> ${res.location}</span></div>
            `;
            row.appendChild(infoCell);

            const slotsTrack = document.createElement('div');
            slotsTrack.className = 'slots-track';
            slotsTrack.style.width = `${totalWidthPx}px`;

            const resBookings = appState.bookings.filter(b => (b.resourceId === res.id || (res.id === cat.id && b.resourceId === cat.id)) && b.date === dateStr);
            resBookings.forEach(booking => {
                const block = createDayBookingBlock(booking, cat);
                if (block) slotsTrack.appendChild(block);
            });

            row.appendChild(slotsTrack);
            gridBody.appendChild(row);
        });
    });
}

function createDayBookingBlock(booking, category) {
    const [startH, startM] = booking.startTime.split(':').map(Number);
    const [endH, endM] = booking.endTime.split(':').map(Number);

    const startDecimal = startH + (startM / 60);
    const endDecimal = endH + (endM / 60);

    if (endDecimal <= CONFIG.START_HOUR || startDecimal >= (CONFIG.END_HOUR + 1)) return null;

    const clampedStart = Math.max(startDecimal, CONFIG.START_HOUR);
    const clampedEnd = Math.min(endDecimal, CONFIG.END_HOUR + 1);

    const left = (clampedStart - CONFIG.START_HOUR) * CONFIG.DAY_HOUR_WIDTH;
    const width = (clampedEnd - clampedStart) * CONFIG.DAY_HOUR_WIDTH;

    const block = document.createElement('div');
    block.className = `booking-block ${booking.status === 'PENDING' ? 'status-pending' : ''}`;
    block.style.left = `${left + 2}px`;
    block.style.width = `${width - 4}px`;
    block.style.borderLeftColor = category.color;
    block.innerHTML = `
        <div style="font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${booking.status === 'PENDING' ? '[Chờ duyệt] ' : ''}${booking.title}
        </div>
        <div style="font-size:11px; opacity:0.85;">${booking.startTime} - ${booking.endTime} • ${booking.userName}</div>
    `;

    block.onclick = (e) => {
        e.stopPropagation();
        openBookingDetailModal(booking, category);
    };

    return block;
}

// ---------------- Modal: Đặt Lịch Mới ----------------
function openBookingModal(resourceId, defaultStart = '08:30', defaultEnd = '11:30', defaultDate = '') {
    const modal = document.getElementById('bookingModal');
    const form = document.getElementById('bookingForm');
    form.reset();

    const resourceSelect = document.getElementById('bookingResourceSelect');
    resourceSelect.innerHTML = '';

    appState.resources.forEach(r => {
        const cat = appState.categories.find(c => c.id === r.categoryId);
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = `[${cat ? cat.name : 'Khác'}] ${r.name}`;
        if (r.id === resourceId) opt.selected = true;
        resourceSelect.appendChild(opt);
    });

    const chosenDate = defaultDate || `${appState.selectedYear}-${String(appState.selectedMonth + 1).padStart(2, '0')}-${String(appState.selectedDay).padStart(2, '0')}`;
    document.getElementById('bookingDate').value = chosenDate;
    document.getElementById('bookingStartTime').value = defaultStart;
    document.getElementById('bookingEndTime').value = defaultEnd;

    renderDynamicFormFields(resourceSelect.value);
    resourceSelect.onchange = () => renderDynamicFormFields(resourceSelect.value);

    modal.classList.add('active');
}

function renderDynamicFormFields(resourceId) {
    const container = document.getElementById('dynamicFieldsContainer');
    container.innerHTML = '';

    const resource = appState.resources.find(r => r.id === resourceId);
    if (!resource) return;

    const category = appState.categories.find(c => c.id === resource.categoryId);
    if (!category || !category.fields) return;

    category.fields.forEach(f => {
        const group = document.createElement('div');
        group.className = 'form-group';

        const label = document.createElement('label');
        label.className = 'form-label';
        label.innerHTML = `${f.label} ${f.required ? '<span class="required">*</span>' : ''}`;
        group.appendChild(label);

        if (f.type === 'select') {
            const select = document.createElement('select');
            select.name = `dynamic_${f.id}`;
            select.className = 'form-control';
            f.options.forEach(opt => {
                const optEl = document.createElement('option');
                optEl.value = opt;
                optEl.textContent = opt;
                select.appendChild(optEl);
            });
            group.appendChild(select);
        } else if (f.type === 'checkbox-group') {
            const boxContainer = document.createElement('div');
            boxContainer.className = 'checkbox-group';
            f.options.forEach(opt => {
                const item = document.createElement('label');
                item.className = 'checkbox-item';
                item.innerHTML = `<input type="checkbox" name="dynamic_${f.id}" value="${opt}"> ${opt}`;
                boxContainer.appendChild(item);
            });
            group.appendChild(boxContainer);
        } else {
            const input = document.createElement('input');
            input.type = f.type || 'text';
            input.name = `dynamic_${f.id}`;
            input.className = 'form-control';
            if (f.placeholder) input.placeholder = f.placeholder;
            if (f.default) input.value = f.default;
            if (f.required) input.required = true;
            group.appendChild(input);
        }

        container.appendChild(group);
    });
}

function handleBookingSubmit(e) {
    e.preventDefault();

    const resourceId = document.getElementById('bookingResourceSelect').value;
    const title = document.getElementById('bookingTitle').value.trim();
    const date = document.getElementById('bookingDate').value;
    const startTime = document.getElementById('bookingStartTime').value;
    const endTime = document.getElementById('bookingEndTime').value;

    if (startTime >= endTime) {
        showToast('Giờ kết thúc phải lớn hơn giờ bắt đầu!', 'error');
        return;
    }

    // Kiểm tra chống trùng lịch
    const hasOverlap = appState.bookings.some(b => {
        if (b.resourceId !== resourceId || b.date !== date || b.status === 'REJECTED' || b.status === 'CANCELLED') {
            return false;
        }
        return (startTime < b.endTime) && (endTime > b.startTime);
    });

    if (hasOverlap) {
        showToast('Khung giờ này đã có người đặt trước! Vui lòng chọn giờ khác.', 'error');
        return;
    }

    const resource = appState.resources.find(r => r.id === resourceId);
    const category = appState.categories.find(c => c.id === resource.categoryId);
    const initialStatus = category.requiresApproval ? 'PENDING' : 'APPROVED';

    const newBooking = {
        id: 'book_' + Date.now(),
        resourceId,
        userId: appState.currentUser ? appState.currentUser.email : 'canbo@company.vn',
        userName: appState.currentUser ? appState.currentUser.fullName : 'Cán bộ Viện',
        title,
        date,
        startTime,
        endTime,
        status: initialStatus,
        details: {}
    };

    appState.bookings.push(newBooking);
    DataService.saveBookings(appState.bookings);

    closeModal('bookingModal');
    renderCalendar();

    if (initialStatus === 'PENDING') {
        showToast(`Đã gửi yêu cầu! Đang chờ ${category.approverRole} phê duyệt.`, 'info');
    } else {
        showToast('Đặt lịch thành công!', 'success');
    }
}

// ---------------- Modal: Chi Tiết Lịch ----------------
function openBookingDetailModal(booking, category) {
    const modal = document.getElementById('bookingDetailModal');
    const content = document.getElementById('bookingDetailContent');
    const resource = appState.resources.find(r => r.id === booking.resourceId) || appState.categories.find(c => c.id === booking.resourceId);

    let detailsHtml = '';
    if (booking.details) {
        for (const [key, val] of Object.entries(booking.details)) {
            const displayVal = Array.isArray(val) ? val.join(', ') : val;
            detailsHtml += `<tr><td style="color:#64748b; padding:4px 0;">${key}:</td><td style="font-weight:600; padding:4px 0 4px 12px;">${displayVal || '-'}</td></tr>`;
        }
    }

    content.innerHTML = `
        <div style="margin-bottom: 16px;">
            <span style="font-size: 11px; font-weight:700; padding:2px 8px; border-radius:4px; ${booking.status === 'APPROVED' ? 'background:#dbeafe; color:#1e40af;' : 'background:#fef3c7; color:#92400e;'}">
                ${booking.status === 'APPROVED' ? 'ĐÃ DUYỆT' : 'CHỜ DUYỆT'}
            </span>
            <h3 style="font-size: 16.5px; font-weight:700; margin-top: 8px; color: #0f172a;">${booking.title}</h3>
        </div>

        <table style="width: 100%; font-size: 13.5px; border-collapse: collapse; margin-bottom: 16px;">
            <tr><td style="color:#64748b; width:130px; padding:4px 0;">Tài nguyên:</td><td style="font-weight:600; padding:4px 0 4px 12px;">${resource ? resource.name : '-'}</td></tr>
            <tr><td style="color:#64748b; padding:4px 0;">Địa điểm:</td><td style="font-weight:600; padding:4px 0 4px 12px;">${resource ? resource.location : '-'}</td></tr>
            <tr><td style="color:#64748b; padding:4px 0;">Thời gian:</td><td style="font-weight:600; padding:4px 0 4px 12px;">${booking.startTime} - ${booking.endTime} (Ngày ${booking.date})</td></tr>
            <tr><td style="color:#64748b; padding:4px 0;">Người đặt:</td><td style="font-weight:600; padding:4px 0 4px 12px;">${booking.userName}</td></tr>
            ${detailsHtml}
        </table>
    `;

    document.getElementById('detailModalActions').innerHTML = `
        <button class="btn btn-secondary" onclick="closeModal('bookingDetailModal')">Đóng</button>
    `;

    modal.classList.add('active');
}

function cancelBooking(bookingId) {
    showToast('Trang xem lịch chỉ dùng để hiển thị thông tin, không cho phép chỉnh sửa hoặc hủy lịch!', 'info');
}

// ---------------- Helpers & Toast ----------------
function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info');
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 250);
    }, 3500);
}

function setupEventListeners() {
    const form = document.getElementById('bookingForm');
    if (form) form.addEventListener('submit', handleBookingSubmit);

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) backdrop.classList.remove('active');
        });
    });
}
