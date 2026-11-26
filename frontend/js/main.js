/* ═══════════════════════════════════════════════════════════
   main.js – Hệ điều hành web_gialap_Android
   Boot → Khóa → Trang chủ → Ứng dụng → Gần đây
   Thanh trạng thái lấy giờ/pin THẬT từ máy người dùng.
   ═══════════════════════════════════════════════════════════ */

const $ = (id) => document.getElementById(id);

const layers = {
  boot: $('bootLayer'), lock: $('lockLayer'), home: $('homeLayer'),
  drawer: $('drawerLayer'), app: $('appLayer'), recents: $('recentsLayer'),
};

const OS = {
  current: 'boot',     
  currentApp: null,      // app đang mở
  recents: [],           // lịch sử app gần đây
};

/* ── Chuyển layer ── */
function show(name) {
  Object.values(layers).forEach(l => l.classList.remove('active'));
  layers[name].classList.add('active');
  OS.current = name;
}

/* ── Toast ── */
let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ── Đồng hồ & ngày tháng ── */
function tickClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const time = `${hh}:${mm}`;
  const date = now.toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  $('sbTime').textContent = time;
  $('lockClock').textContent = time;
  $('hwTime').textContent = time;
  $('lockDate').textContent = date;
  $('hwDate').textContent = date;
}

/* ── Pin THẬT từ thiết bị người dùng ── */
async function initBattery() {
  const el = $('sbBattery');
  try {
    if (navigator.getBattery) {
      const b = await navigator.getBattery();
      const draw = () => {
        const pct = Math.round(b.level * 100);
        el.textContent = `${pct}%${b.charging ? '⚡' : ''}`;
      };
      draw();
      b.addEventListener('levelchange', draw);
      b.addEventListener('chargingchange', draw);
      return;
    }
  } catch { /* fallback dưới */ }
  // Fallback: mô phỏng (giữ trong RAM phiên)
  let pct = DeviceStorage.getRam('sim_battery', 92);
  setInterval(() => {
    pct = pct > 5 ? pct - 1 : 92;           // "hao pin" dần rồi sạc lại
    DeviceStorage.setRam('sim_battery', pct);
    el.textContent = `${pct}%`;
  }, 60000);
  el.textContent = `${pct}%`;
}

/* ── Áp dụng cài đặt (tối/sáng, hình nền) ── */
function applySettings() {
  const s = DeviceStorage.get('settings', { dark: true, wallpaper: 0 });
  const wallpapers = [
    'linear-gradient(160deg,#16213e,#0f172a 50%,#1a1040)',
    'linear-gradient(160deg,#0f3d3e,#042f2e 60%,#134e4a)',
    'linear-gradient(160deg,#3b1d4f,#1a1040 60%,#4a1942)',
    'linear-gradient(160deg,#422006,#1c1917 60%,#3f1d0b)',
  ];
  $('screen').style.background = wallpapers[s.wallpaper % wallpapers.length];
  document.body.classList.toggle('theme-dark', !!s.dark);
}

/* ── Cập nhật bảng thông tin (bên ngoài) ── */
function updateUsagePanel() {
  const u = DeviceStorage.usage();
  const bar = $('usageBar');
  const txt = $('usageText');
  if (bar) bar.style.width = Math.max(1, u.percent) + '%';
  if (txt) {
    txt.textContent =
      `${fmtBytes(u.diskBytes)} / ~${fmtBytes(u.quotaBytes)} · ${u.count} mục · RAM tạm ${fmtBytes(u.ramBytes)}`;
  }
}

/* ── Render icon app ── */
function faceHTML(app, cls = 'app-emoji') {
  return app.svg
    ? `<div class="${cls}" style="background:${app.svgBg || '#fff'}">${app.svg}</div>`
    : `<div class="${cls}" style="background:${app.color}">${app.emoji}</div>`;
}

function iconHTML(app) {
  return `<div class="app-icon" data-app="${app.id}">
      ${faceHTML(app)}
      <div class="app-label">${app.name}</div>
    </div>`;
}

function renderLauncher() {
  const dock = Apps.filter(a => a.dock);
  const rest = Apps.filter(a => !a.dock);
  $('homeGrid').innerHTML = rest.map(iconHTML).join('');
  $('homeDock').innerHTML = dock.map(iconHTML).join('');
  $('drawerGrid').innerHTML = Apps.map(iconHTML).join('');

  document.querySelectorAll('.app-icon').forEach(ic => {
    ic.onclick = (e) => {
      e.stopPropagation();
      openApp(ic.dataset.app);
    };
  });
}

/* ── Đồng bộ game đã cài từ trước (lưu ở localStorage) ── */
function syncInstalledGames() {
  const installed = DeviceStorage.get('installed', []);
  Games.forEach(g => {
    if (installed.includes(g.id) && !Apps.find(a => a.id === 'game_' + g.id)) {
      registerApp({
        id: 'game_' + g.id, name: g.name, emoji: g.emoji, color: g.color,
        isGame: true, gameId: g.id,
        render(b) { g.play(b); },
        destroy() { if (typeof g.destroy === 'function') g.destroy(); },
      });
    }
  });
}

