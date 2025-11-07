(function () {
  // 工具
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const toast = (msg='已保存！') => {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 1600);
  };

  // Tab 切换
  function bindTabs() {
    const tabs = $$('#tabs .tab');
    const sections = ['log','stats','products','history'].map(id => ({id, el: $('#'+id)}));
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        tabs.forEach(b => b.classList.toggle('active', b===btn));
        sections.forEach(s => s.el.classList.toggle('hide', s.id !== target));
        // 让页面可点击（无遮罩）
        document.activeElement && document.activeElement.blur?.();
      }, { passive: true });
    });
  }

  // 早/晚切换
  function bindAMPM() {
    const seg = $('#seg-time');
    const btns = $$('button', seg);
    seg.addEventListener('click', (ev) => {
      const b = ev.target.closest('button');
      if (!b) return;
      btns.forEach(x => x.classList.toggle('active', x === b));
      seg.dataset.value = b.dataset.val;
    }, { passive: true });
  }

  // 保存（示例：存入 localStorage）
  function bindSave() {
    const saveBtn = $('#saveBtn');
    saveBtn.addEventListener('click', () => {
      const data = {
        date: $('#date').value,
        tp  : $('#seg-time').dataset.value || 'AM',
        products: $('#productsInput').value.trim(),
        feeling : $('#feeling').value.trim(),
        skin    : $('#skin').value.trim(),
        note    : $('#note').value.trim(),
        ts: Date.now()
      };
      const key = 'skincare-logs';
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      list.unshift(data);
      localStorage.setItem(key, JSON.stringify(list));
      toast('保存成功');
    });
  }

  // 初始化日期默认今天
  function initDate() {
    const d = $('#date');
    if (!d.value) {
      const now = new Date();
      const pad = n => (n<10?'0':'') + n;
      d.value = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
    }
  }

  // DOM 就绪
  document.addEventListener('DOMContentLoaded', () => {
    bindTabs();
    bindAMPM();
    bindSave();
    initDate();
  }, { passive: true });
})();
// ===== 工具函数 =====
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
function getLogs() {
  try { return JSON.parse(localStorage.getItem('logs') || '[]'); } catch { return []; }
}
function getProductsDB() {
  try { return JSON.parse(localStorage.getItem('products') || '{}'); } catch { return {}; }
}
function setProductsDB(db) {
  localStorage.setItem('products', JSON.stringify(db));
}

// ===== 统计页 =====
function renderStats() {
  const box = $('#statBox');
  if (!box) return;
  const logs = getLogs();
  if (!logs.length) {
    box.innerHTML = '<p>还没有任何记录。</p>';
    return;
  }
  // 近30天次数统计（按产品名聚合）
  const now = Date.now();
  const d30 = now - 30 * 24 * 60 * 60 * 1000;
  const counter = {};
  logs.forEach(l => {
    const t = new Date(l.date).getTime() || 0;
    if (t >= d30) {
      (l.products || []).forEach(name => {
        counter[name] = (counter[name] || 0) + 1;
      });
    }
  });
  const items = Object.entries(counter).sort((a,b)=>b[1]-a[1]);
  if (!items.length) {
    box.innerHTML = '<p>近30天还没有可统计的数据。</p>';
    return;
  }
  box.innerHTML = `
    <p style="margin:.25rem 0 .5rem 0;color:#666;">近30天使用次数（按多到少）：</p>
    <ol style="margin:.25rem 0 .5rem 1.25rem;">
      ${items.map(([k,v])=>`<li>${k}：<b>${v}</b> 次</li>`).join('')}
    </ol>
  `;
}

// ===== 产品库页 =====
function renderProducts() {
  const list = $('#plist');
  if (!list) return;
  const db = getProductsDB();
  const names = Object.keys(db);
  if (!names.length) {
    list.innerHTML = '<li style="color:#666;">暂无产品。你可以在上面输入框添加，或在记录页输入后自动收集。</li>';
    return;
  }
  list.innerHTML = names
    .sort((a,b)=>a.localeCompare(b))
    .map(n => `<li>${n}${db[n] ? ` <small style="color:#666;">(${db[n]})</small>` : ''}</li>`)
    .join('');
}

// 可选：在产品库页点“添加”按钮，写入本地库
function bindAddProduct() {
  const btn = $('#addP');
  if (!btn) return;
  btn.onclick = () => {
    const name = ($('#pname')?.value || '').trim();
    const cate = ($('#pcate')?.value || '').trim();
    if (!name) return alert('请输入产品名称');
    const db = getProductsDB();
    db[name] = cate;
    setProductsDB(db);
    renderProducts();
    $('#pname').value = '';
    $('#pcate').value = '';
  };
}

// ===== 历史页 =====
function renderHistory() {
  const box = $('#hlist');
  if (!box) return;
  const logs = getLogs();
  if (!logs.length) {
    box.innerHTML = '<p>暂无历史记录。</p>';
    return;
  }
  // 展示最近 30 条
  const rows = logs.slice(-30).reverse().map(l => {
    const when = `${l.date || ''} ${l.am ? '早' : '晚'}`;
    const pro = (l.products || []).join('、') || '-';
    const feel = l.feeling || '';
    const skin = l.skin || '';
    return `
      <div style="padding:.5rem 0;border-bottom:1px solid #eee;">
        <div style="font-weight:600;">${when}</div>
        <div>产品：${pro}</div>
        ${feel ? `<div>感受：${feel}</div>` : ''}
        ${skin ? `<div>皮肤：${skin}</div>` : ''}
      </div>
    `;
  }).join('');
  box.innerHTML = rows;
}

// ===== Tab 切换时触发渲染（与你现有 showTab 合并即可） =====
function showTab(id) {
  // 隐藏所有 section
  $$('#main > section.card, section.card').forEach(s => s.classList.add('hide'));
  // 激活目标
  const target = document.getElementById(id);
  if (target) target.classList.remove('hide');
  // 顶部按钮样式（如果你有 .tab）
  $$('#tabs .tab').forEach(b => b.classList.toggle('active', b.dataset?.tab === id));

  // 渲染对应页面
  if (id === 'stats') renderStats();
  if (id === 'products') { renderProducts(); bindAddProduct(); }
  if (id === 'history') renderHistory();

  // 记住最后一个 Tab（可选）
  try { localStorage.setItem('lastTab', id); } catch {}
}

// 首次进入时，默认展示记录页；如果你之前在 DOMContentLoaded 里已经调用 showTab('log') 就不用重复
document.addEventListener('DOMContentLoaded', () => {
  // 保底：如果没有 hash 且没有你自己调用 showTab，就显示 log
  if (!location.hash) {
    showTab('log');
  }
});
