# frontend – web_gialap_Android

Giao diện **điện thoại Android ảo kiểu Samsung One UI** chạy 100% trong trình duyệt.
Không build, không server backend – mở lên là chạy.

## 🚀 Chạy nhanh

```bash
python3 -m http.server 5173     # hoặc: npx serve -l 5173
```

Mở **http://localhost:5173** (hoặc double-click `index.html`).

## 📱 Tính năng

**Hệ điều hành ảo:** boot → màn hình khóa (vuốt lên) → trang chính → ngăn kéo app → ứng dụng gần đây.
Thanh trạng thái lấy **giờ & pin THẬT** từ máy bạn (Battery API).

**12 ứng dụnguilt-in:**

| App | Mô tả |
|-----|--------|
| 📞 Điện thoại | Bàn phím số, lịch sử gọi |
| 💬 Tin nhắn | Hộp thoại, khung chat, trả lời mô phỏng |
| 🌐 Chrome | Trình duyệt thật (iframe) – Google, YouTube, VnExpress… |
| 📷 Máy ảnh | Camera THẬT của bạn → lưu ảnh vào IndexedDB |
| 🖼️ Thư viện | Xem/tải/xóa ảnh đã chụp |
| ▶ CH Play | Cửa hàng – cài game, icon tự thêm vào màn hình chính |
| 🎮 Game | Rắn Săn Mồi, 2048, Cờ Caro, Đoán Số – chơi được thật |
| 📝 Ghi chú | CRUD ghi chú |
| 🧮 Máy tính | Phím số + lịch sử tính toán (RAM) |
| ⏰ Đồng hồ | Giờ thật, bấm giờ, hẹn giờ |
| 📁 Tệp | Trình quản lý file (IndexedDB + localStorage) |
| ⚙️ Cài đặt | Tối/sáng, hình nền, xuất backup, xóa toàn bộ |

## 💾 Triết lý dữ liệu (quan trọng)

Toàn bộ dữ liệu lưu **trên chính thiết bị người dùng**:

| Loại | Vị trí | Dùng cho | Bền vững |
|------|--------|----------|----------|
| `DeviceStorage.RAM` | RAM trình duyệt | Trạng thái tạm (calc, pin…) | ❌ Mất khi đóng tab |
| `DeviceStorage.set/get` | `localStorage` | Ghi chú, cài đặt, SMS, score game | ✅ Giữ qua lần mở sau |
| `FS.put/get` | `IndexedDB` | File lớn: ảnh, nhạc, APK, game | ✅ Giữ vĩnh viễn |

- **Không server** – không có endpoint nào nhận dữ liệu.
- **Không network** – app không gửi byte nào đi (trừ khi bạn tự mở trang web trong Chrome).
- Giới hạn `localStorage` ~5MB; IndexedDB ~20% dung lượng ổ đĩa (thường hàng GB).

## 📁 Cấu trúc

```
frontend/
├── index.html          # Khung điện thoại (các layer + info panel)
├── css/style.css       # Toàn bộ giao diện
└── js/
    ├── storage.js      # 💾 DeviceStorage (localStorage) + FS (IndexedDB)
    ├── apps.js         # App lõi: Ghi chú, Máy tính, Cài đặt, Bộ nhớ, CH Play
    ├── games.js        # 🎮 4 game thật (Snake, 2048, Caro, Đoán Số)
    ├── apps_phone.js   # 📱 App One UI: Điện thoại, Tin nhắn, Chrome, Camera…
    └── main.js         # OS: boot, khóa, vuốt, điều hướng, vòng đời destroy()
```

## 🧩 Thêm app mới

```js
// trong js/apps.js hoặc file mới (nạp sau apps.js)
registerApp({
  id: 'gallery2', name: 'Ảnh', emoji: '🌸', color: '#ec4899',
  render(body) {
    const photos = FS.list(f => f.key.startsWith('photo_')); // đọc IndexedDB
    body.innerHTML = `...`;
  },
  destroy() { /* dọn timer/objectURL khi thoát app */ },
});
```

## 🎮 Thêm game mới

```js
registerGame({
  id: 'mygame', name: 'Game שלי', emoji: '🎲', color: '#f59e0b',
  size: '2 MB', cat: 'Puzzle', desc: 'Mô tả…',
  play(body) { /* vẽ & điều khiển */ },
  destroy() { /* dọn interval */ },
});
```

Game tự xuất hiện trong **CH Play** → cài → icon thêm vào màn hình chính.

## 🎮 Phím tắt

| Phím | Hành động |
|------|-----------|
| `Esc` / `Backspace` | Quay lại |
| `h` | Về trang chủ |
| Vuốt lên (màn hình khóa) | Mở khóa |
| Vuốt lên (trang chính) | Mở ngăn kéo app |
| Phím mũi tên / WASD | Điều khiển game |
