/* ═══════════════════════════════════════════════════════════
   apps_phone.js – Bộ app kiểu Samsung One UI
   Điện thoại · Tin nhắn · Chrome · Google · Máy ảnh ·
   Thư viện · Đồng hồ · Tệp
   Toàn bộ dữ liệu vẫn lưu TRÊN MÁY NGƯỜI DÙNG.
   ═══════════════════════════════════════════════════════════ */

/* ── Logo THẬT (SVG) – Google là Google, Chrome là Chrome ── */
const CHROME_LOGO = `
<svg viewBox="0 0 48 48" width="34" height="34" xmlns="http://www.w3.org/2000/svg">
  <path fill="#EA4335" d="M34 6.68A20 20 0 0 0 4 24L24 24Z"/>
  <path fill="#FBBC05" d="M34 41.32A20 20 0 0 0 34 6.68L24 24Z"/>
  <path fill="#34A853" d="M4 24A20 20 0 0 0 34 41.32L24 24Z"/>
  <circle cx="24" cy="24" r="10" fill="#FFFFFF"/>
  <circle cx="24" cy="24" r="8" fill="#4285F4"/>
</svg>`.trim();

const GOOGLE_LOGO = `
<svg viewBox="0 0 48 48" width="34" height="34" xmlns="http://www.w3.org/2000/svg">
  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
</svg>`.trim();

/* Mở Google THẬT trên tab trình duyệt – không lồng vào điện thoại ảo */
function openGoogle(query) {
  const url = query
    ? 'https://www.google.com/search?q=' + encodeURIComponent(query)
    : 'https://www.google.com';
  window.open(url, '_blank', 'noopener');
}


/* ────────────────────────────────
   📞 ĐIỆN THOẠI (bàn phím + lịch sử gọi)
   ──────────────────────────────── */
registerApp({
  id: 'phone', name: 'Điện thoại', emoji: '📞', color: '#22c55e', dock: true,
  render(body) {
    let dialed = '';
    const calls = DeviceStorage.get('calls', []);

    const drawPad = () => {
      body.innerHTML = `
        <div class="dial-display">
          <div class="dial-num" id="dialNum">${dialed || '<span style="color:#9aa6bd">Nhập số…</span>'}</div>
          <div class="dial-sub">Gọi thử nghiệm – mô phỏng như điện thoại thật</div>
        </div>
        <div class="dial-grid">
          ${[['1',''],['2','ABC'],['3','DEF'],['4','GHI'],['5','JKL'],
             ['6','MNO'],['7','PQRS'],['8','TUV'],['9','WXYZ'],
             ['*',''],['0','+'],['#','']].map(([n, s]) => `
            <button class="dial-btn" data-n="${n}">
              <b>${n}</b>${s ? `<small>${s}</small>` : ''}
            </button>`).join('')}
        </div>
        <div class="dial-actions">
          <button class="dial-call" id="btnCall">📞</button>
          <button class="dial-del" id="btnDel">⌫</button>
        </div>
        <div class="section-title">Lịch sử gọi</div>
        <div id="callList"></div>`;

      body.querySelectorAll('.dial-btn').forEach(b => {
        b.onclick = () => { if (dialed.length < 15) dialed += b.dataset.n; drawNum(); };
      });
      body.querySelector('#btnDel').onclick = () => { dialed = dialed.slice(0, -1); drawNum(); };
      body.querySelector('#btnCall').onclick = () => {
        if (!dialed) return;
        calls.unshift({ num: dialed, at: DeviceStorage.getRam('now', Date.now()) });
        DeviceStorage.set('calls', calls.slice(0, 50));
        toast(`📞 Đang gọi ${dialed}… (mô phỏng)`);
        drawCalls();
        dialed = ''; drawNum();
      };
      drawCalls();
    };

    const drawNum = () => {
      const el = body.querySelector('#dialNum');
      if (el) el.innerHTML = dialed || '<span style="color:#9aa6bd">Nhập số…</span>';
    };

    const drawCalls = () => {
      const el = body.querySelector('#callList');
      if (!el) return;
      el.innerHTML = calls.length ? calls.map((c, i) => `
        <div class="list-item" data-num="${esc(c.num)}">
          <span class="li-icon">📞</span>
          <div class="li-main">
            <div class="li-title">${esc(c.num)}</div>
            <div class="li-sub">${new Date(c.at).toLocaleString('vi-VN')}</div>
          </div>
          <button class="li-del" data-i="${i}">🗑</button>
        </div>`).join('')
        : `<div class="empty-state" style="padding:16px">Chưa có cuộc gọi nào.</div>`;

      el.querySelectorAll('.li-del').forEach(b => {
        b.onclick = () => { calls.splice(+b.dataset.i, 1); DeviceStorage.set('calls', calls); drawCalls(); };
      });
      el.querySelectorAll('.list-item[data-num]').forEach(li => {
        li.onclick = (e) => {
          if (e.target.dataset.i !== undefined) return;
          dialed = li.dataset.num; drawNum();
        };
      });
    };

    drawPad();
  },
});

