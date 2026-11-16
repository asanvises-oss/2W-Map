/* Michelin tire shop guide. Data: data.js (DATA). Map: MapLibre GL + OpenFreeMap tiles. */
const TIERS=[['4.5 ขึ้นไป','#0f7b6c','--t1'],['4.0–4.4','#c98f00','--t2'],['ต่ำกว่า 4.0','#d4582a','--t3'],['ยังไม่มีรีวิว','#8b97a3','--t4']];
const S=DATA.shops.map(a=>({name:a[0],ty:a[1],di:a[2],lat:a[3],lng:a[4],r:a[5],v:a[6],w:a[7],t:a[8],tc:a[11],id:a[12],ph:a[13],sd:a[14],net:a[15]}));
const $=id=>document.getElementById(id);
const fmt=n=>n.toLocaleString('en-US');
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const vol=s=>s.v>=30?0:(s.v>0?1:2);
const VOLS=['รีวิวเยอะ (30+)','รีวิวปานกลาง (1–29)','ยังไม่มีรีวิว'];
S.forEach(s=>{s.icon=vol(s)===0?'star-'+s.t:vol(s)===1?'dot-'+s.t:'ring';});
const HASNET=S.some(s=>s.net);
const st={tier:-1,dist:'',typ:'',q:'',tc:false,many:false,net:false,view:false,sel:null,shown:60};
$('meta').textContent=`${DATA.districts.length} เขต · ข้อมูลคะแนนและรีวิวจาก Google Maps`;
$('tot').textContent=fmt(S.length);
$('dist').innerHTML='<option value="">ทุกเขต</option>'+DATA.districts.map((d,i)=>`<option value="${i}">${d} (${S.filter(s=>s.di===i).length})</option>`).join('');
$('typ').innerHTML='<option value="">ทุกประเภทร้าน</option>'+DATA.types.map((d,i)=>`<option value="${i}">${d}</option>`).join('');
if(HASNET)$('cNet').style.display='';

// ---- map ----
const params=new URLSearchParams(location.search);
const BLANK={version:8,sources:{},layers:[{id:'bg',type:'background',paint:{'background-color':'#e7ebe6'}}]};
const map=new maplibregl.Map({
  container:'map',
  style:params.get('basemap')==='none'?BLANK:'https://tiles.openfreemap.org/styles/liberty',
  bounds:[[100.33,13.49],[100.95,13.96]],fitBoundsOptions:{padding:30},
  attributionControl:{compact:true},
  maxBounds:[[99.6,13.0],[101.6,14.5]]
});
map.addControl(new maplibregl.NavigationControl({showCompass:false}),'bottom-right');
const BKK=[[100.33,13.49],[100.95,13.96]];

