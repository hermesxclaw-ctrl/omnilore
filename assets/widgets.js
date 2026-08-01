// OMNILORE — client widgets v2
(function(){
'use strict';
// tabs — KEEP SCROLL POSITION (no jump to top)
var tabs=document.querySelectorAll('.tab-btn'),panels=document.querySelectorAll('.tab-panel');
for(var i=0;i<tabs.length;i++){tabs[i].onclick=function(){
  for(var j=0;j<tabs.length;j++)tabs[j].classList.remove('active');
  for(var k=0;k<panels.length;k++)panels[k].classList.remove('active');
  this.classList.add('active');
  var p=document.getElementById('tab-'+this.dataset.tab);if(p)p.classList.add('active');
};}
// accordions
var accs=document.querySelectorAll('.acc-head');
for(var a=0;a<accs.length;a++){accs[a].onclick=function(){this.parentElement.classList.toggle('open');};}
// redacted reveal
var reds=document.querySelectorAll('.redacted');
for(var r=0;r<reds.length;r++){reds[r].onclick=function(){this.classList.add('revealed');};
  reds[r].onkeydown=function(e){if(e.key==='Enter'||e.key===' ')this.classList.add('revealed');};}
// signature action: fx + UNSEAL hidden lore
var act=document.querySelector('.sig-action'),fx=document.getElementById('fx'),sealed=document.getElementById('sealed');
if(act&&fx){act.onclick=function(){
  var f=this.dataset.fx||'flash';
  fx.className='fx-layer';void fx.offsetWidth;
  if(f==='shake'){document.body.classList.remove('fx-shake');void document.body.offsetWidth;document.body.classList.add('fx-shake');}
  else{fx.classList.add('fx-'+f);}
  if(sealed&&!sealed.classList.contains('open')){
    setTimeout(function(){sealed.classList.add('open');sealed.scrollIntoView({behavior:'smooth',block:'center'});},450);
    act.textContent=act.dataset.done||'Sealed passage revealed below';act.disabled=true;act.style.opacity='0.55';
  }
};}
// tape player: animate waveform, reveal transcript once
var plays=document.querySelectorAll('.play-btn');
for(var t=0;t<plays.length;t++){plays[t].onclick=function(){
  var entry=this.closest('.tape-entry');if(!entry)return;
  var self=this;
  entry.classList.add('playing');self.classList.add('playing');
  setTimeout(function(){entry.classList.remove('playing');self.classList.remove('playing');entry.classList.add('revealed');},2600);
};}
// oracle: cycle facts
var ob=document.getElementById('oracleBtn'),ot=document.getElementById('oracleText');
if(ob&&ot){
  var facts=[];try{facts=JSON.parse(document.getElementById('oracleData').textContent);}catch(e){}
  var oi=-1;
  ob.onclick=function(){if(!facts.length)return;oi=(oi+1)%facts.length;ot.style.opacity=0;
    setTimeout(function(){ot.textContent=facts[oi];ot.style.opacity=1;},220);};
}
// conf badge tap
var cb=document.querySelector('.conf-badge');
if(cb){cb.onclick=function(){alert(this.getAttribute('title'));};}
})();
