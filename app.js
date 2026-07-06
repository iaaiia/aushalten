// ── Themes ────────────────────────────────────────────────────────────────
const DARK_INK    = '#221F1A';
const LIGHT_CREAM = '#F0EAE0';

const THEMES = [
  { name: 'moss',       bg: '#A7B89F', fg: DARK_INK    },
  { name: 'green mist', bg: '#D7DCD1', fg: DARK_INK    },
  { name: 'clean',      bg: '#F4F1E8', fg: DARK_INK    },
  { name: 'twang',      bg: '#CDAD91', fg: DARK_INK    },
  { name: 'rose',       bg: '#DDAD97', fg: DARK_INK    },
  { name: 'slate',      bg: '#C4BFB9', fg: DARK_INK    },
  { name: 'arizona',    bg: '#CA8F73', fg: DARK_INK    },
  { name: 'mauve',      bg: '#845C65', fg: LIGHT_CREAM },
  { name: 'storm',      bg: '#6D8C8E', fg: LIGHT_CREAM },
  { name: 'sky',        bg: '#ADC7C8', fg: DARK_INK    },
  { name: 'lavendar',   bg: '#CEBEC1', fg: DARK_INK    },
  { name: 'stone',      bg: '#C6BAAB', fg: DARK_INK    },
  { name: 'olive',      bg: '#4A5B46', fg: LIGHT_CREAM },
  { name: 'winkle',     bg: '#97ABC5', fg: DARK_INK    },
];

let themeIdx = parseInt(localStorage.getItem('ah_theme') || '0');

function applyTheme(idx) {
  const t = THEMES[idx];
  const root = document.documentElement;
  root.style.setProperty('--bg', t.bg);
  root.style.setProperty('--fg', t.fg);
  themeIdx = idx;
  localStorage.setItem('ah_theme', idx);
  // Also update canvas stroke if active
  const canvas = document.getElementById('draw-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = t.fg;
  }
  renderSwatches();
}

function openColorSheet() {
  document.getElementById('color-sheet').classList.add('open');
  document.getElementById('overlay-bg').classList.add('open');
}
function closeColorSheet() {
  document.getElementById('color-sheet').classList.remove('open');
  document.getElementById('overlay-bg').classList.remove('open');
}

function renderSwatches() {
  document.getElementById('swatches').innerHTML = THEMES.map((t, i) => `
    <div class="swatch ${i === themeIdx ? 'active' : ''}"
      style="background:${t.bg}; outline: 1.5px solid ${i === themeIdx ? 'var(--fg)' : 'transparent'}; outline-offset:2px;"
      onclick="applyTheme(${i})"></div>
  `).join('');
}