/* ────────────────────────────────
   💬 TIN NHẮN (hộp thoại + gửi mô phỏng)
   ──────────────────────────────── */
registerApp({
  id: 'sms', name: 'Tin nhắn', emoji: '💬', color: '#3b82f6', dock: true,
  render(body) {
    let openThread = null;
    const threads = () => DeviceStorage.get('sms', []);

    const drawList = () => {
      const th = threads();
      body.innerHTML = `
        <div class="notes-toolbar">
          <input class="field" id="smsSearch" placeholder="🔍 Tìm tin nhắn…" />
          <button class="btn" id="smsNew">＋</button>
        </div>
        <div id="smsList"></div>`;

      const draw = (q = '') => {
        const f = th.filter(t =>
          (t.name + (t.last || '')).toLowerCase().includes(q.toLowerCase()));
        const el = body.querySelector('#smsList');
        el.innerHTML = f.length ? f.map(t => `
          <div class="list-item" data-id="${t.id}">
            <div class="sms-avatar">${esc(t.name[0]?.toUpperCase() || '?')}</div>
            <div class="li-main">
              <div class="li-title">${esc(t.name)}</div>
              <div class="li-sub">${esc(t.last || 'Chưa có tin nhắn')}</div>
            </div>
            <span class="sms-unread">${t.unread || ''}</span>
          </div>`).join('')
          : `<div class="empty-state"><span class="es-icon">💬</span>Chưa có tin nhắn nào.</div>`;

        el.querySelectorAll('.list-item').forEach(li => {
          li.onclick = () => openThread = (openThread = li.dataset.id, drawThread(li.dataset.id));
        });
      };

      draw();
      body.querySelector('#smsSearch').oninput = e => draw(e.target.value);
      body.querySelector('#smsNew').onclick = () => {
        const name = prompt('Số điện thoại / tên người nhận:');
        if (!name) return;
        const list = threads();
        if (!list.find(t => t.name === name)) {
          list.unshift({ id: Date.now(), name, last: '', msgs: [], unread: 0 });
          DeviceStorage.set('sms', list);
        }
        drawList();
        drawThread(list.find(t => t.name === name).id);
      };
    };

    function drawThread(id) {
      const list = threads();
      const t = list.find(x => x.id === id);
      if (!t) return drawList();
      t.unread = 0;
      DeviceStorage.set('sms', list);

      body.innerHTML = `
        <button class="btn ghost" id="smsBack" style="margin-bottom:12px">← Hộp thoại</button>
        <div class="sms-thread" id="smsThread"></div>
        <div class="sms-compose">
          <input class="field" id="smsInput" placeholder="Nhắn tin…" />
          <button class="btn" id="smsSend">➤</button>
        </div>`;

      const drawMsgs = () => {
        body.querySelector('#smsThread').innerHTML = t.msgs.length
          ? t.msgs.map(m => `
              <div class="sms-bubble ${m.me ? 'me' : 'them'}">
                ${esc(m.text)}
                <span class="sms-time">${new Date(m.at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>`).join('')
          : `<div class="empty-state" style="padding:20px">Bắt đầu trò chuyện…</div>`;
        const th = body.querySelector('#smsThread');
        th.scrollTop = th.scrollHeight;
      };

      drawMsgs();
      body.querySelector('#smsBack').onclick = drawList;
      const send = () => {
        const inp = body.querySelector('#smsInput');
        const text = inp.value.trim();
        if (!text) return;
        t.msgs.push({ me: true, text, at: Date.now() });
        t.last = text;
        DeviceStorage.set('sms', list);
        inp.value = '';
        drawMsgs();
        // trả lời mô phỏng (lưu ngay trên máy)
        setTimeout(() => {
          t.msgs.push({ me: false, text: 'Tin nhắn này được lưu trên máy bạn 💾 (mô phỏng)', at: Date.now() });
          t.last = t.msgs[t.msgs.length - 1].text;
          DeviceStorage.set('sms', list);
          if (body.querySelector('#smsThread')) drawMsgs();
        }, 900);
      };
      body.querySelector('#smsSend').onclick = send;
      body.querySelector('#smsInput').onkeydown = e => { if (e.key === 'Enter') send(); };
    }

    drawList();
  },
});

