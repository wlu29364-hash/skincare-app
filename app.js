
(function () {
  // === 工具函数 ===
  function $(sel) {
    return document.querySelector(sel);
  }
  function $all(sel) {
    return Array.from(document.querySelectorAll(sel));
  }

  const STORAGE_KEYS = {
    PRODUCTS: 'skincare_products_v1',
    LOGS: 'skincare_logs_v1',
    LAST_TAB: 'skincare_last_tab_v1'
  };

  // === 本地存储封装 ===
  function load(key, defaultValue) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch (e) {
      console.error('Load error', key, e);
      return defaultValue;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Save error', key, e);
    }
  }

  // === 数据 ===
  let products = load(STORAGE_KEYS.PRODUCTS, []);
  let logs = load(STORAGE_KEYS.LOGS, []);

  // === Tab 切换 ===
  const tabButtons = $all('[data-tab]');
  const sections = {
    log: $('#log'),
    stats: $('#stats'),
    products: $('#products'),
    history: $('#history')
  };

  function showTab(id) {
    Object.keys(sections).forEach(key => {
      if (!sections[key]) return;
      if (key === id) {
        sections[key].classList.remove('hide');
      } else {
        sections[key].classList.add('hide');
      }
    });

    tabButtons.forEach(btn => {
      if (btn.dataset.tab === id) {
        btn.classList.add('tab_active');
      } else {
        btn.classList.remove('tab_active');
      }
    });

    // 渲染对应区域
    if (id === 'products') {
      renderProducts();
    } else if (id === 'history') {
      renderHistory();
    } else if (id === 'stats') {
      renderStats();
    }

    // 记住最后一个 tab
    try {
      save(STORAGE_KEYS.LAST_TAB, id);
    } catch (e) {}
  }

  // === 产品库 ===
  const pnameInput = $('#pname');
  const puseSelect = $('#puse');
  const addProductBtn = $('#addProductBtn');
  const productList = $('#productList');

  function renderProducts() {
    if (!productList) return;
    productList.innerHTML = '';
    if (!products.length) {
      const li = document.createElement('li');
      li.textContent = '暂无产品，请先添加。';
      productList.appendChild(li);
      return;
    }
    products.forEach((p, index) => {
      const li = document.createElement('li');
      const labelMap = { all: '早/晚', am: '早用', pm: '晚用' };
      li.textContent = p.name + '（' + (labelMap[p.use] || '未设置') + '）';
      const del = document.createElement('button');
      del.textContent = '删除';
      del.style.marginLeft = '12px';
      del.addEventListener('click', function () {
        products.splice(index, 1);
        save(STORAGE_KEYS.PRODUCTS, products);
        renderProducts();
      });
      li.appendChild(del);
      productList.appendChild(li);
    });
  }

  function addProduct() {
    if (!pnameInput || !puseSelect) return;
    const name = (pnameInput.value || '').trim();
    const use = puseSelect.value || 'all';
    if (!name) {
      alert('请输入产品名');
      return;
    }
    // 去重：同名同用法不重复加
    const exists = products.some(p => p.name === name && p.use === use);
    if (exists) {
      alert('这个产品已经在产品库里了');
      return;
    }
    products.push({ name, use });
    save(STORAGE_KEYS.PRODUCTS, products);
    pnameInput.value = '';
    puseSelect.value = 'all';
    renderProducts();
  }

  if (addProductBtn) {
    addProductBtn.addEventListener('click', addProduct);
  }

  // === 记录页 ===
  const dateSelect = $('#date');
  const amBtn = $('#amBtn');
  const pmBtn = $('#pmBtn');
  const usedInput = $('#used');      // 使用产品
  const feelingInput = $('#feeling');
  const skinInput = $('#skin');
  const noteInput = $('#note');
  const saveBtn = $('#saveBtn');

  let currentTime = 'am'; // 'am' | 'pm'

  function initDate() {
    if (!dateSelect) return;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const today = `${yyyy}-${mm}-${dd}`;
    dateSelect.value = today;
  }

  function setTime(t) {
    currentTime = t;
    if (amBtn && pmBtn) {
      if (t === 'am') {
        amBtn.classList.add('seg_active');
        pmBtn.classList.remove('seg_active');
      } else {
        pmBtn.classList.add('seg_active');
        amBtn.classList.remove('seg_active');
      }
    }
    // 根据产品库自动提示
    fillProductFromLibrary();
  }

  function fillProductFromLibrary() {
    if (!usedInput) return;
    const d = (dateSelect && dateSelect.value) || '';
    if (!d) return;
    const list = products
      .filter(p => p.use === 'all' || p.use === currentTime)
      .map(p => p.name);
    usedInput.placeholder = list.length
      ? '建议：' + list.join(' / ')
      : '使用产品';
  }

  if (amBtn) {
    amBtn.addEventListener('click', () => setTime('am'));
  }
  if (pmBtn) {
    pmBtn.addEventListener('click', () => setTime('pm'));
  }

  function saveTodayLog() {
    if (!dateSelect) {
      alert('页面缺少日期控件');
      return;
    }
    const date = dateSelect.value;
    if (!date || !currentTime) {
      alert('请先选择日期与早/晚');
      return;
    }
    const record = {
      date,
      time: currentTime,
      used: (usedInput && usedInput.value.trim()) || '',
      feeling: (feelingInput && feelingInput.value.trim()) || '',
      skin: (skinInput && skinInput.value.trim()) || '',
      note: (noteInput && noteInput.value.trim()) || '',
      ts: Date.now()
    };

    // 如果当天同一时段已有记录，则覆盖
    const idx = logs.findIndex(
      l => l.date === record.date && l.time === record.time
    );
    if (idx >= 0) {
      logs[idx] = record;
    } else {
      logs.push(record);
    }
    save(STORAGE_KEYS.LOGS, logs);
    alert('已保存');
    renderHistory();
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', saveTodayLog);
  }

  // === 历史记录 ===
  const historyList = $('#historyList');

  function renderHistory() {
    if (!historyList) return;
    historyList.innerHTML = '';
    if (!logs.length) {
      const li = document.createElement('li');
      li.textContent = '暂无记录。';
      historyList.appendChild(li);
      return;
    }
    // 时间倒序
    const sorted = logs.slice().sort((a, b) => b.ts - a.ts);
    sorted.forEach(l => {
      const li = document.createElement('li');
      const timeLabel = l.time === 'am' ? '早' : '晚';
      li.innerHTML =
        `<strong>${l.date} ${timeLabel}</strong> ` +
        (l.used ? `｜产品：${escapeHtml(l.used)} ` : '') +
        (l.feeling ? `｜感受：${escapeHtml(l.feeling)} ` : '') +
        (l.skin ? `｜皮肤：${escapeHtml(l.skin)} ` : '') +
        (l.note ? `｜备注：${escapeHtml(l.note)}` : '');
      historyList.appendChild(li);
    });
  }

  // === 统计（简单示例：最近 30 天使用次数最多的产品） ===
  const statsBox = $('#statsBox');

  function renderStats() {
    if (!statsBox) return;
    statsBox.innerHTML = '';
    if (!logs.length) {
      statsBox.textContent = '暂无记录。';
      return;
    }
    const now = new Date();
    const d30 = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000); // 最近30天
    const counter = {};
    logs.forEach(l => {
      const d = new Date(l.date);
      if (!(d >= d30)) return;
      const names = (l.used || '')
        .split(/[、,/]/)
        .map(s => s.trim())
        .filter(Boolean);
      names.forEach(n => {
        counter[n] = (counter[n] || 0) + 1;
      });
    });
    const items = Object.keys(counter).sort((a, b) => counter[b] - counter[a]);
    if (!items.length) {
      statsBox.textContent = '最近30天没有统计数据。';
      return;
    }
    const ul = document.createElement('ul');
    items.forEach(name => {
      const li = document.createElement('li');
      li.textContent = `${name}：${counter[name]} 次`;
      ul.appendChild(li);
    });
    statsBox.appendChild(ul);
  }

  // === 小工具 ===
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // === 初始化 ===
  document.addEventListener('DOMContentLoaded', function () {
    initDate();
    setTime('am'); // 默认早

    // 绑定 Tab
    if (tabButtons.length) {
      tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.tab;
          if (id) showTab(id);
        });
      });
    }

    // 恢复上次 Tab
    const last = load(STORAGE_KEYS.LAST_TAB, 'log');
    if (sections[last]) {
      showTab(last);
    } else {
      showTab('log');
    }

    renderProducts();
    renderHistory();
    renderStats();
  });
})();