// ── Tasks ─────────────────────────────────────────────────────────────────
const TASKS = [
  // hold
  { id:'hold',      title:'halten.',       desc:'drücke den kreis. halte ihn gedrückt. fünf minuten. lass nicht los.',          type:'hold',   duration:300 },
  { id:'hold2',     title:'nicht loslassen.', desc:'drücke. halte. drei minuten. der drang loszulassen ist die übung.',          type:'hold',   duration:180 },
  // breath / stillsein
  { id:'still',     title:'stillsein.',    desc:'tippe den kreis an. sitz. tu nichts. atme. fünf minuten.',                     type:'breath', duration:300 },
  { id:'notice',    title:'bemerken.',     desc:'was ist unangenehm gerade? benenne es. sitz zwei minuten damit.',               type:'breath', duration:120 },
  { id:'observe',   title:'beobachten.',   desc:'schau aus dem fenster. tu nichts. vier minuten. kein handy.',                   type:'breath', duration:240 },
  // timer
  { id:'cold',      title:'kälte.',        desc:'halte deine hände unter kaltes wasser. beobachte. eine minute.',               type:'timer',  duration:60  },
  { id:'wait',      title:'warten.',       desc:'leg das handy weg. warte drei minuten. nur das.',                               type:'timer',  duration:180 },
  { id:'sit',       title:'sitzen.',       desc:'setz dich. rühr dich nicht. keine ablenkung. zwei minuten.',                   type:'timer',  duration:120 },
  { id:'boredom',   title:'langeweile.',   desc:'steh in einer schlange oder warte irgendwo. handy bleibt weg. so lange es dauert.', type:'timer', duration:150 },
  { id:'silence',   title:'stille.',       desc:'schalte alles aus. keine musik, kein podcast. drei minuten stille.',            type:'timer',  duration:180 },
  // draw variants
  { id:'draw-line', title:'ein strich.',   desc:'zeichne einen einzigen langen strich. langsam. atme dabei.',                   type:'draw', drawPrompt:'strich'   },
  { id:'draw-circle',title:'ein kreis.',   desc:'zeichne einen kreis. ohne abzusetzen. er muss nicht perfekt sein.',            type:'draw', drawPrompt:'kreis'    },
  { id:'draw-tri',  title:'ein dreieck.',  desc:'zeichne ein dreieck. drei linien. nimm dir zeit.',                             type:'draw', drawPrompt:'dreieck'  },
  { id:'draw-face', title:'ein gesicht.',  desc:'zeichne ein gesicht. wie fühlt es sich heute an?',                            type:'draw', drawPrompt:'gesicht'  },
  { id:'draw-feel', title:'zeichnen.',     desc:'zeichne, was du gerade fühlst. eine form. mehr nicht.',                       type:'draw', drawPrompt:'gefühl'   },
  { id:'draw-wave', title:'eine welle.',   desc:'zeichne eine welle. lass die hand einfach fließen.',                          type:'draw', drawPrompt:'welle'    },
];

// ── State ─────────────────────────────────────────────────────────────────
const state = {
  selectedDay: 0,
  history: JSON.parse(localStorage.getItem('ah_history') || '[]'),
};

const TASKS_BY_ID = Object.fromEntries(TASKS.map(t => [t.id, t]));

// Fixed rotation covering every task once per 16-day cycle, arranged so the
// same task type (hold/breath/timer/draw) never appears on two days in a row
// (including across the cycle wrap).
const TASK_ORDER = [
  'draw-line', 'cold',    'draw-circle', 'wait',
  'draw-tri',  'sit',     'draw-face',   'still',
  'draw-feel', 'boredom', 'notice',      'hold',
  'draw-wave', 'silence', 'observe',     'hold2',
];

function todayKey(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}
function isDone(key) { return state.history.includes(key); }
function markDone(key) {
  if (!isDone(key)) {
    state.history.push(key);
    localStorage.setItem('ah_history', JSON.stringify(state.history));
  }
}
function dayIndex(d) {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}
function getTask(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const idx = ((dayIndex(d) % TASK_ORDER.length) + TASK_ORDER.length) % TASK_ORDER.length;
  return TASKS_BY_ID[TASK_ORDER[idx]];
}

// ── Render ────────────────────────────────────────────────────────────────
function render() {
  const task = getTask(state.selectedDay);
  const key  = todayKey(state.selectedDay);
  const done = isDone(key);
  const area = document.getElementById('task-area');

  // Reset animation
  area.style.animation = 'none';
  void area.offsetWidth;
  area.style.animation = '';

  if (done) {
    renderDone(area, task);
  } else {
    renderActive(area, task, key);
  }
}

function renderDone(area, task) {
  const r = 38;
  const c = 2 * Math.PI * r;
  area.innerHTML = `
    <div class="done-svg-wrap task-visual">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--fg)" stroke-width="1" opacity="0.25"/>
        <path id="done-path" class="done-path"
          d="M 40 60 Q 55 78 60 80 Q 72 50 82 40"
          fill="none" stroke="var(--fg)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="task-text">
      <div class="task-title">${task.title}</div>
      <div class="sub" style="opacity:0.4; font-size:14px; margin-top:4px;">erledigt.</div>
    </div>
  `;
  setTimeout(() => {
    const p = document.getElementById('done-path');
    if (p) { p.style.transition = 'stroke-dashoffset 0.9s ease'; p.style.strokeDashoffset = '0'; }
  }, 80);
}