function mkIcon(kind,color){
  const px=2,sz=(kind==='star'?34:26)*px,c=document.createElement('canvas');c.width=c.height=sz;const g=c.getContext('2d'),m=sz/2;
  g.lineJoin='round';
  if(kind==='star'){const R=m-3*px;g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?R*.5:R;g.lineTo(m+r*Math.cos(a),m+r*Math.sin(a));}g.closePath();g.fillStyle=color;g.fill();g.lineWidth=2*px;g.strokeStyle='#fff';g.stroke();g.fill();}
  else if(kind==='dot'){g.beginPath();g.arc(m,m,5.5*px,0,7);g.fillStyle=color;g.fill();g.lineWidth=2*px;g.strokeStyle='#fff';g.stroke();g.fill();}
  else{g.beginPath();g.arc(m,m,5*px,0,7);g.fillStyle='rgba(255,255,255,.85)';g.fill();g.lineWidth=2*px;g.strokeStyle=color;g.stroke();}
  return {width:sz,height:sz,data:g.getImageData(0,0,sz,sz).data};
}
function fc(list){return {type:'FeatureCollection',features:list.map(s=>({type:'Feature',geometry:{type:'Point',coordinates:[s.lng,s.lat]},properties:{id:s.id,icon:s.icon,net:s.net?1:0,star:vol(s)===0?1:0}}))};}
const byId=new Map(S.map(s=>[s.id,s]));
let popup=null;
map.on('load',()=>{
  for(let t=0;t<3;t++){map.addImage('star-'+t,mkIcon('star',TIERS[t][1]),{pixelRatio:2});map.addImage('dot-'+t,mkIcon('dot',TIERS[t][1]),{pixelRatio:2});}
  map.addImage('ring',mkIcon('ring',TIERS[3][1]),{pixelRatio:2});
  map.addSource('shops',{type:'geojson',data:fc(S.filter(s=>pass(s,true))),cluster:true,clusterRadius:48,clusterMaxZoom:14,clusterProperties:{net:['+',['get','net']]}});
  map.addLayer({id:'clusters',type:'circle',source:'shops',filter:['has','point_count'],paint:{
    'circle-color':'#1f4fa3',
    'circle-radius':['step',['get','point_count'],14,10,18,50,22,100,26],
    'circle-stroke-width':['case',['>',['get','net'],0],3,6],
    'circle-stroke-color':['case',['>',['get','net'],0],'#ffd21f','rgba(31,79,163,.25)']}});
  if(map.getStyle().glyphs)map.addLayer({id:'cluster-count',type:'symbol',source:'shops',filter:['has','point_count'],
    layout:{'text-field':['get','point_count_abbreviated'],'text-font':['Noto Sans Bold'],'text-size':13,'text-allow-overlap':true},paint:{'text-color':'#ffffff'}});
  map.addLayer({id:'net-ring',type:'circle',source:'shops',filter:['all',['!',['has','point_count']],['==',['get','net'],1]],paint:{
    'circle-radius':['case',['==',['get','star'],1],14,11],'circle-color':'rgba(0,0,0,0)','circle-stroke-width':3,'circle-stroke-color':'#1f4fa3'}});
  map.addLayer({id:'points',type:'symbol',source:'shops',filter:['!',['has','point_count']],layout:{'icon-image':['get','icon'],'icon-allow-overlap':true,'icon-size':1}});
  map.addLayer({id:'sel',type:'circle',source:'shops',filter:['==',['get','id'],''],paint:{'circle-radius':17,'circle-color':'rgba(0,0,0,0)','circle-stroke-width':3,'circle-stroke-color':'#1d2433'}});
  map.on('click','clusters',e=>{const f=map.queryRenderedFeatures(e.point,{layers:['clusters']})[0];
    map.getSource('shops').getClusterExpansionZoom(f.properties.cluster_id).then(z=>map.easeTo({center:f.geometry.coordinates,zoom:z+.5}));});
  map.on('click','points',e=>{const s=byId.get(e.features[0].properties.id);if(s)select(s,false);});
  for(const l of ['clusters','points'])map.on('mouseenter',l,e=>{map.getCanvas().style.cursor='pointer';
    if(l==='points'){const s=byId.get(e.features[0].properties.id);if(!s)return;
      popup=new maplibregl.Popup({closeButton:false,offset:14}).setLngLat(e.features[0].geometry.coordinates)
        .setHTML(`<b>${esc(s.name)}</b><br>${s.v?`★ ${s.r.toFixed(1)} (${fmt(s.v)} รีวิว)`:'ยังไม่มีรีวิว'}${s.net?'<br><b style="color:#1f4fa3">เครือข่ายมิชลิน</b>':''}`).addTo(map);}});
  for(const l of ['clusters','points'])map.on('mouseleave',l,()=>{map.getCanvas().style.cursor='';if(popup){popup.remove();popup=null;}});
  mapReady=true;renderList();
});
let mapReady=false;
map.on('moveend',()=>{if(st.view)renderList();});
map.on('error',e=>{if(e&&e.error&&/tiles|style|glyph/i.test(String(e.error.message||'')))console.warn('basemap:',e.error.message);});

// ---- filtering ----
function pass(s,ignoreView){
  if(s.tc&&!st.tc)return false;
  if(st.tier>=0&&s.t!==st.tier)return false;
  if(st.dist!==''&&s.di!==+st.dist)return false;
  if(st.typ!==''&&s.ty!==+st.typ)return false;
  if(st.many&&vol(s)!==0)return false;
  if(st.net&&!s.net)return false;
  if(st.q&&!s.name.toLowerCase().includes(st.q.toLowerCase()))return false;
  if(st.view&&!ignoreView&&mapReady&&!map.getBounds().contains([s.lng,s.lat]))return false;
  return true;
}
function pushData(){if(mapReady)map.getSource('shops').setData(fc(S.filter(s=>pass(s,true))));}

