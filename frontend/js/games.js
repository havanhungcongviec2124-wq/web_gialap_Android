/* ═══════════════════════════════════════════════════════════
   games.js – Game THẬT cài từ CH Play và chơi được
   Mỗi game: { id, name, emoji, color, size, cat, desc, play(body) }
   Danh sách đã cài lưu trong localStorage (máy người dùng).
   ═══════════════════════════════════════════════════════════ */

const Games = [];
const registerGame = (g) => { Games.push(g); return g; };

/* ────────────────────────────────
   🐍 RẮN SĂN MỒI (Snake)
   ──────────────────────────────── */
registerGame({
  id: 'snake', name: 'Rắn Săn Mồi', emoji: '🐍', color: '#22c55e',
  size: '2 MB', cat: 'Hành động', desc: 'Điều khiển rắn bằng phím mũi tên hoặc vuốt trên màn hình.',
  play(body) {
    const COLS = 15, ROWS = 15, CELL = 20;
    let snake, dir, nextDir, food, score, best, timer, alive;

    best = DeviceStorage.get('game_snake_best', 0);

    body.innerHTML = `
      <div class="game-hud">
        <span>Điểm: <b id="skScore">0</b></span>
        <span>Best: <b id="skBest">${best}</b></span>
      </div>
      <canvas id="skCanvas" width="${COLS * CELL}" height="${ROWS * CELL}"></canvas>
      <div class="game-hint">Phím mũi tên / WASD để diệu hướng${' – hoặc vuốt trên màn hình'}</div>
      <button class="btn" id="skStart" style="margin-top:10px">▶ Chơi</button>`;

    const cv = body.querySelector('#skCanvas');
    const ctx = cv.getContext('2d');

    const reset = () => {
      snake = [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }];
      dir = { x: 1, y: 0 }; nextDir = dir;
      score = 0; alive = true;
      placeFood();
      body.querySelector('#skScore').textContent = '0';
    };

    const placeFood = () => {
      do {
        food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
      } while (snake.some(s => s.x === food.x && s.y === food.y));
    };

    const draw = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, cv.width, cv.height);
      // lưới
      ctx.strokeStyle = 'rgba(255,255,255,.05)';
      for (let i = 0; i <= COLS; i++) {
        ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, ROWS * CELL); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(COLS * CELL, i * CELL); ctx.stroke();
      }
      // food
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2);
      ctx.fill();
      // rắn
      snake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? '#4ade80' : '#22c55e';
        ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
      });
    };

    const step = () => {
      if (!alive) return;
      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      // va tường / tự cắn
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS ||
          snake.some(s => s.x === head.x && s.y === head.y)) {
        alive = false;
        clearInterval(timer);
        if (score > best) {
          best = score;
          DeviceStorage.set('game_snake_best', best);
          body.querySelector('#skBest').textContent = best;
          toast('🏆 Kỷ lục mới!');
        } else toast('💀 Trò chơi kết thúc – điểm: ' + score);
        body.querySelector('#skStart').textContent = '↺ Chơi lại';
        return;
      }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score += 10;
        body.querySelector('#skScore').textContent = score;
        placeFood();
      } else snake.pop();
      draw();
    };

    const setDir = (x, y) => {
      if (x === -dir.x && y === -dir.y) return; // không được đảo chiều ngược
      nextDir = { x, y };
    };

    // bàn phím
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') { setDir(0, -1); e.preventDefault(); }
      if (k === 'arrowdown' || k === 's') { setDir(0, 1); e.preventDefault(); }
      if (k === 'arrowleft' || k === 'a') { setDir(-1, 0); e.preventDefault(); }
      if (k === 'arrowright' || k === 'd') { setDir(1, 0); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);

    // vuốt trên màn hình
    let tx = 0, ty = 0;
    const onTouchStart = (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; };
    const onTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - tx;
      const dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > Math.abs(dy)) setDir(Math.sign(dx), 0);
      else setDir(0, Math.sign(dy));
    };
    cv.addEventListener('touchstart', onTouchStart, { passive: true });
    cv.addEventListener('touchend', onTouchEnd, { passive: true });

    body.querySelector('#skStart').onclick = () => {
      reset();
      draw();
      clearInterval(timer);
      timer = setInterval(step, 130);
      body.querySelector('#skStart').textContent = '↺ Chơi lại';
    };

    reset();
    draw();

    // dọn khi thoát
    Games.find(g => g.id === 'snake').destroy = () => {
      clearInterval(timer);
      window.removeEventListener('keydown', onKey);
      cv.removeEventListener('touchstart', onTouchStart);
      cv.removeEventListener('touchend', onTouchEnd);
    };
  },
});