function renderActive(area, task, key) {
  let visualHtml = '';
  if (task.type === 'hold')   visualHtml = holdHTML();
  if (task.type === 'breath') visualHtml = breathHTML(task);
  if (task.type === 'timer')  visualHtml = timerHTML(task);
  if (task.type === 'draw')   visualHtml = drawHTML(task);

  area.innerHTML = `
    <div class="task-visual" id="task-visual">${visualHtml}</div>
    <div class="task-text">
      <div class="task-title">${task.title}</div>
      <div>${task.desc}</div>
    </div>
  `;
  setTimeout(() => bindEvents(task, key), 60);
}

// ── Hold ──────────────────────────────────────────────────────────────────
function holdHTML() {
  const r = 72, circ = +(2 * Math.PI * r).toFixed(2);
  return `
    <div class="hold-wrap">
      <div class="hold-circle" id="hold-circle">
        <div class="hold-fill" id="hold-fill"></div>
        <svg class="progress-ring" viewBox="0 0 162 162">
          <circle class="ring-track" cx="81" cy="81" r="${r}"/>
          <circle class="ring-fill"  cx="81" cy="81" r="${r}" id="ring-fill"
            stroke-dasharray="0 ${circ}" stroke-dashoffset="0"/>
        </svg>
        <span class="hold-label" id="hold-label">drücken</span>
      </div>
    </div>`;
}

function bindHold(task, key) {
  const circle = document.getElementById('hold-circle');
  if (!circle) return;
  const label  = document.getElementById('hold-label');
  const fill   = document.getElementById('ring-fill');
  const r = 72, circ = 2 * Math.PI * r;
  let elapsed = 0, timer = null, pressing = false;

  function onStart(e) {
    e.preventDefault();
    if (pressing || elapsed >= task.duration) return;
    pressing = true;
    circle.classList.add('pressing');
    timer = setInterval(() => {
      elapsed++;
      const pct = elapsed / task.duration;
      fill.setAttribute('stroke-dasharray', `${pct * circ} ${circ}`);
      if (label) label.textContent = elapsed >= task.duration ? '✓' : `${task.duration - elapsed}s`;
      if (elapsed >= task.duration) {
        clearInterval(timer);
        circle.style.pointerEvents = 'none';
        circle.classList.remove('pressing');
        markDone(key);
        renderDayStrip();
        setTimeout(render, 700);
      }
    }, 1000);
  }

  function onEnd(e) {
    e.preventDefault();
    if (!pressing || elapsed >= task.duration) return;
    pressing = false;
    clearInterval(timer);
    circle.classList.remove('pressing');
    if (label) label.textContent = 'weiter drücken';
  }

  circle.addEventListener('mousedown', onStart);
  circle.addEventListener('mouseup',   onEnd);
  circle.addEventListener('mouseleave',onEnd);
  circle.addEventListener('touchstart', onStart, { passive: false });
  circle.addEventListener('touchend',   onEnd,   { passive: false });
  circle.addEventListener('touchcancel',onEnd,   { passive: false });
}

// ── Breath ────────────────────────────────────────────────────────────────
function breathHTML(task) {
  return `
    <div class="breath-wrap" id="breath-wrap">
      <div class="breath-circle" id="breath-circle"></div>
      <div class="timer-big" id="breath-timer">${formatTime(task.duration)}</div>
      <div class="sub">tippe zum starten</div>
    </div>`;
}

