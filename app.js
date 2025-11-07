(function () {
  const STORAGE_KEY_LOGS = 'skincare_logs_v3';
  const STORAGE_KEY_PRODUCTS = 'skincare_products_v3';

  let logs = [];
  let products = [];

  function load() {
    try { logs = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS) || '[]'); }
    catch (e) { logs = []; }
    try { products = JSON.parse(localStorage.getItem(STORAGE_KEY_PRODUCTS) || '[]'); }
    catch (e) { products = []; }
  }

  function saveLogs() {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
  }

  function saveProducts() {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1800);
  }

  function setToday() {
    const d = document.getElementById('dateInput');
    if (!d) return;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    d.value = `${yyyy}-${mm}-${dd}`;
  }

  function bindTabs() {
    const tabs = document.querySelectorAll('#tabs .tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const id = tab.dataset.tab;
        document.querySelectorAll('main section').forEach(sec => {
          if (sec.id === id) sec.classList.remove('hide');
          else sec.classList.add('hide');
        });
        if (id === 'stats') renderStats();
        if (id === 'history') renderHistory();
        if (id === 'products') renderProducts();
        if (id === 'log') preloadFromExisting();
      });
    });
  }

  function bindPeriodSeg() {
    const seg = document.getElementById('periodSeg');
    if (!seg) return;
    seg.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      seg.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      preloadFromExisting();
    });
  }

  function getSelectedPeriod() {
    const seg = document.getElementById('periodSeg');
    const active = seg ? seg.querySelector('button.active') : null;
    return active ? active.dataset.value : null;
  }

  function bindChips(id) {
    const box = document.getElementById(id);
    if (!box) return;
    box.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      chip.classList.toggle('active');
    });
  }

  function getActiveTexts(id) {
    const box = document.getElementById(id);
    if (!box) return '';
    return Array.from(box.querySelectorAll('.chip.active'))
      .map(c => c.textContent.trim())
      .join('、');
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>\"']/g, s => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[s]));
  }

  function renderProducts() {
    const list = document.getElementById('productList');
    const dl = document.getElementById('productDatalist');
    if (!list || !dl) return;
    list.innerHTML = '';
    dl.innerHTML = '';
    products.forEach((p, idx) => {
      const li = document.createElement('li');
      const useText = p.use === 'am' ? '早用' : p.use === 'pm' ? '晚用' : '早晚皆可';
      li.innerHTML =
        `<div><strong>${escapeHtml(p.name)}</strong>` +
        `<span class="pill">${escapeHtml(p.type || '其他')}</span>` +
        `<span class="pill">${useText}</span></div>` +
        `<button class="btn-danger" data-idx="${idx}">删除</button>`;
      list.appendChild(li);
      const opt = document.createElement('option');
      opt.value = p.name;
      dl.appendChild(opt);
    });
    list.onclick = (e) => {
      const btn = e.target.closest('.btn-danger');
      if (!btn) return;
      const i = parseInt(btn.dataset.idx, 10);
      if (!Number.isNaN(i)) {
        products.splice(i, 1);
        saveProducts();
        renderProducts();
        showToast('已删除该产品');
      }
    };
  }

  function addProduct() {
    const nameInput = document.getElementById('pname');
    const typeSel = document.getElementById('ptype');
    const useSel = document.getElementById('puse');
    const name = (nameInput.value || '').trim();
    if (!name) {
      showToast('请填写产品名');
      return;
    }
    const type = typeSel.value || '其他';
    const use = useSel.value || 'all';
    const exist = products.find(p => p.name === name);
    if (exist) {
      exist.type = type;
      exist.use = use;
    } else {
      products.push({ name, type, use });
    }
    saveProducts();
    nameInput.value = '';
    renderProducts();
    showToast('产品已保存');
  }

  function splitProducts(str) {
    if (!str) return [];
    return str.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
  }

  function saveLog() {
    const dateInput = document.getElementById('dateInput');
    const date = dateInput.value;
    const period = getSelectedPeriod();
    if (!date || !period) {
      alert('请先选择日期与早/晚');
      return;
    }
    const productsText = document.getElementById('productsInput').value.trim();
    const feelings = getActiveTexts('feelingChips');
    const skin = getActiveTexts('skinChips');
    const note = document.getElementById('noteInput').value.trim();
    const photoInput = document.getElementById('photoInput');
    let photos = [];
    if (photoInput && photoInput.files) {
      photos = Array.from(photoInput.files).slice(0,3).map(f => f.name);
    }
    const list = splitProducts(productsText);
    const log = { date, period, products:list, feeling:feelings, skin, note, photos };
    logs = logs.filter(l => !(l.date === date && l.period === period));
    logs.push(log);
    logs.sort((a,b) => (a.date + a.period).localeCompare(b.date + b.period));
    saveLogs();
    showToast('已保存');
    preloadFromExisting();
  }

  function preloadFromExisting() {
    const dateInput = document.getElementById('dateInput');
    if (!dateInput) return;
    const date = dateInput.value;
    const period = getSelectedPeriod();
    if (!date || !period) return;
    const existing = logs.find(l => l.date === date && l.period === period);
    const pInput = document.getElementById('productsInput');
    const noteInput = document.getElementById('noteInput');
    const photoInput = document.getElementById('photoInput');
    ['feelingChips','skinChips'].forEach(id => {
      const box = document.getElementById(id);
      if (box) box.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    });
    if (!existing) {
      if (pInput) pInput.value = '';
      if (noteInput) noteInput.value = '';
      if (photoInput) photoInput.value = '';
      return;
    }
    if (pInput) pInput.value = (existing.products || []).join('、');
    if (noteInput) noteInput.value = existing.note || '';
    if (photoInput) photoInput.value = '';
    if (existing.feeling) {
      const arr = existing.feeling.split(/[,，、]/).map(s => s.trim());
      const box = document.getElementById('feelingChips');
      if (box) box.querySelectorAll('.chip').forEach(c => {
        if (arr.includes(c.textContent.trim())) c.classList.add('active');
      });
    }
    if (existing.skin) {
      const arr2 = existing.skin.split(/[,，、]/).map(s => s.trim());
      const box2 = document.getElementById('skinChips');
      if (box2) box2.querySelectorAll('.chip').forEach(c => {
        if (arr2.includes(c.textContent.trim())) c.classList.add('active');
      });
    }
  }

  function renderHistory() {
    const ul = document.getElementById('historyList');
    if (!ul) return;
    ul.innerHTML = '';
    if (!logs.length) {
      ul.innerHTML = '<li class="history-item">暂无记录</li>';
      return;
    }
    const sorted = [...logs].sort((a,b) => (b.date + b.period).localeCompare(a.date + a.period)).reverse();
    sorted.slice(0,60).forEach(l => {
      const p = (l.products || []).join('、') || '未填写';
      const pn = l.period === 'am' ? '早' : '晚';
      const li = document.createElement('li');
      li.className = 'history-item';
      li.innerHTML =
        `<strong>${l.date} ${pn}</strong><br>` +
        `产品：${escapeHtml(p)}<br>` +
        `感受：${escapeHtml(l.feeling || '未填写')}<br>` +
        `状态：${escapeHtml(l.skin || '未填写')}` +
        (l.note ? `<br>备注：${escapeHtml(l.note)}` : '');
      ul.appendChild(li);
    });
  }

  function renderStats() {
    const p = document.getElementById('statSummary');
    const top = document.getElementById('topProducts');
    if (!p || !top) return;
    if (!logs.length) {
      p.textContent = '还没有记录，先去“记录”页写一条～';
      top.innerHTML = '';
      return;
    }
    const now = new Date();
    const d30 = new Date(now.getTime() - 29*24*60*60*1000);
    function parseDate(s) {
      const [y,m,d] = s.split('-').map(Number);
      return new Date(y, m-1, d);
    }
    const daysSet = new Set();
    const counter = {};
    logs.forEach(l => {
      const dt = parseDate(l.date);
      if (dt >= d30) daysSet.add(l.date);
      (l.products || []).forEach(name => {
        if (!name) return;
        counter[name] = (counter[name] || 0) + 1;
      });
    });
    p.textContent = `近 30 天有记录的天数：${daysSet.size} 天；累计记录：${logs.length} 条。`;
    const items = Object.keys(counter).map(name => ({name, count: counter[name]}))
      .sort((a,b)=>b.count-a.count).slice(0,5);
    top.innerHTML = '';
    if (!items.length) {
      top.innerHTML = '<li class="list-item">还没有统计到常用产品。</li>';
      return;
    }
    items.forEach(it => {
      const li = document.createElement('li');
      li.textContent = `${it.name}：${it.count} 次`;
      top.appendChild(li);
    });
  }

  function bindSave() {
    const btn = document.getElementById('saveBtn');
    if (btn) btn.addEventListener('click', saveLog);
  }

  function bindAddProduct() {
    const btn = document.getElementById('addProductBtn');
    if (btn) btn.addEventListener('click', addProduct);
  }

  function bindDateChange() {
    const d = document.getElementById('dateInput');
    if (d) d.addEventListener('change', preloadFromExisting);
  }

  document.addEventListener('DOMContentLoaded', () => {
    load();
    setToday();
    bindTabs();
    bindPeriodSeg();
    bindChips('feelingChips');
    bindChips('skinChips');
    bindSave();
    bindAddProduct();
    bindDateChange();
    renderProducts();
    preloadFromExisting();
  });
})();