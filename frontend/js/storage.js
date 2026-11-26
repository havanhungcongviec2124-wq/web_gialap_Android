/* ═══════════════════════════════════════════════════════════
   storage.js – Hệ thống dữ liệu CỦA web_gialap_Android
   ───────────────────────────────────────────────────────────
   TRIẾT LÝ CỐT LÕI:
   Mọi dữ liệu lưu TRÊN CHÍNH MÁY NGƯỜI DÙNG:
     • RAM ảo (in-memory)  → dữ liệu tạm của phiên (mất khi đóng tab)
     • localStorage        → lưu vĩnh viễn trên ổ ĐĨA máy người dùng
   ★ KHÔNG có server.
   ★ KHÔNG gửi dữ liệu ra internet.
   ★ Dữ liệu thuộc về bạn – xóa khỏi máy là mất vĩnh viễn.
   ═══════════════════════════════════════════════════════════ */

const DeviceStorage = (() => {
  const PREFIX = 'wga_';              // tiền tố key để không trùng app khác
  const quotaBytes = 5 * 1024 * 1024; // giới hạn ước tính localStorage (~5MB)

  // ── RAM ẢO: mô phỏng RAM của "chiếc điện thoại" ──
  // Giữ object trong bộ nhớ JS thật của trình duyệt (= RAM máy bạn).
  const RAM = Object.create(null);

  // ── helpers ──
  const sizeOf = (v) => {
    try { return new Blob([JSON.stringify(v ?? null)]).size; }
    catch { return 0; }
  };

  const api = {
    PREFIX,
    RAM,

    /* ── RAM (dữ liệu tạm – mất khi đóng tab) ── */
    setRam(key, value) { RAM[key] = value; return value; },
    getRam(key, fallback = null) { return key in RAM ? RAM[key] : fallback; },
    clearRam() { Object.keys(RAM).forEach(k => delete RAM[k]); },

    /* ── Ổ ĐĨA MÁY NGƯỜI DÙNG (dữ liệu bền vững) ── */
    set(key, value) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.warn('[DeviceStorage] Không ghi được (full?):', e);
        return false;
      }
    },

    get(key, fallback = null) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch { return fallback; }
    },

    remove(key) { localStorage.removeItem(PREFIX + key); },

    has(key) { return localStorage.getItem(PREFIX + key) !== null; },

    /* ── Danh sách key của app mình ── */
    keys() {
      return Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX))
        .map(k => k.slice(PREFIX.length));
    },

    /* ── Thống kê bộ nhớ ĐANG dùng trên máy người dùng ── */
    usage() {
      const entries = this.keys().map(k => {
        const raw = localStorage.getItem(PREFIX + k) || '';
        return { key: k, bytes: new Blob([raw]).size };
      });
      const diskBytes = entries.reduce((s, e) => s + e.bytes, 0);

      // ước tính RAM đang giữ (mô phỏng)
      const ramBytes = Object.keys(RAM)
        .reduce((s, k) => s + sizeOf(RAM[k]), 0);

      // tệp lớn (ảnh/nhạc) lưu trong IndexedDB – metadata nằm ở fs_meta
      const fsMeta = this.get('fs_meta', {}) || {};
      const fsBytes = Object.values(fsMeta).reduce((s, m) => s + (m.size || 0), 0);

      return {
        diskBytes,
        ramBytes,
        fsBytes,
        totalBytes: diskBytes + ramBytes + fsBytes,
        count: entries.length,
        quotaBytes,
        percent: Math.min(100, (diskBytes / quotaBytes) * 100),
        entries: entries.sort((a, b) => b.bytes - a.bytes),
      };
    },

    /* ── XÓA TOÀN BỘ dữ liệu của app trên máy người dùng ── */
    wipe() {
      this.keys().forEach(k => localStorage.removeItem(PREFIX + k));
      this.clearRam();
    },

    /* ── Xuất / Nhập backup (tải về máy – vẫn local) ── */
    exportAll() {
      const data = {};
      this.keys().forEach(k => data[k] = this.get(k));
      return data;
    },

    importAll(data) {
      Object.entries(data || {}).forEach(([k, v]) => this.set(k, v));
    },
  };

  return api;
})();

/* ── tiện ích hiển thị dung lượng ── */
function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}

/* ═══════════════════════════════════════════════════════════
   FS – "Hệ thống tệp" trên IndexedDB
   Dùng cho file LỚN: ảnh chụp, nhạc, APK, game…
   Vẫn lưu hoàn toàn trên MÁY NGƯỜI DÙNG (IndexedDB của trình duyệt).
   Metadata (tên, kích thước, thời gian) nằm trong localStorage → đếm được sync.
   ═══════════════════════════════════════════════════════════ */
const FS = (() => {
  const DB_NAME = 'wga_fs';
  const STORE = 'files';
  const META_KEY = 'fs_meta';   // meta nằm trong DeviceStorage (localStorage)

  let dbPromise = null;
  function db() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        if (!window.indexedDB) return reject(new Error('IndexedDB không hỗ trợ'));
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
          if (!req.result.objectStoreNames.contains(STORE))
            req.result.createObjectStore(STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbPromise;
  }

  async function tx(mode, fn) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const t = d.transaction(STORE, mode);
      const req = fn(t.objectStore(STORE));
      t.oncomplete = () => resolve(req?.result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }

  const meta = {
    all: () => DeviceStorage.get(META_KEY, {}),
    save: (m) => DeviceStorage.set(META_KEY, m),
  };

  return {
    META_KEY,

    /** Ghi 1 tệp (Blob/File) + metadata */
    async put(key, blob, info = {}) {
      await tx('readwrite', st => st.put(blob, key));
      const m = meta.all();
      m[key] = {
        name: info.name || key,
        size: blob.size,
        type: blob.type || 'application/octet-stream',
        at: Date.now(),
      };
      meta.save(m);
      return m[key];
    },

    /** Đọc tệp → Blob */
    get(key) { return tx('readonly', st => st.get(key)); },

    /** Xóa tệp + metadata */
    async remove(key) {
      await tx('readwrite', st => st.delete(key));
      const m = meta.all();
      delete m[key];
      meta.save(m);
    },

    /** Danh sách metadata (sync – nhanh) */
    list(filter = null) {
      const m = meta.all();
      let arr = Object.entries(m).map(([key, v]) => ({ key, ...v }));
      if (filter) arr = arr.filter(filter);
      return arr.sort((a, b) => b.at - a.at);
    },

    /** Dùng bao nhiêu byte (từ metadata) */
    usedBytes() {
      return Object.values(meta.all()).reduce((s, v) => s + (v.size || 0), 0);
    },

    /** Xuất tệp về máy dưới dạng download */
    async download(key) {
      const blob = await this.get(key);
      if (!blob) return false;
      const info = meta.all()[key] || {};
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = info.name || key;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      return true;
    },

    /** Xóa toàn bộ tệp lớn */
    async clear() {
      await tx('readwrite', st => st.clear());
      meta.save({});
    },
  };
})();
