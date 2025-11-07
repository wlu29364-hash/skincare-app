// 护肤记录 PWA v3.2.5 — 柔和绿版
// 所有数据 localStorage，本地生存，本地喜剧。

const STORAGE_KEYS = {
  LOGS: 'skincare_logs_v3',
  PRODUCTS: 'skincare_products_v3',
  LAST_TAB: 'skincare_last_tab_v3'
};

// ---------- 小工具 ----------

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hide');
  el.classList.add('show');
  setTimeout(() => {
    el.classList.remove('show');
    el.classList.add('hide');
  }, 1800);
}

function loadJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    if (!v) return fallback;
    return JSON.parse(v);
  } catch (e) {
    console.error('loadJSON error', key, e);
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('saveJSON error', key, e);
  }
}

// ---------- 产品库 ----------

function getProducts() {
  return loadJSON(STORAGE_KEYS.PRODUCTS, []);
}

function setProducts(list) {
  saveJSON(STORAGE_KEYS.PRODUCTS, list);
}

function renderProductOptions() {
  const datalist = document.getElementById('productOptions');
  if (!datalist) return;
  const products = getProducts();
  datalist.innerHTML = '';
  products.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.name;
    datalist.appendChild(opt);
  });
}

function renderProductList() {
  const ul = document.getElementById('productList');
  if (!ul) return;
  const products = getProducts();
  if (!products.length) {
    ul.innerHTML = '<li>暂无产品，请先添加。</li>';
    return;
  }
  ul.innerHTML = '';
  products.forEach((p, index) => {
    const li = document.createElement('li');
    const label = p.use === 'am'
      ? '早用'
      : p.use === 'pm'
      ? '晚用'
      : '早晚皆可';
    li.innerHTML = `<span>${p.name} <span style="color:#6b7a6b;font-size:12px;">(${label})</span></span>`;
    const del = document.createElement('button');
    del.textContent = '删除';
    del.addEventListener('click', () => {
      const list = getProducts().filter((_, i) => i !== index);
      setProducts(list);
      renderProductList();
      renderProductOptions();
      showToast('已删除该产品');
    });
    li.appendChild(del);
    ul.appendChild(li);
  });
}

function bindProductEvents() {
  const addBtn = document.getElementById('addProductBtn');
  if (!addBtn) return;

  addBtn.addEventListener('click', () => {
    const nameInput = document.getElementById('pname');
    const useSelect = document.getElementById('puse');
    const name = (nameInput.value || '').trim();
    const use = useSelect.value || 'all';
    if (!name) {
      showToast('请输入产品名');
      return;
    }
    let list = getProducts();
    if (list.some(p => p.name === name && p.use === use)) {
      showToast('该产品已存在');
      return;
    }
    list.push({ name, use });
    setProducts(list);
    nameInput.value = '';
    useSelect.value = 'all';
    renderProductList();
    renderProductOptions();
    showToast('已添加到产品库');
  });
}

// ---------- 日志记录 ----------

function getLogs() {
  return loadJSON(STORAGE_KEYS.LOGS, []);
}

function setLogs(list) {
  saveJSON(STORAGE_KEYS.LOGS, list);
}

function bindLogForm() {
  const dateInput = document.getElementById('date');
  const segBtns = document.querySelectorAll('.seg-btn');
  const saveBtn = document.getElementById('saveBtn');

  if (dateInput && !dateInput.value) {
    dateInput.value = todayISO();
  }

  segBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      segBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  if (!saveBtn) return;

  saveBtn.addEventListener('click', () => {
    const date = dateInput.value;
    const activeSeg = document.querySelector('.seg-btn.active');
    const time = activeSeg ? activeSeg.dataset.time : '';

    if (!date || !time) {
      showToast('请先选择日期与早/晚');
      return;
    }

    const productsInput = document.getElementById('productsInput');
    const feelingInput = document.getElementById('feeling');
    const skinInput = document.getElementById('skin');
    const noteInput = document.getElementById('note');

    const productsRaw = (productsInput.value || '').trim();
    const products = productsRaw
      ? productsRaw.split(/[、，,]/).map(s => s.trim()).filter(Boolean)
      : [];

    const log = {
      date,
      time,
      products,
      feeling: (feelingInput.value || '').trim(),
      skin: (skinInput.value || '').trim(),
      note: (noteInput.value || '').trim(),
      ts: Date.now()
    };

    const logs = getLogs();
    const idx = logs.findIndex(l => l.date === date && l.time === time);
    if (idx >= 0) {
      logs[idx] = log;
    } else {
      logs.push(log);
    }
    setLogs(logs);
    showToast('已保存');

    renderHistory();
    renderStats();
  });
}