// ---- list ----
function renderList(){
  const arr=S.filter(s=>pass(s)).sort((a,b)=>(b.v>0)-(a.v>0)||b.w-a.w||b.v-a.v);
  const nr=arr.filter(s=>!s.v).length;
  let last=null,lr=0;arr.forEach((s,i)=>{if(!s.v){s.rk=null;return;}const key=s.w.toFixed(2);if(key!==last){lr=i+1;last=key;}s.rk=lr;});
  $('rt').textContent='เรียงตามคะแนนถ่วงน้ำหนักจำนวนรีวิว';
  $('rs').textContent=nr?`ยังไม่มีรีวิว ${fmt(nr)} ร้าน อยู่ท้ายลิสต์`:`${fmt(arr.length)} ร้าน`;
  const sh=arr.slice(0,st.shown);
  $('list').innerHTML=sh.map((s,i)=>`<li class="item${s.net?' net':''}${st.sel===s?' sel':''}" data-i="${i}" tabindex="0">
    <div class="rk${s.rk&&s.rk<=3?' top':''}">${s.rk||'–'}</div>
    <div><div class="nm">${esc(s.name)}</div><div class="loc">${DATA.districts[s.di]} · ${s.v?fmt(s.v)+' รีวิว':'ยังไม่มีรีวิว'}</div>
      <div class="tags"><span class="tag">${DATA.types[s.ty]}</span>${s.net?'<span class="tag n">เครือข่ายมิชลิน</span>':''}${s.tc?'<span class="tag w">ปิดชั่วคราว</span>':''}${vol(s)===0?'<span class="tag">★ รีวิวเยอะ</span>':''}</div></div>
    <div class="score s${s.t}">${s.v?s.w.toFixed(2):'–'}<small>${s.v?'★ Google '+s.r.toFixed(1):'ยังไม่มีคะแนน'}</small></div>
    ${st.sel===s?`<div class="more">${esc(s.sd||'')}${s.ph?`<br>โทร ${esc(s.ph)}`:''}<br><a href="https://www.google.com/maps/place/?q=place_id:${s.id}" target="_blank" rel="noopener">เปิดใน Google Maps</a></div>`:''}
  </li>`).join('')+(arr.length>st.shown?`<li><button class="btn" style="width:100%" id="more">แสดงเพิ่ม (อีก ${fmt(arr.length-st.shown)} ร้าน)</button></li>`:'')||'<li class="loc" style="padding:16px">ไม่มีร้านตามตัวกรองนี้</li>';
  [...$('list').querySelectorAll('.item')].forEach(li=>{const s=sh[li.dataset.i];li.onclick=()=>select(s,true);li.onkeydown=e=>{if(e.key==='Enter')select(s,true)};});
  const m=$('more');if(m)m.onclick=()=>{st.shown+=60;renderList();};
}
function select(s,pan){
  st.sel=(st.sel===s&&pan)?null:s;
  if(mapReady)map.setFilter('sel',['==',['get','id'],st.sel?st.sel.id:'']);
  if(pan&&st.sel)map.flyTo({center:[s.lng,s.lat],zoom:Math.max(map.getZoom(),15.5)});
  renderList();
  if(!pan){const el=$('list').querySelector('.item.sel');if(el)el.scrollIntoView({block:'nearest'});}
}
function fitDistrict(){
  const a=S.filter(s=>s.di===+st.dist);if(!a.length)return;
  const xs=a.map(s=>s.lng),ys=a.map(s=>s.lat);
  map.fitBounds([[Math.min(...xs),Math.min(...ys)],[Math.max(...xs),Math.max(...ys)]],{padding:60,maxZoom:15});
}
function legend(){
  $('legend').innerHTML='<b>รูปร่าง = จำนวนรีวิว</b> · '+VOLS.map((v,i)=>`<span style="white-space:nowrap">${i===0?'★':i===1?'●':'○'} ${v} ${fmt(S.filter(s=>vol(s)===i).length)}</span>`).join(' &nbsp; ')+'<br><b>สี = ระดับคะแนน</b> · '+TIERS.map(t=>`<span style="white-space:nowrap"><span style="color:${t[1]}">●</span> ${t[0]}</span>`).join(' &nbsp; ')+(HASNET?` &nbsp; <span style="color:var(--net);font-weight:700">◯ วงแหวนน้ำเงิน</span> = เครือข่ายมิชลิน ${fmt(S.filter(s=>s.net).length)}`:'');
}
function upd(){st.shown=60;pushData();renderList();}

