document.addEventListener('DOMContentLoaded',()=>{
  const statsSummary=document.getElementById('statsSummary');
  const list1=document.getElementById('statsByProduct');
  const list2=document.getElementById('statsByType');
  statsSummary.textContent='演示：时间范围内有记录的天数：1 天；记录总数：2 条。';
  list1.innerHTML='<li>HBN：1次</li><li>阿芙面膜：1次</li>';
  list2.innerHTML='<li>精华：1次</li><li>面膜：1次</li>';
});