
// skincare-app / app.js v3.2.4
const STORAGE_KEY = 'skincare_logs_v1';

function loadLogs(){try{const raw=localStorage.getItem(STORAGE_KEY);return raw?JSON.parse(raw):[]}catch(e){return[];}}
function saveLogs(logs){localStorage.setItem(STORAGE_KEY,JSON.stringify(logs));}
function showToast(msg){alert(msg);}

const dateInput=document.getElementById('date');
const amBtn=document.getElementById('amBtn');
const pmBtn=document.getElementById('pmBtn');
const productsInput=document.getElementById('products');
const feelingInput=document.getElementById('feeling');
const skinInput=document.getElementById('skin');
const noteInput=document.getElementById('note');
const saveBtn=document.getElementById('saveBtn');
const tabButtons=document.querySelectorAll('#tabs .tab');
const productList=document.getElementById('productList');
const pname=document.getElementById('pname');
const puse=document.getElementById('puse');
const addProductBtn=document.getElementById('addProductBtn');

let currentPeriod='AM';

if(amBtn&&pmBtn){
  amBtn.addEventListener('click',()=>setPeriod('AM'));
  pmBtn.addEventListener('click',()=>setPeriod('PM'));
}

function setPeriod(p){
  currentPeriod=p;
  amBtn.classList.toggle('active',p==='AM');
  pmBtn.classList.toggle('active',p==='PM');
}

if(dateInput){const d=new Date();dateInput.value=d.toISOString().slice(0,10);}

function handleSave(){
  const date=dateInput.value;
  if(!date)return showToast('请选择日期');
  const logs=loadLogs();
  logs.push({date,period:currentPeriod,products:productsInput.value,feeling:feelingInput.value,skin:skinInput.value,note:noteInput.value,ts:Date.now()});
  saveLogs(logs);
  showToast('已保存');
}

if(saveBtn)saveBtn.addEventListener('click',handleSave);

tabButtons.forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab||'log')));

function showTab(id){
  document.querySelectorAll('main section').forEach(s=>s.classList.toggle('hide',s.id!==id));
  tabButtons.forEach(b=>b.classList.toggle('active',b.dataset.tab===id));
  if(id==='products')renderProducts();
}

function renderProducts(){
  const logs=loadLogs();
  const names=[];
  logs.forEach(l=>{if(l.products)names.push(...l.products.split(/[ ,，;]/).map(x=>x.trim()).filter(Boolean));});
  const map={};
  names.forEach(n=>map[n]=(map[n]||0)+1);
  const list=Object.entries(map).map(([n,c])=>`<li>${n} (${c}次)</li>`).join('');
  productList.innerHTML=list||'<p>暂无数据。</p>';
}

if(addProductBtn)addProductBtn.addEventListener('click',()=>{
  const name=pname.value.trim();
  if(!name)return showToast('请输入产品名');
  const use=puse.value;
  const custom=JSON.parse(localStorage.getItem('customProducts')||'[]');
  custom.push({name,use});
  localStorage.setItem('customProducts',JSON.stringify(custom));
  pname.value='';
  showToast('已添加');
  renderProducts();
});