/* ────────────────────────────────
   🌐 CHROME (trình duyệt – logo Chrome thật)
   Trang web mở NGAY trong khung điện thoại.
   Google KHÔNG bị lồng vào đây – dùng app Google riêng (tab thật).
   ──────────────────────────────── */
registerApp({
  id: 'chrome', name: 'Chrome', emoji: '', color: '#ffffff', dock: true,
  svg: CHROME_LOGO, svgBg: '#ffffff',
  render(body) {
    const QUICK = [
      { name: 'YouTube', url: 'https://www.youtube.com/embed?list=WL' },
      { name: 'Wikipedia', url: 'https://vi.wikipedia.org' },
      { name: 'VnExpress', url: 'https://vnexpress.net' },
      { name: 'Hà Nội', url: 'https://www.openstreetmap.org/export/embed.html?bbox=105.78%2C20.94%2C105.88%2C21.03&layer=mapnik' },
    ];
    let current = QUICK[0].url;

    body.innerHTML = `
      <div class="chrome-bar">
        <input class="field" id="chromeUrl" value="${current}"
               placeholder="Nhập địa chỉ web…" />
        <button class="btn" id="chromeGo">→</button>
      </div>
      <div class="chrome-chips" id="chromeChips">
        <button class="chip chip-google" id="chipGoogle">🔍 Google (tab mới)</button>
        ${QUICK.map(q => `<button class="chip" data-url="${esc(q.url)}">${q.name}</button>`).join('')}
      </div>
      <iframe class="chrome-frame" id="chromeFrame" src="${current}"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              referrerpolicy="no-referrer"></iframe>
      <p class="chrome-note">
        🌐 Trang web được tải thẳng từ internet về MÁY BẠN – không qua server trung gian.
        Site chặn nhúng (X-Frame-Options) → hiện trang trắng.
        Tìm kiếm Google → mở <b>google.com thật</b> ở tab mới.
      </p>`;

    const go = (url) => {
      if (!url) return;
      if (!/^https?:\/\//i.test(url)) {
        // không phải URL → coi là từ khóa, tra Google thật ở tab mới
        if (!url.includes('.') || url.includes(' ')) {
          openGoogle(url);
          return;
        }
        url = 'https://' + url;
      }
      current = url;
      body.querySelector('#chromeUrl').value = url;
      body.querySelector('#chromeFrame').src = url;
    };

    body.querySelector('#chromeGo').onclick = () => go(body.querySelector('#chromeUrl').value.trim());
    body.querySelector('#chromeUrl').onkeydown = e => {
      if (e.key === 'Enter') go(e.target.value.trim());
    };
    body.querySelector('#chipGoogle').onclick = () => {
      const q = body.querySelector('#chromeUrl').value.trim();
      openGoogle(q.includes('.') ? '' : q);
    };
    body.querySelectorAll('.chip[data-url]').forEach(c => c.onclick = () => go(c.dataset.url));
  },
});

