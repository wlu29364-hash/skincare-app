// 护肤记录 app.js 完整版
// 功能：记录今日 / 产品库 / 历史记录 / 简单统计 & Tab 切换

const LOG_KEY = 'skincare-logs-v1';
const PRODUCT_KEY = 'skincare-products-v1';

function loadLogs() {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function saveLogs(list) {
  try { localStorage.setItem(LOG_KEY, JSON.stringify(list)); } catch (e) {}
}

function loadProducts() {
  try {
    const raw = localStorage.getItem(PRODUCT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function saveProducts(list) {
  try { localStorage.setItem(PRODUCT_KEY, JSON.stringify(list)); } catch (e) {}
}

function showTab(id) {
  document.querySelectorAll('section.card').forEach(sec => {
    if (!sec.id) return;
    sec.classList.toggle('hide', sec.id !== id);
  });
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.classList.toggle('tab_active', btn.dataset.tab === id);
  });

  if (id === 'log') fillTodayForm();
  if (id === 'products') { bindAddProduct(); renderProducts(); }
  if (id === 'history') renderHistory();
  if (id === 'stats') renderStats();

  try { localStorage.setItem('lastTab', id); } catch (e) {}
}

function initTabs() {
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
  });
}

function fillTodayForm() {
  const dateInput = document.getElementById('date');
  if (!dateInput) return;
  if (!dateInput.value) {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dateInput.value = `${d.getFullYear()}/${m}/${day}`;
  }
}

function bindSaveToday() {
  const btn = document.getElementById('saveBtn');
  if (!btn || btn._binded) return;
  btn._binded = true;

  btn.addEventListener('click', () => {
    const dateEl = document.getElementById('date');
    const ampmEl = document.querySelector('input[name="ampm"]:checked');
    const productEl = document.getElementById('product');
    const feelingEl = document.getElementById('feeling');
    const skinEl = document.getElementById('skin');
    const noteEl = document.getElementById('note');

    if (!dateEl || !ampmEl) {
      alert('请先选择日期与早/晚');
      return;
    }

    const log = {
      date: dateEl.value,
      ampm: ampmEl.value,
      product: productEl ? productEl.value.trim() : '',
      feeling: feelingEl ? feelingEl.value.trim() : '',
      skin: skinEl ? skinEl.value.trim() : '',
      note: noteEl ? noteEl.value.trim() : '',
      time: Date.now()
    };

    let logs = loadLogs();
    const idx = logs.findIndex(l => l.date === log.date && l.ampm === log.ampm);
    if (idx >= 0) logs[idx] = log; else logs.push(log);
    saveLogs(logs);
    showToast('已保存今日记录');
    renderHistory();
  });
}

function renderProducts() {
  const listEl = document.getElementById('productList');
  if (!listEl) return;

  const items = loadProducts();
  listEl.innerHTML = '';

  if (!items.length) {
    const li = document.createElement('li');
    li.textContent = '暂无数据。';
    listEl.appendChild(li);
    return;
  }

  items.forEach((p, idx) => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';
    li.style.gap = '8px';

    const text = document.createElement('div');
    text.innerHTML = `<strong>${p.name}</strong> <span style="font-size:12px;color:#555;">(${p.useLabel})</span>`;
    li.appendChild(text);

    const del = document.createElement('button');
    del.textContent = '删除';
    del.className = 'btn ghost';
    del.style.fontSize = '12px';
    del.addEventListener('click', () => {
      const list = loadProducts();
      list.splice(idx, 1);
      saveProducts(list);
      renderProducts();
    });

    li.appendChild(del);
    listEl.appendChild(li);
  });
}

function bindAddProduct() {
  const btn = document.getElementById('addProductBtn');
  const nameInput = document.getElementById('pname');
  const useSelect = document.getElementById('puse');
  if (!btn || !nameInput || !useSelect) return;
  if (btn._binded) return;
  btn._binded = true;

  btn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const use = useSelect.value;

    if (!name) {
      alert('请输入产品名称');
      return;
    }

    const useLabel =
      use === 'am' ? '早用' :
      use === 'pm' ? '晚用' : '早晚皆可';

    const list = loadProducts();
    list.push({ name, use, useLabel });
    saveProducts(list);
    nameInput.value = '';
    renderProducts();
  });
}

function renderHistory() {
  const box = document.getElementById('historyList') || document.getElementById('history');
  if (!box) return;

  const logs = loadLogs().sort((a, b) => b.time - a.time);
  box.innerHTML = '';

  if (!logs.length) {
    box.innerHTML = '<p>暂无记录。</p>';
    return;
  }

  logs.forEach(l => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div><strong>${l.date}</strong> ${l.ampm === 'am' ? '早' : '晚'}</div>
      <div>产品：${l.product || '-'}</div>
      <div>感受：${l.feeling || '-'}</div>
      <div>皮肤：${l.skin || '-'}</div>
      ${l.note ? `<div>备注：${l.note}</div>` : ''}
    `;
    box.appendChild(div);
  });
}

function renderStats() {
  const s = document.getElementById('statsContent') || document.querySelector('#stats p');
  if (!s) return;
  const logs = loadLogs();
  s.innerHTML = logs.length ? `共 ${logs.length} 条记录。` : '暂无记录。';
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) { alert(msg); return; }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1600);
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  bindSaveToday();
  bindAddProduct();
  renderProducts();
  renderHistory();
  const last = localStorage.getItem('lastTab') || 'log';
  showTab(last);
});