function bindBreath(task, key) {
  const wrap  = document.getElementById('breath-wrap');
  const bc    = document.getElementById('breath-circle');
  const timer = document.getElementById('breath-timer');
  if (!wrap) return;
  let elapsed = 0, started = false, iv = null;

  function start() {
    if (started) return;
    started = true;
    bc.classList.add('breathing');
    iv = setInterval(() => {
      elapsed++;
      const rem = task.duration - elapsed;
      if (timer) timer.textContent = formatTime(rem);
      if (elapsed >= task.duration) {
        clearInterval(iv);
        bc.classList.remove('breathing');
        markDone(key);
        renderDayStrip();
        setTimeout(render, 600);
      }
    }, 1000);
  }

  wrap.addEventListener('click', start);
  wrap.addEventListener('touchend', e => { e.preventDefault(); start(); }, { passive: false });
}

// ── Timer ─────────────────────────────────────────────────────────────────
function timerHTML(task) {
  const r = 52, circ = +(2 * Math.PI * r).toFixed(2);
  return `
    <div class="timer-wrap" id="timer-wrap">
      <div class="timer-ring-wrap">
        <svg class="timer-ring-svg" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--fg)" stroke-width="1" opacity="0.14"/>
          <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--fg)" stroke-width="1.5"
            stroke-linecap="round" stroke-dasharray="0 ${circ}" id="timer-ring"/>
        </svg>
        <div class="timer-big" id="timer-display">${formatTime(task.duration)}</div>
      </div>
      <div class="sub" id="timer-sub">tippe zum starten</div>
    </div>`;
}

function bindTimer(task, key) {
  const wrap    = document.getElementById('timer-wrap');
  const display = document.getElementById('timer-display');
  const ring    = document.getElementById('timer-ring');
  const sub     = document.getElementById('timer-sub');
  if (!wrap) return;
  const r = 52, circ = 2 * Math.PI * r;
  let elapsed = 0, started = false, iv = null;

  function start() {
    if (started) return;
    started = true;
    if (sub) sub.textContent = 'aushalten.';
    iv = setInterval(() => {
      elapsed++;
      const rem = task.duration - elapsed;
      if (display) display.textContent = formatTime(rem);
      const pct = elapsed / task.duration;
      if (ring) ring.setAttribute('stroke-dasharray', `${pct * circ} ${circ}`);
      if (elapsed >= task.duration) {
        clearInterval(iv);
        markDone(key);
        renderDayStrip();
        setTimeout(render, 600);
      }
    }, 1000);
  }

  wrap.addEventListener('click', start);
  wrap.addEventListener('touchend', e => { e.preventDefault(); start(); }, { passive: false });
}

// ── Draw ──────────────────────────────────────────────────────────────────
function drawHTML(task) {
  const prompt = task.drawPrompt || 'zeichne hier.';
  return `
    <div class="draw-wrap">
      <canvas id="draw-canvas" width="240" height="200"></canvas>
      <div class="sub" id="draw-sub">${prompt}</div>
    </div>`;
}