/* ────────────────────────────────
   🧩 2048 – puzzle số
   ──────────────────────────────── */
registerGame({
  id: 'g2048', name: '2048', emoji: '🔢', color: '#f59e0b',
  size: '1 MB', cat: 'Puzzle', desc: 'Gộp các ô số giống nhau để đạt 2048!',
  play(body) {
    let grid, score, best, over, won;

    best = DeviceStorage.get('game_2048_best', 0);

    body.innerHTML = `
      <div class="game-hud">
        <span>Điểm: <b id="gScore">0</b></span>
        <span>Best: <b id="gBest">${best}</b></span>
      </div>
      <div class="g2048-grid" id="gGrid"></div>
      <div class="game-hint">Phím mũi tên để di chuyển</div>
      <button class="btn" id="gNew" style="margin-top:10px">↺ Ván mới</button>`;

    const COLORS = {
      2: '#eef2ff', 4: '#e0e7ff', 8: '#c7d2fe', 16: '#a5b4fc',
      32: '#818cf8', 64: '#6366f1', 128: '#4f46e5', 256: '#4338ca',
      512: '#3730a3', 1024: '#312e81', 2048: '#1e1b4b',
    };

    const empty = () => Array.from({ length: 4 }, () => [0, 0, 0, 0]);

    const addTile = () => {
      const free = [];
      grid.forEach((r, y) => r.forEach((v, x) => { if (!v) free.push([x, y]); }));
      if (!free.length) return;
      const [x, y] = free[Math.floor(Math.random() * free.length)];
      grid[y][x] = Math.random() < 0.9 ? 2 : 4;
    };

    const draw = () => {
      const el = body.querySelector('#gGrid');
      el.innerHTML = grid.flat().map(v => `
        <div class="g2048-tile ${v ? '' : 'empty'}" style="${v ? `background:${COLORS[v] || '#1e1b4b'};color:${v > 4 ? '#fff' : '#333'}` : ''}">
          ${v || ''}
        </div>`).join('');
    };

    const collapse = (row) => {
      const arr = row.filter(v => v);
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
          arr[i] *= 2;
          score += arr[i];
          if (arr[i] === 2048) won = true;
          arr.splice(i + 1, 1);
        }
      }
      while (arr.length < 4) arr.push(0);
      return arr;
    };

    const move = (dir) => {
      if (over) return;
      const before = JSON.stringify(grid);

      const rot = (g) => g[0].map((_, i) => g.map(r => r[i]).reverse());
      let g = grid.map(r => [...r]);
      let n = dir; // 0=left 1=up 2=right 3=down
      while (n-- > 0) g = rot(g);
      g = g.map(collapse);
      while ((dir - (4 - dir)) && false) break; // noop
      for (let i = 0; i < (4 - dir) % 4; i++) g = rot(g);

      grid = g;
      if (JSON.stringify(grid) !== before) {
        addTile();
        body.querySelector('#gScore').textContent = score;
        draw();
        if (score > best) {
          best = score;
          DeviceStorage.set('game_2048_best', best);
          body.querySelector('#gBest').textContent = best;
        }
        if (won) { toast('🎉 Bạn đã đạt 2048!'); won = false; }
        else if (isOver()) { over = true; toast('💀 Hết nước đi – điểm: ' + score); }
      }
    };

    const isOver = () => {
      for (let y = 0; y < 4; y++)
        for (let x = 0; x < 4; x++) {
          if (!grid[y][x]) return false;
          if (x < 3 && grid[y][x] === grid[y][x + 1]) return false;
          if (y < 3 && grid[y][x] === grid[y + 1][x]) return false;
        }
      return true;
    };

    const newGame = () => {
      grid = empty(); score = 0; over = false; won = false;
      addTile(); addTile();
      body.querySelector('#gScore').textContent = '0';
      draw();
    };

    const onKey = (e) => {
      const m = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, ArrowDown: 3 };
      if (e.key in m) { move(m[e.key]); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);

    body.querySelector('#gNew').onclick = newGame;
    newGame();

    Games.find(g => g.id === 'g2048').destroy = () =>
      window.removeEventListener('keydown', onKey);
  },
});

