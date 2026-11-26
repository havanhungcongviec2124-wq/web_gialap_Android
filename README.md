# web_gialap_Android

> **Nền tảng giả lập Android trên Web** – Trình chạy Android ảo chạy trực tiếp trong trình duyệt, cho phép mở ứng dụng, chơi game và thao tác như một chiếc điện thoại Android thật mà không cần cài đặt gì trên máy.

![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Android%20%7C%20Windows%20%7C%20macOS-blue)
![Status](https://img.shields.io/badge/status-in%20development-yellow)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📖 Mục lục

1. [Tổng quan](#-tổng-quan)
2. [Tính năng](#-tính-năng)
3. [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
4. [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
5. [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
6. [Cài đặt & Chạy dự án](#-cài-đặt--chạy-dự-án)
7. [Cấu hình](#-cấu-hình)
8. [API](#-api)
9. [Triển khai (Deploy)](#-triển-khai-deploy)
10. [Lộ trình phát triển](#-lộ-trình-phát-triển)
11. [Đóng góp](#-đóng-góp)
12. [Giấy phép](#-giấy-phép)
13. [Liên hệ](#-liên-hệ)

---

## 🌟 Tổng quan

`web_gialap_Android` là dự án mã nguồn mở mô phỏng một thiết bị Android ảo ngay trên trình duyệt web. Thay vì phải cài sẵn ứng dụng Android trên máy, bạn chỉ cần mở trình duyệt là đã có một "chiếc điện thoại" ảo với đầy đủ màn hình, thanh trạng thái, bàn phím và kho ứng dụng.

**Điểm nổi bật:**

- 🖥️ **Chạy trên trình duyệt** – Không cần cài đặt, hoạt động trên Windows, macOS, Linux.
- 📱 **Giống điện thoại thật** – Màn hình cảm ứng, vuốt, chạm, xoay màn hình, bàn phím ảo.
- 🎮 **Chơi được game** – Hỗ trợ cài APK / tải từ kho ứng dụng, bàn phím & gamepad.
- ☁️ **Sẵn sàng cho đám mây** – Kiến trúc client–server cho phép chạy Android trên máy chủ (cloud phone) và stream về trình duyệt.
- 🔌 **API mở** – Tích hợp điều khiển từ xa qua REST/WebSocket.

---

## ✨ Tính năng

### Hiện tại
| Tính năng | Mô tả |
|-----------|--------|
| Màn hình Android ảo | Hiển thị giao diện Android trong khung web (iframe/canvas) |
| Điều khiển cảm ứng | Chuột, cảm ứng đa điểm, vuốt – chụm – kéo |
| Bàn phím & phím tắt | Bàn phím ảo, gõ tiếng Việt, tổ hợp phím hệ thống (Home, Back, Recent) |
| Cài đặt ứng dụng | Tải file APK lên hoặc cài từ kho ứng dụng |
| Xoay màn hình | Chế độ dọc / ngang |
| Lưu trạng thái | Giữ trạng thái phiên khi đóng trình duyệt (server-side) |
| Kết nối không dây | Kết nối Wi-Fi ảo, Bluetooth ảo (mô phỏng) |

### Theo lộ trình
- 🔊 Âm thanh stereo truyền về trình duyệt
- 📷 Camera ảo (mô phỏng webcam)
- 🌐 Nhiều thiết bị ảo cùng lúc (multi-instance)
- 🎮 Hỗ trợ tay cầm gamepad (Gamepad API)
- 🔑 Root / ADB debug mode
- ☁️ Cloud phone: chạy Android trên server, stream WebRTC

---

## 🏗️ Kiến trúc hệ thống

```
┌──────────────────────────────────────────────────────────┐
│                    TRÌNH DUYỆT (Client)                  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Frontend: HTML/CSS/JS – giao diện điện thoại ảo   │  │
│  │  • Canvas/Video stream   • Touch controller        │  │
│  │  • Virtual keyboard     • Status bar / nav bar     │  │
│  └───────────────────────┬────────────────────────────┘  │
└──────────────────────────┼───────────────────────────────┘
                           │  HTTP / WebSocket / WebRTC
                           ▼
┌──────────────────────────────────────────────────────────┐
│                    MÁY CHỦ (Backend)                     │
│  ┌────────────────────────────────────────────────────┐  │
│  │  API Server (Node.js / Python)                    │  │
│  │  • Quản lý phiên • Nhận lệnh điều khiển          │  │
│  │  • Tải APK • Phát stream frame                    │  │
│  └───────────────────────┬────────────────────────────┘  │
│                          ▼                               │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Runtime Android (một trong các lựa chọn):        │  │
│  │  • Android Emulator (AVD)  • Android-x86 (QEMU)   │  │
│  │  • Waydroid (container)    • Redroid (Docker)      │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**Luồng hoạt động:**

1. Người dùng mở trang web → trình duyệt kết nối tới server.
2. Server khởi tạo (hoặc khôi phục) một phiên Android ảo.
3. Server stream hình ảnh Android về client qua **WebSocket / WebRTC**.
4. Tác vụ chạm/kéo/gõ trên web được gửi ngược lại server thành lệnh input Android.
5. Game/ứng dụng chạy hoàn toàn trên server → không tốn tài nguyên máy người dùng.

---

## 🛠️ Công nghệ sử dụng

| Thành phần | Công nghệ |
|------------|-----------|
| Frontend | HTML5, CSS3, JavaScript (ES6+), Canvas / WebRTC |
| Backend | Node.js (Express / Socket.IO) *hoặc* Python (FastAPI / aiohttp) |
| Runtime Android | Redroid (Docker) / Android-x86 (QEMU) / Waydroid |
| Truyền stream | WebSocket (frame) hoặc WebRTC (video realtime) |
| Lưu trữ | SQLite / MongoDB (phiên & cấu hình) |
| Triển khai | Docker, Docker Compose, Nginx |

---

## 💻 Yêu cầu hệ thống

**Máy khách (người dùng):**
- Trình duyệt modern: Chrome / Edge / Firefox / Safari (mới nhất)
- Kết nối internet ổn định (khuyến nghị ≥ 10 Mbps)
- Bật JavaScript và cookie

**Máy chủ (nếu tự host):**
- OS: Linux (Ubuntu 20.04+ / Debian 11+), macOS, Windows (WSL2)
- CPU: 2+ nhân (4 nhân khuyến nghị cho game)
- RAM: 4 GB (8 GB+ cho nhiều phiên)
- Ổ đĩa: 20 GB+ (trống để cài image Android)
- Docker (khuyến nghị) hoặc QEMU/KVM

---

## 🚀 Cài đặt & Chạy dự án

### 1. Clone repo

```bash
git clone https://github.com/havanhungcongviec2124-wq/web_gialap_Android.git
cd web_gialap_Android
```

### 2. Cài đặt phụ thuộc

```bash
# Node.js 18+
node -v
npm -v

# Docker (để chạy runtime Android)
docker -v
```

### 3. Cài package

```bash
npm install
```

### 4. Cấu hình

```bash
cp .env.example .env
# Chỉnh sửa file .env theo nhu cầu (xem mục Cấu hình)
```

### 5. Chạy Android runtime (Redroid – khuyến nghị)

```bash
docker run -d --privileged \
  --name android-vm \
  -p 5555:5555 \
  redroid/redroid:12.0.0-latest
```

### 6. Chạy server & mở ứng dụng

```bash
# Chế độ development
npm run dev

# Chế độ production
npm start
```

Mở trình duyệt truy cập: **http://localhost:3000**

---

## ⚙️ Cấu hình

Các biến trong file `.env`:

| Biến | Mặc định | Mô tả |
|------|----------|--------|
| `PORT` | `3000` | Cổng server |
| `HOST` | `0.0.0.0` | Địa chỉ lắng nghe |
| `ANDROID_BACKEND` | `redroid` | Runtime Android (`redroid` / `qemu` / `waydroid`) |
| `ANDROID_IMAGE` | `12.0.0` | Phiên bản Android |
| `STREAM_MODE` | `websocket` | Chế độ truyền hình ảnh (`websocket` / `webrtc`) |
| `MAX_SESSIONS` | `3` | Số phiên Android tối đa đồng thời |
| `SESSION_TTL` | `3600` | Thời gian giữ phiên (giây) |
| `STORAGE_DIR` | `./storage` | Thư mục lưu APK & dữ liệu |

---

## 🔌 API

### REST

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/session` | Tạo phiên Android mới |
| `GET` | `/api/session/:id` | Lấy thông tin phiên |
| `DELETE` | `/api/session/:id` | Kết thúc phiên |
| `POST` | `/api/session/:id/apk` | Tải & cài APK |
| `GET` | `/api/session/:id/screenshot` | Chụp màn hình hiện tại |
| `POST` | `/api/session/:id/input` | Gửi lệnh chạm/kéo/gõ |

**Ví dụ tạo phiên:**

```bash
curl -X POST http://localhost:3000/api/session \
  -H "Content-Type: application/json" \
  -d '{"name": "my-phone", "androidVersion": "12"}'
```

### WebSocket

```
ws://localhost:3000/stream/:sessionId
```

**Các loại message:**

```jsonc
// Server → Client: frame hình ảnh
{ "type": "frame", "data": "<base64-or-binary>" }

// Client → Server: thao tác cảm ứng
{ "type": "touch", "action": "tap", "x": 540, "y": 1200 }

// Client → Server: phím hệ thống
{ "type": "key", "key": "HOME" }   // HOME | BACK | RECENT
```

---

## 📦 Triển khai (Deploy)

### Docker Compose (khuyến nghị)

```yaml
version: "3.8"
services:
  web:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - android
    environment:
      - ANDROID_BACKEND=redroid
      - ANDROID_HOST=android

  android:
    image: redroid/redroid:12.0.0-latest
    privileged: true
    ports:
      - "5555:5555"
```

```bash
docker compose up -d
```

### Trên VPS (cloud phone)

1. Thuê VPS có hỗ trợ KVM (DigitalOcean, Hetzner, AWS EC2...).
2. Cài Docker + chạy `docker compose up -d`.
3. Dùng Nginx反 proxy + SSL (Let's Encrypt) để truy cập an toàn qua HTTPS.
4. Mở trình duyệt bất kỳ → truy cập domain → dùng điện thoại Android ảo.

---

## 🗺️ Lộ trình phát triển

- [x] Khởi tạo repo & kiến trúc dự án
- [ ] Giao diện khung điện thoại ảo (status bar, nav bar)
- [ ] Điều khiển cảm ứng qua WebSocket
- [ ] Tích hợp Redroid / Android-x86
- [ ] Tải & cài APK từ web
- [ ] Truyền âm thanh
- [ ] WebRTC stream (giảm độ trễ)
- [ ] Multi-instance (nhiều điện thoại ảo)
- [ ] Hỗ trợ gamepad & bàn phím game
- [ ] Đăng nhập & quản lý phiên
- [ ] Dashboard quản trị

---

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh!

1. Fork repo
2. Tạo nhánh mới: `git checkout -b feature/ten-tinh-nang`
3. Commit: `git commit -m "Thêm tính năng mới"`
4. Push: `git push origin feature/ten-tinh-nang`
5. Mạo Pull Request

Vui lòng giữ code sạch, viết comment rõ ràng và kiểm thử trước khi gửi PR.

---

## 📄 Giấy phép

Dự án được phát hành theo giấy phép **MIT** – xem file [`LICENSE`](LICENSE) để biết thêm chi tiết.

---

## 📬 Liên hệ

- **Tác giả:** havanhungcongviec2124-wq
- **Repo:** https://github.com/havanhungcongviec2124-wq/web_gialap_Android
- **Vấn đề & đề xuất:** hãy mở [GitHub Issues](https://github.com/havanhungcongviec2124-wq/web_gialap_Android/issues)

---

<p align="center">Made with ❤️ – web_gialap_Android © 2026</p>