/* ── Mở / đóng app ── */
function openApp(id) {
  const app = Apps.find(a => a.id === id);
  if (!app) return;

  // dọn app trước (tắt camera, dừng đồng hồ, giải phóng URL…)
  if (OS.currentApp && OS.currentApp !== id) {
    const prev = Apps.find(a => a.id === OS.currentApp);
    if (prev && typeof prev.destroy === 'function') {
      try { prev.destroy(); } catch (e) { console.warn('destroy', e); }
    }
  }

  OS.currentApp = id;
  $('appTitle').textContent = `${app.emoji ? app.emoji + ' ' : ''}${app.name}`;
  $('appBody').innerHTML = '<div class="empty-state">Đang mở…</div>';
  show('app');

  // render nội dung app
  try {
    const r = app.render($('appBody'));
    if (r && typeof r.catch === 'function') {
      r.catch(err => {
        console.error(err);
        $('appBody').innerHTML = '<div class="empty-state">⚠️ Lỗi khi mở app</div>';
      });
    }
  } catch (err) {
    console.error(err);
    $('appBody').innerHTML = '<div class="empty-state">⚠️ Lỗi khi mở app</div>';
  }

  // thêm vào gần đây (đầu tiên)
  OS.recents = [id, ...OS.recents.filter(x => x !== id)].slice(0, 8);
  updateUsagePanel();   // app có thể vừa ghi dữ liệu
}

function cleanupCurrentApp() {
  if (!OS.currentApp) return;
  const app = Apps.find(a => a.id === OS.currentApp);
  if (app && typeof app.destroy === 'function') {
    try { app.destroy(); } catch (e) { console.warn('destroy', e); }
  }
}

function goHome() {
  cleanupCurrentApp();
  OS.currentApp = null;
  show('home');
  updateUsagePanel();
}

function openRecents() {
  const list = $('recentsList');
  if (!OS.recents.length) {
    list.innerHTML = '<div class="recents-empty">Chưa có ứng dụng nào</div>';
  } else {
    list.innerHTML = OS.recents.map(id => {
      const a = Apps.find(x => x.id === id);
      return a ? `<div class="recent-card" data-app="${a.id}">
        ${faceHTML(a)}
        <span>${a.name}</span>
      </div>` : '';
    }).join('');
    list.querySelectorAll('.recent-card').forEach(c => {
      c.onclick = () => openApp(c.dataset.app);
    });
  }
  show('recents');
}

function goBack() {
  if (OS.current === 'app') goHome();
  else if (OS.current === 'drawer') goHome();
  else if (OS.current === 'recents') goHome();
  else if (OS.current === 'home') show('drawer');
}

/* ── Thanh điều hướng ── */
$('navbar').addEventListener('click', (e) => {
  const btn = e.target.closest('.nav-btn');
  if (!btn) return;
  const nav = btn.dataset.nav;
  if (nav === 'back') goBack();
  else if (nav === 'home') goHome();
  else if (nav === 'recents') openRecents();
});
$('appBack').onclick = goHome;
$('recentsClear').onclick = () => {
  OS.recents = [];
  openRecents();
  toast('Đã xóa danh sách gần đây');
};

/* ── Vuốt (gesture) bằng chuột & cảm ứng ── */
function initGestures() {
  const screen = $('screen');
  let startY = null, startX = null, startLayer = null;

  const down = (e) => {
    const p = e.touches ? e.touches[0] : e;
    startY = p.clientY; startX = p.clientX;
    startLayer = OS.current;
  };
  const up = (e) => {
    if (startY === null) return;
    const p = e.changedTouches ? e.changedTouches[0] : e;
    const dy = p.clientY - startY;   // + = vuốt lên
    const dx = p.clientX - startX;
    startY = startX = null;

    if (Math.abs(dy) < 55 || Math.abs(dx) > Math.abs(dy)) return; // quá ngắn / ngang

    // MÀN HÌNH KHÓA: vuốt lên → mở khóa
    if (startLayer === 'lock' && dy < 0) {
      show('home');
      toast('Đã mở khóa 🔓');
      return;
    }
    // TRANG CHÍNH: vuốt lên → ngăn kéo; vuốt xuống → quay về widget
    if (startLayer === 'home') {
      if (dy < 0) show('drawer');
      return;
    }
    // NGĂN KÉO: vuốt xuống → về trang chủ
    if (startLayer === 'drawer' && dy > 0) goHome();
  };

  screen.addEventListener('mousedown', down);
  screen.addEventListener('touchstart', down, { passive: true });
  window.addEventListener('mouseup', up);
  window.addEventListener('touchend', up, { passive: true });

  // Click vào nền trang chính / ngăn kéo → đóng ngăn kéo
  layers.drawer.addEventListener('click', (e) => {
    if (e.target === layers.drawer || e.target.classList.contains('drawer-search')) {
      if (e.target.classList.contains('drawer-search')) return;
      goHome();
    }
  });
}

/* ── BOOT ── */
function boot() {
  tickClock();
  setInterval(tickClock, 1000);
  initBattery();
  applySettings();
  syncInstalledGames();   // khôi phục game đã cài từ lần trước
  renderLauncher();
  initGestures();
  updateUsagePanel();

  // Boot ~2.2 giây rồi sang màn hình khóa
  setTimeout(() => {
    show('lock');
    toast('Vuốt LÊN để mở khóa');
  }, 2200);

  // Phím tắt như Android (Backspace = back)
  window.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); goBack(); }
    if (e.key === 'h') goHome();
  });
}

boot();