/* ────────────────────────────────
   ❌⭕ CỜ CARO (1 người vs máy)
   ──────────────────────────────── */
registerGame({
  id: 'caro', name: 'Cờ Caro', emoji: '⭕', color: '#3b82f6',
  size: '1 MB', cat: 'Chiến thuật', desc: 'Đánh cờ caro 15×15 với máy – thắng 5 nước thẳng hàng.',
  play(body) {
    const N = 15, WIN = 5;
    let board, turn, over, myScore, aiScore;

    myScore = DeviceStorage.get('game_caro_win', 0);
    aiScore = DeviceStorage.get('game_caro_lose', 0);

    body.innerHTML = `
      <div class="game-hud">
        <span>Bạn <b style="color:#3b82f6">⭕</b>: <b id="cWin">${myScore}</b></span>
        <span>Máy <b style="color:#ef4444">✕</b>: <b id="cLose">${aiScore}</b></span>
      </div>
      <div class="caro-board" id="cBoard"></div>
      <div class="game-hint" id="cHint">Lượt của bạn – đánh vào ô trống</div>
      <button class="btn" id="cNew" style="margin-top:10px">↺ Ván mới</button>`;

    const draw = () => {
      body.querySelector('#cBoard').innerHTML = board.map((row, y) =>
        row.map((v, x) => `<button class="caro-cell ${v === 1 ? 'me' : v === 2 ? 'ai' : ''}"
            data-x="${x}" data-y="${y}">${v === 1 ? '⭕' : v === 2 ? '✕' : ''}</button>`).join('')
      ).join('');
      body.querySelectorAll('.caro-cell').forEach(c => {
        c.onclick = () => {
          if (over || turn !== 'me') return;
          const x = +c.dataset.x, y = +c.dataset.y;
          if (board[y][x]) return;
          board[y][x] = 1;
          draw();
          if (checkWin(board, 1)) {
            over = true;
            myScore++; DeviceStorage.set('game_caro_win', myScore);
            body.querySelector('#cWin').textContent = myScore;
            body.querySelector('#cHint').textContent = '🏆 Bạn thắng!';
            toast('🏆 Bạn thắng máy!');
            return;
          }
          if (isFull()) { over = true; body.querySelector('#cHint').textContent = '🤝 Hòa!'; return; }
          turn = 'ai';
          body.querySelector('#cHint').textContent = 'Máy đang suy nghĩ…';
          setTimeout(aiMove, 350);
        };
      });
    };

    const isFull = () => board.every(r => r.every(v => v));

    const checkWin = (b, p) => {
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++) {
          if (b[y][x] !== p) continue;
          for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
            let cnt = 1;
            for (let k = 1; k < WIN; k++) {
              const nx = x + dx * k, ny = y + dy * k;
              if (nx < 0 || nx >= N || ny < 0 || ny >= N || b[ny][nx] !== p) break;
              cnt++;
            }
            if (cnt >= WIN) return true;
          }
        }
      return false;
    };

    // Máy: thắng ngay nếu được, chặn người chơi, không thì đánh gần quân đã có
    const aiMove = () => {
      if (over) return;
      const find = (p) => {
        for (let y = 0; y < N; y++)
          for (let x = 0; x < N; x++) {
            if (board[y][x]) continue;
            board[y][x] = p;
            const win = checkWin(board, p);
            board[y][x] = 0;
            if (win) return [x, y];
          }
        return null;
      };

      let move = find(2) || find(1);

      if (!move) {
        // đánh gần ô đã có, ưu tiên trung tâm
        const filled = [];
        board.forEach((r, y) => r.forEach((v, x) => { if (v) filled.push([x, y]); }));
        let bestD = Infinity;
        for (let y = 0; y < N; y++)
          for (let x = 0; x < N; x++) {
            if (board[y][x]) continue;
            const d = filled.reduce((m, [fx, fy]) =>
              Math.min(m, Math.abs(fx - x) + Math.abs(fy - y)), Infinity);
            const center = Math.abs(7 - x) + Math.abs(7 - y);
            const score = d * 2 + center;
            if (score < bestD) { bestD = score; move = [x, y]; }
          }
      }
      if (!move) return;

      board[move[1]][move[0]] = 2;
      draw();

      if (checkWin(board, 2)) {
        over = true;
        aiScore++; DeviceStorage.set('game_caro_lose', aiScore);
        body.querySelector('#cLose').textContent = aiScore;
        body.querySelector('#cHint').textContent = '💀 Máy thắng!';
        toast('💀 Máy thắng – thử lại nhé!');
        return;
      }
      if (isFull()) { over = true; body.querySelector('#cHint').textContent = '🤝 Hòa!'; return; }
      turn = 'me';
      body.querySelector('#cHint').textContent = 'Lượt của bạn – đánh vào ô trống';
    };

    const newGame = () => {
      board = Array.from({ length: N }, () => Array(N).fill(0));
      turn = 'me'; over = false;
      body.querySelector('#cHint').textContent = 'Lượt của bạn – đánh vào ô trống';
      draw();
    };

    body.querySelector('#cNew').onclick = newGame;
    newGame();
  },
});

