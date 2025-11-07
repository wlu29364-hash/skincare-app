(function(){
  const STORAGE_KEY_LOGS = 'skincare_logs_v2';
  const STORAGE_KEY_PRODUCTS = 'skincare_products_v2';

  function load(key, def){
    try{
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : def;
    }catch(e){
      console.warn('load fail', key, e);
      return def;
    }
  }
  function save(key, val){
    try{
      localStorage.setItem(key, JSON.stringify(val));
    }catch(e){
      console.warn('save fail', key, e);
    }
  }

  let logs = load(STORAGE_KEY_LOGS, []);
  let products = load(STORAGE_KEY_PRODUCTS, []);

  // DOM
  const tabBtns = document.querySelectorAll('.tab-btn');
  const sections = {
    log: document.getElementById('log'),
    stats: document.getElementById('stats'),
    products: document.getElementById('products'),
    history: document.getElementById('history')
  };

  function showTab(id){
    tabBtns.forEach(b=>{
      b.classList.toggle('active', b.dataset.tab === id);
    });
    Object.keys(sections).forEach(k=>{
      sections[k].classList.toggle('hide', k !== id);
    });
    if(id === 'stats') renderStats();
    if(id === 'products') renderProducts();
    if(id === 'history') renderHistory();
  }

  tabBtns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      showTab(btn.dataset.tab);
      // 记住最后tab
      try{ localStorage.setItem('skincare_last_tab', btn.dataset.tab); }catch(e){}
    });
  });

  // 恢复tab
  const last = (()=>{
    try{return localStorage.getItem('skincare_last_tab') || 'log';}catch(e){return 'log';}
  })();
  showTab(last);

  // 日期选择：近30天+今天往前
  const dateSelect = document.getElementById('dateSelect');
  function initDates(){
    const today = new Date();
    for(let i=0;i<60;i++){
      const d = new Date(today.getTime()-i*86400000);
      const y = d.getFullYear();
      const m = String(d.getMonth()+1).padStart(2,'0');
      const day = String(d.getDate()).padStart(2,'0');
      const v = `${y}-${m}-${day}`;
      const text = `${y}/${m}/${day}`;
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = text;
      dateSelect.appendChild(opt);
    }
    dateSelect.value = formatDate(today);
  }
  function formatDate(d){
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,'0');
    const day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }
  initDates();

  // 早晚切换
  const timeSeg = document.getElementById('timeSeg');
  let currentTime = 'am';
  timeSeg.addEventListener('click', e=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    currentTime = btn.dataset.time;
    [...timeSeg.querySelectorAll('button')].forEach(b=>{
      b.classList.toggle('active', b===btn);
    });
  });

  // chips 数据
  const feelingOptions = ['清爽','滋润','有刺痛','成膜感强','有闷痘','粘腻','温和','一般','其他'];
  const skinOptions = ['正常','偏干','偏油','出油','T区暗沉','泛红','闭口','痘痘','毛孔粗大','稳定'];
  function renderChips(containerId, options){
    const box = document.getElementById(containerId);
    box.innerHTML = '';
    options.forEach(text=>{
      const c = document.createElement('div');
      c.className = 'chip';
      c.textContent = text;
      c.dataset.value = text;
      c.addEventListener('click', ()=>{
        c.classList.toggle('active');
      });
      box.appendChild(c);
    });
  }
  renderChips('feelingChips', feelingOptions);
  renderChips('skinChips', skinOptions);

  // 产品库渲染 & 选择建议
  const productInput = document.getElementById('productInput');
  const productSuggest = document.getElementById('productSuggest');

  function renderProductSuggest(){
    productSuggest.innerHTML = '';
    if(!products.length) return;
    products.forEach(p=>{
      const c = document.createElement('div');
      c.className = 'chip';
      c.textContent = p.name;
      c.title = `${p.type || ''} ${p.use === 'am' ? '早' : p.use === 'pm' ? '晚':'早晚皆可'}`;
      c.addEventListener('click', ()=>{
        const cur = productInput.value.trim();
        if(!cur){
          productInput.value = p.name;
        }else if(!cur.includes(p.name)){
          productInput.value = cur + '、' + p.name;
        }
      });
      productSuggest.appendChild(c);
    });
  }

  // 保存记录
  const saveBtn = document.getElementById('saveBtn');
  const noteInput = document.getElementById('noteInput');

  function getSelectedChips(containerId){
    return [...document.getElementById(containerId).querySelectorAll('.chip.active')]
      .map(c=>c.dataset.value);
  }

  function saveLog(){
    const date = dateSelect.value;
    if(!date || !currentTime){
      alert('请先选择日期与早/晚');
      return;
    }
    const productsText = productInput.value.trim();
    const feeling = getSelectedChips('feelingChips');
    const skin = getSelectedChips('skinChips');
    const note = noteInput.value.trim();
    const log = {
      id: `${date}_${currentTime}`,
      date,
      time: currentTime,
      products: productsText,
      feeling,
      skin,
      note
    };
    const idx = logs.findIndex(l=>l.id === log.id);
    if(idx>=0){
      logs[idx] = log;
    }else{
      logs.push(log);
    }
    save(STORAGE_KEY_LOGS, logs);
    alert('已保存');
    renderHistory();
    renderStats();
  }

  saveBtn.addEventListener('click', saveLog);

  // 产品库逻辑
  const pnameInput = document.getElementById('pnameInput');
  const ptypeSelect = document.getElementById('ptypeSelect');
  const puseSelect = document.getElementById('puseSelect');
  const addProductBtn = document.getElementById('addProductBtn');
  const productList = document.getElementById('productList');

  function renderProducts(){
    productList.innerHTML = '';
    if(!products.length){
      const p = document.createElement('div');
      p.className = 'stat-sub';
      p.textContent = '暂无产品，请先添加。';
      productList.appendChild(p);
      renderProductSuggest();
      return;
    }
    products.forEach((p,idx)=>{
      const div = document.createElement('div');
      div.className = 'pitem';
      const left = document.createElement('div');
      left.innerHTML = `<div>${p.name}</div><span class="sub">${p.type || '未分类'} ｜ ${p.use==='am'?'早用':p.use==='pm'?'晚用':'早晚皆可'}</span>`;
      const del = document.createElement('button');
      del.className = 'btn-text';
      del.textContent = '删除';
      del.addEventListener('click', ()=>{
        if(!confirm('删除该产品？')) return;
        products.splice(idx,1);
        save(STORAGE_KEY_PRODUCTS, products);
        renderProducts();
        renderProductSuggest();
        renderStats();
      });
      div.appendChild(left);
      div.appendChild(del);
      productList.appendChild(div);
    });
    renderProductSuggest();
  }

  addProductBtn.addEventListener('click', ()=>{
    const name = (pnameInput.value || '').trim();
    if(!name){
      alert('请填写产品名');
      return;
    }
    const type = ptypeSelect.value || '其他';
    const use = puseSelect.value || 'all';
    // 去重(按名称)
    const exist = products.find(p=>p.name===name);
    if(exist){
      exist.type = type;
      exist.use = use;
    }else{
      products.push({name, type, use});
    }
    save(STORAGE_KEY_PRODUCTS, products);
    pnameInput.value = '';
    renderProducts();
    renderProductSuggest();
    alert('已保存到产品库');
  });

  // 历史
  const historyList = document.getElementById('historyList');

  function renderHistory(){
    historyList.innerHTML = '';
    if(!logs.length){
      const p = document.createElement('div');
      p.className = 'stat-sub';
      p.textContent = '暂无记录。';
      historyList.appendChild(p);
      return;
    }
    const sorted = [...logs].sort((a,b)=>{
      if(a.date === b.date){
        return (a.time||'am') > (b.time||'am') ? -1:1;
      }
      return a.date > b.date ? -1 : 1;
    });
    sorted.forEach(log=>{
      const div = document.createElement('div');
      div.className = 'hitem';
      const head = document.createElement('div');
      head.className = 'hitem-header';
      head.innerHTML = `<div>${log.date.replace(/-/g,'-')} ${log.time==='am'?'早':'晚'}</div>`;
      const del = document.createElement('button');
      del.className = 'btn-text';
      del.textContent = '删除';
      del.addEventListener('click', ()=>{
        if(!confirm('删除这条记录？')) return;
        logs = logs.filter(l=>l.id !== log.id);
        save(STORAGE_KEY_LOGS, logs);
        renderHistory();
        renderStats();
      });
      head.appendChild(del);
      div.appendChild(head);

      const pLine = document.createElement('div');
      pLine.className = 'hmeta';
      pLine.textContent = '产品：' + (log.products || '未填写');
      div.appendChild(pLine);

      const fLine = document.createElement('div');
      fLine.className = 'hmeta';
      fLine.textContent = '感受：' + ((log.feeling && log.feeling.length)? log.feeling.join('、'):'未填写');
      div.appendChild(fLine);

      const sLine = document.createElement('div');
      sLine.className = 'hmeta';
      sLine.textContent = '状态：' + ((log.skin && log.skin.length)? log.skin.join('、'):'未填写');
      div.appendChild(sLine);

      if(log.note){
        const nLine = document.createElement('div');
        nLine.textContent = '备注：' + log.note;
        div.appendChild(nLine);
      }

      historyList.appendChild(div);
    });
  }

  // 统计
  const filterBtns = document.querySelectorAll('.filter-btn');
  const statSummary = document.getElementById('statSummary');
  const statByProduct = document.getElementById('statByProduct');
  const statByType = document.getElementById('statByType');

  let currentRange = '30';
  filterBtns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      currentRange = btn.dataset.range;
      filterBtns.forEach(b=>b.classList.toggle('active', b===btn));
      renderStats();
    });
  });

  function inRange(dateStr){
    const [y,m,d] = dateStr.split('-').map(n=>parseInt(n,10));
    const date = new Date(y, m-1, d);
    const now = new Date();

    if(currentRange === '30'){
      const diff = (now - date)/86400000;
      return diff >=0 && diff < 30.0001;
    }
    if(currentRange === 'week'){
      const day = now.getDay() || 7;
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day +1);
      const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate()+6);
      return date >= monday && date <= sunday;
    }
    if(currentRange === 'month'){
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }
    return true;
  }

  function renderStats(){
    const filtered = logs.filter(l=>inRange(l.date));
    const daySet = new Set(filtered.map(l=>l.date));
    const dayCount = daySet.size;
    const total = filtered.length;
    statSummary.textContent = `演示：时间范围内有记录的天数：${dayCount} 天；记录总数：${total} 条。`;

    // 产品统计
    const pCount = {};
    filtered.forEach(l=>{
      if(!l.products) return;
      const arr = l.products.split(/[、,，]/).map(s=>s.trim()).filter(Boolean);
      arr.forEach(name=>{
        if(!pCount[name]) pCount[name]=0;
        pCount[name]++;
      });
    });
    statByProduct.innerHTML = '';
    if(Object.keys(pCount).length === 0){
      statByProduct.innerHTML = '<li>暂无数据</li>';
    }else{
      Object.keys(pCount).sort().forEach(name=>{
        const li = document.createElement('li');
        li.textContent = `${name}：${pCount[name]} 次`;
        statByProduct.appendChild(li);
      });
    }

    // 类型统计
    const typeCount = {};
    filtered.forEach(l=>{
      if(!l.products) return;
      const arr = l.products.split(/[、,，]/).map(s=>s.trim()).filter(Boolean);
      arr.forEach(name=>{
        const p = products.find(pp=>pp.name===name);
        const t = p ? (p.type || '其他') : '其他';
        if(!typeCount[t]) typeCount[t]=0;
        typeCount[t]++;
      });
    });
    statByType.innerHTML = '';
    if(Object.keys(typeCount).length===0){
      statByType.innerHTML = '<li>暂无数据</li>';
    }else{
      Object.keys(typeCount).sort().forEach(t=>{
        const li = document.createElement('li');
        li.textContent = `${t}：${typeCount[t]} 次`;
        statByType.appendChild(li);
      });
    }
  }

  // 初始
  renderProducts();
  renderProductSuggest();
  renderHistory();
  renderStats();

  // PWA / sw
  if('serviceWorker' in navigator){
    window.addEventListener('load', ()=>{
      navigator.serviceWorker.register('./sw.js').catch(()=>{});
    });
  }
})();
