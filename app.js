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
