(function(){
  const STORAGE_KEYS = {
    LOGS: 'skincareLogs_v3',
    PRODUCTS: 'skincareProducts_v3'
  };

  function showToast(msg){
    const el = document.getElementById('toast');
    if(!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(()=>el.classList.remove('show'), 1800);
  }

  function formatDate(date){
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,'0');
    const d = String(date.getDate()).padStart(2,'0');
    return y + '-' + m + '-' + d;
  }

  function loadLogs(){
    try{
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
    }catch(e){
      return [];
    }
  }
  function saveLogs(list){
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(list));
  }
  function loadProducts(){
    try{
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    }catch(e){
      return [];
    }
  }
  function saveProducts(list){
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));
  }

  function initTabs(){
    const tabs = document.getElementById('tabs');
    if(!tabs) return;
    tabs.addEventListener('click', e=>{
      const btn = e.target.closest('button[data-tab]');
      if(!btn) return;
      const id = btn.dataset.tab;
      tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('active', b===btn));
      document.querySelectorAll('main > section').forEach(sec=>{
        sec.style.display = (sec.id === id) ? '' : 'none';
      });
      if(id === 'stats') renderStats();
      if(id === 'products') renderProducts();
      if(id === 'history') renderHistory();
      localStorage.setItem('skincare_last_tab', id);
    });

    const last = localStorage.getItem('skincare_last_tab') || 'log';
    const targetBtn = tabs.querySelector('button[data-tab="'+last+'"]') || tabs.querySelector('button[data-tab="log"]');
    if(targetBtn){
      targetBtn.click();
    }
  }

  function initDate(){
    const sel = document.getElementById('dateSelect');
    if(!sel) return;
    sel.innerHTML = '';
    const today = new Date();
    for(let i=0;i<14;i++){
      const d = new Date(today.getTime() - i*24*60*60*1000);
      const val = formatDate(d);
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val.replace(/-/g,'/');
      if(i===0) opt.selected = true;
      sel.appendChild(opt);
    }
  }

  function getSelectedTime(){
    const am = document.getElementById('amBtn');
    return am && am.classList.contains('active') ? 'am' : 'pm';
  }

  function bindAmPm(){
    const am = document.getElementById('amBtn');
    const pm = document.getElementById('pmBtn');
    if(!am || !pm) return;
    const handler = (btn, val)=>{
      btn.addEventListener('click', ()=>{
        am.classList.toggle('active', val==='am');
        pm.classList.toggle('active', val==='pm');
      });
    };
    handler(am,'am');
    handler(pm,'pm');
  }

  function renderProducts(){
    const listEl = document.getElementById('productList');
    if(!listEl) return;
    const products = loadProducts();
    listEl.innerHTML = '';
    if(!products.length){
      listEl.innerHTML = '<li class="note" style="margin-top:4px;">暂无产品，请添加。</li>';
      return;
    }
    products.forEach((p,idx)=>{
      const li = document.createElement('li');
      li.style.marginTop = '10px';
      li.style.padding = '10px 12px';
      li.style.borderRadius = '16px';
      li.style.background = '#f5faf5';
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';
      li.style.gap = '8px';

      const text = [];
      text.push(p.name);
      if(p.type) text.push('['+p.type+']');
      if(p.use === 'am') text.push('(早用)');
      else if(p.use === 'pm') text.push('(晚用)');
      else text.push('(早晚皆可)');

      const span = document.createElement('div');
      span.textContent = text.join(' ');
      span.style.fontSize = '14px';

      const del = document.createElement('button');
      del.textContent = '删除';
      del.className = 'btn-sm';
      del.addEventListener('click', ()=>{
        const list = loadProducts();
        list.splice(idx,1);
        saveProducts(list);
        renderProducts();
        fillProductSelect();
        showToast('已删除产品');
      });

      li.appendChild(span);
      li.appendChild(del);
      listEl.appendChild(li);
    });
  }

  function fillProductSelect(){
    const sel = document.getElementById('productInput');
    if(!sel) return;
    const products = loadProducts();
    sel.innerHTML = '';

    if(!products.length){
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '直接输入产品名';
      sel.appendChild(opt);
      sel.disabled = true;
      return;
    }

    sel.disabled = false;
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = '选择或输入产品名（可多条，用逗号隔开）';
    sel.appendChild(empty);

    products.forEach(p=>{
      const opt = document.createElement('option');
      opt.value = p.name;
      opt.textContent = p.name + (p.type ? ' ['+p.type+']':'') + (p.use==='am'?' (早)':p.use==='pm'?' (晚)':'');
      sel.appendChild(opt);
    });

    // allow manual typing via prompt when changed to special value? 简化：选择后直接填入输入框表现
    sel.addEventListener('change', ()=>{
      const val = sel.value;
      if(!val) return;
      // 如果当前已有内容，则追加
      const logsInput = document.getElementById('productInputText');
      // 这里保留向后兼容：直接把选择值留在 select，保存时读取
    });
  }

  function bindAddProduct(){
    const btn = document.getElementById('addProductBtn');
    if(!btn) return;
    btn.addEventListener('click', ()=>{
      const nameInput = document.getElementById('pname');
      const useSel = document.getElementById('puse');
      const typeSel = document.getElementById('ptype');
      const name = (nameInput.value || '').trim();
      if(!name){
        showToast('请填写产品名');
        return;
      }
      const list = loadProducts();
      if(list.some(p=>p.name === name)){
        showToast('该产品已存在');
        return;
      }
      list.push({
        name,
        use: useSel.value || 'all',
        type: typeSel.value || ''
      });
      saveProducts(list);
      nameInput.value = '';
      typeSel.value = '';
      renderProducts();
      fillProductSelect();
      showToast('已添加到产品库');
    });
  }

  function getSelectedChips(containerId){
    const c = document.getElementById(containerId);
    if(!c) return [];
    return Array.from(c.querySelectorAll('.chip.active')).map(x=>x.dataset.value);
  }

  function bindChipGroups(){
    ['feelChips','skinChips'].forEach(id=>{
      const c = document.getElementById(id);
      if(!c) return;
      c.addEventListener('click', e=>{
        const chip = e.target.closest('.chip');
        if(!chip) return;
        chip.classList.toggle('active');
      });
    });
  }

  function saveToday(){
    const date = document.getElementById('dateSelect').value;
    const time = getSelectedTime();
    const productSel = document.getElementById('productInput');
    let product = '';
    if(productSel){
      product = productSel.value || '';
    }
    const note = document.getElementById('note').value.trim();
    const feelings = getSelectedChips('feelChips');
    const skins = getSelectedChips('skinChips');

    if(!date){
      showToast('请选择日期');
      return;
    }
    if(!time){
      showToast('请选择早/晚');
      return;
    }

    const logs = loadLogs();
    const idx = logs.findIndex(l=>l.date===date && l.time===time);
    const entry = {
      date,
      time,
      product,
      feelings,
      skins,
      note
    };
    if(idx>=0) logs[idx] = entry; else logs.push(entry);
    saveLogs(logs);
    showToast('已保存');
    renderHistory();
    renderStats();
  }

  function renderHistory(){
    const box = document.getElementById('historyList');
    if(!box) return;
    const logs = loadLogs().sort((a,b)=>{
      if(a.date===b.date){
        return (a.time==='am'?0:1) - (b.time==='am'?0:1);
      }
      return a.date < b.date ? 1 : -1;
    });
    box.innerHTML = '';
    if(!logs.length){
      box.innerHTML = '<div class="note">暂无记录。</div>';
      return;
    }
    logs.forEach((l, index)=>{
      const wrap = document.createElement('div');
      wrap.className = 'history-item';

      const main = document.createElement('div');
      main.className = 'history-main';

      const title = document.createElement('div');
      title.className = 'history-title';
      title.textContent = l.date + ' ' + (l.time==='am'?'早':'晚');
      main.appendChild(title);

      const detail = [];
      if(l.product) detail.push('产品：'+l.product);
      if(l.feelings && l.feelings.length) detail.push('感受：'+l.feelings.join('、'));
      if(l.skins && l.skins.length) detail.push('状态：'+l.skins.join('、'));
      if(l.note) detail.push('备注：'+l.note);
      const sub = document.createElement('div');
      sub.className = 'history-sub';
      sub.textContent = detail.join(' / ') || '未填写详情';
      main.appendChild(sub);

      const act = document.createElement('div');
      act.className = 'history-actions';
      const del = document.createElement('button');
      del.className = 'btn-sm';
      del.textContent = '删除';
      del.addEventListener('click', ()=>{
        const list = loadLogs();
        const i = list.findIndex(x=>x.date===l.date && x.time===l.time);
        if(i>=0){
          list.splice(i,1);
          saveLogs(list);
          renderHistory();
          renderStats();
          showToast('已删除记录');
        }
      });
      act.appendChild(del);

      wrap.appendChild(main);
      wrap.appendChild(act);
      box.appendChild(wrap);
    });
  }

  function renderStats(rangeDays){
    const logs = loadLogs();
    const listEl = document.getElementById('statsList');
    const sumEl = document.getElementById('statsSummary');
    const filterWrap = document.querySelector('.stats-filter');
    if(!listEl || !sumEl) return;

    // range
    let range = rangeDays || 30;
    if(filterWrap){
      filterWrap.querySelectorAll('button').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          filterWrap.querySelectorAll('button').forEach(b=>b.classList.toggle('active', b===btn));
          const v = btn.dataset.range;
          let days = 30;
          if(v==='7') days = 7;
          else if(v==='31') days = 31; // treat as month
          else days = 30;
          renderStats(days);
        });
      });
    }

    const now = new Date();
    let fromDate;

    if(range === 7){ // this week: from Monday
      const day = now.getDay() || 7;
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
    }else if(range === 31){ // this month: from 1st
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }else{ // last 30 days
      fromDate = new Date(now.getTime() - 29*24*60*60*1000);
    }

    const fromStr = formatDate(fromDate);
    const filtered = logs.filter(l=>l.date >= fromStr);

    const byProduct = {};
    filtered.forEach(l=>{
      const key = l.product || '未填写产品';
      byProduct[key] = (byProduct[key] || 0) + 1;
    });

    const daysSet = new Set(filtered.map(l=>l.date));
    sumEl.textContent = filtered.length
      ? `时间范围内有记录的天数：${daysSet.size} 天；记录总数：${filtered.length} 条。`
      : '当前时间范围内暂无记录。';

    listEl.innerHTML = '';
    Object.keys(byProduct).sort((a,b)=>byProduct[b]-byProduct[a]).forEach(name=>{
      const div = document.createElement('div');
      div.className = 'stats-line';
      const left = document.createElement('div');
      left.textContent = name;
      const right = document.createElement('div');
      right.textContent = byProduct[name] + ' 次';
      div.appendChild(left);
      div.appendChild(right);
      listEl.appendChild(div);
    });
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    initTabs();
    initDate();
    bindAmPm();
    bindChipGroups();
    bindAddProduct();
    renderProducts();
    fillProductSelect();
    renderHistory();

    const saveBtn = document.getElementById('saveBtn');
    if(saveBtn) saveBtn.addEventListener('click', saveToday);

    // 初始统计
    renderStats();
  });
})();
