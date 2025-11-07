
(function(){
var LS = { products:'skincare_products_v1', logs:'skincare_logs_v1' };
var FEELINGS = ['保湿','清爽','刺激','出油','闷痘','泛红','稳定'];
var STATES = ['干','油','混合','敏','痘','泛红','稳定'];
function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }
function today(){ return new Date().toISOString().slice(0,10); }
function read(k, fb){ try{ var v = localStorage.getItem(k); if(!v){ return fb; } return JSON.parse(v); }catch(e){ return fb; } }
function write(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function uid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function toast(msg){ var el=$('#toast'); if(!el) return; el.textContent=msg; el.style.opacity=1; setTimeout(function(){ el.style.opacity=0; }, 1200); }

var products = read(LS.products, []);
var logs = read(LS.logs, []);
var isAM = true, selectedProducts=[], selectedFeelings=[], selectedStates=[], photoData=[];

function showTab(name){
  $all('.tab').forEach(function(t){ t.classList.toggle('active', t.getAttribute('data-tab')===name); });
  $all('main section').forEach(function(s){ s.classList.toggle('hide', s.id !== name); });
  if(name==='log') renderLogEditor();
  if(name==='products') renderProducts();
  if(name==='stats') renderStats();
  if(name==='history') renderHistory();
}

function parseHash(){
  var h = location.hash.replace(/^#/,'');
  var params = new URLSearchParams(h);
  if (params.get('tab')) showTab(params.get('tab'));
  if (params.get('am')!==null) setAM(params.get('am')==='1');
  if (params.get('save')==='1') { saveEntry(); location.hash='#tab=log'; }
  if (params.get('add')==='1') { doAddProduct(); location.hash='#tab=products'; }
  if (params.get('clear')==='all') { if(confirm('清空全部历史记录？')){ logs=[]; write(LS.logs, logs); renderHistory(); toast('已清空'); } location.hash='#tab=history'; }
  if (params.get('export')==='csv') { exportCSV(); location.hash='#tab=history'; }
  if (params.get('del')) { var id=params.get('del'); logs=logs.filter(function(x){ return x.id!==id; }); write(LS.logs, logs); renderHistory(); toast('已删除一条'); location.hash='#tab=history'; }
}

window.addEventListener('hashchange', parseHash, false);

function renderLogEditor(){
  var d=$('#date'); if(d) d.value=today();
  selectedProducts=[]; selectedFeelings=[]; selectedStates=[]; photoData=[];
  var chips=$('#productChips'); if(chips){ chips.innerHTML=''; products.forEach(function(p){
    var el=document.createElement('a'); el.href='#'; el.className='btn'; el.style.margin='4px'; el.textContent=p.name;
    el.addEventListener('click', function(e){ e.preventDefault(); var on=toggleSelect(selectedProducts,p.id); el.classList.toggle('primary', on); }, false);
    chips.appendChild(el);
  }); }
  var feel=$('#feelChips'); if(feel){ feel.innerHTML=''; FEELINGS.forEach(function(fv){
    var el=document.createElement('a'); el.href='#'; el.className='btn'; el.style.margin='4px'; el.textContent=fv;
    el.addEventListener('click', function(e){ e.preventDefault(); var on=toggleSelect(selectedFeelings,fv); el.classList.toggle('primary', on); }, false);
    feel.appendChild(el);
  }); }
  var states=$('#stateChips'); if(states){ states.innerHTML=''; STATES.forEach(function(sv){
    var el=document.createElement('a'); el.href='#'; el.className='btn'; el.style.margin='4px'; el.textContent=sv;
    el.addEventListener('click', function(e){ e.preventDefault(); var on=toggleSelect(selectedStates,sv); el.classList.toggle('primary', on); }, false);
    states.appendChild(el);
  }); }
  var photos=$('#photos'); if(photos){
    photos.onchange = function(e){
      var files=Array.prototype.slice.call(e.target.files||[]).slice(0,3-photoData.length);
      files.forEach(function(f){
        var reader=new FileReader();
        reader.onload=function(){ photoData.push(reader.result); var img=document.createElement('img'); img.className='preview'; img.src=reader.result; var pv=$('#previews'); if(pv) pv.appendChild(img); };
        reader.readAsDataURL(f);
      });
      e.target.value='';
    };
  }
}

function saveEntry(){
  var d=$('#date'); var date=d && d.value ? d.value : today();
  var notesEl=$('#notes'); var notes=notesEl ? notesEl.value : '';
  var entry={ id:uid(), date:date, timeOfDay:isAM?'AM':'PM', products:selectedProducts.slice(0), feelings:selectedFeelings.slice(0), skinState:selectedStates.slice(0), notes:notes, photos:photoData.slice(0) };
  logs.unshift(entry); write(LS.logs, logs); toast('已保存'); renderLogEditor();
}

function toggleSelect(arr,val){ var i=arr.indexOf(val); if(i>=0){arr.splice(i,1); return false;} else {arr.push(val); return true;} }
function setAM(v){
  isAM=v;
  var am=$('#amBtn'), pm=$('#pmBtn');
  if(am&&pm){ 
    if(v){ am.classList.add('on'); am.classList.remove('off'); pm.classList.add('off'); pm.classList.remove('on'); }
    else { pm.classList.add('on'); pm.classList.remove('off'); am.classList.add('off'); am.classList.remove('on'); }
  }
}

function renderProducts(){
  var list=$('#plist'); if(!list) return; list.innerHTML='';
  var grouped={}; products.forEach(function(p){ (grouped[p.category]||(grouped[p.category]=[])).push(p); });
  var cats=Object.keys(grouped);
  if (cats.length===0){ var empty=document.createElement('div'); empty.className='muted'; empty.textContent='（暂无产品）'; list.appendChild(empty); }
  cats.forEach(function(cat){
    var wrap=document.createElement('div'); var title=document.createElement('div'); title.className='muted'; title.textContent=cat; wrap.appendChild(title);
    grouped[cat].forEach(function(p){
      var row=document.createElement('div'); row.className='list item'; row.style.margin='6px 0';
      var delId='del_'+p.id;
      row.innerHTML='<div style="display:flex; justify-content:space-between; align-items:center;"><div>'+p.name+'</div><a id="'+delId+'" class="btn" href="#del='+p.id+'">删除</a></div>';
      wrap.appendChild(row);
      setTimeout(function(){ var delBtn=document.getElementById(delId); if(delBtn){ delBtn.addEventListener('click', function(e){ e.preventDefault(); products=products.filter(function(x){ return x.id!==p.id; }); write(LS.products, products); renderProducts(); }, false); } },0);
    });
    list.appendChild(wrap);
  });
}

function mapProducts(){ var m={}; products.forEach(function(p){ m[p.id]=p; }); return m; }

function renderHistory(){
  var wrap=$('#hlist'); if(!wrap) return; wrap.innerHTML='';
  if (!logs || logs.length===0){ wrap.innerHTML='<div class="muted">（暂无记录，先到“记录”页保存一条）</div>'; return; }
  var pm = mapProducts();
  logs.forEach(function(l){
    var details=document.createElement('details'); details.className='item';
    var summary=document.createElement('summary'); summary.className='item-head';
    summary.innerHTML='<div><b>'+l.date+'</b> · '+(l.timeOfDay||'')+'</div><a class="btn" href="#del='+l.id+'">删除</a>';
    details.appendChild(summary);

    var info=document.createElement('div'); info.style.marginTop='8px';
    var names=(l.products||[]).map(function(pid){ var p=pm[pid]; return p ? p.name : '(已删除)'; });
    var feels=(l.feelings||[]).join('、');
    var states=(l.skinState||[]).join('、');
    var notes=l.notes||'';

    var chips=document.createElement('div'); chips.className='kv';
    if(names.length){ var s=document.createElement('span'); s.className='badge'; s.textContent='产品：'+names.join('、'); chips.appendChild(s); }
    if(feels){ var s2=document.createElement('span'); s2.className='badge'; s2.textContent='感受：'+feels; chips.appendChild(s2); }
    if(states){ var s3=document.createElement('span'); s3.className='badge'; s3.textContent='皮肤：'+states; chips.appendChild(s3); }
    info.appendChild(chips);

    if(notes){ var nt=document.createElement('div'); nt.style.marginTop='6px'; nt.textContent=notes; info.appendChild(nt); }

    if((l.photos||[]).length){ var pv=document.createElement('div'); pv.style.marginTop='8px'; (l.photos||[]).forEach(function(src){ var im=document.createElement('img'); im.className='preview'; im.src=src; pv.appendChild(im); }); info.appendChild(pv); }

    details.appendChild(info);
    wrap.appendChild(details);
  });
}

function exportCSV(){
  var pm=mapProducts();
  var rows=[['日期','早/晚','使用产品','使用感受','皮肤状态','备注','照片数量']];
  logs.forEach(function(l){
    var names=(l.products||[]).map(function(pid){ var p=pm[pid]; return p ? p.name : '(已删除)'; }).join('|');
    var feelings=(l.feelings||[]).join('|');
    var states=(l.skinState||[]).join('|');
    var note=(l.notes||'').replace(/\n/g,' ').replace(/\r/g,' ');
    rows.push([l.date, l.timeOfDay, names, feelings, states, note, (l.photos||[]).length]);
  });
  var csv=''; rows.forEach(function(r){ csv += r.map(function(s){ s=String(s||''); if(/[,"\n]/.test(s)){ s='"'+s.replace(/"/g,'""')+'"'; } return s; }).join(',') + '\n'; });
  var blob=new Blob([csv], {type:'text/csv;charset=utf-8;'});
  var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='skincare-logs.csv'; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },0);
}

function doAddProduct(){
  var nameEl=document.getElementById('pname');
  var catEl=document.getElementById('pcat');
  var name = nameEl && nameEl.value ? nameEl.value.trim() : '';
  var cat = catEl && catEl.value ? catEl.value : '其他';
  if (!name) { toast('请输入产品名称'); return; }
  products.unshift({ id: uid(), name: name, category: cat });
  write(LS.products, products);
  if (nameEl) nameEl.value='';
  renderProducts();
  toast('已添加到产品库');
}

function renderStats(){
  var map={}, i;
  products.forEach(function(p){ map[p.id] = {name:p.name, category:p.category}; });
  var mask=0;
  logs.forEach(function(l){
    (l.products||[]).forEach(function(pid){ var info=map[pid]; if(info && info.category==='面膜'){ mask++; } });
  });
  var mc = document.getElementById('maskCount'); if(mc) mc.textContent = mask + ' 次';

  var now = new Date();
  var d30 = new Date(now.getTime() - 29*24*3600*1000);
  function parseDate(s){ try{ return new Date(s+'T00:00:00'); }catch(e){ return new Date(0);} }
  var counter={};
  logs.forEach(function(l){
    var dt = parseDate(l.date);
    if(dt >= d30){
      (l.products||[]).forEach(function(pid){ counter[pid] = (counter[pid]||0) + 1; });
    }
  });
  var items=Object.keys(counter).map(function(pid){ return {pid:pid,n:counter[pid]}; }).sort(function(a,b){ return b.n-a.n; }).slice(0,10);
  var list=document.getElementById('topUsage');
  if(list){
    list.innerHTML='';
    if(items.length===0){ list.innerHTML='<div class="muted">近30天暂无数据</div>'; }
    items.forEach(function(it){ var inf=map[it.pid]||{name:'(已删除)'}; var li=document.createElement('li'); li.textContent=inf.name+' · '+it.n+' 次'; list.appendChild(li); });
  }
}

document.addEventListener('DOMContentLoaded', function(){
  var d=document.getElementById('date'); if(d) d.value=today();
  if(!location.hash){ showTab('log'); } else { parseHash(); }
  renderLogEditor(); renderProducts();
}, false);

})();