/* ────────────────────────────────
   🔍 GOOGLE (app riêng – logo G thật)
   Bấm vào = mở google.com THẬT trên tab trình duyệt.
   ──────────────────────────────── */
registerApp({
  id: 'google', name: 'Google', emoji: '', color: '#ffffff', dock: true,
  svg: GOOGLE_LOGO, svgBg: '#ffffff',
  render(body) {
    body.innerHTML = `
      <div class="google-page">
        <div class="google-logo">${GOOGLE_LOGO}</div>
        <div class="google-search">
          <input class="field" id="gQ" placeholder="Tìm kiếm trên Google…" />
          <button class="btn" id="gGo">Tìm</button>
        </div>
        <div class="google-links">
          <button class="chip" data-t="https://www.youtube.com">YouTube</button>
          <button class="chip" data-t="https://maps.google.com">Google Maps</button>
          <button class="chip" data-t="https://translate.google.com">Translate</button>
          <button class="chip" data-t="https://mail.google.com">Gmail</button>
        </div>
        <p class="chrome-note" style="text-align:center">
          Bấm <b>Tìm</b> hoặc mở link → google.com mở <b>thật</b> trên tab trình duyệt
          của bạn. Không lồng giao diện Google vào trong điện thoại ảo.
        </p>
      </div>`;

    const search = () => {
      const q = body.querySelector('#gQ').value.trim();
      if (!q) { openGoogle(); return; }
      openGoogle(q);
    };
    body.querySelector('#gGo').onclick = search;
    body.querySelector('#gQ').onkeydown = e => { if (e.key === 'Enter') search(); };
    body.querySelectorAll('.google-links .chip').forEach(c => {
      c.onclick = () => window.open(c.dataset.t, '_blank', 'noopener');
    });
    body.querySelector('#gQ').focus();
  },
});

/* ────────────────────────────────
   📷 MÁY ẢNH (camera thật của bạn – lưu vào IndexedDB)
   ──────────────────────────────── */