// ---- controls ----
$('dist').onchange=e=>{st.dist=e.target.value;st.sel=null;upd();if(st.dist!=='')fitDistrict();else map.fitBounds(BKK,{padding:30});};
$('typ').onchange=e=>{st.typ=e.target.value;upd();};
$('q').oninput=e=>{st.q=e.target.value.trim();upd();};
document.querySelectorAll('.chip[data-t]').forEach(b=>b.onclick=()=>{st.tier=+b.dataset.t;document.querySelectorAll('.chip[data-t]').forEach(x=>x.setAttribute('aria-pressed',x===b));upd();});
const tog=(id,key)=>{$(id).onclick=()=>{st[key]=!st[key];$(id).setAttribute('aria-pressed',st[key]);upd();};};
tog('cMany','many');tog('cNet','net');tog('cTc','tc');
$('cView').onclick=()=>{st.view=!st.view;$('cView').setAttribute('aria-pressed',st.view);renderList();};
$('near').onclick=()=>{
  if(!navigator.geolocation){alert('เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง');return;}
  navigator.geolocation.getCurrentPosition(p=>{map.flyTo({center:[p.coords.longitude,p.coords.latitude],zoom:14});},()=>alert('ไม่สามารถระบุตำแหน่งได้ กรุณาอนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์'));
};

// ---- summary tab ----
function summary(){
  const tot=S.length;
  const types=DATA.types.map((t,i)=>[t,S.filter(s=>s.ty===i).length]).sort((a,b)=>b[1]-a[1]);
  const tiers=TIERS.map((t,i)=>[t[0],S.filter(s=>s.t===i).length,t[2]]);
  const rated=S.filter(s=>s.v>0);
  const topd=DATA.districts.map((d,i)=>[d,S.filter(s=>s.di===i).length]).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const row=(l,v,m,c)=>`<div class="bar"><span>${l}</span><span class="tr"><span class="fl" style="width:${v/m*100}%;background:${c}"></span></span><span class="v">${fmt(v)}</span></div>`;
  $('sum').innerHTML=`<div class="grid">
  <div class="card"><h2>ร้านที่เปลี่ยนยางมอเตอร์ไซค์ได้ในกรุงเทพฯ</h2><div class="big">${fmt(tot)}</div><div class="loc">ร้านใน ${DATA.districts.length} เขต ไม่นับร้านปิดถาวร ร้านนอกกรุงเทพฯ และตัวแทนจำหน่าย</div>
    <div class="foot">มีรีวิวบน Google ${fmt(rated.length)} ร้าน (${Math.round(rated.length/tot*100)}%) ยังไม่มีรีวิว ${fmt(tot-rated.length)} ร้าน</div></div>
  <div class="card"><h2>แยกตามประเภทร้าน</h2>${types.map(t=>row(t[0],t[1],types[0][1],'var(--blue)')).join('')}</div>
  <div class="card"><h2>แยกตามระดับคะแนน Google</h2>${tiers.map(t=>row(t[0],t[1],Math.max(...tiers.map(x=>x[1])),`var(${t[2]})`)).join('')}</div>
  <div class="card"><h2>10 เขตที่มีร้านมากที่สุด</h2>${topd.map(t=>row(t[0],t[1],topd[0][1],'var(--blue)')).join('')}</div></div>`;
}
function show(on){
  $('tabMap').setAttribute('aria-selected',on);$('tabSum').setAttribute('aria-selected',!on);
  $('filters').style.display=on?'':'none';$('mapwrap').style.display=$('right').style.display=on?'':'none';
  $('sum').style.display=on?'none':'block';$('main').style.gridTemplateColumns=on?'':'1fr';
  if(on)map.resize();
}
$('tabMap').onclick=()=>show(true);$('tabSum').onclick=()=>show(false);
summary();legend();renderList();
