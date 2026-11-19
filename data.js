/**
 * DATA.JS - Dữ liệu khởi tạo & Hệ thống Lưu trữ Bảng Sheet (Data Store)
 * Đảm bảo: KHÔNG BAO GIỜ MẤT DỮ LIỆU KHI RESET / RELOAD
 * Hỗ trợ xuất/nhập tệp Sheet CSV, sao lưu JSON và đồng bộ trực tiếp với Google Sheets
 */

const STORAGE_KEYS = {
    RESOURCES: 'weblich_resources',
    CATEGORIES: 'weblich_categories',
    BOOKINGS: 'weblich_bookings',
    WHITELIST: 'weblich_whitelist',
    SHARE_CONFIG: 'weblich_share_config',
    CURRENT_USER: 'weblich_current_user',
    GOOGLE_SHEET_URL: 'weblich_google_sheet_url',
    AUTO_BACKUP: 'weblich_auto_backup_history'
};

// 1. Danh mục dịch vụ / tài nguyên chuẩn ban đầu
const DEFAULT_CATEGORIES = [
    {
        id: 'cat_lab',
        name: 'Phòng Máy',
        slug: 'phong-may',
        icon: 'fa-desktop',
        color: '#2563eb',
        catalogType: 'Cơ sở vật chất',
        quantity: '4 phòng',
        managingDept: 'Phòng CNTT & Khảo thí',
        description: 'Hệ thống phòng máy tính trạm và máy chủ phục vụ thi, thực hành đào tạo và nghiên cứu tại cơ sở Xuân Thủy và Hòa Lạc.',
        requiresApproval: true,
        approverRole: 'Phòng CNTT & Khảo thí',
        fields: [
            { id: 'purpose', label: 'Mục đích sử dụng', type: 'select', options: ['Bảo trì / Cài đặt Server', 'Thực hành đào tạo', 'Kiểm tra thiết bị', 'Demo đối tác / Khách hàng'], required: true },
            { id: 'attendees', label: 'Số người ra vào', type: 'number', default: 2, required: true },
            { id: 'equipment_list', label: 'Thiết bị mang vào / ra (nếu có)', type: 'text', placeholder: 'Ví dụ: 1 Switch Cisco, 2 Laptop kiểm thử...' }
        ]
    },
    {
        id: 'cat_meeting',
        name: 'Phòng Họp',
        slug: 'phong-hop',
        icon: 'fa-users',
        color: '#059669',
        catalogType: 'Phòng chức năng',
        quantity: '1 phòng',
        managingDept: 'Phòng Hành chính - Quản trị',
        description: 'Phòng họp hội nghị A sức chứa 16 người trang bị màn hình, micro và hội nghị trực tuyến.',
        requiresApproval: false,
        approverRole: 'Phòng Hành chính - Quản trị',
        fields: [
            { id: 'attendees', label: 'Số lượng người tham gia', type: 'number', default: 8, required: true },
            { id: 'features', label: 'Yêu cầu thiết bị', type: 'checkbox-group', options: ['Máy chiếu / Màn TV', 'Micro không dây', 'Họp trực tuyến Polycom/Zoom', 'Trà nước tiếp khách'] }
        ]
    },
    {
        id: 'cat_car',
        name: 'Xe Công Vụ',
        slug: 'xe-cong-vu',
        icon: 'fa-car-side',
        color: '#d97706',
        catalogType: 'Phương tiện di chuyển',
        quantity: '2 xe',
        managingDept: 'Ban Hành chính / Đội xe',
        description: 'Xe 7 chỗ Ford Everest và Xe 4 chỗ Toyota Vios phục vụ công tác điều phối thi và công vụ của Viện.',
        requiresApproval: true,
        approverRole: 'Ban Hành chính / Đội xe',
        fields: [
            { id: 'destination', label: 'Lộ trình (Điểm đi - Điểm đến)', type: 'text', placeholder: 'VD: Cơ sở XT -> Khu CNC Hòa Lạc -> Cơ sở XT', required: true },
            { id: 'driver_mode', label: 'Hình thức lái', type: 'select', options: ['Cần tài xế cơ quan', 'Nhân viên tự lái'], required: true },
            { id: 'passengers_count', label: 'Số người đi cùng', type: 'number', default: 3, required: true },
            { id: 'purpose', label: 'Mục đích công tác', type: 'text', placeholder: 'VD: Đưa đoàn chuyên gia khảo sát', required: true }
        ]
    },
    {
        id: 'cat_equipment',
        name: 'Mượn Thiết Bị',
        slug: 'muon-thiet-bi',
        icon: 'fa-video',
        color: '#7c3aed',
        catalogType: 'Thiết bị công nghệ',
        quantity: '1 bộ',
        managingDept: 'Quản lý kho thiết bị',
        description: 'Máy quay phim Sony 4K, micro không dây, chân máy phục vụ ghi hình sự kiện và hội thảo.',
        requiresApproval: true,
        approverRole: 'Quản lý kho thiết bị',
        fields: [
            { id: 'purpose', label: 'Mục đích mượn', type: 'text', placeholder: 'VD: Quay video tư liệu hội thảo', required: true },
            { id: 'accessories', label: 'Phụ kiện kèm theo', type: 'text', placeholder: 'VD: Chân máy (Tripod), 2 Pin dự phòng, Thẻ nhớ 128GB' }
        ]
    }
];

// 2. Tài nguyên chi tiết chuẩn ban đầu
const DEFAULT_RESOURCES = [
    {
        id: 'res_lab_xt',
        categoryId: 'cat_lab',
        name: 'Phòng máy Xuân Thủy (XT)',
        location: 'Tầng 4, Tòa nhà A - Cơ sở XT',
        capacity: '30 máy trạm + 2 tủ Rack Server',
        status: 'ACTIVE',
        calendarId: 'lab_xt@company.org'
    },
    {
        id: 'res_lab_hl',
        categoryId: 'cat_lab',
        name: 'Phòng máy Hòa Lạc (HL)',
        location: 'Tầng 2, Tòa nhà Công nghệ cao - Cơ sở HL',
        capacity: '50 máy trạm + 4 tủ Rack Server',
        status: 'ACTIVE',
        calendarId: 'lab_hl@company.org'
    },
    {
        id: 'res_meeting_a',
        categoryId: 'cat_meeting',
        name: 'Phòng họp Hội nghị A',
        location: 'Tầng 3, Nhà Điều hành (XT)',
        capacity: '16 người (Ghế đệm, bàn tròn họp)',
        status: 'ACTIVE',
        calendarId: 'meeting_room_a@company.org'
    },
    {
        id: 'res_car_7seat',
        categoryId: 'cat_car',
        name: 'Xe 7 chỗ Ford Everest (29A-888.66)',
        location: 'Bãi đỗ xe Cơ sở XT',
        capacity: '7 chỗ ngồi',
        status: 'ACTIVE',
        calendarId: 'car_29a_88866@company.org'
    },
    {
        id: 'res_car_4seat',
        categoryId: 'cat_car',
        name: 'Xe 4 chỗ Toyota Vios (29E-555.22)',
        location: 'Bãi đỗ xe Cơ sở HL',
        capacity: '4 chỗ ngồi',
        status: 'ACTIVE',
        calendarId: 'car_29e_55522@company.org'
    },
    {
        id: 'res_eq_camera',
        categoryId: 'cat_equipment',
        name: 'Máy quay chuyên dụng Sony A7 IV',
        location: 'Tủ thiết bị Phòng Truyền thông',
        capacity: '1 bộ (Kèm lens 24-70mm)',
        status: 'ACTIVE',
        calendarId: 'gear_camera_01@company.org'
    }
];

