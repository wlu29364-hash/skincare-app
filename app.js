// skincare-app / app.js
// 本地存储键
const STORAGE_KEY = 'skincare_logs_v1';

// ================= 工具函数 =================

function loadLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.error('loadLogs error', e);
    return [];
  }
}

function saveLogs(logs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('saveLogs error', e);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) {
    alert(msg);
    return;
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1600);
}

// ================= 初始化 DOM 引用 =================

// 表单字段
const dateInput = document.getElementById('date');
const amBtn = document.getElementById('amBtn');
const pmBtn = document.getElementById('pmBtn');
const productsInput = document.getElementById('products');
const feelingInput = document.getElementById('feeling');
const skinInput = document.getElementById('skin');
const noteInput = document.getElementById('note');
const photosInput = document.getElementById('photos'); // 目前仅本地，不入库
const saveBtn = document.getElementById('saveBtn');

// 区块
const statsSection = document.getElementById('stats');
const productsSection = document.getElementById('products');
const historySection = document.getElementById('history');

// 记录页容器（尽量兼容几种写法：有哪个用哪个）
const logSection =
  document.getElementById('logForm') ||
  document.getElementById('log') ||
  document.querySelector('[data-section="log"]') ||
  null;

// 版本角标（可选）
const versionBadge = document.getElementById('version');
if (versionBadge) {
  versionBadge.textContent = 'v3.2.3';
}

// Tab 按钮（上面四个）
const tabButtons = document.querySelectorAll('#tabs .tab');

// 给没有 data-tab 的按钮按顺序补一个
const TAB_IDS = ['log', 'stats', 'products', 'history'];
tabButtons.forEach((btn, i) => {
  if (!btn.dataset.tab) {
    btn.dataset.tab = TAB_IDS[i] || 'log';
  }
});

// ================= 记录页：早/晚 =================

let currentPeriod = 'AM';

function setPeriod(p) {
  currentPeriod = p;
  if (amBtn && pmBtn) {
    if (p === 'AM') {
      amBtn.classList.add('active');
      pmBtn.classList.remove('active');
    } else {
      pmBtn.classList.add('active');
      amBtn.classList.remove('active');
    }
  }
}

if (amBtn && pmBtn) {
  amBtn.addEventListener('click', () => setPeriod('AM'));
  pmBtn.addEventListener('click', () => setPeriod('PM'));
}

// 默认日期 = 今天
function initDate() {
  if (!dateInput) return;
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  dateInput.value = `${d.getFullYear()}-${m}-${day}`;
}

// ================= 保存记录 =================

function handleSave() {
  if (!dateInput) return;

  const date = (dateInput.value || '').trim();
  if (!date) {
    showToast('请先选择日期');
    return;
  }

  const products = (productsInput && productsInput.value || '').trim();
  const feeling = (feelingInput && feelingInput.value || '').trim();
  const skin = (skinInput && skinInput.value || '').trim();
  const note = (noteInput && noteInput.value || '').trim();

  const logs = loadLogs();

  // 同一天同一时段唯一一条，用 key 标识
  const key = `${date}_${currentPeriod}`;
  const idx = logs.findIndex(l => l.key === key);

  const item = {
    key,
    date,
    period: currentPeriod,
    products,
    feeling,
    skin,
    note,
    ts: Date.now()
  };

  if (idx >= 0) {
    logs[idx] = item;
  } else {
    logs.push(item);
  }

  saveLogs(logs);
  showToast('已保存');

  renderHistory();
  renderProducts();
  renderStats();
}

if (saveBtn) {
  saveBtn.addEventListener('click', handleSave);
}

// ================= Tab 切换 =================

function showTab(id) {
  // 按钮高亮
  tabButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === id);
  });

  // 区块显隐
  if (logSection) {
    logSection.classList.toggle('hide', id !== 'log');
  }

  if (statsSection) {
    statsSection.classList.toggle('hide', id !== 'stats');
  }
  if (productsSection) {
    productsSection.classList.toggle('hide', id !== 'products');
  }
  if (historySection) {
    historySection.classList.toggle('hide', id !== 'history');
  }

  // 渲染对应内容
  if (id === 'stats') renderStats();
  if (id === 'products') renderProducts();
  if (id === 'history') renderHistory();

  // 记住最后一个 tab
  try {
    localStorage.setItem('lastTab', id);
  } catch (e) {}
}

// 绑定点击
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.tab || 'log';
    showTab(id);
  });
});

// ================= 渲染：统计 =================

function renderStats() {
  if (!statsSection) return;

