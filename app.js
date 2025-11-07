document.addEventListener('DOMContentLoaded', ()=>{
  const statsBtns=document.querySelectorAll('.stats-filter button');
  statsBtns.forEach(b=>b.addEventListener('click',()=>{statsBtns.forEach(x=>x.classList.remove('active'));b.classList.add('active');}));
  document.getElementById('statsSummary').textContent='演示：时间范围内有记录的天数：1 天；记录总数：2 条。';
  const list=document.getElementById('statsList');
  list.innerHTML='<div>HBN：1次</div><div>阿芙面膜：1次</div>';
  const tlist=document.getElementById('typeStatsList');
  tlist.innerHTML='<div>精华：1次</div><div>面膜：1次</div>';
});