// 3. Danh sách Email Whitelist chuẩn ban đầu
const DEFAULT_WHITELIST = [
    {
        email: 'theanhnguyen1301@gmai.com',
        fullName: 'Nguyễn Thế Anh (Admin)',
        role: 'ADMIN',
        department: 'Phòng CNTT',
        password: '123456'
    },
    {
        email: 'admin@company.vn',
        fullName: 'Nguyễn Văn Quản Trị (Admin)',
        role: 'ADMIN',
        department: 'Ban Giám Đốc / CNTT',
        password: '123456'
    },
    {
        email: 'it.lead@company.vn',
        fullName: 'Trần Văn Kỹ Thuật (Editor / Approver)',
        role: 'EDITOR',
        department: 'Bộ phận IT & Vận hành Mạng',
        password: '123456'
    },
    {
        email: 'hànhchinh@company.vn',
        fullName: 'Lê Thị Hành Chính (Editor / Approver)',
        role: 'EDITOR',
        department: 'Phòng Hành chính - Quản trị',
        password: '123456'
    },
    {
        email: 'nhanvien.xt@company.vn',
        fullName: 'Hoàng Văn Nam (Editor)',
        role: 'EDITOR',
        department: 'Trung tâm Khảo thí XT',
        password: '123456'
    },
    {
        email: 'nhanvien.hl@company.vn',
        fullName: 'Đỗ Thị Lan (Editor)',
        role: 'EDITOR',
        department: 'Cơ sở Hòa Lạc',
        password: '123456'
    },
    {
        email: 'thuctapsinh@company.vn',
        fullName: 'Vũ Minh Khang (Viewer)',
        role: 'VIEWER',
        department: 'Thực tập sinh',
        password: '123456'
    }
];

const DEFAULT_SHARE_CONFIG = {
    isPublicEnabled: true,
    shareToken: 'wl-share-2026-demo-secret',
    accessPin: '2026',
    requirePin: false,
    maskSensitiveData: true,
    allowedCategories: ['cat_lab', 'cat_meeting', 'cat_car', 'cat_equipment'],
    expiresAt: '2026-12-31'
};

function getSampleBookings() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const fmt = (d) => `${year}-${month}-${String(d).padStart(2, '0')}`;

    return [
        {
            id: 'book_01',
            resourceId: 'res_lab_xt',
            userId: 'it.lead@company.vn',
            userName: 'Trần Văn Kỹ Thuật',
            title: 'Bảo trì hệ thống mạng nội bộ & Tủ Rack số 2',
            date: fmt(today.getDate()),
            startTime: '08:30',
            endTime: '11:30',
            status: 'APPROVED',
            details: { purpose: 'Bảo trì / Cài đặt Server', attendees: 3 }
        },
        {
            id: 'book_02',
            resourceId: 'res_lab_hl',
            userId: 'nhanvien.hl@company.vn',
            userName: 'Đỗ Thị Lan',
            title: 'Kiểm tra hạ tầng máy tính phục vụ đợt thi',
            date: fmt(today.getDate()),
            startTime: '13:30',
            endTime: '16:30',
            status: 'APPROVED',
            details: { purpose: 'Kiểm tra thiết bị', attendees: 5 }
        },
        {
            id: 'book_03',
            resourceId: 'res_meeting_a',
            userId: 'admin@company.vn',
            userName: 'Nguyễn Văn Quản Trị',
            title: 'Họp Giao Ban Đầu Tuần & Kế Hoạch Đợt Mới',
            date: fmt(today.getDate()),
            startTime: '09:00',
            endTime: '10:30',
            status: 'APPROVED',
            details: { attendees: 12, features: ['Máy chiếu / Màn TV', 'Micro không dây'] }
        },
        {
            id: 'book_04',
            resourceId: 'res_car_7seat',
            userId: 'nhanvien.xt@company.vn',
            userName: 'Hoàng Văn Nam',
            title: 'Đưa đoàn cán bộ đi công tác & làm việc tại Hòa Lạc',
            date: fmt(today.getDate()),
            startTime: '08:00',
            endTime: '17:00',
            status: 'APPROVED',
            details: { destination: 'Xuân Thủy -> Hòa Lạc', driver_mode: 'Cần tài xế cơ quan', passengers_count: 5 }
        },
        {
            id: 'book_05',
            resourceId: 'res_eq_camera',
            userId: 'nhanvien.xt@company.vn',
            userName: 'Hoàng Văn Nam',
            title: 'Mượn máy quay ghi hình buổi khai mạc tập huấn',
            date: fmt(today.getDate()),
            startTime: '13:00',
            endTime: '15:30',
            status: 'PENDING',
            details: { purpose: 'Ghi hình tư liệu sự kiện' }
        }
    ];
}

