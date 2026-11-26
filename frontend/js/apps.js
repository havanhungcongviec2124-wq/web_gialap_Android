/* ═══════════════════════════════════════════════════════════
   apps.js – Hệ thống ứng dụng của web_gialap_Android
   Mỗi app: { id, name, emoji, color, dock?, render(body) }
   Mọi app dùng DeviceStorage để lưu trên MÁY NGƯỜI DÙNG.
   ═══════════════════════════════════════════════════════════ */

const Apps = [];
const registerApp = (app) => { Apps.push(app); return app; };

/* ────────────────────────────────
   📝 GHI CHÚ
   ──────────────────────────────── */
registerApp({
  id: 'notes', name: 'Ghi chú', emoji: '📝', color: '#f5b942',
  render(body) {
    const state = { editing: null }; // RAM tạm của app

    function list() {
      const notes = DeviceStorage.get('notes', []);
      body.innerHTML = `
        <div class="notes-toolbar">
          <input class="field" id="noteSearch" placeholder="🔍 Tìm ghi chú…" />
          <button class="btn" id="noteNew">＋</button>
        </div>
        <div id="noteList"></div>`;

      const draw = (filter = '') => {
        const q = filter.toLowerCase();
        const filtered = notes.filter(n =>
          (n.title + n.text).toLowerCase().includes(q));
        const el = body.querySelector('#noteList');
        if (!filtered.length) {
          el.innerHTML = `<div class="empty-state">
            <span class="es-icon">📝</span>
            Chưa có ghi chú nào.<br>Nhấn ＋ để tạo – dữ liệu lưu trên máy bạn!
          </div>`;
          return;
        }
        el.innerHTML = filtered.map(n => `
          <div class="list-item" data-id="${n.id}">
            <span class="li-icon">📄</span>
            <div class="li-main">
              <div class="li-title">${esc(n.title || 'Không tiêu đề')}</div>
              <div class="li-sub">${new Date(n.updated).toLocaleString('vi-VN')} · ${fmtBytes(size(n))}</div>
            </div>
            <button class="li-del" data-del="${n.id}" title="Xóa">🗑</button>
          </div>`).join('');
      };

      draw();
      body.querySelector('#noteSearch').oninput = e => draw(e.target.value);
      body.querySelector('#noteNew').onclick = () => edit(null);

      body.querySelectorAll('.list-item').forEach(li => {
        li.onclick = (e) => {
          if (e.target.dataset.del) return;
          edit(li.dataset.id);
        };
      });
      body.querySelectorAll('.li-del').forEach(btn => {
        btn.onclick = () => {
          const id = btn.dataset.del;
          const idx = notes.findIndex(n => n.id === id);
          if (idx > -1) { notes.splice(idx, 1); DeviceStorage.set('notes', notes); }
          draw(body.querySelector('#noteSearch').value);
          toast('Đã xóa – gỡ khỏi bộ nhớ máy bạn');
        };
      });
    }

    function edit(id) {
      const notes = DeviceStorage.get('notes', []);
      const note = id ? notes.find(n => n.id === id)
        : { id: Date.now(), title: '', text: '', updated: Date.now() };
      state.editing = note.id;

      body.innerHTML = `
        <div class="note-editor">
          <input class="field" id="nTitle" placeholder="Tiêu đề" style="margin-bottom:10px"
                 value="${esc(note.title)}" />
          <textarea id="nText" placeholder="Viết gì đó…">${esc(note.text)}</textarea>
          <div class="note-actions">
            <button class="btn" id="nSave">💾 Lưu vào máy</button>
            <button class="btn ghost" id="nBack">← Danh sách</button>
          </div>
          <p style="font-size:11px;color:#7a869e;margin-top:10px">
            💾 Ghi chú được ghi vào ổ đĩa của BẠN (localStorage) – không qua server.
          </p>
        </div>`;

      body.querySelector('#nBack').onclick = list;
      body.querySelector('#nSave').onclick = () => {
        note.title = body.querySelector('#nTitle').value.trim();
        note.text = body.querySelector('#nText').value;
        note.updated = Date.now();
        const i = notes.findIndex(n => n.id === note.id);
        if (i > -1) notes[i] = note; else notes.unshift(note);
        DeviceStorage.set('notes', notes);
        toast('✓ Đã lưu vào bộ nhớ máy bạn');
        list();
      };
    }

    list();
  },
});

