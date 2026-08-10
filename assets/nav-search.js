/* Omnilore nav-search — works from any depth (/, /entity/, /wings/) */
(function(){
  var q=document.getElementById('q'),dd=document.getElementById('dd');
  if(!q||!dd) return;
  // wait for index if not yet loaded
  function getIDX(){ return window.OMNILORE_INDEX||[]; }
  function skel(s){return s.toLowerCase().normalize('NFD').replace(/[^a-z]/g,'').replace(/[aeiou]/g,'').split('').filter(function(c,i,a){return c!==a[i-1]}).join('');}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  // prefix for entity links depending on current depth
  var path=location.pathname.replace(/\\/g,'/');
  var prefix='entity/';
  if(path.indexOf('/entity/')!==-1) prefix='';
  else if(path.indexOf('/wings/')!==-1) prefix='../entity/';
  else if(path.indexOf('/assets/')!==-1) prefix='../entity/';
  // also handle file:// with backslashes
  var sel=-1,lastTop=null;
  function scoreNav(e,qn,qs){
    var n=(e.n||'').toLowerCase(),qnN=qn.toLowerCase();
    if(n===qnN) return 0;
    if(n.indexOf(qnN)===0) return 0.5;
    if(n.indexOf(qnN)>=0) return 1;
    var aa=e.a||[];
    for(var i=0;i<aa.length;i++){var an=String(aa[i]).toLowerCase(); if(an===qnN) return 1.2; if(an.indexOf(qnN)>=0) return 1.6;}
    var c=(e.c||'').toLowerCase(); if(c.indexOf(qnN)>=0) return 1.8;
    var epit=(e.e||'').toLowerCase(); if(epit.indexOf(qnN)>=0) return 2;
    // fuzzy skeleton
    if(qs.length>2 && skel(e.n).indexOf(qs)>=0) return 4;
    return 99;
  }
  q.addEventListener('input',function(){
    var raw=q.value.trim();
    if(raw.length<2){dd.className=''; sel=-1; lastTop=null; return;}
    var IDX=getIDX();
    if(!IDX.length){dd.innerHTML='<a>Archive loading…</a>'; dd.className='on'; return;}
    var qn=raw.toLowerCase(), qs=skel(qn), scored=[];
    for(var i=0;i<IDX.length;i++){
      var e=IDX[i];
      var sc=scoreNav(e,qn,qs);
      if(sc<99){
        var via=null;
        if((e.n||'').toLowerCase().indexOf(qn)<0){
          for(var a=0;a<(e.a||[]).length;a++) if(String(e.a[a]).toLowerCase().indexOf(qn)>=0){via=e.a[a]; break;}
          if(!via && sc>=4) via='close match';
        }
        scored.push({e:e,via:via,score:sc});
        if(scored.length>200) break;
      }
    }
    scored.sort(function(a,b){return a.score-b.score || a.e.n.localeCompare(b.e.n);});
    var out=scored.slice(0,9);
    lastTop=out[0]?out[0].e:null;
    sel=-1;
    dd.innerHTML=out.map(function(o,idx){
      return '<a href="'+prefix+esc(o.e.s)+'.html" data-idx="'+idx+'">'+esc(o.e.n)+(o.via?' <span class="via">← '+esc(o.via)+'</span>':'')+'<small>'+esc(o.e.c||o.e.k||'')+'</small></a>';
    }).join('')||'<a>No matches in the Archive…</a>';
    dd.className='on';
    if(window.Omnilore && Omnilore.bus) Omnilore.bus.emit('search',{q:raw,results:out.length});
  });
  q.addEventListener('keydown',function(ev){
    var links=dd.querySelectorAll("a[href]");
    if(ev.key==="ArrowDown"){ev.preventDefault(); sel=Math.min(sel+1, links.length-1); for(var i=0;i<links.length;i++) links[i].classList.toggle('sel', i===sel); if(sel>=0) links[sel].scrollIntoView({block:'nearest'});}
    else if(ev.key==="ArrowUp"){ev.preventDefault(); sel=Math.max(sel-1,-1); for(var j=0;j<links.length;j++) links[j].classList.toggle('sel', j===sel); if(sel>=0) links[sel].scrollIntoView({block:'nearest'});}
    else if(ev.key==="Enter"){
      if(sel>=0 && links[sel] && links[sel].getAttribute('href') && links[sel].getAttribute('href').indexOf('.html')!==-1){ev.preventDefault(); location.href=links[sel].getAttribute('href');}
      else if(lastTop){ev.preventDefault(); location.href=prefix+lastTop.s+'.html';}
    }
    else if(ev.key==="Escape"){dd.className=''; sel=-1;}
  });
  document.addEventListener('click',function(ev){ if(!dd.contains(ev.target) && ev.target!==q) {dd.className=''; sel=-1;}});
})();