/* ────────────────────────────────
   🧠 ĐOÁN SỐ (minh mẫn)
   ──────────────────────────────── */
registerGame({
  id: 'guess', name: 'Đoán Số', emoji: '🎯', color: '#8b5cf6',
  size: '0.5 MB', cat: 'Trí tuệ', desc: 'Tìm số bí mật 1–100, máy sẽ gợi ý lớn hơn/nhỏ hơn.',
  play(body) {
    let secret, tries, history;

    body.innerHTML = `
      <div class="game-hud">
        <span>Lượt: <b id="gsTries">0</b></span>
        <span id="gsMsg">Hãy đoán số từ 1 đến 100</span>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <input class="field" id="gsInput" type="number" min="1" max="100" placeholder="Số của bạn" />
        <button class="btn" id="gsBtn">Đoán</button>
      </div>
      <div class="section-title">Lịch sử</div>
      <div class="sw-laps" id="gsHist"></div>
      <button class="btn ghost" id="gsNew" style="margin-top:12px">↺ Ván mới</button>`;

    const newGame = () => {
      secret = 1 + Math.floor(Math.random() * 100);
      tries = 0; history = [];
      body.querySelector('#gsTries').textContent = '0';
      body.querySelector('#gsMsg').textContent = 'Hãy đoán số từ 1 đến 100';
      body.querySelector('#gsHist').innerHTML = '';
      body.querySelector('#gsInput').value = '';
      body.querySelector('#gsInput').focus();
    };

    const guess = () => {
      const inp = body.querySelector('#gsInput');
      const v = +inp.value;
      if (!v || v < 1 || v > 100) { toast('Nhập số 1–100'); return; }
      tries++;
      let msg;
      if (v === secret) {
        const best = DeviceStorage.get('game_guess_best', null);
        if (best === null || tries < best) {
          DeviceStorage.set('game_guess_best', tries);
          msg = `🎉 Đúng! Chỉ ${tries} lượt – kỷ lục mới!`;
          toast('🏆 Kỷ lục mới!');
        } else {
          msg = `🎉 Đúng! Số là ${secret} – ${tries} lượt.`;
          toast('🎉 Chính xác!');
        }
      } else if (v < secret) msg = `${v} → nhỏ hơn! 🔼`;
      else msg = `${v} → lớn hơn! 🔽`;

      history.unshift(`${tries}. ${v} – ${v === secret ? '✓ ĐÚNG' : v < secret ? 'thấp' : 'cao'}`);
      body.querySelector('#gsTries').textContent = tries;
      body.querySelector('#gsMsg').textContent = msg;
      body.querySelector('#gsHist').innerHTML =
        history.map(h => `<div class="sw-lap">${esc(h)}</div>`).join('');
      inp.value = '';
      inp.focus();
      if (v === secret) setTimeout(newGame, 1800);
    };

    body.querySelector('#gsBtn').onclick = guess;
    body.querySelector('#gsInput').onkeydown = e => { if (e.key === 'Enter') guess(); };
    body.querySelector('#gsNew').onclick = newGame;
    newGame();
  },
});

/* ── Danh sách game trong CH Play ── */
const GAME_CATALOG = () => Games;