registerApp({
  id: 'camera', name: 'Máy ảnh', emoji: '📷', color: '#ef4444', dock: true,
  async render(body) {
    body.innerHTML = `
      <div class="cam-wrap">
        <video id="camVideo" autoplay playsinline muted></video>
        <div class="cam-fallback" id="camFallback" style="display:none">
          📷<br>Không truy cập được camera.<br>
          <small>Cho phép camera trong trình duyệt, hoặc mở bằng localhost/HTTPS.</small>
        </div>
      </div>
      <div class="cam-controls">
        <button class="cam-thumb" id="camThumb">🖼️</button>
        <button class="cam-shutter" id="camShot"></button>
        <button class="cam-flip" id="camFlip">🔄</button>
      </div>
      <p class="chrome-note">Ảnh chụp được lưu vào IndexedDB trên MÁY BẠN (mục Thư viện).</p>`;

    const video = body.querySelector('#camVideo');
    const fallback = body.querySelector('#camFallback');
    let stream = null, facing = 'environment';

    const start = async () => {
      try {
        if (stream) stream.getTracks().forEach(t => t.stop());
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing }, audio: false,
        });
        video.srcObject = stream;
        video.style.display = '';
        fallback.style.display = 'none';
      } catch (e) {
        video.style.display = 'none';
        fallback.style.display = 'flex';
      }
    };
    await start();

    body.querySelector('#camFlip').onclick = () => {
      facing = facing === 'environment' ? 'user' : 'environment';
      start();
    };

    body.querySelector('#camShot').onclick = async () => {
      if (!stream) { toast('Camera chưa sẵn sàng'); return; }
      const w = video.videoWidth || 640, h = video.videoHeight || 480;
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(video, 0, 0, w, h);
      const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.9));
      const name = `IMG_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;
      await FS.put('photo_' + Date.now(), blob, { name, type: 'image/jpeg' });
      toast('📷 Đã lưu ảnh vào Thư viện (máy bạn)');
      const th = body.querySelector('#camThumb');
      if (th) th.classList.add('has');
    };

    body.querySelector('#camThumb').onclick = () => openApp('gallery');

    // dọn dẹp khi thoát app – tắt camera
    Apps.find(a => a.id === 'camera').destroy = () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      stream = null;
    };
  },
});

/* ────────────────────────────────
   🖼️ THƯ VIỆN (ảnh chụp – đọc từ IndexedDB)
   ──────────────────────────────── */
registerApp({
  id: 'gallery', name: 'Thư viện', emoji: '🖼️', color: '#ec4899',
  async render(body) {
    const photos = FS.list(k => k.key.startsWith('photo_'));

    if (!photos.length) {
      body.innerHTML = `<div class="empty-state">
        <span class="es-icon">🖼️</span>Chưa có ảnh nào.<br>
        Mở <strong>Máy ảnh</strong> để chụp ảnh – ảnh lưu trên máy bạn!
      </div>`;
      return;
    }

    body.innerHTML = `
      <div class="gal-grid" id="galGrid"></div>
      <div class="gal-view" id="galView" style="display:none">
        <img id="galImg" alt="ảnh" />
        <div class="gal-actions">
          <button class="btn ghost" id="galDown">⬇ Tải về máy</button>
          <button class="btn danger" id="galDel">🗑 Xóa</button>
          <button class="btn ghost" id="galClose">✕ Đóng</button>
        </div>
      </div>`;

    const grid = body.querySelector('#galGrid');
    const objectUrls = [];

    const draw = () => {
      const list = FS.list(k => k.key.startsWith('photo_'));
      grid.innerHTML = list.map(p => `
        <div class="gal-item" data-k="${p.key}">
          <div class="gal-ph" data-k="${p.key}"></div>
          <span>${esc(p.name.slice(0, 18))}</span>
        </div>`).join('');

      // load thumbnail bất đồng bộ
      list.forEach(p => {
        FS.get(p.key).then(blob => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          objectUrls.push(url);
          const el = grid.querySelector(`[data-k="${p.key}"].gal-ph`) ||
                     grid.querySelector(`.gal-item[data-k="${p.key}"] .gal-ph`);
          if (el) el.style.backgroundImage = `url(${url})`;
        });
      });

      grid.querySelectorAll('.gal-item').forEach(it => {
        it.onclick = async () => {
          const blob = await FS.get(it.dataset.k);
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          objectUrls.push(url);
          const view = body.querySelector('#galView');
          body.querySelector('#galImg').src = url;
          view.style.display = 'flex';
          view.dataset.k = it.dataset.k;
        };
      });
    };

    draw();

    body.querySelector('#galClose').onclick = () => {
      body.querySelector('#galView').style.display = 'none';
    };
    body.querySelector('#galDown').onclick = async () => {
      const k = body.querySelector('#galView').dataset.k;
      await FS.download(k);
      toast('⬇ Đã tải ảnh về máy');
    };
    body.querySelector('#galDel').onclick = async () => {
      const k = body.querySelector('#galView').dataset.k;
      await FS.remove(k);
      body.querySelector('#galView').style.display = 'none';
      draw();
      toast('🗑 Đã xóa ảnh khỏi máy bạn');
    };

    // dọn object URL khi thoát
    Apps.find(a => a.id === 'gallery').destroy = () => {
      objectUrls.forEach(u => URL.revokeObjectURL(u));
    };
  },
});

/* ────────────────────────────────
   ⏰ ĐỒNG HỒ (giờ thật + bấm giờ)
   ──────────────────────────────── */
registerApp({
  id: 'clock', name: 'Đồng hồ', emoji: '⏰', color: '#6366f1',
  render(body) {
    let swRunning = false, swStart = 0, swElapsed = 0, swTimer = null;
    let timer = null;

    body.innerHTML = `
      <div class="clk-hero">
        <div class="clk-time" id="clkTime">00:00:00</div>
        <div class="clk-date" id="clkDate"></div>
      </div>

      <div class="section-title">Bấm giờ</div>
      <div class="sw-box">
        <div class="sw-time" id="swTime">00:00.00</div>
        <div class="sw-btns">
          <button class="btn" id="swStart">▶ Bắt đầu</button>
          <button class="btn ghost" id="swLap">Vòng</button>
          <button class="btn ghost" id="swReset">↺ Đặt lại</button>
        </div>
        <div class="sw-laps" id="swLaps"></div>
      </div>

      <div class="section-title">Hẹn giờ (phút)</div>
      <div class="sw-box" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input class="field" id="tmInput" type="number" min="1" max="180"
               value="5" style="width:90px" />
        <button class="btn" id="tmStart">⏱ Bắt đầu</button>
        <span id="tmLeft" style="font-weight:700;font-size:16px"></span>
      </div>`;

    const fmtSW = (ms) => {
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      const c = Math.floor((ms % 1000) / 10);
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
    };

    const tick = () => {
      const now = new Date();
      body.querySelector('#clkTime').textContent =
        now.toLocaleTimeString('vi-VN', { hour12: false });
      body.querySelector('#clkDate').textContent =
        now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      if (swRunning) {
        body.querySelector('#swTime').textContent = fmtSW(swElapsed + (Date.now() - swStart));
      }
    };
    timer = setInterval(tick, 50);
    tick();

    const laps = [];
    body.querySelector('#swStart').onclick = (e) => {
      swRunning = !swRunning;
      if (swRunning) {
        swStart = Date.now();
        e.target.textContent = '⏸ Tạm dừng';
      } else {
        swElapsed += Date.now() - swStart;
        e.target.textContent = '▶ Bắt đầu';
      }
    };
    body.querySelector('#swLap').onclick = () => {
      const ms = swElapsed + (swRunning ? Date.now() - swStart : 0);
      if (!swRunning && !ms) return;
      laps.unshift(fmtSW(ms));
      body.querySelector('#swLaps').innerHTML = laps
        .map((l, i) => `<div class="sw-lap"><b>V${laps.length - i}</b> ${l}</div>`).join('');
    };
    body.querySelector('#swReset').onclick = () => {
      swRunning = false; swElapsed = 0; laps.length = 0;
      body.querySelector('#swTime').textContent = '00:00.00';
      body.querySelector('#swStart').textContent = '▶ Bắt đầu';
      body.querySelector('#swLaps').innerHTML = '';
    };

    let tmEnd = 0;
    body.querySelector('#tmStart').onclick = () => {
      const min = Math.min(180, Math.max(1, +body.querySelector('#tmInput').value || 5));
      tmEnd = Date.now() + min * 60000;
      clearInterval(swTimer);
      const upd = () => {
        const left = tmEnd - Date.now();
        if (left <= 0) {
          clearInterval(swTimer);
          body.querySelector('#tmLeft').textContent = '🔔 Hết giờ!';
          toast('🔔 Hẹn giờ đã hết!');
          return;
        }
        const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
        body.querySelector('#tmLeft').textContent = `${m}:${String(s).padStart(2, '0')}`;
      };
      upd();
      swTimer = setInterval(upd, 500);
      toast(`⏱ Hẹn ${min} phút`);
    };

    // dọn khi thoát app
    Apps.find(a => a.id === 'clock').destroy = () => {
      clearInterval(timer); clearInterval(swTimer);
    };
  },
});

/* ────────────────────────────────
   📁 TỆP (quản lý file trên IndexedDB + localStorage)
   ──────────────────────────────── */
registerApp({
  id: 'files', name: 'Tệp', emoji: '📁', color: '#0ea5e9',
  async render(body) {
    const draw = async () => {
      const big = FS.list();
      const settings = DeviceStorage.keys().filter(k => k !== FS.META_KEY);
      const u = DeviceStorage.usage();

      body.innerHTML = `
        <div class="storage-hero">
          <div class="sh-sub">Tổng dữ liệu trên MÁY BẠN</div>
          <div class="sh-num">${fmtBytes(u.totalBytes)}</div>
          <div class="sh-sub">
            Tệp lớn ${fmtBytes(u.fsBytes)} · Cài đặt/Ghi chú ${fmtBytes(u.diskBytes)} · RAM ${fmtBytes(u.ramBytes)}
          </div>
        </div>

        <div class="section-title">Tệp lớn (IndexedDB – ảnh, nhạc, APK, game)</div>
        <div id="fsBig"></div>

        <div class="section-title">Dữ liệu app (localStorage)</div>
        ${settings.length ? settings.map(k => `
          <div class="list-item" style="cursor:default">
            <span class="li-icon">💾</span>
            <div class="li-main">
              <div class="li-title">${esc(k)}</div>
              <div class="li-sub">${fmtBytes(new Blob([localStorage.getItem(DeviceStorage.PREFIX + k) || '']).size)}</div>
            </div>
            <button class="li-del" data-ls="${esc(k)}">🗑</button>
          </div>`).join('')
        : '<div class="empty-state" style="padding:14px">Trống.</div>'}

        <div style="display:flex;gap:10px;margin-top:14px">
          <button class="btn ghost" id="fsExport">⬇ Xuất backup</button>
          <button class="btn danger" id="fsWipe">🗑 Xóa toàn bộ tệp</button>
        </div>`;

      const bigEl = body.querySelector('#fsBig');
      bigEl.innerHTML = big.length ? big.map(f => `
        <div class="list-item" style="cursor:default">
          <span class="li-icon">${f.type.startsWith('image') ? '🖼️' : f.type.startsWith('audio') ? '🎵' : '📄'}</span>
          <div class="li-main">
            <div class="li-title">${esc(f.name)}</div>
            <div class="li-sub">${fmtBytes(f.size)} · ${new Date(f.at).toLocaleString('vi-VN')}</div>
          </div>
          <button class="btn ghost" style="padding:6px 10px;font-size:12px" data-dl="${f.key}">⬇</button>
          <button class="li-del" data-big="${f.key}">🗑</button>
        </div>`).join('')
        : '<div class="empty-state" style="padding:14px">Chưa có tệp lớn nào.</div>';

      bigEl.querySelectorAll('[data-dl]').forEach(b => {
        b.onclick = async () => { await FS.download(b.dataset.dl); toast('⬇ Đã tải về máy'); };
      });
      bigEl.querySelectorAll('[data-big]').forEach(b => {
        b.onclick = async () => { await FS.remove(b.dataset.big); draw(); toast('🗑 Đã xóa tệp'); };
      });
      body.querySelectorAll('[data-ls]').forEach(b => {
        b.onclick = () => { DeviceStorage.remove(b.dataset.ls); draw(); toast('🗑 Đã xóa khỏi đĩa'); };
      });
      body.querySelector('#fsExport').onclick = () => {
        const data = JSON.stringify(DeviceStorage.exportAll(), null, 2);
        const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url; a.download = 'web_gialap_Android_backup.json'; a.click();
        URL.revokeObjectURL(url);
        toast('⬇ Đã xuất backup');
      };
      body.querySelector('#fsWipe').onclick = async () => {
        if (confirm('Xóa MỌI tệp lớn (ảnh, nhạc…) trên máy bạn?')) {
          await FS.clear();
          draw();
          toast('🗑 Đã xóa toàn bộ tệp');
        }
      };
    };

    draw();
  },
});