// ---------- 历史列表 ----------

function renderHistory() {
  const ul = document.getElementById('historyList');
  if (!ul) return;
  const logs = getLogs()
    .slice()
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 60);

  if (!logs.length) {
    ul.innerHTML = '<li>暂无记录，先去上面记一条吧。</li>';
    return;
  }

  ul.innerHTML = '';
  logs.forEach(log => {
    const li = document.createElement('li');
    const timeLabel = log.time === 'am' ? '早' : '晚';
    const prods = log.products && log.products.length
      ? log.products.join('、')
      : '未填写产品';
    li.innerHTML = `
      <div style="flex:1;">
        <div><strong>${log.date}</strong> <span style="font-size:12px;color:#6b7a6b;">${timeLabel}</span></div>
        <div style="font-size:13px;color:#163017;">产品：${prods}</div>
        ${log.feeling ? `<div style="font-size:12px;color:#6b7a6b;">感受：${log.feeling}</div>` : ''}
        ${log.skin ? `<div style="font-size:12px;color:#6b7a6b;">皮肤：${log.skin}</div>` : ''}
        ${log.note ? `<div style="font-size:12px;color:#6b7a6b;">备注：${log.note}</div>` : ''}
      </div>
    `;
    ul.appendChild(li);
  });
}

// ---------- 统计 ----------

function renderStats() {
  const logs = getLogs();
  const daysSpan = document.getElementById('stat-days');
  const totalSpan = document.getElementById('stat-total');
  const topUl = document.getElementById('stat-top-products');
  if (!daysSpan || !totalSpan || !topUl) return;

  if (!logs.length) {
    daysSpan.textContent = '0';
    totalSpan.textContent = '0';
    topUl.innerHTML = '<li>暂无数据。</li>';
    return;
  }

  const recent30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const daySet = new Set();
  const productCount = {};

  logs.forEach(l => {
    if (l.ts >= recent30) {
      daySet.add(l.date);
    }
    (l.products || []).forEach(name => {
      if (!name) return;
      productCount[name] = (productCount[name] || 0) + 1;
    });
  });

  daysSpan.textContent = String(daySet.size);
  totalSpan.textContent = String(logs.length);

  const top = Object.entries(productCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (!top.length) {
    topUl.innerHTML = '<li>还没有统计到常用产品。</li>';
  } else {
    topUl.innerHTML = '';
    top.forEach(([name, count]) => {
      const li = document.createElement('li');
      li.textContent = `${name} — ${count} 次`;
      topUl.appendChild(li);
    });
  }
}

// ---------- Tab 切换 ----------

function showTab(id) {
  const sections = document.querySelectorAll('main > section');
  sections.forEach(sec => {
    sec.classList.toggle('hide', sec.id !== id);
  });

  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === id);
  });

  // 记住 tab
  saveJSON(STORAGE_KEYS.LAST_TAB, id);

  // 切换时刷新对应内容
  if (id === 'stats') renderStats();
  if (id === 'products') {
    renderProductList();
    renderProductOptions();
  }
  if (id === 'history') renderHistory();
}

function bindTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.tab;
      showTab(id);
    });
  });
}

// ---------- 初始化 ----------

document.addEventListener('DOMContentLoaded', () => {
  // 绑定事件
  bindTabs();
  bindProductEvents();
  bindLogForm();

  // 初始数据
  renderProductOptions();
  renderProductList();
  renderHistory();
  renderStats();

  // 还原上次 tab
  const lastTab = loadJSON(STORAGE_KEYS.LAST_TAB, 'log');
  showTab(lastTab || 'log');

  // 日期默认今天
  const dateInput = document.getElementById('date');
  if (dateInput && !dateInput.value) {
    dateInput.value = todayISO();
  }

  // 注册 SW
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(e => {
        console.log('SW 注册失败', e);
      });
    });
  }
});