/* ────────────────────────────────
   🧮 MÁY TÍNH
   ──────────────────────────────── */
registerApp({
  id: 'calc', name: 'Máy tính', emoji: '🧮', color: '#5a6472',
  render(body) {
    // expression lưu trong RAM (DeviceStorage.RAM) – mang nghĩa "bộ nhớ tính toán"
    DeviceStorage.setRam('calc_expr', '');
    DeviceStorage.setRam('calc_result', '0');

    body.innerHTML = `
      <div class="calc-display">
        <div class="calc-expr" id="cExpr"></div>
        <div class="calc-result" id="cRes">0</div>
      </div>
      <div class="calc-grid" id="cGrid"></div>`;

    const keys = [
      ['C', 'op'], ['(', 'op'], [')', 'op'], ['⌫', 'op'],
      ['7', ''], ['8', ''], ['9', ''], ['÷', 'op'],
      ['4', ''], ['5', ''], ['6', ''], ['×', 'op'],
      ['1', ''], ['2', ''], ['3', ''], ['−', 'op'],
      ['0', 'zero'], ['.', ''], ['=', 'eq'], ['+', 'op'],
    ];
    const grid = body.querySelector('#cGrid');
    grid.innerHTML = keys.map(([k, cls]) =>
      `<button class="calc-btn ${cls}" data-k="${k}">${k}</button>`).join('');

    const exprEl = body.querySelector('#cExpr');
    const resEl = body.querySelector('#cRes');

    const refresh = () => {
      exprEl.textContent = DeviceStorage.getRam('calc_expr', '');
      resEl.textContent = DeviceStorage.getRam('calc_result', '0');
    };

    grid.onclick = (e) => {
      const k = e.target.dataset.k;
      if (!k) return;
      let expr = DeviceStorage.getRam('calc_expr', '');

      if (k === 'C') { expr = ''; DeviceStorage.setRam('calc_result', '0'); }
      else if (k === '⌫') expr = expr.slice(0, -1);
      else if (k === '=') {
        try {
          const js = expr.replace(/×/g, '*').replace(/÷/g, '/')
                         .replace(/−/g, '-').replace(/(\d)\(/g, '$1*(');
          if (!/^[0-9+\-*/().\s]+$/.test(js)) throw new Error('bad');
          const val = Function(`"use strict";return (${js})`)();
          if (val === undefined || !isFinite(val)) throw new Error('bad');
          const rounded = Math.round(val * 1e10) / 1e10;
          DeviceStorage.setRam('calc_result', String(rounded));
          DeviceStorage.setRam('calc_history',
            [...DeviceStorage.getRam('calc_history', []), { expr, val: rounded, at: Date.now() }]);
        } catch { DeviceStorage.setRam('calc_result', 'Lỗi'); }
        expr = '';
      } else expr += k;

      DeviceStorage.setRam('calc_expr', expr);
      refresh();
    };
    refresh();
  },
});

/* ────────────────────────────────
   ⚙️ CÀI ĐẶT
   ──────────────────────────────── */
registerApp({
  id: 'settings', name: 'Cài đặt', emoji: '⚙️', color: '#6b7280',
  render(body) {
    const s = DeviceStorage.get('settings', { dark: true, wallpaper: 0 });
    const wallpapers = [
      'linear-gradient(160deg,#16213e,#0f172a 50%,#1a1040)',
      'linear-gradient(160deg,#0f3d3e,#042f2e 60%,#134e4a)',
      'linear-gradient(160deg,#3b1d4f,#1a1040 60%,#4a1942)',
      'linear-gradient(160deg,#422006,#1c1917 60%,#3f1d0b)',
    ];

    const draw = () => {
      const u = DeviceStorage.usage();
      body.innerHTML = `
        <div class="section-title">Hiển thị</div>
        <div class="setting-row">
          <div><div class="sr-label">Chế độ tối</div>
               <div class="sr-sub">Giao diện tối cho màn hình khóa & launcher</div></div>
          <div class="switch ${s.dark ? 'on' : ''}" id="swDark"></div>
        </div>
        <div class="setting-row" style="flex-direction:column;align-items:flex-start">
          <div class="sr-label">Hình nền</div>
          <div class="wallpaper-row">
            ${wallpapers.map((w, i) =>
              `<div class="wp-dot ${s.wallpaper === i ? 'selected' : ''}"
                    data-wp="${i}" style="background:${w}"></div>`).join('')}
          </div>
        </div>

        <div class="section-title">Về thiết bị ảo</div>
        <div class="setting-row">
          <div><div class="sr-label">web_gialap_Android</div>
               <div class="sr-sub">Android 14 (simulated) · Web runtime 1.0</div></div>
          <span style="font-size:26px">🤖</span>
        </div>
        <div class="setting-row">
          <div><div class="sr-label">Bộ nhớ đã dùng</div>
               <div class="sr-sub">${fmtBytes(u.diskBytes)} ổ đĩa · ${fmtBytes(u.ramBytes)} RAM · ${u.count} mục</div></div>
          <span style="font-size:22px">💾</span>
        </div>

        <div class="section-title">Dữ liệu & Quyền riêng tư</div>
        <div class="setting-row">
          <div><div class="sr-label">🔒 Lưu trên máy bạn</div>
               <div class="sr-sub">Không server · Không đồng bộ · Không theo dõi</div></div>
        </div>
        <div style="display:flex;gap:10px;margin-top:6px">
          <button class="btn ghost" id="btnExport">⬇ Xuất backup</button>
          <button class="btn danger" id="btnWipe">🗑 Xóa toàn bộ</button>
        </div>`;

      body.querySelector('#swDark').onclick = () => {
        s.dark = !s.dark;
        DeviceStorage.set('settings', s);
        applySettings();
        draw();
      };
      body.querySelectorAll('.wp-dot').forEach(d => {
        d.onclick = () => {
          s.wallpaper = +d.dataset.wp;
          DeviceStorage.set('settings', s);
          applySettings();
          draw();
          toast('✓ Đã đổi hình nền');
        };
      });
      body.querySelector('#btnExport').onclick = () => {
        const data = JSON.stringify(DeviceStorage.exportAll(), null, 2);
        const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url; a.download = 'web_gialap_Android_backup.json'; a.click();
        URL.revokeObjectURL(url);
        toast('⬇ Đã tải backup về máy');
      };
      body.querySelector('#btnWipe').onclick = () => {
        if (confirm('XÓA toàn bộ dữ liệu trên máy bạn?\n(Hành động này không thể hoàn tác)')) {
          DeviceStorage.wipe();
          applySettings();
          draw();
          toast('🗑 Đã xóa toàn bộ – máy bạn sạch hoàn toàn');
        }
      };
    };
    draw();
  },
});

/* ────────────────────────────────
   📦 BỘ NHỚ (trình quản lý)
   ──────────────────────────────── */
registerApp({
  id: 'storage', name: 'Bộ nhớ', emoji: '📦', color: '#3b82f6',
  render(body) {
    const u = DeviceStorage.usage();
    body.innerHTML = `
      <div class="storage-hero">
        <div class="sh-sub">Bộ nhớ đã dùng trên MÁY BẠN</div>
        <div class="sh-num">${fmtBytes(u.diskBytes)}</div>
        <div class="sh-sub">RAM ${fmtBytes(u.ramBytes)} · ${u.count} mục dữ liệu</div>
      </div>

      <div class="section-title">Ổ đĩa (localStorage – bền vững)</div>
      ${u.entries.length ? u.entries.map(e => `
        <div class="list-item" style="cursor:default">
          <span class="li-icon">💾</span>
          <div class="li-main">
            <div class="li-title">${esc(e.key)}</div>
            <div class="li-sub">${fmtBytes(e.bytes)}</div>
          </div>
          <button class="li-del" data-key="${esc(e.key)}">🗑</button>
        </div>`).join('')
      : `<div class="empty-state"><span class="es-icon">📭</span>Chưa có dữ liệu nào trên đĩa.</div>`}

      <div class="section-title">RAM phiên hiện tại (tạm – mất khi đóng tab)</div>
      ${Object.keys(DeviceStorage.RAM).length
        ? Object.keys(DeviceStorage.RAM).map(k => `
          <div class="list-item" style="cursor:default;background:#fffbea">
            <span class="li-icon">⚡</span>
            <div class="li-main">
              <div class="li-title">${esc(k)}</div>
              <div class="li-sub">${fmtBytes(new Blob([JSON.stringify(DeviceStorage.RAM[k]) ?? '']).size)}</div>
            </div>
          </div>`).join('')
        : `<div class="empty-state" style="padding:16px">RAM trống.</div>`}

      <p style="font-size:11px;color:#7a869e;margin-top:14px;line-height:1.6">
        ℹ️ Toàn bộ dữ liệu trên nằm trong trình duyệt của BẠN.
        Không có bản sao nào được gửi lên internet.
      </p>`;

    body.querySelectorAll('.li-del').forEach(b => {
      b.onclick = () => {
        DeviceStorage.remove(b.dataset.key);
        toast('Đã xóa 1 mục khỏi đĩa máy bạn');
        Apps.find(a => a.id === 'storage').render(body);
      };
    });
  },
});

/* ────────────────────────────────
   ▶ CH PLAY – cửa hàng game thật
   Cài game → icon xuất hiện trên màn hình chính.
   Danh sách đã cài lưu trong localStorage (máy người dùng).
   ──────────────────────────────── */
registerApp({
  id: 'store', name: 'CH Play', emoji: '▶', color: '#01875f',
  render(body) {
    // Đảm bảo game đã cài được đăng ký thành app
    const syncInstalled = () => {
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
      renderLauncher();
    };

    const installed = () => DeviceStorage.get('installed', []);

    const draw = (tab = 'games') => {
      const inst = installed();
      const list = tab === 'installed'
        ? Games.filter(g => inst.includes(g.id))
        : Games;

      body.innerHTML = `
        <div class="store-banner">
          <h2>▶ CH Play</h2>
          <p>Tải game về chơi NGAY trên điện thoại ảo này – game lưu trong bộ nhớ máy bạn.</p>
        </div>
        <div class="store-tabs">
          <button class="stab ${tab === 'games' ? 'on' : ''}" data-t="games">Khám phá</button>
          <button class="stab ${tab === 'installed' ? 'on' : ''}" data-t="installed">Đã cài (${inst.length})</button>
        </div>
        <div id="storeList"></div>`;

      const el = body.querySelector('#storeList');
      el.innerHTML = list.length ? list.map(g => {
        const has = inst.includes(g.id);
        return `
        <div class="game-card">
          <div class="gc-icon" style="background:${g.color}">${g.emoji}</div>
          <div class="gc-main">
            <div class="gc-name">${g.name}</div>
            <div class="gc-meta">${g.cat} · ${g.size} · ⭐ ${(4 + Math.random() * 0.9).toFixed(1)}</div>
            <div class="gc-desc">${g.desc}</div>
          </div>
          <button class="gc-btn ${has ? 'installed' : ''}" data-g="${g.id}">
            ${has ? 'Mở' : 'Cài đặt'}
          </button>
        </div>`;
      }).join('') : `<div class="empty-state"><span class="es-icon">🎮</span>Chưa cài game nào.</div>`;

      body.querySelectorAll('.stab').forEach(t => t.onclick = () => draw(t.dataset.t));
      body.querySelectorAll('.gc-btn').forEach(b => {
        b.onclick = async () => {
          const g = Games.find(x => x.id === b.dataset.g);
          const list2 = installed();
          if (list2.includes(g.id)) { openApp('game_' + g.id); return; }

          // mô phỏng tiến trình cài
          b.textContent = '0%';
          b.classList.add('installed');
          let p = 0;
          const iv = setInterval(() => {
            p += 7 + Math.random() * 16;
            if (p >= 100) {
              clearInterval(iv);
              list2.push(g.id);
              DeviceStorage.set('installed', list2);
              syncInstalled();
              toast(`✓ Đã cài ${g.name} – icon đã thêm vào màn hình chính`);
              draw(tab);
            } else b.textContent = Math.floor(p) + '%';
          }, 120);
        };
      });

      // "Mở" từ tab đã cài
      body.querySelectorAll('.game-card').forEach(card => {
        const btn = card.querySelector('.gc-btn');
        if (btn.textContent === 'Mở') {
          card.style.cursor = 'pointer';
          card.onclick = (e) => {
            if (e.target === btn) return;
            openApp('game_' + btn.dataset.g);
          };
        }
      });
    };

    syncInstalled();
    draw();
  },
});

/* ── helpers dùng chung ── */
function esc(s = '') {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function size(obj) {
  try { return new Blob([JSON.stringify(obj)]).size; } catch { return 0; }
}
