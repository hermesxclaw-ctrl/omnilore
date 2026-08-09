/* Omnilore search worker: fuzzy maxed — exact > prefix > token > alias > lev ≤2 > skeleton. Keeps 25k filtering off UI. */
self.window=self;
importScripts('search-index.js');
var IDX=(self.OMNILORE_INDEX||[]).slice().sort(function(a,b){if(a._finished&&!b._finished)return -1;if(!a._finished&&b._finished)return 1;return a.n.localeCompare(b.n);});
function norm(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').trim().replace(/\s+/g,' ');}
function skel(v){return v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,'').replace(/[aeiou]/g,'').split('').filter(function(c,i,a){return c!==a[i-1]}).join('');}
function scpNum(n){var m=/SCP-(\d+)/i.exec(n);return m?parseInt(m[1],10):999999;}
function lev(a,b){if(a===b)return 0;var al=a.length,bl=b.length;if(!al)return bl;if(!bl)return al;if(al>bl){var t=a;a=b;b=t;al=a.length;bl=b.length;}var prev=[],cur=[],i,j,ca,cb,cost;for(i=0;i<=al;i++)prev[i]=i;for(j=1;j<=bl;j++){cur[0]=j;cb=b.charAt(j-1);for(i=1;i<=al;i++){ca=a.charAt(i-1);cost=ca===cb?0:1;cur[i]=Math.min(prev[i]+1,cur[i-1]+1,prev[i-1]+cost);if(i>1&&j>1&&a.charAt(i-2)===cb&&ca===b.charAt(j-2))cur[i]=Math.min(cur[i],prev[i-2]+cost);}var tmp=prev;prev=cur;cur=tmp;}return prev[al];}
function compact(e){return {s:e.s,n:e.n,d:e.d,c:e.c,k:e.k,e:e.e,_finished:e._finished};}
function scoreEntity(e,q,qs,qTokens){
  var n=norm(e.n), qn=norm(q), sk=skel(qn);
  // 0 exact name, 1 prefix, 2 substring, 3 alias exact/prefix/sub, 4 token-all, 5 lev≤2, 6 skeleton
  if(n===qn) return 0;
  if(n.indexOf(qn)===0) return 1;
  if(n.indexOf(qn)>=0) return 2;
  // aliases
  var aa=e.a||[];
  for(var ai=0;ai<aa.length;ai++){var an=norm(aa[ai]); if(an===qn) return 3; if(an.indexOf(qn)===0) return 3.2; if(an.indexOf(qn)>=0) return 3.5;}
  // culture / epithet / designation substring
  if(norm(e.c||'').indexOf(qn)>=0) return 2.5;
  if(norm(e.e||'').indexOf(qn)>=0) return 3.7;
  if(norm(e.d||'').indexOf(qn)>=0) return 3.7;
  // token-all: every query token appears somewhere in n+aliases
  if(qTokens.length>1){
    var blob=n+' '+(aa.map(norm).join(' '));
    var all=true; for(var ti=0;ti<qTokens.length;ti++) if(blob.indexOf(qTokens[ti])<0){all=false;break;}
    if(all) return 4;
  }
  // lev ≤2 against name tokens
  var best=99; var parts=n.split(' ');
  for(var pi=0;pi<parts.length;pi++) best=Math.min(best, lev(parts[pi], qn));
  if(best<=2) return 5+best*0.3;
  // skeleton fuzzy
  if(qs.length>2 && skel(n).indexOf(qs)>=0) return 6;
  return 99;
}
self.postMessage({type:'ready',count:IDX.length});
self.onmessage=function(ev){
  var r=ev.data; if(!r||r.type!=='search') return;
  var q=(r.query||'').trim(), qn=norm(q), qs=skel(qn), qTokens=qn?qn.split(' ').filter(Boolean):[], wing=r.wing||'all', cult=r.culture||'all', off=r.offset||0, lim=r.limit||60;
  var out=[];
  if(!q){
    for(var i=0;i<IDX.length;i++){var e=IDX[i]; if(wing!=='all'&&e.k!==wing)continue; if(cult!=='all'&&e.c!==cult)continue; out.push({e:e,sc:99});}
  } else {
    for(var j=0;j<IDX.length;j++){var ent=IDX[j]; if(wing!=='all'&&ent.k!==wing)continue; if(cult!=='all'&&ent.c!==cult)continue; var sc=scoreEntity(ent,q,qs,qTokens); if(sc<99) out.push({e:ent,sc:sc});}
    out.sort(function(a,b){return a.sc-b.sc || (a.e._finished===b.e._finished? a.e.n.localeCompare(b.e.n) : (a.e._finished?-1:1));});
    if(cult==='SCP Foundation') out.sort(function(a,b){var d=scpNum(a.e.n)-scpNum(b.e.n); return d!==0?d:a.sc-b.sc;});
  }
  var matched=out.map(function(x){return x.e;});
  var scored=out;
  var items=[], top=null;
  for(var k=off;k<Math.min(off+lim, matched.length);k++) items.push(compact(matched[k]));
  if(scored.length) top=compact(scored[0].e);
  // topScore lets UI do Enter→top even without rendering
  var topScore=scored.length?scored[0].sc:99;
  self.postMessage({type:'results',id:r.id,count:matched.length,items:items,offset:off,hasMore:off+items.length<matched.length,top:top,topScore:topScore});
};