function drawGhostGuide(ctx, fg, prompt) {
  ctx.save();
  ctx.strokeStyle = fg;
  ctx.lineWidth   = 1;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.globalAlpha = 0.1;
  if (prompt === 'kreis') {
    ctx.beginPath(); ctx.arc(120, 100, 50, 0, 2 * Math.PI); ctx.stroke();
  } else if (prompt === 'dreieck') {
    ctx.beginPath(); ctx.moveTo(120, 45); ctx.lineTo(175, 155); ctx.lineTo(65, 155); ctx.closePath(); ctx.stroke();
  } else if (prompt === 'gesicht') {
    ctx.beginPath(); ctx.arc(120, 95, 52, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(103, 83, 5, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(137, 83, 5, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(120, 105, 20, 0.2, Math.PI - 0.2); ctx.stroke();
  } else if (prompt === 'welle') {
    ctx.beginPath(); ctx.moveTo(20, 100);
    ctx.bezierCurveTo(60, 50, 100, 150, 140, 100);
    ctx.bezierCurveTo(180, 50, 210, 130, 220, 100); ctx.stroke();
  } else if (prompt === 'strich') {
    ctx.beginPath(); ctx.moveTo(30, 100); ctx.lineTo(210, 100); ctx.stroke();
  }
  ctx.restore();
}

// ── Shape recognition ────────────────────────────────────────────────────
// Heuristic checks on the recorded stroke points, so a task only counts as
// done once the drawing actually resembles the requested shape.
function distPt(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function pathStats(pts) {
  let length = 0;
  for (let i = 1; i < pts.length; i++) length += distPt(pts[i - 1], pts[i]);
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
  return { length, width: maxX - minX, height: maxY - minY, cx, cy };
}

function resamplePath(pts, step) {
  if (pts.length < 2) return pts;
  const out = [pts[0]];
  let prev = pts[0], carry = 0;
  for (let i = 1; i < pts.length; i++) {
    let cur = pts[i];
    let segLen = distPt(prev, cur);
    while (segLen > 0 && carry + segLen >= step) {
      const t = (step - carry) / segLen;
      const np = { x: prev.x + (cur.x - prev.x) * t, y: prev.y + (cur.y - prev.y) * t };
      out.push(np);
      prev = np;
      segLen = distPt(prev, cur);
      carry = 0;
    }
    carry += segLen;
    prev = cur;
  }
  return out;
}

function countCorners(pts, angleThresholdDeg, minGapPx) {
  const rs = resamplePath(pts, 6);
  if (rs.length < 5) return 0;
  const threshold = angleThresholdDeg * Math.PI / 180;
  const corners = [];
  for (let i = 1; i < rs.length - 1; i++) {
    const a = rs[i - 1], b = rs[i], c = rs[i + 1];
    const v1 = Math.atan2(b.y - a.y, b.x - a.x);
    const v2 = Math.atan2(c.y - b.y, c.x - b.x);
    let d = v2 - v1;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    if (Math.abs(d) > threshold) corners.push(b);
  }
  const merged = [];
  for (const c of corners) {
    if (!merged.length || distPt(merged[merged.length - 1], c) > minGapPx) merged.push(c);
  }
  return merged.length;
}

function checkShape(prompt, pts) {
  if (pts.length < 8) return false;
  const stats = pathStats(pts);
  const diag = Math.hypot(stats.width, stats.height);
  if (diag < 25 || stats.length < 40) return false;

  if (prompt === 'kreis') {
    const radii = pts.map(p => Math.hypot(p.x - stats.cx, p.y - stats.cy));
    const meanR = radii.reduce((a, b) => a + b, 0) / radii.length;
    if (meanR < 12) return false;
    const variance = radii.reduce((a, r) => a + (r - meanR) ** 2, 0) / radii.length;
    const relStd = Math.sqrt(variance) / meanR;
    let angleTotal = 0, prevAngle = null;
    for (const p of pts) {
      const ang = Math.atan2(p.y - stats.cy, p.x - stats.cx);
      if (prevAngle !== null) {
        let d = ang - prevAngle;
        while (d > Math.PI) d -= 2 * Math.PI;
        while (d < -Math.PI) d += 2 * Math.PI;
        angleTotal += d;
      }
      prevAngle = ang;
    }
    return relStd < 0.4 && Math.abs(angleTotal) > 4.4;
  }

  if (prompt === 'dreieck') {
    const corners = countCorners(pts, 35, 18);
    const closed = distPt(pts[0], pts[pts.length - 1]) < diag * 0.6;
    return corners >= 2 && corners <= 5 && closed;
  }

  if (prompt === 'strich') {
    const a = pts[0], b = pts[pts.length - 1];
    const lineLen = distPt(a, b);
    if (lineLen < 50) return false;
    let maxDevSq = 0;
    for (const p of pts) {
      const t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / (lineLen * lineLen);
      const px = a.x + t * (b.x - a.x), py = a.y + t * (b.y - a.y);
      const dSq = (p.x - px) ** 2 + (p.y - py) ** 2;
      if (dSq > maxDevSq) maxDevSq = dSq;
    }
    return Math.sqrt(maxDevSq) < lineLen * 0.15;
  }

  if (prompt === 'welle') {
    if (stats.width < 70) return false;
    let extrema = 0, dir = 0;
    for (let i = 1; i < pts.length; i++) {
      const dy = pts[i].y - pts[i - 1].y;
      if (Math.abs(dy) < 0.5) continue;
      const nd = dy > 0 ? 1 : -1;
      if (dir !== 0 && nd !== dir) extrema++;
      dir = nd;
    }
    return extrema >= 2;
  }

  // gesicht / gefühl: offen für interpretation, nur prüfen ob wirklich etwas gezeichnet wurde
  return true;
}

function bindDraw(task, key) {
  const canvas = document.getElementById('draw-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const sub = document.getElementById('draw-sub');
  const fg  = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim() || '#F0EDE6';
  const prompt = task.drawPrompt || '';

  drawGhostGuide(ctx, fg, prompt);

  ctx.strokeStyle = fg;
  ctx.lineWidth   = 1.5;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.globalAlpha = 1;

  let drawing = false, settled = false, points = [];

  function getXY(e) {
    const rect = canvas.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  function resetCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGhostGuide(ctx, fg, prompt);
    ctx.strokeStyle = fg;
    ctx.globalAlpha = 1;
    points = [];
  }

  function down(e) {
    if (settled) return;
    e.preventDefault();
    drawing = true;
    const p = getXY(e);
    points.push(p);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }
  function move(e) {
    if (settled) return;
    e.preventDefault();
    if (!drawing) return;
    const p = getXY(e);
    points.push(p);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  function up(e) {
    if (settled || !drawing) return;
    drawing = false;
    if (points.length < 8) return;
    if (checkShape(prompt, points)) {
      settled = true;
      if (sub) sub.textContent = 'fertig.';
      setTimeout(() => { markDone(key); renderDayStrip(); setTimeout(render, 700); }, 800);
    } else {
      if (sub) sub.textContent = 'hmm — nochmal versuchen.';
      setTimeout(() => {
        if (settled) return;
        resetCanvas();
        if (sub) sub.textContent = prompt || 'zeichne hier.';
      }, 1100);
    }
  }

  canvas.addEventListener('mousedown', down);
  canvas.addEventListener('mousemove', move);
  canvas.addEventListener('mouseup',   up);
  canvas.addEventListener('touchstart', down, { passive: false });
  canvas.addEventListener('touchmove',  move, { passive: false });
  canvas.addEventListener('touchend',   up,   { passive: false });
}

// ── Dispatch ──────────────────────────────────────────────────────────────
function bindEvents(task, key) {
  if (task.type === 'hold')   bindHold(task, key);
  if (task.type === 'breath') bindBreath(task, key);
  if (task.type === 'timer')  bindTimer(task, key);
  if (task.type === 'draw')   bindDraw(task, key);
}

// ── Day strip ─────────────────────────────────────────────────────────────
function renderDayStrip() {
  const el = document.getElementById('day-strip');
  const names = ['So','Mo','Di','Mi','Do','Fr','Sa'];
  let html = '';
  for (let i = -20; i <= 0; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const key  = todayKey(i);
    const done = isDone(key);
    const act  = i === state.selectedDay;
    html += `<div class="day-item ${act ? 'active' : ''} ${done ? 'done' : ''}" onclick="selectDay(${i})">
      <span class="day-name">${names[d.getDay()]}</span>
      <span class="day-num">${d.getDate()}</span>
      <span class="day-dot"></span>
    </div>`;
  }
  el.innerHTML = html;
  setTimeout(() => {
    const active = el.querySelector('.day-item.active');
    if (active) active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, 40);
}

function selectDay(offset) {
  state.selectedDay = offset;
  renderDayStrip();
  render();
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2,'0')}`;
}

// ── Init ──────────────────────────────────────────────────────────────────
applyTheme(themeIdx);
renderDayStrip();
render();