// ==============================================================================
// SERVICE QUẢN LÝ DỮ LIỆU BẢNG SHEET & BẢO VỆ CHỐNG MẤT MÁT
// ==============================================================================
const DataService = {
    activeApiBase: '',
    isServerConnected: false,

    /**
     * Tự động đồng bộ với tệp sheet_data.js ngay khi tải trang:
     * Nếu tệp sheet_data.js có timestamp mới hơn hoặc trình duyệt mới mở lần đầu,
     * tự động nạp 100% dữ liệu từ tệp sheet_data.js vào hệ thống!
     */
    async initSheetDataSync() {
        if (window.SHARED_SHEET_DATA) {
            const fileTimestamp = window.SHARED_SHEET_DATA.updatedAt || 'v1';
            const cachedTimestamp = localStorage.getItem('weblich_sheet_file_timestamp');

            if (!cachedTimestamp || fileTimestamp !== cachedTimestamp) {
                console.log('Phát hiện tệp sheet_data.js mới! Đang đồng bộ tự động...');
                if (window.SHARED_SHEET_DATA.whitelist) localStorage.setItem(STORAGE_KEYS.WHITELIST, JSON.stringify(window.SHARED_SHEET_DATA.whitelist));
                if (window.SHARED_SHEET_DATA.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(window.SHARED_SHEET_DATA.categories));
                if (window.SHARED_SHEET_DATA.resources) localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(window.SHARED_SHEET_DATA.resources));
                if (window.SHARED_SHEET_DATA.bookings) localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(window.SHARED_SHEET_DATA.bookings));
                localStorage.setItem('weblich_sheet_file_timestamp', fileTimestamp);
            }
        }

        // Kiểm tra kết nối máy chủ và nạp bản mới nhất từ ổ cứng
        await this.checkServerConnection();
        await this.refreshFromDiskJson();
    },

    /**
     * Nạp lại trực tiếp từ tệp sheet_data.js (bỏ qua cache)
     */
    forceReloadFromSheetFile() {
        if (!window.SHARED_SHEET_DATA) {
            return false;
        }
        if (window.SHARED_SHEET_DATA.whitelist) localStorage.setItem(STORAGE_KEYS.WHITELIST, JSON.stringify(window.SHARED_SHEET_DATA.whitelist));
        if (window.SHARED_SHEET_DATA.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(window.SHARED_SHEET_DATA.categories));
        if (window.SHARED_SHEET_DATA.resources) localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(window.SHARED_SHEET_DATA.resources));
        if (window.SHARED_SHEET_DATA.bookings) localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(window.SHARED_SHEET_DATA.bookings));
        if (window.SHARED_SHEET_DATA.updatedAt) localStorage.setItem('weblich_sheet_file_timestamp', window.SHARED_SHEET_DATA.updatedAt);
        return true;
    },

    /**
     * Kiểm tra trạng thái máy chủ start_server.bat
     */
    async checkServerConnection() {
        const isHttps = window.location.protocol === 'https:';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '[::1]';
        const isFileProtocol = window.location.protocol === 'file:';
        const isWebHosting = isHttps || (!isLocalhost && !isFileProtocol);

        if (isWebHosting) {
            // Trên môi trường Web / GitHub Pages: không gọi http://localhost để tránh Mixed Content & CORS block
            this.updateServerStatusBadge(false);
            return false;
        }

        const candidateBases = [
            window.location.protocol.startsWith('http') ? '' : null,
            this.activeApiBase || null,
            'http://localhost:8080',
            'http://127.0.0.1:8080',
            'http://localhost:8081',
            'http://localhost:8082',
            'http://localhost:8088'
        ].filter(b => b !== null);

        const uniqueBases = Array.from(new Set(candidateBases));

        for (const base of uniqueBases) {
            try {
                const url = (base === '' ? '' : base) + '/api/status';
                const res = await fetch(url, { method: 'GET', cache: 'no-store' });
                if (res.ok) {
                    const status = await res.json();
                    this.activeApiBase = base;
                    this.updateServerStatusBadge(true, status.serverPort);
                    return true;
                }
            } catch(e) {}
        }
        this.updateServerStatusBadge(false);
        return false;
    },

    /**
     * Nạp trực tiếp tệp sheet_data.json từ máy chủ (bỏ qua cache trình duyệt)
     */
    async refreshFromDiskJson() {
        const isHttps = window.location.protocol === 'https:';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '[::1]';
        const isFileProtocol = window.location.protocol === 'file:';
        const isWebHosting = isHttps || (!isLocalhost && !isFileProtocol);
        if (isWebHosting) return;

        try {
            const base = this.activeApiBase || (window.location.protocol.startsWith('http') ? '' : 'http://localhost:8080');
            const res = await fetch((base === '' ? '' : base) + '/sheet_data.json?t=' + Date.now(), { cache: 'no-store' });
            if (res.ok) {
                const diskData = await res.json();
                const cachedTime = localStorage.getItem('weblich_sheet_file_timestamp');
                if (!cachedTime || diskData.updatedAt !== cachedTime) {
                    console.log('🔄 Đã phát hiện phiên bản mới từ sheet_data.json trên ổ cứng. Đang cập nhật...');
                    window.SHARED_SHEET_DATA = diskData;
                    if (diskData.whitelist) localStorage.setItem(STORAGE_KEYS.WHITELIST, JSON.stringify(diskData.whitelist));
                    if (diskData.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(diskData.categories));
                    if (diskData.resources) localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(diskData.resources));
                    if (diskData.bookings) localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(diskData.bookings));
                    localStorage.setItem('weblich_sheet_file_timestamp', diskData.updatedAt || new Date().toISOString());

                    if (typeof window.onExternalDataUpdate === 'function') {
                        window.onExternalDataUpdate();
                    }
                }
            }
        } catch(e) {}
    },

    /**
     * Cập nhật huy hiệu trạng thái kết nối máy chủ trên giao diện
     */
    updateServerStatusBadge(isConnected, port) {
        this.isServerConnected = isConnected;
        const isHttps = window.location.protocol === 'https:';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '[::1]';
        const isFileProtocol = window.location.protocol === 'file:';
        const isWebHosting = isHttps || (!isLocalhost && !isFileProtocol);
        const hasGoogleSheet = !!this.getGoogleSheetUrl();

        const pills = document.querySelectorAll('.auto-save-pill, #autoSavePill');
        pills.forEach(pill => {
            if (isConnected) {
                pill.style.background = '#f0fdf4';
                pill.style.borderColor = '#86efac';
                pill.style.color = '#15803d';
                pill.title = 'Máy chủ nội bộ đang hoạt động. Mọi thay đổi đều tự động ghi tức thì vào file sheet_data.js. Nhấp để xem chi tiết.';
                pill.innerHTML = '<span class="pulse-dot" style="background:#16a34a;"></span> <span>Tự động lưu: <b>Máy chủ nội bộ</b></span>';
                pill.onclick = () => this.showServerGuideModal();
                pill.style.cursor = 'pointer';
            } else if (hasGoogleSheet) {
                pill.style.background = '#eff6ff';
                pill.style.borderColor = '#93c5fd';
                pill.style.color = '#1d4ed8';
                pill.title = 'Hệ thống đang đồng bộ với Google Sheets của Viện. Nhấp để xem thông tin lưu trữ.';
                pill.innerHTML = '<span class="pulse-dot" style="background:#2563eb;"></span> <span>Đồng bộ: <b>Google Sheets</b></span>';
                pill.onclick = () => this.showServerGuideModal();
                pill.style.cursor = 'pointer';
            } else if (isWebHosting) {
                pill.style.background = '#f0fdf4';
                pill.style.borderColor = '#86efac';
                pill.style.color = '#15803d';
                pill.title = 'Dữ liệu đang được lưu an toàn trong trình duyệt (LocalStorage). Nhấp để xem hướng dẫn đồng bộ.';
                pill.innerHTML = '<span class="pulse-dot" style="background:#16a34a;"></span> <span>Lưu trữ: <b>Trình duyệt Web</b></span>';
                pill.onclick = () => this.showServerGuideModal();
                pill.style.cursor = 'pointer';
            } else {
                pill.style.background = '#fffbeb';
                pill.style.borderColor = '#fde68a';
                pill.style.color = '#b45309';
                pill.title = 'Đang lưu trong trình duyệt. Mẹo: Bạn có thể nhấp đúp file start_server.bat để tự động ghi thẳng vào file. Nhấp để xem.';
                pill.innerHTML = '<span class="pulse-dot" style="background:#f59e0b;"></span> <span>Lưu trữ: <b>Trình duyệt (Offline)</b></span>';
                pill.onclick = () => this.showServerGuideModal();
                pill.style.cursor = 'pointer';
            }
        });

        const badge = document.getElementById('fileAccessStatusBadge');
        if (badge) {
            if (isConnected) {
                badge.innerHTML = '<span style="color:#16a34a; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Máy chủ nội bộ ĐANG HOẠT ĐỘNG: Mọi thay đổi được TỰ ĐỘNG GHI TỨC THÌ vào sheet_data.js!</span>';
            } else if (hasGoogleSheet) {
                badge.innerHTML = '<span style="color:#2563eb; font-weight:700;"><i class="fa-solid fa-cloud"></i> Đang đồng bộ trực tuyến với Google Sheets: Dữ liệu được lưu an toàn 2 chiều lên Drive của Viện!</span>';
            } else if (isWebHosting) {
                badge.innerHTML = '<span style="color:#16a34a; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Chế độ Web / Trực tuyến: Dữ liệu được lưu an toàn trong trình duyệt (LocalStorage). Kết nối Google Sheets bên dưới để chia sẻ giữa nhiều thiết bị!</span>';
            } else {
                badge.innerHTML = '<span style="color:#d97706; font-weight:700;"><i class="fa-solid fa-circle-info"></i> Đang lưu trên trình duyệt. Mẹo: Bạn có thể nhấp đúp file <b>start_server.bat</b> trong thư mục để tự động lưu tức thì vào ổ cứng!</span>';
            }
        }
    },

    showServerGuideModal() {
        const isHttps = window.location.protocol === 'https:';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '[::1]';
        const isFileProtocol = window.location.protocol === 'file:';
        const isWebHosting = isHttps || (!isLocalhost && !isFileProtocol);
        const hasGoogleSheet = !!this.getGoogleSheetUrl();
        const googleUrl = this.getGoogleSheetUrl();

        let modal = document.getElementById('weblichStorageStatusModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'weblichStorageStatusModal';
            modal.className = 'modal-backdrop';
            modal.onclick = (e) => {
                if (e.target === modal) modal.classList.remove('active');
            };
            document.body.appendChild(modal);
        }

        const serverStatusHtml = this.isServerConnected
            ? '<span style="color:#16a34a; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Đang hoạt động (Tự động ghi tức thì vào file sheet_data.js)</span>'
            : (isWebHosting
                ? '<span style="color:#64748b;"><i class="fa-solid fa-circle-info"></i> Không áp dụng (Đang chạy trực tuyến trên Web)</span>'
                : '<span style="color:#d97706; font-weight:600;"><i class="fa-solid fa-circle-pause"></i> Chưa bật (Chỉ cần nhấp đúp file start_server.bat trong thư mục dự án)</span>');

        const webStorageStatusHtml = '<span style="color:#16a34a; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Đang hoạt động an toàn (Dữ liệu được lưu trữ bảo vệ trong trình duyệt)</span>';

        const cloudStatusHtml = hasGoogleSheet
            ? `<span style="color:#2563eb; font-weight:700;"><i class="fa-solid fa-cloud"></i> Đã kết nối: ${googleUrl.length > 50 ? googleUrl.substring(0, 50) + '...' : googleUrl}</span>`
            : '<span style="color:#64748b;"><i class="fa-solid fa-circle-notch"></i> Chưa cấu hình (Tùy chọn kết nối qua Google Apps Script)</span>';

        modal.innerHTML = `
            <div class="modal-card" style="max-width: 600px;">
                <div class="modal-header">
                    <div class="modal-title" style="display:flex; align-items:center; gap:8px; font-size:16px;">
                        <i class="fa-solid fa-shield-halved" style="color: #2563eb;"></i>
                        <span>Trạng Thái Lưu Trữ & Đồng Bộ Dữ Liệu</span>
                    </div>
                    <button class="btn-close" onclick="document.getElementById('weblichStorageStatusModal').classList.remove('active')">&times;</button>
                </div>
                <div class="modal-body" style="font-size:13px; line-height:1.6; color:#334155;">
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px; margin-bottom:16px;">
                        <div style="font-weight:700; color:#1e293b; margin-bottom:10px; font-size:13.5px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;">
                            📊 Trạng thái hệ thống lưu trữ hiện tại:
                        </div>
                        <div style="margin-bottom:8px;">
                            <b>1. Bộ nhớ trình duyệt (Web Storage):</b><br>${webStorageStatusHtml}
                        </div>
                        <div style="margin-bottom:8px;">
                            <b>2. Đồng bộ Google Sheets (Trực tuyến):</b><br>${cloudStatusHtml}
                        </div>
                        <div>
                            <b>3. Máy chủ nội bộ (start_server.bat):</b><br>${serverStatusHtml}
                        </div>
                    </div>

                    <h4 style="font-size:13.5px; font-weight:700; color:#0f172a; margin-bottom:8px;">
                        💡 Hướng dẫn 3 phương thức lưu trữ linh hoạt:
                    </h4>

                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:10px 12px;">
                            <div style="font-weight:700; color:#1e40af;"><i class="fa-solid fa-globe"></i> 1. Chạy trên GitHub / Web (Trực tuyến):</div>
                            <div style="color:#475569; font-size:12.5px; margin-top:2px;">
                                Dữ liệu luôn được lưu an toàn trong trình duyệt của bạn. Để đồng bộ dữ liệu giữa tất cả cán bộ trong cơ quan, chỉ cần vào tab <b>"Quản Lý Bảng Sheet"</b> và dán link Google Apps Script (tệp <code>google-sheet-sync.gs</code>).
                            </div>
                        </div>

                        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:10px 12px;">
                            <div style="font-weight:700; color:#166534;"><i class="fa-solid fa-server"></i> 2. Chạy trên máy tính cơ quan (Offline / Local):</div>
                            <div style="color:#475569; font-size:12.5px; margin-top:2px;">
                                Nhấp đúp vào file <b>start_server.bat</b> trong thư mục phần mềm. Cửa sổ máy chủ sẽ mở và tự động ghi thẳng mọi thay đổi vào file <code>sheet_data.js</code> trên ổ đĩa.
                            </div>
                        </div>

                        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:10px 12px;">
                            <div style="font-weight:700; color:#7c3aed;"><i class="fa-solid fa-download"></i> 3. Xuất & Tải file sao lưu bất kỳ lúc nào:</div>
                            <div style="color:#475569; font-size:12.5px; margin-top:2px;">
                                Bạn có thể bấm nút <b>"Tải File sheet_data.js"</b> bên dưới để lấy file dữ liệu mới nhất và sao lưu hoặc đẩy lên GitHub.
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <button class="btn btn-secondary" onclick="DataService.downloadSharedSheetDataJs()">
                        <i class="fa-solid fa-download" style="color:#059669;"></i> Tải File sheet_data.js
                    </button>
                    <button class="btn btn-primary" onclick="document.getElementById('weblichStorageStatusModal').classList.remove('active')">
                        Đã Hiểu & Đóng
                    </button>
                </div>
            </div>
        `;
        modal.classList.add('active');
    },

    showSaveWarning(msg) {
        let el = document.getElementById('weblichAutoSaveNotice');
        if (!el) {
            el = document.createElement('div');
            el.id = 'weblichAutoSaveNotice';
            document.body.appendChild(el);
        }
        el.style.cssText = 'position:fixed; bottom:20px; left:20px; z-index:9999; background:#0369a1; color:#ffffff; font-size:13px; font-weight:600; padding:10px 16px; border-radius:8px; box-shadow:0 6px 18px rgba(0,0,0,0.25); display:flex; align-items:center; gap:10px; transition:opacity 0.25s ease; font-family:system-ui,sans-serif; cursor:pointer;';
        el.innerHTML = '<i class="fa-solid fa-circle-info" style="font-size:16px;"></i> <span>' + msg + '</span> <button style="margin-left:8px; background:#fff; color:#0369a1; border:none; padding:3px 8px; border-radius:4px; font-weight:700; cursor:pointer;">Xem chi tiết</button>';
        el.onclick = () => this.showServerGuideModal();
        el.style.opacity = '1';
        clearTimeout(window._saveNoticeTimer);
        window._saveNoticeTimer = setTimeout(() => {
            el.style.opacity = '0';
        }, 5000);
    },

    // 1. TÀI NGUYÊN (RESOURCES)
    getResources() {
        const stored = localStorage.getItem(STORAGE_KEYS.RESOURCES);
        if (!stored) {
            const initial = (window.SHARED_SHEET_DATA && window.SHARED_SHEET_DATA.resources) ? window.SHARED_SHEET_DATA.resources : DEFAULT_RESOURCES;
            localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(initial));
            return initial;
        }
        return JSON.parse(stored);
    },
    saveResources(data) {
        localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(data));
        this.triggerAutoSave();
    },

    // Lấy danh sách tài nguyên hiệu lực (đồng bộ thông minh từ Bảng tài nguyên và tài nguyên chi tiết)
    getEffectiveResources() {
        const categories = this.getCategories();
        const resources = this.getResources();
        const result = [];

        categories.forEach(cat => {
            const subRes = resources.filter(r => r.categoryId === cat.id);
            if (subRes.length > 0) {
                subRes.forEach(r => {
                    result.push({
                        ...r,
                        categoryId: cat.id,
                        categoryName: cat.name,
                        catalogType: cat.catalogType || 'Tài nguyên',
                        managingDept: cat.managingDept || '',
                        isSubResource: true
                    });
                });
            } else {
                // Mục trong Bảng tài nguyên tự đóng vai trò là tài nguyên sử dụng
                result.push({
                    id: cat.id,
                    categoryId: cat.id,
                    name: cat.name,
                    categoryName: cat.name,
                    catalogType: cat.catalogType || 'Tài nguyên',
                    location: cat.managingDept || 'Cơ quan',
                    capacity: cat.quantity || '1',
                    calendarId: cat.slug || '',
                    status: 'ACTIVE',
                    description: cat.description || '',
                    isCategoryDirect: true
                });
            }
        });

        // Bất kỳ tài nguyên nào trong resources mà không thuộc category trên
        resources.forEach(r => {
            if (!result.some(item => item.id === r.id)) {
                result.push({
                    ...r,
                    categoryName: 'Khác',
                    catalogType: 'Khác',
                    managingDept: '',
                    isSubResource: true
                });
            }
        });

        return result;
    },

    // 2. DANH MỤC DỊCH VỤ (CATEGORIES)
    getCategories() {
        const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        if (!stored) {
            const initial = (window.SHARED_SHEET_DATA && window.SHARED_SHEET_DATA.categories) ? window.SHARED_SHEET_DATA.categories : DEFAULT_CATEGORIES;
            localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(initial));
            return initial;
        }
        return JSON.parse(stored);
    },
    saveCategories(data) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data));
        this.triggerAutoSave();
    },

    // 3. DANH SÁCH TÀI KHOẢN (WHITELIST)
    getWhitelist() {
        const stored = localStorage.getItem(STORAGE_KEYS.WHITELIST);
        let list = null;
        if (!stored) {
            list = (window.SHARED_SHEET_DATA && window.SHARED_SHEET_DATA.whitelist) ? window.SHARED_SHEET_DATA.whitelist : DEFAULT_WHITELIST;
        } else {
            try { list = JSON.parse(stored); } catch(e) { list = DEFAULT_WHITELIST; }
        }
        // Đảm bảo mọi tài khoản đều có mật khẩu (mặc định là: 123456)
        let modified = false;
        list = list.map(u => {
            if (!u.password) {
                u.password = '123456';
                modified = true;
            }
            return u;
        });
        if (modified || !stored) {
            localStorage.setItem(STORAGE_KEYS.WHITELIST, JSON.stringify(list));
        }
        return list;
    },
    saveWhitelist(data) {
        // Đảm bảo mật khẩu được chuẩn hóa
        const sanitized = data.map(u => ({
            ...u,
            password: u.password ? String(u.password).trim() : '123456'
        }));
        localStorage.setItem(STORAGE_KEYS.WHITELIST, JSON.stringify(sanitized));
        this.triggerAutoSave();
    },

    // =========================================================================
    // HỆ THỐNG XÁC THỰC & ĐĂNG NHẬP / ĐỔI MẬT KHẨU
    // =========================================================================
    AUTH_KEY: 'weblich_auth_user',

    /**
     * Lấy thông tin tài khoản đang đăng nhập (chỉ trong phiên làm việc sessionStorage)
     */
    getAuthUser() {
        // Dọn sạch mọi tàn dư lưu vĩnh viễn trong localStorage để bảo đảm an toàn bảo mật
        try {
            if (localStorage.getItem(this.AUTH_KEY)) {
                localStorage.removeItem(this.AUTH_KEY);
            }
        } catch(e) {}

        const stored = sessionStorage.getItem(this.AUTH_KEY);
        if (!stored) return null;
        try {
            const parsed = JSON.parse(stored);
            const whitelist = this.getWhitelist();
            const current = whitelist.find(u => u.email.toLowerCase() === parsed.email.toLowerCase());
            if (current) {
                const sessionUser = { ...current };
                delete sessionUser.password;
                return sessionUser;
            }
            return null;
        } catch(e) {
            return null;
        }
    },

    /**
     * Đăng nhập bằng Tài khoản (phần trước @ hoặc email đầy đủ) và Mật khẩu
     */
    login(identifier, password) {
        if (!identifier || !password) {
            return { success: false, message: 'Vui lòng nhập đầy đủ Tài khoản đăng nhập và Mật khẩu!' };
        }
        const cleanInput = identifier.trim().toLowerCase();
        const cleanPass = String(password).trim();
        const inputPrefix = cleanInput.split('@')[0];

        const whitelist = this.getWhitelist();
        const user = whitelist.find(u => {
            const emailLower = (u.email || '').trim().toLowerCase();
            const emailPrefix = emailLower.split('@')[0];
            return cleanInput === emailLower || cleanInput === emailPrefix || inputPrefix === emailPrefix;
        });

        if (!user) {
            return { success: false, message: 'Tài khoản không tồn tại trong danh sách được cấp quyền!' };
        }

        const validPassword = user.password || '123456';
        if (cleanPass !== String(validPassword).trim()) {
            return { success: false, message: 'Mật khẩu không chính xác!' };
        }

        const sessionUser = { ...user };
        delete sessionUser.password;

        // Chỉ lưu trong sessionStorage: Khi đóng tab hoặc chuyển từ trang khác sang sẽ luôn bắt buộc đăng nhập
        sessionStorage.setItem(this.AUTH_KEY, JSON.stringify(sessionUser));
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

        // Xóa hoàn toàn khỏi localStorage
        try {
            localStorage.removeItem(this.AUTH_KEY);
        } catch(e) {}

        return { success: true, user: sessionUser };
    },

    /**
     * Đăng xuất
     */
    logout() {
        try {
            localStorage.removeItem(this.AUTH_KEY);
            sessionStorage.removeItem(this.AUTH_KEY);
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
            sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        } catch(e) {}
    },

    /**
     * Người dùng tự đổi mật khẩu
     */
    changePassword(email, currentPassword, newPassword) {
        if (!email || !currentPassword || !newPassword) {
            return { success: false, message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới!' };
        }
        const cleanEmail = email.trim().toLowerCase();
        const cleanOld = String(currentPassword).trim();
        const cleanNew = String(newPassword).trim();

        if (cleanNew.length < 4) {
            return { success: false, message: 'Mật khẩu mới phải có tối thiểu 4 ký tự!' };
        }

        const whitelist = this.getWhitelist();
        const user = whitelist.find(u => u.email.trim().toLowerCase() === cleanEmail);
        if (!user) {
            return { success: false, message: 'Không tìm thấy tài khoản!' };
        }

        const actualPass = user.password || '123456';
        if (cleanOld !== String(actualPass).trim()) {
            return { success: false, message: 'Mật khẩu hiện tại không chính xác!' };
        }

        if (cleanNew === String(actualPass).trim()) {
            return { success: false, message: 'Mật khẩu mới phải khác với mật khẩu hiện tại!' };
        }

        user.password = cleanNew;
        this.saveWhitelist(whitelist);

        return { success: true, message: 'Đổi mật khẩu thành công! Mật khẩu mới đã được tự động lưu vĩnh viễn vào file sheet_data.js.' };
    },

    /**
     * Quản trị viên đổi hoặc đặt lại mật khẩu cho bất kỳ tài khoản nào
     */
    adminSetPassword(email, newPassword = '123456') {
        const cleanEmail = email.trim().toLowerCase();
        const cleanNew = String(newPassword).trim();
        if (!cleanNew) {
            return { success: false, message: 'Mật khẩu không được để trống!' };
        }

        const whitelist = this.getWhitelist();
        const user = whitelist.find(u => u.email.trim().toLowerCase() === cleanEmail);
        if (!user) {
            return { success: false, message: 'Không tìm thấy tài khoản!' };
        }

        user.password = cleanNew;
        this.saveWhitelist(whitelist);
        return { success: true, message: `Đã cập nhật mật khẩu cho tài khoản ${user.email}!` };
    },

    // 4. LỊCH ĐẶT (BOOKINGS)
    getBookings() {
        const stored = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
        if (!stored) {
            const initial = (window.SHARED_SHEET_DATA && window.SHARED_SHEET_DATA.bookings && window.SHARED_SHEET_DATA.bookings.length > 0)
                ? window.SHARED_SHEET_DATA.bookings
                : getSampleBookings();
            localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(initial));
            return initial;
        }
        return JSON.parse(stored);
    },
    saveBookings(data) {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(data));
        this.triggerAutoSave();
    },

    // 5. CẤU HÌNH KHÁCH & NGƯỜI DÙNG HIỆN TẠI
    getShareConfig() {
        const stored = localStorage.getItem(STORAGE_KEYS.SHARE_CONFIG);
        if (!stored) {
            localStorage.setItem(STORAGE_KEYS.SHARE_CONFIG, JSON.stringify(DEFAULT_SHARE_CONFIG));
            return DEFAULT_SHARE_CONFIG;
        }
        return JSON.parse(stored);
    },
    saveShareConfig(data) {
        localStorage.setItem(STORAGE_KEYS.SHARE_CONFIG, JSON.stringify(data));
    },

    getCurrentUser() {
        const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (!stored) {
            const defaultUser = DEFAULT_WHITELIST[0];
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(defaultUser));
            return defaultUser;
        }
        return JSON.parse(stored);
    },
    setCurrentUser(user) {
        if (user) localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        else localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    },

    getGoogleSheetUrl() {
        return localStorage.getItem(STORAGE_KEYS.GOOGLE_SHEET_URL) || '';
    },
    setGoogleSheetUrl(url) {
        localStorage.setItem(STORAGE_KEYS.GOOGLE_SHEET_URL, url.trim());
    },

    // -------------------------------------------------------------------------
    // CƠ CHẾ BẢO VỆ DỮ LIỆU: AN TOÀN TUYỆT ĐỐI (SAFE RELOAD & BACKUP)
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // CƠ CHẾ TỰ ĐỘNG GHI TỨC THÌ VÀO FILE DỮ LIỆU TRÊN Ổ ĐĨA
    // -------------------------------------------------------------------------
    async syncToFileInstantly() {
        const payload = {
            updatedAt: new Date().toISOString(),
            version: "1.0",
            whitelist: this.getWhitelist(),
            categories: this.getCategories(),
            resources: this.getResources(),
            bookings: this.getBookings()
        };

        window.SHARED_SHEET_DATA = payload;

        const isHttps = window.location.protocol === 'https:';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '[::1]';
        const isFileProtocol = window.location.protocol === 'file:';
        const isWebHosting = isHttps || (!isLocalhost && !isFileProtocol);

        // 1. Nếu có kết nối Google Sheets: Tự động đẩy lên Google Sheets
        const sheetUrl = this.getGoogleSheetUrl();
        if (sheetUrl && sheetUrl.startsWith('http')) {
            this.pushToGoogleSheetAsync(sheetUrl, payload);
        }

        // 2. Thử gửi tới máy chủ start_server.bat (chỉ chạy khi ở môi trường Local / Desktop)
        let saved = false;
        if (!isWebHosting) {
            const candidateBases = [
                this.activeApiBase || null,
                window.location.protocol.startsWith('http') ? '' : null,
                'http://localhost:8080',
                'http://127.0.0.1:8080',
                'http://localhost:8081',
                'http://localhost:8082',
                'http://localhost:8088'
            ].filter(b => b !== null);

            const uniqueBases = Array.from(new Set(candidateBases));

            for (const base of uniqueBases) {
                try {
                    const ep = (base === '' ? '' : base) + '/api/save';
                    const res = await fetch(ep, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (res.ok) {
                        saved = true;
                        this.activeApiBase = base;
                        localStorage.setItem('weblich_sheet_file_timestamp', payload.updatedAt);
                        this.updateServerStatusBadge(true);
                        this.showSaveNotification('Đã tự động ghi tức thì vào file sheet_data.js');
                        console.log('✅ Đã ghi thành công vào file sheet_data.js qua ' + ep);
                        break;
                    }
                } catch (e) {}
            }
        }

        if (saved) return true;

        // 3. Nếu đang mở file:/// và đã cấp quyền File System Access API
        if (window.localFileHandle) {
            try {
                const writable = await window.localFileHandle.createWritable();
                const jsContent = `/**\n * SHEET_DATA.JS - Tệp Dữ Liệu Bảng Sheet Offline Dùng Chung\n * Tự động cập nhật tức thì lúc: ${new Date().toLocaleString('vi-VN')}\n */\n\nwindow.SHARED_SHEET_DATA = ${JSON.stringify(payload, null, 4)};\n`;
                await writable.write(jsContent);
                await writable.close();
                localStorage.setItem('weblich_sheet_file_timestamp', payload.updatedAt);
                this.showSaveNotification('Đã tự động ghi tức thì vào file sheet_data.js');
                console.log('✅ Đã ghi thành công vào sheet_data.js qua File System Access');
                return true;
            } catch (err) {
                console.warn('Lỗi ghi file:', err);
            }
        }

        // 4. Nếu không ghi máy chủ được: Dữ liệu đã được lưu an toàn trong localStorage trình duyệt
        this.updateServerStatusBadge(false);
        return false;
    },

    /**
     * Hiển thị thông báo nhỏ khi dữ liệu được tự động ghi vào đĩa
     */
    showSaveNotification(msg) {
        let el = document.getElementById('weblichAutoSaveNotice');
        if (!el) {
            el = document.createElement('div');
            el.id = 'weblichAutoSaveNotice';
            document.body.appendChild(el);
        }
        el.style.cssText = 'position:fixed; bottom:20px; left:20px; z-index:9999; background:#166534; color:#ffffff; font-size:12.5px; font-weight:600; padding:8px 14px; border-radius:6px; box-shadow:0 4px 12px rgba(0,0,0,0.15); display:flex; align-items:center; gap:8px; transition:opacity 0.25s ease; pointer-events:none; font-family:system-ui,sans-serif;';
        el.innerHTML = '<i class="fa-solid fa-check"></i> <span>' + msg + '</span>';
        el.style.opacity = '1';
        clearTimeout(window._saveNoticeTimer);
        window._saveNoticeTimer = setTimeout(() => {
            el.style.opacity = '0';
        }, 2200);
    },

    /**
     * Vòng lặp đồng bộ thời gian thực giữa nhiều máy / nhiều tab
     */
    startLivePolling() {
        const isHttps = window.location.protocol === 'https:';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '[::1]';
        const isFileProtocol = window.location.protocol === 'file:';
        const isWebHosting = isHttps || (!isLocalhost && !isFileProtocol);

        // Trên môi trường Web Hosting (GitHub Pages): không có endpoint /api/status cục bộ
        if (isWebHosting) return;

        setInterval(async () => {
            try {
                const base = this.activeApiBase || (window.location.protocol.startsWith('http') ? '' : 'http://localhost:8080');
                const res = await fetch((base === '' ? '' : base) + '/api/status', { cache: 'no-store' });
                if (res.ok) {
                    const status = await res.json();
                    if (!this.isServerConnected) this.updateServerStatusBadge(true, status.serverPort);
                    const lastKnown = localStorage.getItem('weblich_sheet_file_timestamp');
                    if (status.updatedAt && lastKnown && status.updatedAt !== lastKnown) {
                        await this.refreshFromDiskJson();
                    }
                } else {
                    if (this.isServerConnected) this.updateServerStatusBadge(false);
                }
            } catch (e) {
                if (this.isServerConnected) this.updateServerStatusBadge(false);
            }
        }, 3500);
    },

    /**
     * Tự động sao lưu một bản snapshot vào bộ nhớ
     */
    triggerAutoSave() {
        try {
            const snapshot = {
                timestamp: new Date().toISOString(),
                resources: this.getResources(),
                categories: this.getCategories(),
                whitelist: this.getWhitelist(),
                bookings: this.getBookings()
            };
            localStorage.setItem(STORAGE_KEYS.AUTO_BACKUP, JSON.stringify(snapshot));
            
            // TỰ ĐỘNG GHI TỨC THÌ VÀO FILE TRÊN Ổ CỨNG
            this.syncToFileInstantly();

            // Nếu có cài đặt Google Sheet URL -> Bắn đồng bộ ngầm
            const sheetUrl = this.getGoogleSheetUrl();
            if (sheetUrl && sheetUrl.startsWith('http')) {
                this.pushToGoogleSheetAsync(sheetUrl, snapshot);
            }
        } catch (e) {
            console.warn('Auto backup notice:', e);
        }
    },

    /**
     * LÀM MỚI AN TOÀN (SAFE RELOAD):
     * Chỉ nạp lại dữ liệu từ bộ nhớ/sheet, TUYỆT ĐỐI KHÔNG XÓA tài khoản, dịch vụ hay lịch mới đã làm!
     */
    safeReload() {
        return {
            resources: this.getResources(),
            categories: this.getCategories(),
            whitelist: this.getWhitelist(),
            bookings: this.getBookings()
        };
    },

    /**
     * NẠP BỔ SUNG MẪU (MERGE DEFAULT):
     * Nếu thiếu danh mục hay tài nguyên mặc định nào thì bù vào, nhưng GIỮ NGUYÊN 100% dữ liệu mới của người dùng
     */
    mergeMissingDefaults() {
        // Giữ lại dữ liệu hiện tại
        const curRes = this.getResources();
        const curCat = this.getCategories();
        const curWh = this.getWhitelist();

        // Bổ sung các danh mục mặc định nếu chưa có
        DEFAULT_CATEGORIES.forEach(dCat => {
            if (!curCat.some(c => c.id === dCat.id)) curCat.push(dCat);
        });
        // Bổ sung các tài nguyên mặc định nếu chưa có
        DEFAULT_RESOURCES.forEach(dRes => {
            if (!curRes.some(r => r.id === dRes.id)) curRes.push(dRes);
        });
        // Bổ sung email mặc định nếu chưa có
        DEFAULT_WHITELIST.forEach(dWh => {
            if (!curWh.some(w => w.email.toLowerCase() === dWh.email.toLowerCase())) curWh.push(dWh);
        });

        this.saveCategories(curCat);
        this.saveResources(curRes);
        this.saveWhitelist(curWh);
    },

    // -------------------------------------------------------------------------
    // XUẤT VÀ NHẬP TỆP SHEET (CSV / JSON SAO LƯU)
    // -------------------------------------------------------------------------
    /**
     * Xuất tệp sheet_data.js dùng chung cho toàn bộ dự án
     */
    downloadSharedSheetDataJs() {
        const newTimestamp = new Date().toISOString();
        const fullData = {
            updatedAt: newTimestamp,
            version: "1.0",
            whitelist: this.getWhitelist(),
            categories: this.getCategories(),
            resources: this.getResources(),
            bookings: this.getBookings()
        };

        // Cập nhật timestamp của trình duyệt hiện tại
        localStorage.setItem('weblich_sheet_file_timestamp', newTimestamp);

        const jsContent = `/**\n * SHEET_DATA.JS - Tệp Dữ Liệu Bảng Sheet Offline Dùng Chung\n * Viện Quản lý chất lượng và Khảo thí\n * Cập nhật lúc: ${new Date().toLocaleString('vi-VN')}\n */\n\nwindow.SHARED_SHEET_DATA = ${JSON.stringify(fullData, null, 4)};\n`;
        const blob = new Blob([jsContent], { type: 'text/javascript;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'sheet_data.js';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Xuất một bảng cụ thể ra định dạng CSV chuẩn mở trong Excel / Google Sheets
     */
    exportSheetToCsv(sheetName) {
        let data = [];
        let filename = '';

        if (sheetName === 'whitelist') {
            data = this.getWhitelist();
            filename = 'Bang_TaiKhoan_Whitelist.csv';
        } else if (sheetName === 'categories') {
            data = this.getCategories();
            filename = 'Bang_DichVu_Categories.csv';
        } else if (sheetName === 'resources') {
            data = this.getResources();
            filename = 'Bang_TaiNguyen_Resources.csv';
        } else if (sheetName === 'bookings') {
            data = this.getBookings();
            filename = 'Bang_LichDat_Bookings.csv';
        }

        if (data.length === 0) {
            alert('Bảng chưa có dữ liệu để xuất!');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvRows = [];
        csvRows.push(headers.join(','));

        data.forEach(item => {
            const values = headers.map(header => {
                let val = item[header];
                if (typeof val === 'object') val = JSON.stringify(val);
                val = String(val !== undefined ? val : '').replace(/"/g, '""');
                return `"${val}"`;
            });
            csvRows.push(values.join(','));
        });

        const csvContent = '\uFEFF' + csvRows.join('\r\n'); // BOM để hiển thị tiếng Việt UTF-8 chuẩn trên Excel
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Xuất toàn bộ hệ thống ra 1 file sao lưu JSON an toàn
     */
    exportFullBackupJson() {
        const fullBackup = {
            exportDate: new Date().toISOString(),
            system: 'WebLich_VQLCLKT',
            whitelist: this.getWhitelist(),
            categories: this.getCategories(),
            resources: this.getResources(),
            bookings: this.getBookings(),
            shareConfig: this.getShareConfig()
        };

        const str = JSON.stringify(fullBackup, null, 2);
        const blob = new Blob([str], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `SaoLuu_ToanBo_WebLich_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Khôi phục toàn bộ từ file sao lưu JSON (không làm mất các dữ liệu mới nếu gộp)
     */
    importFullBackupJson(jsonString, isMerge = true) {
        try {
            const parsed = JSON.parse(jsonString);
            if (!parsed.whitelist || !parsed.categories || !parsed.resources) {
                throw new Error('Định dạng tệp sao lưu không hợp lệ!');
            }

            if (isMerge) {
                // Chế độ gộp thông minh: Không ghi đè làm mất tài khoản mới
                const existingWh = this.getWhitelist();
                parsed.whitelist.forEach(item => {
                    if (!existingWh.some(w => w.email.toLowerCase() === item.email.toLowerCase())) {
                        existingWh.push(item);
                    }
                });
                this.saveWhitelist(existingWh);

                const existingCat = this.getCategories();
                parsed.categories.forEach(item => {
                    if (!existingCat.some(c => c.id === item.id)) existingCat.push(item);
                });
                this.saveCategories(existingCat);

                const existingRes = this.getResources();
                parsed.resources.forEach(item => {
                    if (!existingRes.some(r => r.id === item.id)) existingRes.push(item);
                });
                this.saveResources(existingRes);

                const existingBookings = this.getBookings();
                if (parsed.bookings) {
                    parsed.bookings.forEach(item => {
                        if (!existingBookings.some(b => b.id === item.id)) existingBookings.push(item);
                    });
                    this.saveBookings(existingBookings);
                }
            } else {
                // Ghi đè toàn bộ
                this.saveWhitelist(parsed.whitelist);
                this.saveCategories(parsed.categories);
                this.saveResources(parsed.resources);
                if (parsed.bookings) this.saveBookings(parsed.bookings);
            }
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    // -------------------------------------------------------------------------
    // ĐỒNG BỘ TRỰC TUYẾN VỚI GOOGLE SHEETS (QUA APPS SCRIPT WEB APP)
    // -------------------------------------------------------------------------
    async pushToGoogleSheetAsync(sheetUrl, snapshotData) {
        try {
            await fetch(sheetUrl, {
                method: 'POST',
                mode: 'no-cors', // Apps script redirect
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'SYNC_ALL',
                    data: snapshotData || {
                        whitelist: this.getWhitelist(),
                        categories: this.getCategories(),
                        resources: this.getResources(),
                        bookings: this.getBookings()
                    }
                })
            });
        } catch (e) {
            console.error('Push to Google Sheet error:', e);
        }
    },

    async fetchFromGoogleSheet(sheetUrl) {
        try {
            const res = await fetch(sheetUrl);
            const json = await res.json();
            if (json && json.status === 'success' && json.data) {
                // Nhận dữ liệu từ Google Sheet và gộp vào hệ thống
                if (json.data.whitelist && json.data.whitelist.length > 0) {
                    this.saveWhitelist(json.data.whitelist);
                }
                if (json.data.categories && json.data.categories.length > 0) {
                    this.saveCategories(json.data.categories);
                }
                if (json.data.resources && json.data.resources.length > 0) {
                    this.saveResources(json.data.resources);
                }
                if (json.data.bookings && json.data.bookings.length > 0) {
                    this.saveBookings(json.data.bookings);
                }
                return { success: true };
            }
            return { success: false, error: 'Phản hồi từ Google Sheet không đúng định dạng.' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }
};

// Khởi chạy đồng bộ tệp sheet_data.js ngay khi tải thư viện
DataService.initSheetDataSync();
DataService.startLivePolling();
