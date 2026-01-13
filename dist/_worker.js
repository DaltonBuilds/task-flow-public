var Lr=Object.defineProperty;var St=e=>{throw TypeError(e)};var Ar=(e,t,r)=>t in e?Lr(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r;var h=(e,t,r)=>Ar(e,typeof t!="symbol"?t+"":t,r),yt=(e,t,r)=>t.has(e)||St("Cannot "+r);var l=(e,t,r)=>(yt(e,t,"read from private field"),r?r.call(e):t.get(e)),y=(e,t,r)=>t.has(e)?St("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),f=(e,t,r,s)=>(yt(e,t,"write to private field"),s?s.call(e,r):t.set(e,r),r),b=(e,t,r)=>(yt(e,t,"access private method"),r);var Ct=(e,t,r,s)=>({set _(a){f(e,t,a,r)},get _(){return l(e,t,s)}});var jt=(e,t,r)=>(s,a)=>{let n=-1;return o(0);async function o(i){if(i<=n)throw new Error("next() called multiple times");n=i;let c,d=!1,p;if(e[i]?(p=e[i][0][0],s.req.routeIndex=i):p=i===e.length&&a||void 0,p)try{c=await p(s,()=>o(i+1))}catch(u){if(u instanceof Error&&t)s.error=u,c=await t(u,s),d=!0;else throw u}else s.finalized===!1&&r&&(c=await r(s));return c&&(s.finalized===!1||d)&&(s.res=c),s}},Sr=Symbol(),Cr=async(e,t=Object.create(null))=>{const{all:r=!1,dot:s=!1}=t,n=(e instanceof Zt?e.raw.headers:e.headers).get("Content-Type");return n!=null&&n.startsWith("multipart/form-data")||n!=null&&n.startsWith("application/x-www-form-urlencoded")?jr(e,{all:r,dot:s}):{}};async function jr(e,t){const r=await e.formData();return r?Ur(r,t):{}}function Ur(e,t){const r=Object.create(null);return e.forEach((s,a)=>{t.all||a.endsWith("[]")?Fr(r,a,s):r[a]=s}),t.dot&&Object.entries(r).forEach(([s,a])=>{s.includes(".")&&(Mr(r,s,a),delete r[s])}),r}var Fr=(e,t,r)=>{e[t]!==void 0?Array.isArray(e[t])?e[t].push(r):e[t]=[e[t],r]:t.endsWith("[]")?e[t]=[r]:e[t]=r},Mr=(e,t,r)=>{let s=e;const a=t.split(".");a.forEach((n,o)=>{o===a.length-1?s[n]=r:((!s[n]||typeof s[n]!="object"||Array.isArray(s[n])||s[n]instanceof File)&&(s[n]=Object.create(null)),s=s[n])})},Yt=e=>{const t=e.split("/");return t[0]===""&&t.shift(),t},qr=e=>{const{groups:t,path:r}=Br(e),s=Yt(r);return $r(s,t)},Br=e=>{const t=[];return e=e.replace(/\{[^}]+\}/g,(r,s)=>{const a=`@${s}`;return t.push([a,r]),a}),{groups:t,path:e}},$r=(e,t)=>{for(let r=t.length-1;r>=0;r--){const[s]=t[r];for(let a=e.length-1;a>=0;a--)if(e[a].includes(s)){e[a]=e[a].replace(s,t[r][1]);break}}return e},Je={},Pr=(e,t)=>{if(e==="*")return"*";const r=e.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);if(r){const s=`${e}#${t}`;return Je[s]||(r[2]?Je[s]=t&&t[0]!==":"&&t[0]!=="*"?[s,r[1],new RegExp(`^${r[2]}(?=/${t})`)]:[e,r[1],new RegExp(`^${r[2]}$`)]:Je[s]=[e,r[1],!0]),Je[s]}return null},Rt=(e,t)=>{try{return t(e)}catch{return e.replace(/(?:%[0-9A-Fa-f]{2})+/g,r=>{try{return t(r)}catch{return r}})}},Hr=e=>Rt(e,decodeURI),Jt=e=>{const t=e.url,r=t.indexOf("/",t.indexOf(":")+4);let s=r;for(;s<t.length;s++){const a=t.charCodeAt(s);if(a===37){const n=t.indexOf("?",s),o=t.slice(r,n===-1?void 0:n);return Hr(o.includes("%25")?o.replace(/%25/g,"%2525"):o)}else if(a===63)break}return t.slice(r,s)},Wr=e=>{const t=Jt(e);return t.length>1&&t.at(-1)==="/"?t.slice(0,-1):t},ve=(e,t,...r)=>(r.length&&(t=ve(t,...r)),`${(e==null?void 0:e[0])==="/"?"":"/"}${e}${t==="/"?"":`${(e==null?void 0:e.at(-1))==="/"?"":"/"}${(t==null?void 0:t[0])==="/"?t.slice(1):t}`}`),zt=e=>{if(e.charCodeAt(e.length-1)!==63||!e.includes(":"))return null;const t=e.split("/"),r=[];let s="";return t.forEach(a=>{if(a!==""&&!/\:/.test(a))s+="/"+a;else if(/\:/.test(a))if(/\?/.test(a)){r.length===0&&s===""?r.push("/"):r.push(s);const n=a.replace("?","");s+="/"+n,r.push(s)}else s+="/"+a}),r.filter((a,n,o)=>o.indexOf(a)===n)},Et=e=>/[%+]/.test(e)?(e.indexOf("+")!==-1&&(e=e.replace(/\+/g," ")),e.indexOf("%")!==-1?Rt(e,Qt):e):e,Kt=(e,t,r)=>{let s;if(!r&&t&&!/[%+]/.test(t)){let o=e.indexOf("?",8);if(o===-1)return;for(e.startsWith(t,o+1)||(o=e.indexOf(`&${t}`,o+1));o!==-1;){const i=e.charCodeAt(o+t.length+1);if(i===61){const c=o+t.length+2,d=e.indexOf("&",c);return Et(e.slice(c,d===-1?void 0:d))}else if(i==38||isNaN(i))return"";o=e.indexOf(`&${t}`,o+1)}if(s=/[%+]/.test(e),!s)return}const a={};s??(s=/[%+]/.test(e));let n=e.indexOf("?",8);for(;n!==-1;){const o=e.indexOf("&",n+1);let i=e.indexOf("=",n);i>o&&o!==-1&&(i=-1);let c=e.slice(n+1,i===-1?o===-1?void 0:o:i);if(s&&(c=Et(c)),n=o,c==="")continue;let d;i===-1?d="":(d=e.slice(i+1,o===-1?void 0:o),s&&(d=Et(d))),r?(a[c]&&Array.isArray(a[c])||(a[c]=[]),a[c].push(d)):a[c]??(a[c]=d)}return t?a[t]:a},Xr=Kt,Vr=(e,t)=>Kt(e,t,!0),Qt=decodeURIComponent,Ut=e=>Rt(e,Qt),ke,F,Q,er,tr,bt,ee,Pt,Zt=(Pt=class{constructor(e,t="/",r=[[]]){y(this,Q);h(this,"raw");y(this,ke);y(this,F);h(this,"routeIndex",0);h(this,"path");h(this,"bodyCache",{});y(this,ee,e=>{const{bodyCache:t,raw:r}=this,s=t[e];if(s)return s;const a=Object.keys(t)[0];return a?t[a].then(n=>(a==="json"&&(n=JSON.stringify(n)),new Response(n)[e]())):t[e]=r[e]()});this.raw=e,this.path=t,f(this,F,r),f(this,ke,{})}param(e){return e?b(this,Q,er).call(this,e):b(this,Q,tr).call(this)}query(e){return Xr(this.url,e)}queries(e){return Vr(this.url,e)}header(e){if(e)return this.raw.headers.get(e)??void 0;const t={};return this.raw.headers.forEach((r,s)=>{t[s]=r}),t}async parseBody(e){var t;return(t=this.bodyCache).parsedBody??(t.parsedBody=await Cr(this,e))}json(){return l(this,ee).call(this,"text").then(e=>JSON.parse(e))}text(){return l(this,ee).call(this,"text")}arrayBuffer(){return l(this,ee).call(this,"arrayBuffer")}blob(){return l(this,ee).call(this,"blob")}formData(){return l(this,ee).call(this,"formData")}addValidatedData(e,t){l(this,ke)[e]=t}valid(e){return l(this,ke)[e]}get url(){return this.raw.url}get method(){return this.raw.method}get[Sr](){return l(this,F)}get matchedRoutes(){return l(this,F)[0].map(([[,e]])=>e)}get routePath(){return l(this,F)[0].map(([[,e]])=>e)[this.routeIndex].path}},ke=new WeakMap,F=new WeakMap,Q=new WeakSet,er=function(e){const t=l(this,F)[0][this.routeIndex][1][e],r=b(this,Q,bt).call(this,t);return r&&/\%/.test(r)?Ut(r):r},tr=function(){const e={},t=Object.keys(l(this,F)[0][this.routeIndex][1]);for(const r of t){const s=b(this,Q,bt).call(this,l(this,F)[0][this.routeIndex][1][r]);s!==void 0&&(e[r]=/\%/.test(s)?Ut(s):s)}return e},bt=function(e){return l(this,F)[1]?l(this,F)[1][e]:e},ee=new WeakMap,Pt),Gr={Stringify:1},rr=async(e,t,r,s,a)=>{typeof e=="object"&&!(e instanceof String)&&(e instanceof Promise||(e=e.toString()),e instanceof Promise&&(e=await e));const n=e.callbacks;return n!=null&&n.length?(a?a[0]+=e:a=[e],Promise.all(n.map(i=>i({phase:t,buffer:a,context:s}))).then(i=>Promise.all(i.filter(Boolean).map(c=>rr(c,t,!1,s,a))).then(()=>a[0]))):Promise.resolve(e)},Yr="text/plain; charset=UTF-8",_t=(e,t)=>({"Content-Type":e,...t}),Be,$e,V,Re,G,S,Pe,we,Ne,le,He,We,te,be,Ht,Jr=(Ht=class{constructor(e,t){y(this,te);y(this,Be);y(this,$e);h(this,"env",{});y(this,V);h(this,"finalized",!1);h(this,"error");y(this,Re);y(this,G);y(this,S);y(this,Pe);y(this,we);y(this,Ne);y(this,le);y(this,He);y(this,We);h(this,"render",(...e)=>(l(this,we)??f(this,we,t=>this.html(t)),l(this,we).call(this,...e)));h(this,"setLayout",e=>f(this,Pe,e));h(this,"getLayout",()=>l(this,Pe));h(this,"setRenderer",e=>{f(this,we,e)});h(this,"header",(e,t,r)=>{this.finalized&&f(this,S,new Response(l(this,S).body,l(this,S)));const s=l(this,S)?l(this,S).headers:l(this,le)??f(this,le,new Headers);t===void 0?s.delete(e):r!=null&&r.append?s.append(e,t):s.set(e,t)});h(this,"status",e=>{f(this,Re,e)});h(this,"set",(e,t)=>{l(this,V)??f(this,V,new Map),l(this,V).set(e,t)});h(this,"get",e=>l(this,V)?l(this,V).get(e):void 0);h(this,"newResponse",(...e)=>b(this,te,be).call(this,...e));h(this,"body",(e,t,r)=>b(this,te,be).call(this,e,t,r));h(this,"text",(e,t,r)=>!l(this,le)&&!l(this,Re)&&!t&&!r&&!this.finalized?new Response(e):b(this,te,be).call(this,e,t,_t(Yr,r)));h(this,"json",(e,t,r)=>b(this,te,be).call(this,JSON.stringify(e),t,_t("application/json",r)));h(this,"html",(e,t,r)=>{const s=a=>b(this,te,be).call(this,a,t,_t("text/html; charset=UTF-8",r));return typeof e=="object"?rr(e,Gr.Stringify,!1,{}).then(s):s(e)});h(this,"redirect",(e,t)=>{const r=String(e);return this.header("Location",/[^\x00-\xFF]/.test(r)?encodeURI(r):r),this.newResponse(null,t??302)});h(this,"notFound",()=>(l(this,Ne)??f(this,Ne,()=>new Response),l(this,Ne).call(this,this)));f(this,Be,e),t&&(f(this,G,t.executionCtx),this.env=t.env,f(this,Ne,t.notFoundHandler),f(this,We,t.path),f(this,He,t.matchResult))}get req(){return l(this,$e)??f(this,$e,new Zt(l(this,Be),l(this,We),l(this,He))),l(this,$e)}get event(){if(l(this,G)&&"respondWith"in l(this,G))return l(this,G);throw Error("This context has no FetchEvent")}get executionCtx(){if(l(this,G))return l(this,G);throw Error("This context has no ExecutionContext")}get res(){return l(this,S)||f(this,S,new Response(null,{headers:l(this,le)??f(this,le,new Headers)}))}set res(e){if(l(this,S)&&e){e=new Response(e.body,e);for(const[t,r]of l(this,S).headers.entries())if(t!=="content-type")if(t==="set-cookie"){const s=l(this,S).headers.getSetCookie();e.headers.delete("set-cookie");for(const a of s)e.headers.append("set-cookie",a)}else e.headers.set(t,r)}f(this,S,e),this.finalized=!0}get var(){return l(this,V)?Object.fromEntries(l(this,V)):{}}},Be=new WeakMap,$e=new WeakMap,V=new WeakMap,Re=new WeakMap,G=new WeakMap,S=new WeakMap,Pe=new WeakMap,we=new WeakMap,Ne=new WeakMap,le=new WeakMap,He=new WeakMap,We=new WeakMap,te=new WeakSet,be=function(e,t,r){const s=l(this,S)?new Headers(l(this,S).headers):l(this,le)??new Headers;if(typeof t=="object"&&"headers"in t){const n=t.headers instanceof Headers?t.headers:new Headers(t.headers);for(const[o,i]of n)o.toLowerCase()==="set-cookie"?s.append(o,i):s.set(o,i)}if(r)for(const[n,o]of Object.entries(r))if(typeof o=="string")s.set(n,o);else{s.delete(n);for(const i of o)s.append(n,i)}const a=typeof t=="number"?t:(t==null?void 0:t.status)??l(this,Re);return new Response(e,{status:a,headers:s})},Ht),N="ALL",zr="all",Kr=["get","post","put","delete","options","patch"],sr="Can not add a route since the matcher is already built.",ar=class extends Error{},Qr="__COMPOSED_HANDLER",Zr=e=>e.text("404 Not Found",404),Ft=(e,t)=>{if("getResponse"in e){const r=e.getResponse();return t.newResponse(r.body,r)}return console.error(e),t.text("Internal Server Error",500)},$,I,nr,P,ce,Ze,et,Ie,es=(Ie=class{constructor(t={}){y(this,I);h(this,"get");h(this,"post");h(this,"put");h(this,"delete");h(this,"options");h(this,"patch");h(this,"all");h(this,"on");h(this,"use");h(this,"router");h(this,"getPath");h(this,"_basePath","/");y(this,$,"/");h(this,"routes",[]);y(this,P,Zr);h(this,"errorHandler",Ft);h(this,"onError",t=>(this.errorHandler=t,this));h(this,"notFound",t=>(f(this,P,t),this));h(this,"fetch",(t,...r)=>b(this,I,et).call(this,t,r[1],r[0],t.method));h(this,"request",(t,r,s,a)=>t instanceof Request?this.fetch(r?new Request(t,r):t,s,a):(t=t.toString(),this.fetch(new Request(/^https?:\/\//.test(t)?t:`http://localhost${ve("/",t)}`,r),s,a)));h(this,"fire",()=>{addEventListener("fetch",t=>{t.respondWith(b(this,I,et).call(this,t.request,t,void 0,t.request.method))})});[...Kr,zr].forEach(n=>{this[n]=(o,...i)=>(typeof o=="string"?f(this,$,o):b(this,I,ce).call(this,n,l(this,$),o),i.forEach(c=>{b(this,I,ce).call(this,n,l(this,$),c)}),this)}),this.on=(n,o,...i)=>{for(const c of[o].flat()){f(this,$,c);for(const d of[n].flat())i.map(p=>{b(this,I,ce).call(this,d.toUpperCase(),l(this,$),p)})}return this},this.use=(n,...o)=>(typeof n=="string"?f(this,$,n):(f(this,$,"*"),o.unshift(n)),o.forEach(i=>{b(this,I,ce).call(this,N,l(this,$),i)}),this);const{strict:s,...a}=t;Object.assign(this,a),this.getPath=s??!0?t.getPath??Jt:Wr}route(t,r){const s=this.basePath(t);return r.routes.map(a=>{var o;let n;r.errorHandler===Ft?n=a.handler:(n=async(i,c)=>(await jt([],r.errorHandler)(i,()=>a.handler(i,c))).res,n[Qr]=a.handler),b(o=s,I,ce).call(o,a.method,a.path,n)}),this}basePath(t){const r=b(this,I,nr).call(this);return r._basePath=ve(this._basePath,t),r}mount(t,r,s){let a,n;s&&(typeof s=="function"?n=s:(n=s.optionHandler,s.replaceRequest===!1?a=c=>c:a=s.replaceRequest));const o=n?c=>{const d=n(c);return Array.isArray(d)?d:[d]}:c=>{let d;try{d=c.executionCtx}catch{}return[c.env,d]};a||(a=(()=>{const c=ve(this._basePath,t),d=c==="/"?0:c.length;return p=>{const u=new URL(p.url);return u.pathname=u.pathname.slice(d)||"/",new Request(u,p)}})());const i=async(c,d)=>{const p=await r(a(c.req.raw),...o(c));if(p)return p;await d()};return b(this,I,ce).call(this,N,ve(t,"*"),i),this}},$=new WeakMap,I=new WeakSet,nr=function(){const t=new Ie({router:this.router,getPath:this.getPath});return t.errorHandler=this.errorHandler,f(t,P,l(this,P)),t.routes=this.routes,t},P=new WeakMap,ce=function(t,r,s){t=t.toUpperCase(),r=ve(this._basePath,r);const a={basePath:this._basePath,path:r,method:t,handler:s};this.router.add(t,r,[s,a]),this.routes.push(a)},Ze=function(t,r){if(t instanceof Error)return this.errorHandler(t,r);throw t},et=function(t,r,s,a){if(a==="HEAD")return(async()=>new Response(null,await b(this,I,et).call(this,t,r,s,"GET")))();const n=this.getPath(t,{env:s}),o=this.router.match(a,n),i=new Jr(t,{path:n,matchResult:o,env:s,executionCtx:r,notFoundHandler:l(this,P)});if(o[0].length===1){let d;try{d=o[0][0][0][0](i,async()=>{i.res=await l(this,P).call(this,i)})}catch(p){return b(this,I,Ze).call(this,p,i)}return d instanceof Promise?d.then(p=>p||(i.finalized?i.res:l(this,P).call(this,i))).catch(p=>b(this,I,Ze).call(this,p,i)):d??l(this,P).call(this,i)}const c=jt(o[0],this.errorHandler,l(this,P));return(async()=>{try{const d=await c(i);if(!d.finalized)throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");return d.res}catch(d){return b(this,I,Ze).call(this,d,i)}})()},Ie),or=[];function ts(e,t){const r=this.buildAllMatchers(),s=((a,n)=>{const o=r[a]||r[N],i=o[2][n];if(i)return i;const c=n.match(o[0]);if(!c)return[[],or];const d=c.indexOf("",1);return[o[1][d],c]});return this.match=s,s(e,t)}var rt="[^/]+",Ue=".*",Fe="(?:|/.*)",Te=Symbol(),rs=new Set(".\\+*[^]$()");function ss(e,t){return e.length===1?t.length===1?e<t?-1:1:-1:t.length===1||e===Ue||e===Fe?1:t===Ue||t===Fe?-1:e===rt?1:t===rt?-1:e.length===t.length?e<t?-1:1:t.length-e.length}var ue,pe,H,fe,as=(fe=class{constructor(){y(this,ue);y(this,pe);y(this,H,Object.create(null))}insert(t,r,s,a,n){if(t.length===0){if(l(this,ue)!==void 0)throw Te;if(n)return;f(this,ue,r);return}const[o,...i]=t,c=o==="*"?i.length===0?["","",Ue]:["","",rt]:o==="/*"?["","",Fe]:o.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);let d;if(c){const p=c[1];let u=c[2]||rt;if(p&&c[2]&&(u===".*"||(u=u.replace(/^\((?!\?:)(?=[^)]+\)$)/,"(?:"),/\((?!\?:)/.test(u))))throw Te;if(d=l(this,H)[u],!d){if(Object.keys(l(this,H)).some(g=>g!==Ue&&g!==Fe))throw Te;if(n)return;d=l(this,H)[u]=new fe,p!==""&&f(d,pe,a.varIndex++)}!n&&p!==""&&s.push([p,l(d,pe)])}else if(d=l(this,H)[o],!d){if(Object.keys(l(this,H)).some(p=>p.length>1&&p!==Ue&&p!==Fe))throw Te;if(n)return;d=l(this,H)[o]=new fe}d.insert(i,r,s,a,n)}buildRegExpStr(){const r=Object.keys(l(this,H)).sort(ss).map(s=>{const a=l(this,H)[s];return(typeof l(a,pe)=="number"?`(${s})@${l(a,pe)}`:rs.has(s)?`\\${s}`:s)+a.buildRegExpStr()});return typeof l(this,ue)=="number"&&r.unshift(`#${l(this,ue)}`),r.length===0?"":r.length===1?r[0]:"(?:"+r.join("|")+")"}},ue=new WeakMap,pe=new WeakMap,H=new WeakMap,fe),it,Xe,Wt,ns=(Wt=class{constructor(){y(this,it,{varIndex:0});y(this,Xe,new as)}insert(e,t,r){const s=[],a=[];for(let o=0;;){let i=!1;if(e=e.replace(/\{[^}]+\}/g,c=>{const d=`@\\${o}`;return a[o]=[d,c],o++,i=!0,d}),!i)break}const n=e.match(/(?::[^\/]+)|(?:\/\*$)|./g)||[];for(let o=a.length-1;o>=0;o--){const[i]=a[o];for(let c=n.length-1;c>=0;c--)if(n[c].indexOf(i)!==-1){n[c]=n[c].replace(i,a[o][1]);break}}return l(this,Xe).insert(n,t,s,l(this,it),r),s}buildRegExp(){let e=l(this,Xe).buildRegExpStr();if(e==="")return[/^$/,[],[]];let t=0;const r=[],s=[];return e=e.replace(/#(\d+)|@(\d+)|\.\*\$/g,(a,n,o)=>n!==void 0?(r[++t]=Number(n),"$()"):(o!==void 0&&(s[Number(o)]=++t),"")),[new RegExp(`^${e}`),r,s]}},it=new WeakMap,Xe=new WeakMap,Wt),os=[/^$/,[],Object.create(null)],tt=Object.create(null);function ir(e){return tt[e]??(tt[e]=new RegExp(e==="*"?"":`^${e.replace(/\/\*$|([.\\+*[^\]$()])/g,(t,r)=>r?`\\${r}`:"(?:|/.*)")}$`))}function is(){tt=Object.create(null)}function cs(e){var d;const t=new ns,r=[];if(e.length===0)return os;const s=e.map(p=>[!/\*|\/:/.test(p[0]),...p]).sort(([p,u],[g,E])=>p?1:g?-1:u.length-E.length),a=Object.create(null);for(let p=0,u=-1,g=s.length;p<g;p++){const[E,T,_]=s[p];E?a[T]=[_.map(([O])=>[O,Object.create(null)]),or]:u++;let k;try{k=t.insert(T,u,E)}catch(O){throw O===Te?new ar(T):O}E||(r[u]=_.map(([O,D])=>{const me=Object.create(null);for(D-=1;D>=0;D--){const[ye,j]=k[D];me[ye]=j}return[O,me]}))}const[n,o,i]=t.buildRegExp();for(let p=0,u=r.length;p<u;p++)for(let g=0,E=r[p].length;g<E;g++){const T=(d=r[p][g])==null?void 0:d[1];if(!T)continue;const _=Object.keys(T);for(let k=0,O=_.length;k<O;k++)T[_[k]]=i[T[_[k]]]}const c=[];for(const p in o)c[p]=r[o[p]];return[n,c,a]}function _e(e,t){if(e){for(const r of Object.keys(e).sort((s,a)=>a.length-s.length))if(ir(r).test(t))return[...e[r]]}}var re,se,ct,cr,Xt,ds=(Xt=class{constructor(){y(this,ct);h(this,"name","RegExpRouter");y(this,re);y(this,se);h(this,"match",ts);f(this,re,{[N]:Object.create(null)}),f(this,se,{[N]:Object.create(null)})}add(e,t,r){var i;const s=l(this,re),a=l(this,se);if(!s||!a)throw new Error(sr);s[e]||[s,a].forEach(c=>{c[e]=Object.create(null),Object.keys(c[N]).forEach(d=>{c[e][d]=[...c[N][d]]})}),t==="/*"&&(t="*");const n=(t.match(/\/:/g)||[]).length;if(/\*$/.test(t)){const c=ir(t);e===N?Object.keys(s).forEach(d=>{var p;(p=s[d])[t]||(p[t]=_e(s[d],t)||_e(s[N],t)||[])}):(i=s[e])[t]||(i[t]=_e(s[e],t)||_e(s[N],t)||[]),Object.keys(s).forEach(d=>{(e===N||e===d)&&Object.keys(s[d]).forEach(p=>{c.test(p)&&s[d][p].push([r,n])})}),Object.keys(a).forEach(d=>{(e===N||e===d)&&Object.keys(a[d]).forEach(p=>c.test(p)&&a[d][p].push([r,n]))});return}const o=zt(t)||[t];for(let c=0,d=o.length;c<d;c++){const p=o[c];Object.keys(a).forEach(u=>{var g;(e===N||e===u)&&((g=a[u])[p]||(g[p]=[..._e(s[u],p)||_e(s[N],p)||[]]),a[u][p].push([r,n-d+c+1]))})}}buildAllMatchers(){const e=Object.create(null);return Object.keys(l(this,se)).concat(Object.keys(l(this,re))).forEach(t=>{e[t]||(e[t]=b(this,ct,cr).call(this,t))}),f(this,re,f(this,se,void 0)),is(),e}},re=new WeakMap,se=new WeakMap,ct=new WeakSet,cr=function(e){const t=[];let r=e===N;return[l(this,re),l(this,se)].forEach(s=>{const a=s[e]?Object.keys(s[e]).map(n=>[n,s[e][n]]):[];a.length!==0?(r||(r=!0),t.push(...a)):e!==N&&t.push(...Object.keys(s[N]).map(n=>[n,s[N][n]]))}),r?cs(t):null},Xt),ae,Y,Vt,ls=(Vt=class{constructor(e){h(this,"name","SmartRouter");y(this,ae,[]);y(this,Y,[]);f(this,ae,e.routers)}add(e,t,r){if(!l(this,Y))throw new Error(sr);l(this,Y).push([e,t,r])}match(e,t){if(!l(this,Y))throw new Error("Fatal error");const r=l(this,ae),s=l(this,Y),a=r.length;let n=0,o;for(;n<a;n++){const i=r[n];try{for(let c=0,d=s.length;c<d;c++)i.add(...s[c]);o=i.match(e,t)}catch(c){if(c instanceof ar)continue;throw c}this.match=i.match.bind(i),f(this,ae,[i]),f(this,Y,void 0);break}if(n===a)throw new Error("Fatal error");return this.name=`SmartRouter + ${this.activeRouter.name}`,o}get activeRouter(){if(l(this,Y)||l(this,ae).length!==1)throw new Error("No active router has been determined yet.");return l(this,ae)[0]}},ae=new WeakMap,Y=new WeakMap,Vt),Ce=Object.create(null),ne,A,ge,Oe,L,J,de,De,us=(De=class{constructor(t,r,s){y(this,J);y(this,ne);y(this,A);y(this,ge);y(this,Oe,0);y(this,L,Ce);if(f(this,A,s||Object.create(null)),f(this,ne,[]),t&&r){const a=Object.create(null);a[t]={handler:r,possibleKeys:[],score:0},f(this,ne,[a])}f(this,ge,[])}insert(t,r,s){f(this,Oe,++Ct(this,Oe)._);let a=this;const n=qr(r),o=[];for(let i=0,c=n.length;i<c;i++){const d=n[i],p=n[i+1],u=Pr(d,p),g=Array.isArray(u)?u[0]:d;if(g in l(a,A)){a=l(a,A)[g],u&&o.push(u[1]);continue}l(a,A)[g]=new De,u&&(l(a,ge).push(u),o.push(u[1])),a=l(a,A)[g]}return l(a,ne).push({[t]:{handler:s,possibleKeys:o.filter((i,c,d)=>d.indexOf(i)===c),score:l(this,Oe)}}),a}search(t,r){var c;const s=[];f(this,L,Ce);let n=[this];const o=Yt(r),i=[];for(let d=0,p=o.length;d<p;d++){const u=o[d],g=d===p-1,E=[];for(let T=0,_=n.length;T<_;T++){const k=n[T],O=l(k,A)[u];O&&(f(O,L,l(k,L)),g?(l(O,A)["*"]&&s.push(...b(this,J,de).call(this,l(O,A)["*"],t,l(k,L))),s.push(...b(this,J,de).call(this,O,t,l(k,L)))):E.push(O));for(let D=0,me=l(k,ge).length;D<me;D++){const ye=l(k,ge)[D],j=l(k,L)===Ce?{}:{...l(k,L)};if(ye==="*"){const B=l(k,A)["*"];B&&(s.push(...b(this,J,de).call(this,B,t,l(k,L))),f(B,L,j),E.push(B));continue}const[lt,Ye,X]=ye;if(!u&&!(X instanceof RegExp))continue;const q=l(k,A)[lt],ut=o.slice(d).join("/");if(X instanceof RegExp){const B=X.exec(ut);if(B){if(j[Ye]=B[0],s.push(...b(this,J,de).call(this,q,t,l(k,L),j)),Object.keys(l(q,A)).length){f(q,L,j);const Se=((c=B[0].match(/\//))==null?void 0:c.length)??0;(i[Se]||(i[Se]=[])).push(q)}continue}}(X===!0||X.test(u))&&(j[Ye]=u,g?(s.push(...b(this,J,de).call(this,q,t,j,l(k,L))),l(q,A)["*"]&&s.push(...b(this,J,de).call(this,l(q,A)["*"],t,j,l(k,L)))):(f(q,L,j),E.push(q)))}}n=E.concat(i.shift()??[])}return s.length>1&&s.sort((d,p)=>d.score-p.score),[s.map(({handler:d,params:p})=>[d,p])]}},ne=new WeakMap,A=new WeakMap,ge=new WeakMap,Oe=new WeakMap,L=new WeakMap,J=new WeakSet,de=function(t,r,s,a){const n=[];for(let o=0,i=l(t,ne).length;o<i;o++){const c=l(t,ne)[o],d=c[r]||c[N],p={};if(d!==void 0&&(d.params=Object.create(null),n.push(d),s!==Ce||a&&a!==Ce))for(let u=0,g=d.possibleKeys.length;u<g;u++){const E=d.possibleKeys[u],T=p[d.score];d.params[E]=a!=null&&a[E]&&!T?a[E]:s[E]??(a==null?void 0:a[E]),p[d.score]=!0}}return n},De),he,Gt,ps=(Gt=class{constructor(){h(this,"name","TrieRouter");y(this,he);f(this,he,new us)}add(e,t,r){const s=zt(t);if(s){for(let a=0,n=s.length;a<n;a++)l(this,he).insert(e,s[a],r);return}l(this,he).insert(e,t,r)}match(e,t){return l(this,he).search(e,t)}},he=new WeakMap,Gt),W=class extends es{constructor(e={}){super(e),this.router=e.router??new ls({routers:[new ds,new ps]})}},gs=e=>{const r={...{origin:"*",allowMethods:["GET","HEAD","PUT","POST","DELETE","PATCH"],allowHeaders:[],exposeHeaders:[]},...e},s=(n=>typeof n=="string"?n==="*"?()=>n:o=>n===o?o:null:typeof n=="function"?n:o=>n.includes(o)?o:null)(r.origin),a=(n=>typeof n=="function"?n:Array.isArray(n)?()=>n:()=>[])(r.allowMethods);return async function(o,i){var p;function c(u,g){o.res.headers.set(u,g)}const d=await s(o.req.header("origin")||"",o);if(d&&c("Access-Control-Allow-Origin",d),r.credentials&&c("Access-Control-Allow-Credentials","true"),(p=r.exposeHeaders)!=null&&p.length&&c("Access-Control-Expose-Headers",r.exposeHeaders.join(",")),o.req.method==="OPTIONS"){r.origin!=="*"&&c("Vary","Origin"),r.maxAge!=null&&c("Access-Control-Max-Age",r.maxAge.toString());const u=await a(o.req.header("origin")||"",o);u.length&&c("Access-Control-Allow-Methods",u.join(","));let g=r.allowHeaders;if(!(g!=null&&g.length)){const E=o.req.header("Access-Control-Request-Headers");E&&(g=E.split(/\s*,\s*/))}return g!=null&&g.length&&(c("Access-Control-Allow-Headers",g.join(",")),o.res.headers.append("Vary","Access-Control-Request-Headers")),o.res.headers.delete("Content-Length"),o.res.headers.delete("Content-Type"),new Response(null,{headers:o.res.headers,status:204,statusText:"No Content"})}await i(),r.origin!=="*"&&o.header("Vary","Origin",{append:!0})}};function hs(){const{process:e,Deno:t}=globalThis;return!(typeof(t==null?void 0:t.noColor)=="boolean"?t.noColor:e!==void 0?"NO_COLOR"in(e==null?void 0:e.env):!1)}async function fs(){const{navigator:e}=globalThis,t="cloudflare:workers";return!(e!==void 0&&e.userAgent==="Cloudflare-Workers"?await(async()=>{try{return"NO_COLOR"in((await import(t)).env??{})}catch{return!1}})():!hs())}var ms=e=>{const[t,r]=[",","."];return e.map(a=>a.replace(/(\d)(?=(\d\d\d)+(?!\d))/g,"$1"+t)).join(r)},ys=e=>{const t=Date.now()-e;return ms([t<1e3?t+"ms":Math.round(t/1e3)+"s"])},Es=async e=>{if(await fs())switch(e/100|0){case 5:return`\x1B[31m${e}\x1B[0m`;case 4:return`\x1B[33m${e}\x1B[0m`;case 3:return`\x1B[36m${e}\x1B[0m`;case 2:return`\x1B[32m${e}\x1B[0m`}return`${e}`};async function Mt(e,t,r,s,a=0,n){const o=t==="<--"?`${t} ${r} ${s}`:`${t} ${r} ${s} ${await Es(a)} ${n}`;e(o)}var _s=(e=console.log)=>async function(r,s){const{method:a,url:n}=r.req,o=n.slice(n.indexOf("/",8));await Mt(e,"<--",a,o);const i=Date.now();await s(),await Mt(e,"-->",a,o,r.res.status,ys(i))};function K(e=""){const t=crypto.randomUUID();return e?`${e}_${t}`:t}function w(){return new Date().toISOString()}let vt=!1,je=null;async function vs(e){if(!vt)return je||(je=(async()=>{try{try{await e.prepare("SELECT 1 FROM boards LIMIT 1").first(),vt=!0;return}catch{}await e.batch([e.prepare(`
      CREATE TABLE IF NOT EXISTS boards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT DEFAULT '📋',
        color TEXT DEFAULT '#10B981',
        background_type TEXT DEFAULT 'solid',
        background_value TEXT DEFAULT '#f3f4f6',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT,
        deleted_at TEXT
      )
    `),e.prepare(`
      CREATE TABLE IF NOT EXISTS columns (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL,
        name TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        auto_archive INTEGER NOT NULL DEFAULT 0,
        auto_archive_days INTEGER NOT NULL DEFAULT 7,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT,
        deleted_at TEXT,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
      )
    `),e.prepare(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL,
        column_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT NOT NULL DEFAULT 'medium',
        due_date TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        position INTEGER NOT NULL DEFAULT 0,
        recurrence_rule TEXT,
        recurrence_end_date TEXT,
        recurrence_count INTEGER,
        recurrence_completed_count INTEGER DEFAULT 0,
        original_task_id TEXT,
        is_recurrence_instance INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT,
        deleted_at TEXT,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
        FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
      )
    `),e.prepare(`
      CREATE TABLE IF NOT EXISTS subtasks (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        title TEXT NOT NULL,
        is_completed INTEGER NOT NULL DEFAULT 0,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `),e.prepare(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL
      )
    `),e.prepare(`
      CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id)
    `),e.prepare(`
      CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC)
    `),e.prepare(`
      CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action)
    `),e.prepare(`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `),e.prepare(`
      CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id)
    `),e.prepare(`
      CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(task_id, created_at DESC)
    `)]),vt=!0}catch(t){throw je=null,t}})(),je)}async function bs(e,t={}){let r="SELECT * FROM boards WHERE 1=1";return t.includeDeleted||(r+=" AND deleted_at IS NULL"),t.includeArchived||(r+=" AND archived_at IS NULL"),r+=" ORDER BY created_at DESC",(await e.prepare(r).all()).results||[]}async function Tt(e,t){return await e.prepare("SELECT * FROM boards WHERE id = ?").bind(t).first()||null}async function dr(e,t){const r=await Tt(e,t);if(!r)return null;const a=(await e.prepare(`
    SELECT * FROM columns 
    WHERE board_id = ? AND deleted_at IS NULL 
    ORDER BY position ASC
  `).bind(t).all()).results||[],o=((await e.prepare(`
    SELECT * FROM tasks 
    WHERE board_id = ? AND deleted_at IS NULL AND archived_at IS NULL
    ORDER BY position ASC
  `).bind(t).all()).results||[]).map(u=>({...u,tags:typeof u.tags=="string"?JSON.parse(u.tags):u.tags,recurrence_rule:u.recurrence_rule?typeof u.recurrence_rule=="string"?JSON.parse(u.recurrence_rule):u.recurrence_rule:null,is_recurrence_instance:!!u.is_recurrence_instance})),i=o.map(u=>u.id);let c=[],d={};if(i.length>0){const u=i.map(()=>"?").join(",");c=((await e.prepare(`
      SELECT * FROM subtasks 
      WHERE task_id IN (${u})
      ORDER BY position ASC
    `).bind(...i).all()).results||[]).map(T=>({...T,is_completed:!!T.is_completed})),((await e.prepare(`
      SELECT task_id, COUNT(*) as count FROM comments WHERE task_id IN (${u}) GROUP BY task_id
    `).bind(...i).all()).results||[]).forEach(T=>{d[T.task_id]=T.count})}const p=a.map(u=>({...u,tasks:o.filter(g=>g.column_id===u.id).map(g=>({...g,subtasks:c.filter(E=>E.task_id===g.id),comments:[],comment_count:d[g.id]||0}))}));return{...r,columns:p}}const qt={blank:[],simple:["Not Started","Completed"],basic:["To Do","In Progress","Done"],extended:["Backlog","To Do","In Progress","Review","Done"]};async function Ts(e,t){const r=K("board"),s=w();await e.prepare(`
    INSERT INTO boards (id, name, description, icon, color, background_type, background_value, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(r,t.name,t.description||null,t.icon||"📋",t.color||"#10B981",t.background_type||"solid",t.background_value||"#f3f4f6",s,s).run();const a=t.template||"basic",n=qt[a]||qt.basic;for(let o=0;o<n.length;o++){const i=K("col");await e.prepare(`
      INSERT INTO columns (id, board_id, name, position, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(i,r,n[o],o,s,s).run()}return dr(e,r)}async function ks(e,t,r){const s=await Tt(e,t);if(!s)return null;const a=[],n=[];return r.name!==void 0&&(a.push("name = ?"),n.push(r.name)),r.description!==void 0&&(a.push("description = ?"),n.push(r.description)),r.icon!==void 0&&(a.push("icon = ?"),n.push(r.icon)),r.color!==void 0&&(a.push("color = ?"),n.push(r.color)),r.background_type!==void 0&&(a.push("background_type = ?"),n.push(r.background_type)),r.background_value!==void 0&&(a.push("background_value = ?"),n.push(r.background_value)),r.archived_at!==void 0&&(a.push("archived_at = ?"),n.push(r.archived_at)),a.length===0?s:(a.push("updated_at = ?"),n.push(w()),n.push(t),await e.prepare(`
    UPDATE boards SET ${a.join(", ")} WHERE id = ?
  `).bind(...n).run(),Tt(e,t))}async function Rs(e,t,r=!1){return r?(await e.prepare("DELETE FROM boards WHERE id = ?").bind(t).run()).meta.changes>0:(await e.prepare(`
    UPDATE boards SET deleted_at = ?, updated_at = ? WHERE id = ?
  `).bind(w(),w(),t).run()).meta.changes>0}async function ws(e,t,r={}){let s="SELECT * FROM columns WHERE board_id = ?";return r.includeDeleted||(s+=" AND deleted_at IS NULL"),s+=" ORDER BY position ASC",(await e.prepare(s).bind(t).all()).results||[]}async function xe(e,t){return await e.prepare("SELECT * FROM columns WHERE id = ?").bind(t).first()||null}async function Ns(e,t,r){const s=K("col"),a=w();let n=r.position;if(n===void 0){const o=await e.prepare(`
      SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM columns WHERE board_id = ?
    `).bind(t).first();n=(o==null?void 0:o.next_pos)||0}return await e.prepare(`
    INSERT INTO columns (id, board_id, name, position, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(s,t,r.name,n,a,a).run(),xe(e,s)}async function Is(e,t,r){const s=await xe(e,t);if(!s)return null;const a=[],n=[];return r.name!==void 0&&(a.push("name = ?"),n.push(r.name)),r.position!==void 0&&(a.push("position = ?"),n.push(r.position)),r.auto_archive!==void 0&&(a.push("auto_archive = ?"),n.push(r.auto_archive?1:0)),r.auto_archive_days!==void 0&&(a.push("auto_archive_days = ?"),n.push(r.auto_archive_days)),r.archived_at!==void 0&&(a.push("archived_at = ?"),n.push(r.archived_at)),a.length===0?s:(a.push("updated_at = ?"),n.push(w()),n.push(t),await e.prepare(`
    UPDATE columns SET ${a.join(", ")} WHERE id = ?
  `).bind(...n).run(),xe(e,t))}async function Os(e,t){return(await e.prepare(`
    UPDATE columns SET deleted_at = ?, updated_at = ? WHERE id = ?
  `).bind(w(),w(),t).run()).meta.changes>0}async function Ds(e,t,r={}){let s="SELECT * FROM tasks WHERE board_id = ?";const a=[t];r.includeDeleted||(s+=" AND deleted_at IS NULL"),r.includeArchived||(s+=" AND archived_at IS NULL"),r.columnId&&(s+=" AND column_id = ?",a.push(r.columnId)),r.priority&&(s+=" AND priority = ?",a.push(r.priority));const n=["position","due_date","priority","updated_at","created_at","title"],o=["asc","desc"],i=r.sort&&n.includes(r.sort)?r.sort:"position",c=r.order&&o.includes(r.order.toLowerCase())?r.order.toLowerCase():"asc";s+=` ORDER BY ${i} ${c}`;const p=((await e.prepare(s).bind(...a).all()).results||[]).map(_=>({..._,tags:typeof _.tags=="string"?JSON.parse(_.tags):_.tags,recurrence_rule:_.recurrence_rule?typeof _.recurrence_rule=="string"?JSON.parse(_.recurrence_rule):_.recurrence_rule:null,is_recurrence_instance:!!_.is_recurrence_instance}));let u=p;r.tag&&(u=p.filter(_=>_.tags.includes(r.tag)));const g=u.map(_=>_.id);let E=[],T={};if(g.length>0){const _=g.map(()=>"?").join(",");E=((await e.prepare(`
      SELECT * FROM subtasks WHERE task_id IN (${_}) ORDER BY position ASC
    `).bind(...g).all()).results||[]).map(D=>({...D,is_completed:!!D.is_completed})),((await e.prepare(`
      SELECT task_id, COUNT(*) as count FROM comments WHERE task_id IN (${_}) GROUP BY task_id
    `).bind(...g).all()).results||[]).forEach(D=>{T[D.task_id]=D.count})}return u.map(_=>({..._,subtasks:E.filter(k=>k.task_id===_.id),comments:[],comment_count:T[_.id]||0}))}async function M(e,t){const r=await e.prepare("SELECT * FROM tasks WHERE id = ?").bind(t).first();if(!r)return null;const s={...r,tags:typeof r.tags=="string"?JSON.parse(r.tags):r.tags,recurrence_rule:r.recurrence_rule?typeof r.recurrence_rule=="string"?JSON.parse(r.recurrence_rule):r.recurrence_rule:null,is_recurrence_instance:!!r.is_recurrence_instance},n=((await e.prepare(`
    SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC
  `).bind(t).all()).results||[]).map(c=>({...c,is_completed:!!c.is_completed})),i=(await e.prepare(`
    SELECT * FROM comments WHERE task_id = ? ORDER BY created_at ASC
  `).bind(t).all()).results||[];return{...s,subtasks:n,comments:i}}async function xs(e,t,r){const s=K("task"),a=w();let n=r.position;if(n===void 0){const p=await e.prepare(`
      SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM tasks WHERE column_id = ?
    `).bind(r.column_id).first();n=(p==null?void 0:p.next_pos)||0}const o=await xe(e,r.column_id),i=(o==null?void 0:o.name)||"Unknown",c=JSON.stringify(r.tags||[]),d=r.recurrence_rule?JSON.stringify(r.recurrence_rule):null;return await e.prepare(`
    INSERT INTO tasks (id, board_id, column_id, title, description, priority, due_date, tags, position, recurrence_rule, recurrence_end_date, recurrence_count, recurrence_completed_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).bind(s,t,r.column_id,r.title,r.description||null,r.priority||"medium",r.due_date||null,c,n,d,r.recurrence_end_date||null,r.recurrence_count??null,a,a).run(),await Z(e,"task",s,"created",{title:r.title,column_name:i}),M(e,s)}async function z(e,t,r){const s=await M(e,t);if(!s)return null;const a=[],n=[],o=[];if(r.title!==void 0&&r.title!==s.title&&(a.push("title = ?"),n.push(r.title),o.push({action:"edited",details:{field:"title",old_value:s.title,new_value:r.title}})),r.description!==void 0&&r.description!==s.description&&(a.push("description = ?"),n.push(r.description),o.push({action:"edited",details:{field:"description"}})),r.column_id!==void 0&&r.column_id!==s.column_id){a.push("column_id = ?"),n.push(r.column_id);const i=await xe(e,s.column_id),c=await xe(e,r.column_id);o.push({action:"moved",details:{from_column:(i==null?void 0:i.name)||"Unknown",to_column:(c==null?void 0:c.name)||"Unknown"}})}if(r.position!==void 0&&(a.push("position = ?"),n.push(r.position)),r.priority!==void 0&&r.priority!==s.priority&&(a.push("priority = ?"),n.push(r.priority),o.push({action:"priority_changed",details:{old_priority:s.priority,new_priority:r.priority}})),r.due_date!==void 0&&(a.push("due_date = ?"),n.push(r.due_date),r.due_date===null&&s.due_date?o.push({action:"due_date_removed",details:{}}):r.due_date&&r.due_date!==s.due_date&&o.push({action:"due_date_set",details:{due_date:r.due_date}})),r.tags!==void 0){a.push("tags = ?"),n.push(JSON.stringify(r.tags));const i=s.tags||[],c=r.tags||[],d=c.filter(u=>!i.includes(u)),p=i.filter(u=>!c.includes(u));d.length>0&&o.push({action:"tag_added",details:{tags:d}}),p.length>0&&o.push({action:"tag_removed",details:{tags:p}})}if(r.archived_at!==void 0&&(a.push("archived_at = ?"),n.push(r.archived_at),r.archived_at&&!s.archived_at?o.push({action:"archived",details:{}}):!r.archived_at&&s.archived_at&&o.push({action:"restored",details:{}})),r.recurrence_rule!==void 0&&(a.push("recurrence_rule = ?"),n.push(r.recurrence_rule?JSON.stringify(r.recurrence_rule):null)),r.recurrence_end_date!==void 0&&(a.push("recurrence_end_date = ?"),n.push(r.recurrence_end_date)),r.recurrence_count!==void 0&&(a.push("recurrence_count = ?"),n.push(r.recurrence_count)),r.recurrence_completed_count!==void 0&&(a.push("recurrence_completed_count = ?"),n.push(r.recurrence_completed_count)),a.length===0)return s;a.push("updated_at = ?"),n.push(w()),n.push(t),await e.prepare(`
    UPDATE tasks SET ${a.join(", ")} WHERE id = ?
  `).bind(...n).run();for(const i of o)await Z(e,"task",t,i.action,i.details);return M(e,t)}async function lr(e,t){const r=await M(e,t);if(!r)return!1;const s=await e.prepare(`
    UPDATE tasks SET deleted_at = ?, updated_at = ? WHERE id = ?
  `).bind(w(),w(),t).run();return s.meta.changes>0&&await Z(e,"task",t,"deleted",{title:r.title}),s.meta.changes>0}async function Ls(e,t){return((await e.prepare(`
    SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC
  `).bind(t).all()).results||[]).map(s=>({...s,is_completed:!!s.is_completed}))}async function st(e,t){const r=await e.prepare("SELECT * FROM subtasks WHERE id = ?").bind(t).first();return r?{...r,is_completed:!!r.is_completed}:null}async function As(e,t,r){const s=K("sub"),a=w();let n=r.position;if(n===void 0){const o=await e.prepare(`
      SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM subtasks WHERE task_id = ?
    `).bind(t).first();n=(o==null?void 0:o.next_pos)||0}return await e.prepare(`
    INSERT INTO subtasks (id, task_id, title, is_completed, position, created_at, updated_at)
    VALUES (?, ?, ?, 0, ?, ?, ?)
  `).bind(s,t,r.title,n,a,a).run(),await Z(e,"subtask",s,"subtask_created",{task_id:t,title:r.title}),st(e,s)}async function Ss(e,t,r){const s=await st(e,t);if(!s)return null;const a=[],n=[];return r.title!==void 0&&r.title!==s.title&&(a.push("title = ?"),n.push(r.title)),r.is_completed!==void 0&&r.is_completed!==s.is_completed&&(a.push("is_completed = ?"),n.push(r.is_completed?1:0),await Z(e,"subtask",t,"subtask_completed",{task_id:s.task_id,title:s.title,completed:r.is_completed})),r.position!==void 0&&(a.push("position = ?"),n.push(r.position)),a.length===0?s:(a.push("updated_at = ?"),n.push(w()),n.push(t),await e.prepare(`
    UPDATE subtasks SET ${a.join(", ")} WHERE id = ?
  `).bind(...n).run(),st(e,t))}async function Cs(e,t){const r=await st(e,t);if(!r)return!1;const s=await e.prepare("DELETE FROM subtasks WHERE id = ?").bind(t).run();return s.meta.changes>0&&await Z(e,"subtask",t,"subtask_deleted",{task_id:r.task_id,title:r.title}),s.meta.changes>0}async function js(e,t){return(await e.prepare(`
    SELECT * FROM comments WHERE task_id = ? ORDER BY created_at ASC
  `).bind(t).all()).results||[]}async function at(e,t){return await e.prepare("SELECT * FROM comments WHERE id = ?").bind(t).first()||null}async function Us(e,t,r){const s=K("comment"),a=w();return await e.prepare(`
    INSERT INTO comments (id, task_id, content, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(s,t,r.content,a,a).run(),await Z(e,"task",t,"comment_added",{comment_id:s,content_preview:r.content.substring(0,100)}),at(e,s)}async function Fs(e,t,r){const s=await at(e,t);if(!s)return null;const a=[],n=[];return r.content!==void 0&&r.content!==s.content&&(a.push("content = ?"),n.push(r.content)),a.length===0?s:(a.push("updated_at = ?"),n.push(w()),n.push(t),await e.prepare(`
    UPDATE comments SET ${a.join(", ")} WHERE id = ?
  `).bind(...n).run(),await Z(e,"task",s.task_id,"comment_edited",{comment_id:t}),at(e,t))}async function Ms(e,t){const r=await at(e,t);if(!r)return!1;const s=await e.prepare("DELETE FROM comments WHERE id = ?").bind(t).run();return s.meta.changes>0&&await Z(e,"task",r.task_id,"comment_deleted",{comment_id:t}),s.meta.changes>0}async function qs(e,t){const r=await e.prepare(`
    SELECT COUNT(*) as count FROM comments WHERE task_id = ?
  `).bind(t).first();return(r==null?void 0:r.count)||0}function nt(e,t){const r=new Date(e);switch(t.type){case"daily":r.setDate(r.getDate()+t.interval);break;case"weekly":if(t.weekdays&&t.weekdays.length>0){const s=r.getDay(),a=[...t.weekdays].sort((o,i)=>o-i);let n=!1;for(const o of a)if(o>s){r.setDate(r.getDate()+(o-s)),n=!0;break}if(!n){const o=7-s+a[0];r.setDate(r.getDate()+o+(t.interval-1)*7)}}else r.setDate(r.getDate()+7*t.interval);break;case"monthly":if(t.monthDay){r.setMonth(r.getMonth()+t.interval);const s=new Date(r.getFullYear(),r.getMonth()+1,0).getDate();r.setDate(Math.min(t.monthDay,s))}else if(t.monthWeek!==void 0&&t.monthWeekday!==void 0){r.setMonth(r.getMonth()+t.interval),r.setDate(1);const s=t.monthWeekday,a=t.monthWeek;if(a>0){let n=0;for(;n<a&&!(r.getDay()===s&&(n++,n===a));)r.setDate(r.getDate()+1)}else{const n=new Date(r.getFullYear(),r.getMonth()+1,0).getDate();for(r.setDate(n);r.getDay()!==s;)r.setDate(r.getDate()-1)}}else{const s=r.getDate();r.setMonth(r.getMonth()+t.interval);const a=new Date(r.getFullYear(),r.getMonth()+1,0).getDate();r.setDate(Math.min(s,a))}break;case"custom":r.setDate(r.getDate()+t.interval);break}return r.toISOString().split("T")[0]}async function Bs(e,t){if(!t.recurrence_rule)return null;const r=(t.recurrence_completed_count||0)+1;if(t.recurrence_count&&r>=t.recurrence_count)return null;const s=t.due_date?nt(t.due_date,t.recurrence_rule):nt(w().split("T")[0],t.recurrence_rule);if(t.recurrence_end_date&&s>t.recurrence_end_date)return null;await z(e,t.original_task_id||t.id,{recurrence_completed_count:r});const a=K("task"),n=w(),o=await e.prepare(`
    SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM tasks WHERE column_id = ?
  `).bind(t.column_id).first(),i=(o==null?void 0:o.next_pos)||0,c=JSON.stringify(t.tags||[]),d=JSON.stringify(t.recurrence_rule),p=t.original_task_id||t.id;if(await e.prepare(`
    INSERT INTO tasks (id, board_id, column_id, title, description, priority, due_date, tags, position, recurrence_rule, recurrence_end_date, recurrence_count, recurrence_completed_count, original_task_id, is_recurrence_instance, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).bind(a,t.board_id,t.column_id,t.title,t.description,t.priority,s,c,i,d,t.recurrence_end_date,t.recurrence_count,r,p,n,n).run(),t.subtasks&&t.subtasks.length>0)for(let u=0;u<t.subtasks.length;u++){const g=t.subtasks[u],E=K("sub");await e.prepare(`
        INSERT INTO subtasks (id, task_id, title, is_completed, position, created_at, updated_at)
        VALUES (?, ?, ?, 0, ?, ?, ?)
      `).bind(E,a,g.title,u,n,n).run()}return M(e,a)}function $s(e){const t=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],r=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];switch(e.type){case"daily":return e.interval===1?"Daily":`Every ${e.interval} days`;case"weekly":if(e.weekdays&&e.weekdays.length>0){if(e.weekdays.length===7)return"Every day";if(e.weekdays.length===5&&e.weekdays.includes(1)&&e.weekdays.includes(2)&&e.weekdays.includes(3)&&e.weekdays.includes(4)&&e.weekdays.includes(5))return"Weekdays";const s=e.weekdays.map(a=>r[a]).join(", ");return e.interval===1?`Weekly on ${s}`:`Every ${e.interval} weeks on ${s}`}return e.interval===1?"Weekly":`Every ${e.interval} weeks`;case"monthly":if(e.monthDay){const s=Bt(e.monthDay);return e.interval===1?`Monthly on the ${e.monthDay}${s}`:`Every ${e.interval} months on the ${e.monthDay}${s}`}if(e.monthWeek!==void 0&&e.monthWeekday!==void 0){const s=e.monthWeek===-1?"last":Bt(e.monthWeek),a=e.monthWeek===-1?"":`${e.monthWeek}`,n=t[e.monthWeekday];return e.interval===1?`Monthly on the ${a}${s} ${n}`:`Every ${e.interval} months on the ${a}${s} ${n}`}return e.interval===1?"Monthly":`Every ${e.interval} months`;case"custom":return`Every ${e.interval} days`;default:return"Recurring"}}function Bt(e){const t=["th","st","nd","rd"],r=e%100;return t[(r-20)%10]||t[r]||t[0]}async function Ps(e,t){const r={boards:[],columns:[],tasks:[]};if(!t||t==="board"){const s=await e.prepare("SELECT * FROM boards WHERE deleted_at IS NOT NULL").all();r.boards=s.results||[]}if(!t||t==="column"){const s=await e.prepare("SELECT * FROM columns WHERE deleted_at IS NOT NULL").all();r.columns=s.results||[]}if(!t||t==="task"){const s=await e.prepare("SELECT * FROM tasks WHERE deleted_at IS NOT NULL").all();r.tasks=(s.results||[]).map(a=>({...a,tags:typeof a.tags=="string"?JSON.parse(a.tags):a.tags,recurrence_rule:a.recurrence_rule?typeof a.recurrence_rule=="string"?JSON.parse(a.recurrence_rule):a.recurrence_rule:null,is_recurrence_instance:!!a.is_recurrence_instance}))}return r}async function Hs(e,t,r){const s=t==="board"?"boards":t==="column"?"columns":"tasks";return(await e.prepare(`
    UPDATE ${s} SET deleted_at = NULL, updated_at = ? WHERE id = ?
  `).bind(w(),r).run()).meta.changes>0}async function Z(e,t,r,s,a={}){const n=K("activity"),o=w();await e.prepare(`
    INSERT INTO activity_log (id, entity_type, entity_id, action, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(n,t,r,s,JSON.stringify(a),o).run()}async function ur(e,t={}){let r="SELECT * FROM activity_log WHERE 1=1";const s=[];return t.entityType&&t.entityId?(r+=" AND entity_type = ? AND entity_id = ?",s.push(t.entityType,t.entityId)):t.boardId&&(r+=` AND (
      (entity_type = 'task' AND entity_id IN (SELECT id FROM tasks WHERE board_id = ?))
      OR (entity_type = 'board' AND entity_id = ?)
      OR (entity_type = 'column' AND entity_id IN (SELECT id FROM columns WHERE board_id = ?))
    )`,s.push(t.boardId,t.boardId,t.boardId)),t.action&&(r+=" AND action = ?",s.push(t.action)),r+=" ORDER BY created_at DESC",t.limit&&(r+=" LIMIT ?",s.push(t.limit),t.offset&&(r+=" OFFSET ?",s.push(t.offset))),((await e.prepare(r).bind(...s).all()).results||[]).map(o=>({...o,details:typeof o.details=="string"?JSON.parse(o.details):o.details}))}const ze={READ:{windowMs:60*1e3,maxRequests:100,message:"Too many requests. Please try again later."},WRITE:{windowMs:60*1e3,maxRequests:30,message:"Too many write requests. Please slow down."},SEARCH:{windowMs:60*1e3,maxRequests:50,message:"Too many search requests. Please try again later."}},Me={};function Ws(e){const t=e.req.header("cf-connecting-ip");if(t)return t;const r=e.req.header("x-forwarded-for");if(r)return r.split(",")[0].trim();const s=e.req.header("x-real-ip");return s||"unknown"}function Xs(){const e=Date.now();for(const t in Me)Me[t].resetTime<e&&delete Me[t]}function Vs(e){return async(t,r)=>{const s=Ws(t),a=Date.now(),n=`${s}:${e.windowMs}`;Math.random()<.1&&Xs();const o=Me[n];if(!o||o.resetTime<a){Me[n]={count:1,resetTime:a+e.windowMs},await r();return}if(o.count++,o.count>e.maxRequests){const i=Math.ceil((o.resetTime-a)/1e3);return t.json({success:!1,error:{code:"RATE_LIMIT_EXCEEDED",message:e.message||"Too many requests. Please try again later.",retryAfter:i}},429,{"Retry-After":i.toString(),"X-RateLimit-Limit":e.maxRequests.toString(),"X-RateLimit-Remaining":"0","X-RateLimit-Reset":new Date(o.resetTime).toISOString()})}t.header("X-RateLimit-Limit",e.maxRequests.toString()),t.header("X-RateLimit-Remaining",Math.max(0,e.maxRequests-o.count).toString()),t.header("X-RateLimit-Reset",new Date(o.resetTime).toISOString()),await r()}}function Gs(){return async(e,t)=>{const r=e.req.method;let s;return r==="GET"?s=ze.READ:r==="POST"&&e.req.path.includes("/search")?s=ze.SEARCH:["POST","PATCH","PUT","DELETE"].includes(r)?s=ze.WRITE:s=ze.READ,Vs(s)(e,t)}}function Ys(e){return(e||"development")==="production"?["info","warn","error"]:["debug","info","warn","error"]}function Js(e,t){return e instanceof Error?{name:e.name,message:e.message,code:e.code,stack:t==="development"?e.stack:void 0}:typeof e=="string"?{name:"Error",message:e}:{name:"UnknownError",message:"An unknown error occurred"}}function Ke(e,t,r,s,a){const n={level:e,message:t,timestamp:new Date().toISOString(),context:r};return s&&(n.error=Js(s,a)),n}function Qe(e,t){if((t||"development")==="production")console.log(JSON.stringify(e));else{const s=`[${e.level.toUpperCase()}] ${e.timestamp}`,a=e.context?` ${JSON.stringify(e.context)}`:"",n=e.error?`
  Error: ${e.error.name}: ${e.error.message}${e.error.stack?`
  ${e.error.stack}`:""}`:"";console.log(`${s} ${e.message}${a}${n}`)}}class wt{constructor(t){h(this,"environment");h(this,"enabledLevels");h(this,"context");this.environment=t,this.enabledLevels=Ys(t)}debug(t,r){this.enabledLevels.includes("debug")&&Qe(Ke("debug",t,r),this.environment)}info(t,r){this.enabledLevels.includes("info")&&Qe(Ke("info",t,r),this.environment)}warn(t,r,s){this.enabledLevels.includes("warn")&&Qe(Ke("warn",t,r,s,this.environment),this.environment)}error(t,r,s){this.enabledLevels.includes("error")&&Qe(Ke("error",t,r,s,this.environment),this.environment)}withContext(t){const s={requestId:t.get("requestId"),path:t.req.path,method:t.req.method},a=new wt(this.environment);return a.context=s,a}getContext(){return this.context}}function pr(e){return new wt(e)}function m(e){const t=e.get("logger");if(t)return t;const r=e.env.ENVIRONMENT;return pr(r).withContext(e)}function zs(e){const t=[],r=[];if(e.DB||t.push("DB (D1Database) is required but not found"),(e.ENVIRONMENT||"development")==="production")if(!e.ALLOWED_ORIGINS||e.ALLOWED_ORIGINS.trim().length===0)r.push("ALLOWED_ORIGINS is not set in production. CORS will be restricted to same-origin only.");else{const n=e.ALLOWED_ORIGINS.split(",").map(o=>o.trim()).filter(o=>{try{return new URL(o),!1}catch{return!0}});n.length>0&&t.push(`Invalid origins in ALLOWED_ORIGINS: ${n.join(", ")}`)}return e.ENVIRONMENT&&!["development","production","staging"].includes(e.ENVIRONMENT)&&r.push(`ENVIRONMENT has unexpected value: ${e.ENVIRONMENT}. Expected: development, production, or staging`),{valid:t.length===0,errors:t,warnings:r}}const oe={TITLE_MAX:500,DESCRIPTION_MAX:1e4,COMMENT_MAX:5e3,NAME_MAX:200,TAG_MAX_LENGTH:50,TAG_MAX_COUNT:20};function dt(e,t,r=1,s=1/0){return typeof e!="string"?{valid:!1,error:`${t} must be a string`}:e.length<r?{valid:!1,error:`${t} must be at least ${r} characters`}:e.length>s?{valid:!1,error:`${t} must be at most ${s} characters`}:{valid:!0}}function Ks(e){if(!e)return{valid:!1,error:"Title is required"};const t=typeof e=="string"?e.trim():"";return t.length===0?{valid:!1,error:"Title cannot be empty"}:dt(t,"Title",1,oe.TITLE_MAX)}function gr(e){return e==null?{valid:!0}:typeof e!="string"?{valid:!1,error:"Description must be a string"}:dt(e,"Description",0,oe.DESCRIPTION_MAX)}function Qs(e){if(!e)return{valid:!1,error:"Comment content is required"};if(typeof e!="string")return{valid:!1,error:"Comment content must be a string"};const t=e.trim();return t.length===0?{valid:!1,error:"Comment content cannot be empty"}:dt(t,"Comment",1,oe.COMMENT_MAX)}function Zs(e){if(!e)return{valid:!1,error:"Name is required"};if(typeof e!="string")return{valid:!1,error:"Name must be a string"};const t=e.trim();return t.length===0?{valid:!1,error:"Name cannot be empty"}:dt(t,"Name",1,oe.NAME_MAX)}function hr(e){const t=["low","medium","high"];return typeof e!="string"?{valid:!1,error:"Priority must be a string"}:t.includes(e)?{valid:!0}:{valid:!1,error:`Priority must be one of: ${t.join(", ")}`}}function ea(e){if(e==null)return{valid:!0};if(!Array.isArray(e))return{valid:!1,error:"Tags must be an array"};if(e.length>oe.TAG_MAX_COUNT)return{valid:!1,error:`Tags cannot exceed ${oe.TAG_MAX_COUNT} items`};for(const t of e){if(typeof t!="string")return{valid:!1,error:"All tags must be strings"};const r=t.trim();if(r.length===0)return{valid:!1,error:"Tags cannot be empty strings"};if(r.length>oe.TAG_MAX_LENGTH)return{valid:!1,error:`Tag length cannot exceed ${oe.TAG_MAX_LENGTH} characters`}}return{valid:!0}}function ta(e){if(e==null)return{valid:!0};if(typeof e!="string")return{valid:!1,error:"Date must be a string"};const t=new Date(e);return isNaN(t.getTime())?{valid:!1,error:"Date must be a valid ISO date string"}:{valid:!0}}function ot(e,t="ID"){return e?typeof e!="string"?{valid:!1,error:`${t} must be a string`}:e.trim().length===0?{valid:!1,error:`${t} cannot be empty`}:/^[a-zA-Z0-9_-]+$/.test(e)?{valid:!0}:{valid:!1,error:`${t} contains invalid characters`}:{valid:!1,error:`${t} is required`}}function ra(e){const t=["position","due_date","priority","updated_at","created_at","title"];return typeof e!="string"?{valid:!1,error:"Sort field must be a string"}:t.includes(e)?{valid:!0}:{valid:!1,error:`Sort field must be one of: ${t.join(", ")}`}}function sa(e){const t=["asc","desc"];if(typeof e!="string")return{valid:!1,error:"Sort order must be a string"};const r=e.toLowerCase();return t.includes(r)?{valid:!0}:{valid:!1,error:`Sort order must be one of: ${t.join(", ")}`}}function qe(e){return e.trim().replace(/[\x00-\x1F\x7F]/g,"").replace(/\s+/g," ")}const Le=new W;Le.get("/",async e=>{try{const t=e.req.query("include_archived")==="true",r=e.req.query("include_deleted")==="true",s=await bs(e.env.DB,{includeArchived:t,includeDeleted:r});return e.json({success:!0,data:s})}catch(t){const r=m(e),s=e.req.query("include_archived")==="true",a=e.req.query("include_deleted")==="true";return r.error("Error fetching boards",{includeArchived:s,includeDeleted:a},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to fetch boards"}},500)}});Le.get("/:boardId",async e=>{try{const t=e.req.param("boardId"),r=await dr(e.env.DB,t);return r?e.json({success:!0,data:r}):e.json({success:!1,error:{code:"NOT_FOUND",message:"Board not found"}},404)}catch(t){return m(e).error("Error fetching board",{boardId:e.req.param("boardId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to fetch board"}},500)}});Le.post("/",async e=>{try{const t=await e.req.json(),r=Zs(t.name);if(!r.valid)return e.json({success:!1,error:{code:"VALIDATION_ERROR",message:r.error}},400);if(t.description!==void 0){const o=gr(t.description);if(!o.valid)return e.json({success:!1,error:{code:"VALIDATION_ERROR",message:o.error}},400)}const s=qe(t.name),a=t.description?qe(t.description):void 0,n=await Ts(e.env.DB,{name:s,description:a,icon:t.icon,color:t.color,background_type:t.background_type,background_value:t.background_value,template:t.template});return e.json({success:!0,data:n},201)}catch(t){const r=m(e),s=await e.req.json().catch(()=>({}));return r.error("Error creating board",{boardName:s.name},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to create board"}},500)}});Le.patch("/:boardId",async e=>{try{const t=e.req.param("boardId"),r=await e.req.json(),s=await ks(e.env.DB,t,r);return s?e.json({success:!0,data:s}):e.json({success:!1,error:{code:"NOT_FOUND",message:"Board not found"}},404)}catch(t){return m(e).error("Error updating board",{boardId:e.req.param("boardId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to update board"}},500)}});Le.delete("/:boardId",async e=>{try{const t=e.req.param("boardId"),r=e.req.query("hard")==="true";return await Rs(e.env.DB,t,r)?e.json({success:!0,data:{deleted:!0}}):e.json({success:!1,error:{code:"NOT_FOUND",message:"Board not found"}},404)}catch(t){const r=m(e),s=e.req.param("boardId"),a=e.req.query("hard")==="true";return r.error("Error deleting board",{boardId:s,hardDelete:a},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to delete board"}},500)}});const Ve=new W;Ve.get("/boards/:boardId/columns",async e=>{try{const t=e.req.param("boardId"),r=e.req.query("include_deleted")==="true",s=await ws(e.env.DB,t,{includeDeleted:r});return e.json({success:!0,data:s})}catch(t){return m(e).error("Error fetching columns",{boardId:e.req.param("boardId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to fetch columns"}},500)}});Ve.post("/boards/:boardId/columns",async e=>{try{const t=e.req.param("boardId"),r=await e.req.json();if(!r.name||typeof r.name!="string")return e.json({success:!1,error:{code:"VALIDATION_ERROR",message:"Name is required"}},400);const s=await Ns(e.env.DB,t,{name:r.name,position:r.position});return e.json({success:!0,data:s},201)}catch(t){return m(e).error("Error creating column",{boardId:e.req.param("boardId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to create column"}},500)}});Ve.patch("/columns/:columnId",async e=>{try{const t=e.req.param("columnId"),r=await e.req.json(),s=await Is(e.env.DB,t,r);return s?e.json({success:!0,data:s}):e.json({success:!1,error:{code:"NOT_FOUND",message:"Column not found"}},404)}catch(t){return m(e).error("Error updating column",{columnId:e.req.param("columnId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to update column"}},500)}});Ve.delete("/columns/:columnId",async e=>{try{const t=e.req.param("columnId");return await Os(e.env.DB,t)?e.json({success:!0,data:{deleted:!0}}):e.json({success:!1,error:{code:"NOT_FOUND",message:"Column not found"}},404)}catch(t){return m(e).error("Error deleting column",{columnId:e.req.param("columnId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to delete column"}},500)}});const C=new W;C.get("/boards/:boardId/tasks",async e=>{try{const t=e.req.param("boardId"),r=e.req.query("column_id"),s=e.req.query("priority"),a=e.req.query("tag"),n=e.req.query("include_archived")==="true",o=e.req.query("include_deleted")==="true",i=e.req.query("sort"),c=e.req.query("order"),d=ot(t,"Board ID");if(!d.valid)return e.json({success:!1,error:{code:"VALIDATION_ERROR",message:d.error}},400);if(i){const u=ra(i);if(!u.valid)return e.json({success:!1,error:{code:"VALIDATION_ERROR",message:u.error}},400)}if(c){const u=sa(c);if(!u.valid)return e.json({success:!1,error:{code:"VALIDATION_ERROR",message:u.error}},400)}if(s){const u=hr(s);if(!u.valid)return e.json({success:!1,error:{code:"VALIDATION_ERROR",message:u.error}},400)}const p=await Ds(e.env.DB,t,{columnId:r,priority:s,tag:a,includeArchived:n,includeDeleted:o,sort:i,order:c});return e.json({success:!0,data:p})}catch(t){return m(e).error("Error fetching tasks",{boardId:e.req.param("boardId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to fetch tasks"}},500)}});C.get("/tasks/:taskId",async e=>{try{const t=e.req.param("taskId"),r=await M(e.env.DB,t);return r?e.json({success:!0,data:r}):e.json({success:!1,error:{code:"NOT_FOUND",message:"Task not found"}},404)}catch(t){return m(e).error("Error fetching task",{taskId:e.req.param("taskId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to fetch task"}},500)}});C.post("/boards/:boardId/tasks",async e=>{try{const t=e.req.param("boardId"),r=await e.req.json(),s=ot(t,"Board ID");if(!s.valid)return e.json({success:!1,error:{code:"VALIDATION_ERROR",message:s.error}},400);const a=Ks(r.title);if(!a.valid)return e.json({success:!1,error:{code:"VALIDATION_ERROR",message:a.error}},400);const n=ot(r.column_id,"Column ID");if(!n.valid)return e.json({success:!1,error:{code:"VALIDATION_ERROR",message:n.error}},400);if(r.description!==void 0){const d=gr(r.description);if(!d.valid)return e.json({success:!1,error:{code:"VALIDATION_ERROR",message:d.error}},400)}if(r.priority!==void 0){const d=hr(r.priority);if(!d.valid)return e.json({success:!1,error:{code:"VALIDATION_ERROR",message:d.error}},400)}if(r.tags!==void 0){const d=ea(r.tags);if(!d.valid)return e.json({success:!1,error:{code:"VALIDATION_ERROR",message:d.error}},400)}if(r.due_date!==void 0&&r.due_date!==null){const d=ta(r.due_date);if(!d.valid)return e.json({success:!1,error:{code:"VALIDATION_ERROR",message:d.error}},400)}const o=qe(r.title),i=r.description?qe(r.description):void 0,c=await xs(e.env.DB,t,{column_id:r.column_id,title:o,description:i,priority:r.priority,due_date:r.due_date,tags:r.tags,position:r.position,recurrence_rule:r.recurrence_rule,recurrence_end_date:r.recurrence_end_date,recurrence_count:r.recurrence_count});return e.json({success:!0,data:c},201)}catch(t){return m(e).error("Error creating task",{boardId:e.req.param("boardId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to create task"}},500)}});C.patch("/tasks/:taskId",async e=>{try{const t=e.req.param("taskId"),r=await e.req.json(),s=await z(e.env.DB,t,r);return s?e.json({success:!0,data:s}):e.json({success:!1,error:{code:"NOT_FOUND",message:"Task not found"}},404)}catch(t){return m(e).error("Error updating task",{taskId:e.req.param("taskId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to update task"}},500)}});C.delete("/tasks/:taskId",async e=>{try{const t=e.req.param("taskId");return await lr(e.env.DB,t)?e.json({success:!0,data:{deleted:!0}}):e.json({success:!1,error:{code:"NOT_FOUND",message:"Task not found"}},404)}catch(t){return m(e).error("Error deleting task",{taskId:e.req.param("taskId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to delete task"}},500)}});C.post("/tasks/:taskId/archive",async e=>{try{const t=e.req.param("taskId"),r=await z(e.env.DB,t,{archived_at:new Date().toISOString()});return r?e.json({success:!0,data:r}):e.json({success:!1,error:{code:"NOT_FOUND",message:"Task not found"}},404)}catch(t){return m(e).error("Error archiving task",{taskId:e.req.param("taskId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to archive task"}},500)}});C.post("/tasks/:taskId/unarchive",async e=>{try{const t=e.req.param("taskId"),r=await z(e.env.DB,t,{archived_at:null});return r?e.json({success:!0,data:r}):e.json({success:!1,error:{code:"NOT_FOUND",message:"Task not found"}},404)}catch(t){return m(e).error("Error unarchiving task",{taskId:e.req.param("taskId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to unarchive task"}},500)}});C.post("/tasks/:taskId/complete-recurring",async e=>{try{const t=e.req.param("taskId"),r=await e.req.json(),s=r.action||"archive",a=r.done_column_id,n=await M(e.env.DB,t);if(!n)return e.json({success:!1,error:{code:"NOT_FOUND",message:"Task not found"}},404);if(!n.recurrence_rule)return e.json({success:!1,error:{code:"VALIDATION_ERROR",message:"Task is not recurring"}},400);const o=await Bs(e.env.DB,n);let i;return s==="archive"?i=await z(e.env.DB,t,{archived_at:new Date().toISOString()}):s==="delete"?(await lr(e.env.DB,t),i=null):s==="complete"&&a&&(i=await z(e.env.DB,t,{column_id:a})),e.json({success:!0,data:{completed_task:i,next_task:o,has_more_recurrences:o!==null}})}catch(t){return m(e).error("Error completing recurring task",{taskId:e.req.param("taskId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to complete recurring task"}},500)}});C.post("/tasks/:taskId/skip-occurrence",async e=>{try{const t=e.req.param("taskId"),r=await M(e.env.DB,t);if(!r)return e.json({success:!1,error:{code:"NOT_FOUND",message:"Task not found"}},404);if(!r.recurrence_rule)return e.json({success:!1,error:{code:"VALIDATION_ERROR",message:"Task is not recurring"}},400);const s=r.due_date?nt(r.due_date,r.recurrence_rule):nt(new Date().toISOString().split("T")[0],r.recurrence_rule);if(r.recurrence_end_date&&s>r.recurrence_end_date){const o=await z(e.env.DB,t,{recurrence_rule:null,recurrence_end_date:null,recurrence_count:null});return e.json({success:!0,data:{task:o,skipped:!1,message:"Recurrence ended - past end date"}})}const a=(r.recurrence_completed_count||0)+1;if(r.recurrence_count&&a>=r.recurrence_count){const o=await z(e.env.DB,t,{recurrence_rule:null,recurrence_end_date:null,recurrence_count:null,recurrence_completed_count:a});return e.json({success:!0,data:{task:o,skipped:!1,message:"Recurrence ended - reached occurrence limit"}})}const n=await z(e.env.DB,t,{due_date:s,recurrence_completed_count:a});return e.json({success:!0,data:{task:n,skipped:!0,next_due_date:s}})}catch(t){return m(e).error("Error skipping occurrence",{taskId:e.req.param("taskId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to skip occurrence"}},500)}});C.get("/tasks/:taskId/recurrence-summary",async e=>{try{const t=e.req.param("taskId"),r=await M(e.env.DB,t);if(!r)return e.json({success:!1,error:{code:"NOT_FOUND",message:"Task not found"}},404);if(!r.recurrence_rule)return e.json({success:!0,data:{is_recurring:!1,summary:null}});const s=$s(r.recurrence_rule);return e.json({success:!0,data:{is_recurring:!0,summary:s,rule:r.recurrence_rule,end_date:r.recurrence_end_date,count:r.recurrence_count,completed_count:r.recurrence_completed_count}})}catch(t){return m(e).error("Error getting recurrence summary",{taskId:e.req.param("taskId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to get recurrence summary"}},500)}});C.get("/boards/:boardId/archive",async e=>{try{const t=e.req.param("boardId"),s=(await e.env.DB.prepare(`
      SELECT t.*, c.name as column_name
      FROM tasks t
      LEFT JOIN columns c ON t.column_id = c.id
      WHERE t.board_id = ? AND t.archived_at IS NOT NULL AND t.deleted_at IS NULL
      ORDER BY t.archived_at DESC
    `).bind(t).all()).results.map(a=>({...a,tags:a.tags?JSON.parse(a.tags):[],recurrence_rule:a.recurrence_rule?JSON.parse(a.recurrence_rule):null,is_recurrence_instance:!!a.is_recurrence_instance}));return e.json({success:!0,data:s})}catch(t){return m(e).error("Error fetching archived tasks",{boardId:e.req.param("boardId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to fetch archived tasks"}},500)}});C.post("/boards/:boardId/archive-all",async e=>{try{const t=e.req.param("boardId"),s=(await e.req.json()).column_id;if(!s)return e.json({success:!1,error:{code:"VALIDATION_ERROR",message:"Column ID is required"}},400);const a=new Date().toISOString(),n=await e.env.DB.prepare(`
      UPDATE tasks 
      SET archived_at = ?, updated_at = ?
      WHERE board_id = ? AND column_id = ? AND archived_at IS NULL AND deleted_at IS NULL
    `).bind(a,a,t,s).run();return e.json({success:!0,data:{archived_count:n.meta.changes}})}catch(t){return m(e).error("Error archiving all tasks",{boardId:e.req.param("boardId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to archive tasks"}},500)}});C.post("/boards/:boardId/auto-archive",async e=>{try{const t=e.req.param("boardId"),r=new Date,s=await e.env.DB.prepare(`
      SELECT id, auto_archive_days FROM columns 
      WHERE board_id = ? AND auto_archive = 1 AND deleted_at IS NULL
    `).bind(t).all();let a=0;for(const n of s.results){const o=n,c=new Date(r.getTime()-o.auto_archive_days*24*60*60*1e3).toISOString(),d=await e.env.DB.prepare(`
        UPDATE tasks 
        SET archived_at = ?, updated_at = ?
        WHERE column_id = ? AND archived_at IS NULL AND deleted_at IS NULL
        AND updated_at < ?
      `).bind(r.toISOString(),r.toISOString(),o.id,c).run();a+=d.meta.changes||0}return e.json({success:!0,data:{archived_count:a}})}catch(t){return m(e).error("Error processing auto-archive",{boardId:e.req.param("boardId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to process auto-archive"}},500)}});C.get("/search",async e=>{try{const t=e.req.query("q")||"",r=e.req.query("board_id"),s=e.req.query("priority"),a=e.req.query("due"),n=e.req.query("tag"),o=parseInt(e.req.query("limit")||"50");if(t.length<1&&!s&&!a&&!n)return e.json({success:!0,data:[]});let i=`
      SELECT 
        t.id, t.board_id, t.column_id, t.title, t.description, t.priority, 
        t.due_date, t.tags, t.position, t.created_at, t.updated_at, t.archived_at,
        b.name as board_name, b.icon as board_icon,
        c.name as column_name
      FROM tasks t
      LEFT JOIN boards b ON t.board_id = b.id
      LEFT JOIN columns c ON t.column_id = c.id
      WHERE t.deleted_at IS NULL AND t.archived_at IS NULL
        AND b.deleted_at IS NULL
    `;const c=[];if(t){i+=` AND (
        t.title LIKE ? OR 
        t.description LIKE ? OR 
        t.tags LIKE ?
      )`;const u=`%${t}%`;c.push(u,u,u)}if(r&&(i+=" AND t.board_id = ?",c.push(r)),s&&(i+=" AND t.priority = ?",c.push(s)),n&&(i+=" AND t.tags LIKE ?",c.push(`%"${n}"%`)),a){const u=new Date;u.setHours(0,0,0,0);const g=u.toISOString().split("T")[0],E=new Date(u);E.setDate(u.getDate()+7);const T=E.toISOString().split("T")[0];switch(a){case"overdue":i+=" AND DATE(t.due_date) < DATE(?)",c.push(g);break;case"today":i+=" AND DATE(t.due_date) = DATE(?)",c.push(g);break;case"week":i+=" AND DATE(t.due_date) >= DATE(?) AND DATE(t.due_date) <= DATE(?)",c.push(g,T);break;case"no_date":i+=" AND t.due_date IS NULL";break}}i+=" ORDER BY t.updated_at DESC LIMIT ?",c.push(o);const p=((await e.env.DB.prepare(i).bind(...c).all()).results||[]).map(u=>({...u,tags:u.tags?JSON.parse(u.tags):[],recurrence_rule:u.recurrence_rule?JSON.parse(u.recurrence_rule):null,is_recurrence_instance:!!u.is_recurrence_instance}));return e.json({success:!0,data:p})}catch(t){return m(e).error("Error searching tasks",{boardId:e.req.param("boardId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to search tasks"}},500)}});const Ge=new W;Ge.get("/tasks/:taskId/subtasks",async e=>{try{const t=e.req.param("taskId"),r=await Ls(e.env.DB,t);return e.json({success:!0,data:r})}catch(t){return m(e).error("Error fetching subtasks",{taskId:e.req.param("taskId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to fetch subtasks"}},500)}});Ge.post("/tasks/:taskId/subtasks",async e=>{try{const t=e.req.param("taskId"),r=await e.req.json();if(!r.title||typeof r.title!="string")return e.json({success:!1,error:{code:"VALIDATION_ERROR",message:"Title is required"}},400);if(!await M(e.env.DB,t))return e.json({success:!1,error:{code:"NOT_FOUND",message:"Task not found"}},404);const a=await As(e.env.DB,t,{title:r.title,position:r.position});return e.json({success:!0,data:a},201)}catch(t){return m(e).error("Error creating subtask",{taskId:e.req.param("taskId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to create subtask"}},500)}});Ge.patch("/subtasks/:subtaskId",async e=>{try{const t=e.req.param("subtaskId"),r=await e.req.json(),s=await Ss(e.env.DB,t,r);return s?e.json({success:!0,data:s}):e.json({success:!1,error:{code:"NOT_FOUND",message:"Subtask not found"}},404)}catch(t){return m(e).error("Error updating subtask",{subtaskId:e.req.param("subtaskId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to update subtask"}},500)}});Ge.delete("/subtasks/:subtaskId",async e=>{try{const t=e.req.param("subtaskId");return await Cs(e.env.DB,t)?e.json({success:!0,data:{deleted:!0}}):e.json({success:!1,error:{code:"NOT_FOUND",message:"Subtask not found"}},404)}catch(t){return m(e).error("Error deleting subtask",{subtaskId:e.req.param("subtaskId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to delete subtask"}},500)}});const Ae=new W;Ae.get("/tasks/:taskId/comments",async e=>{try{const t=e.req.param("taskId");if(!await M(e.env.DB,t))return e.json({success:!1,error:{code:"NOT_FOUND",message:"Task not found"}},404);const s=await js(e.env.DB,t);return e.json({success:!0,data:s})}catch(t){return m(e).error("Error fetching comments",{taskId:e.req.param("taskId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to fetch comments"}},500)}});Ae.post("/tasks/:taskId/comments",async e=>{try{const t=e.req.param("taskId"),r=await e.req.json(),s=ot(t,"Task ID");if(!s.valid)return e.json({success:!1,error:{code:"VALIDATION_ERROR",message:s.error}},400);const a=Qs(r.content);if(!a.valid)return e.json({success:!1,error:{code:"VALIDATION_ERROR",message:a.error}},400);if(!await M(e.env.DB,t))return e.json({success:!1,error:{code:"NOT_FOUND",message:"Task not found"}},404);const o=qe(r.content),i=await Us(e.env.DB,t,{content:o});return e.json({success:!0,data:i},201)}catch(t){return m(e).error("Error creating comment",{taskId:e.req.param("taskId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to create comment"}},500)}});Ae.patch("/comments/:commentId",async e=>{var t;try{const r=e.req.param("commentId"),s=await e.req.json();if(s.content!==void 0&&(typeof s.content!="string"||s.content.trim()===""))return e.json({success:!1,error:{code:"VALIDATION_ERROR",message:"Comment content cannot be empty"}},400);const a=await Fs(e.env.DB,r,{content:(t=s.content)==null?void 0:t.trim()});return a?e.json({success:!0,data:a}):e.json({success:!1,error:{code:"NOT_FOUND",message:"Comment not found"}},404)}catch(r){return m(e).error("Error updating comment",{commentId:e.req.param("commentId")},r),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to update comment"}},500)}});Ae.delete("/comments/:commentId",async e=>{try{const t=e.req.param("commentId");return await Ms(e.env.DB,t)?e.json({success:!0,data:{deleted:!0}}):e.json({success:!1,error:{code:"NOT_FOUND",message:"Comment not found"}},404)}catch(t){return m(e).error("Error deleting comment",{commentId:e.req.param("commentId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to delete comment"}},500)}});Ae.get("/tasks/:taskId/comments/count",async e=>{try{const t=e.req.param("taskId"),r=await qs(e.env.DB,t);return e.json({success:!0,data:{count:r}})}catch(t){return m(e).error("Error fetching comment count",{taskId:e.req.param("taskId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to fetch comment count"}},500)}});const Nt=new W;Nt.get("/",async e=>{try{const t=e.req.query("type"),r=await Ps(e.env.DB,t);return e.json({success:!0,data:r})}catch(t){return m(e).error("Error fetching trash",{type:e.req.query("type")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to fetch trash"}},500)}});Nt.post("/:type/:id/restore",async e=>{try{const t=e.req.param("type"),r=e.req.param("id");return["board","column","task"].includes(t)?await Hs(e.env.DB,t,r)?e.json({success:!0,data:{restored:!0}}):e.json({success:!1,error:{code:"NOT_FOUND",message:"Item not found in trash"}},404):e.json({success:!1,error:{code:"VALIDATION_ERROR",message:"Invalid type. Must be board, column, or task"}},400)}catch(t){return m(e).error("Error restoring from trash",{type:e.req.param("type"),id:e.req.param("id")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to restore item"}},500)}});const It=new W;It.get("/tasks/:taskId/activity",async e=>{try{const t=e.req.param("taskId"),r=e.req.query("action"),s=parseInt(e.req.query("limit")||"50"),a=parseInt(e.req.query("offset")||"0"),n=await ur(e.env.DB,{entityType:"task",entityId:t,action:r,limit:s,offset:a});return e.json({success:!0,data:n})}catch(t){return m(e).error("Error fetching task activity",{taskId:e.req.param("taskId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to fetch activity log"}},500)}});It.get("/boards/:boardId/activity",async e=>{try{const t=e.req.param("boardId"),r=e.req.query("action"),s=parseInt(e.req.query("limit")||"100"),a=parseInt(e.req.query("offset")||"0"),n=await ur(e.env.DB,{boardId:t,action:r,limit:s,offset:a});return e.json({success:!0,data:n})}catch(t){return m(e).error("Error fetching board activity",{boardId:e.req.param("boardId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to fetch activity log"}},500)}});const Ot=new W;function aa(){const e=new Date,t=new Date(e.getFullYear(),e.getMonth(),e.getDate()),r=t.toISOString().split("T")[0],s=new Date(t);s.setDate(t.getDate()-t.getDay());const a=s.toISOString().split("T")[0],n=new Date(s);n.setDate(s.getDate()+6);const o=n.toISOString().split("T")[0],c=new Date(e.getFullYear(),e.getMonth(),1).toISOString().split("T")[0],d=new Date(t);d.setDate(t.getDate()-30);const p=d.toISOString().split("T")[0],u=new Date(t);u.setDate(t.getDate()-56);const g=u.toISOString().split("T")[0];return{todayStr:r,startOfWeekStr:a,endOfWeekStr:o,startOfMonthStr:c,thirtyDaysAgoStr:p,eightWeeksAgoStr:g}}Ot.get("/",async e=>{try{const t=e.req.query("board_id"),r=aa(),s=t?"AND t.board_id = ?":"",a=t?[t]:[],n=`
      SELECT COUNT(*) as count FROM tasks t
      WHERE t.deleted_at IS NULL AND t.archived_at IS NULL
      ${s}
    `,o=await e.env.DB.prepare(n).bind(...a).first(),i=(o==null?void 0:o.count)||0,c=`
      SELECT COUNT(*) as count FROM tasks t
      WHERE t.deleted_at IS NULL AND t.archived_at IS NOT NULL
      ${s}
    `,d=await e.env.DB.prepare(c).bind(...a).first(),p=(d==null?void 0:d.count)||0,u=`
      SELECT COUNT(*) as count FROM tasks t
      WHERE t.deleted_at IS NULL AND t.archived_at IS NULL
      AND DATE(t.due_date) < DATE(?)
      ${s}
    `,g=await e.env.DB.prepare(u).bind(r.todayStr,...a).first(),E=(g==null?void 0:g.count)||0,T=`
      SELECT COUNT(*) as count FROM tasks t
      WHERE t.deleted_at IS NULL AND t.archived_at IS NULL
      AND DATE(t.due_date) = DATE(?)
      ${s}
    `,_=await e.env.DB.prepare(T).bind(r.todayStr,...a).first(),k=(_==null?void 0:_.count)||0,O=`
      SELECT COUNT(*) as count FROM tasks t
      WHERE t.deleted_at IS NULL AND t.archived_at IS NULL
      AND DATE(t.due_date) >= DATE(?) AND DATE(t.due_date) <= DATE(?)
      ${s}
    `,D=await e.env.DB.prepare(O).bind(r.todayStr,r.endOfWeekStr,...a).first(),me=(D==null?void 0:D.count)||0,ye=`
      SELECT COUNT(*) as count FROM tasks t
      WHERE t.deleted_at IS NULL AND t.archived_at IS NOT NULL
      AND DATE(t.archived_at) >= DATE(?)
      ${s}
    `,j=await e.env.DB.prepare(ye).bind(r.startOfWeekStr,...a).first(),lt=(j==null?void 0:j.count)||0,Ye=`
      SELECT COUNT(*) as count FROM tasks t
      WHERE t.deleted_at IS NULL AND t.archived_at IS NOT NULL
      AND DATE(t.archived_at) >= DATE(?)
      ${s}
    `,X=await e.env.DB.prepare(Ye).bind(r.startOfMonthStr,...a).first(),q=(X==null?void 0:X.count)||0,ut=t?`
      SELECT c.id as column_id, c.name as column_name, COUNT(t.id) as count
      FROM columns c
      LEFT JOIN tasks t ON t.column_id = c.id AND t.deleted_at IS NULL AND t.archived_at IS NULL
      WHERE c.board_id = ? AND c.deleted_at IS NULL
      GROUP BY c.id, c.name
      ORDER BY c.position ASC
    `:`
      SELECT c.id as column_id, c.name as column_name, COUNT(t.id) as count
      FROM columns c
      LEFT JOIN tasks t ON t.column_id = c.id AND t.deleted_at IS NULL AND t.archived_at IS NULL
      WHERE c.deleted_at IS NULL
      GROUP BY c.id, c.name
      ORDER BY c.position ASC
    `,B=await e.env.DB.prepare(ut).bind(...t?[t]:[]).all(),Se=(B.results||[]).reduce((v,x)=>v+x.count,0)||1,Dt=(B.results||[]).map(v=>({column_id:v.column_id,column_name:v.column_name,count:v.count,percentage:Math.round(v.count/Se*100)})),Er=`
      SELECT priority, COUNT(*) as count FROM tasks t
      WHERE t.deleted_at IS NULL AND t.archived_at IS NULL
      ${s}
      GROUP BY priority
    `,_r=await e.env.DB.prepare(Er).bind(...a).all(),pt=i||1,ie={high:0,medium:0,low:0};(_r.results||[]).forEach(v=>{ie[v.priority]=v.count});const vr=[{priority:"high",count:ie.high,percentage:Math.round(ie.high/pt*100)},{priority:"medium",count:ie.medium,percentage:Math.round(ie.medium/pt*100)},{priority:"low",count:ie.low,percentage:Math.round(ie.low/pt*100)}],br=`
      SELECT 
        DATE(t.archived_at) as date,
        COUNT(*) as completed
      FROM tasks t
      WHERE t.deleted_at IS NULL AND t.archived_at IS NOT NULL
      AND DATE(t.archived_at) >= DATE(?)
      ${s}
      GROUP BY DATE(t.archived_at)
      ORDER BY date ASC
    `,Tr=await e.env.DB.prepare(br).bind(r.thirtyDaysAgoStr,...a).all(),kr=`
      SELECT 
        DATE(t.created_at) as date,
        COUNT(*) as created
      FROM tasks t
      WHERE t.deleted_at IS NULL
      AND DATE(t.created_at) >= DATE(?)
      ${s}
      GROUP BY DATE(t.created_at)
      ORDER BY date ASC
    `,Rr=await e.env.DB.prepare(kr).bind(r.thirtyDaysAgoStr,...a).all(),Ee=new Map,wr=new Date(r.thirtyDaysAgoStr),Nr=new Date(r.todayStr);for(let v=new Date(wr);v<=Nr;v.setDate(v.getDate()+1)){const x=v.toISOString().split("T")[0];Ee.set(x,{date:x,completed:0,created:0})}(Tr.results||[]).forEach(v=>{const x=Ee.get(v.date)||{date:v.date,completed:0,created:0};x.completed=v.completed,Ee.set(v.date,x)}),(Rr.results||[]).forEach(v=>{const x=Ee.get(v.date)||{date:v.date,completed:0,created:0};x.created=v.created,Ee.set(v.date,x)});const Ir=Array.from(Ee.values()).sort((v,x)=>v.date.localeCompare(x.date)),xt=[],Lt=new Date(r.startOfWeekStr);for(let v=7;v>=0;v--){const x=new Date(Lt);x.setDate(Lt.getDate()-v*7);const U=new Date(x);U.setDate(x.getDate()+6);const gt=x.toISOString().split("T")[0],ht=U.toISOString().split("T")[0],Dr=`
        SELECT COUNT(*) as count FROM tasks t
        WHERE t.deleted_at IS NULL AND t.archived_at IS NOT NULL
        AND DATE(t.archived_at) >= DATE(?) AND DATE(t.archived_at) <= DATE(?)
        ${s}
      `,ft=await e.env.DB.prepare(Dr).bind(gt,ht,...a).first(),xr=`
        SELECT COUNT(*) as count FROM tasks t
        WHERE t.deleted_at IS NULL
        AND DATE(t.created_at) >= DATE(?) AND DATE(t.created_at) <= DATE(?)
        ${s}
      `,mt=await e.env.DB.prepare(xr).bind(gt,ht,...a).first();xt.push({week_start:gt,week_end:ht,completed:(ft==null?void 0:ft.count)||0,created:(mt==null?void 0:mt.count)||0})}let At=[];t||(At=((await e.env.DB.prepare(`
        SELECT 
          b.id as board_id,
          b.name as board_name,
          b.icon as board_icon,
          (SELECT COUNT(*) FROM tasks t WHERE t.board_id = b.id AND t.deleted_at IS NULL AND t.archived_at IS NULL) as total_tasks,
          (SELECT COUNT(*) FROM tasks t WHERE t.board_id = b.id AND t.deleted_at IS NULL AND t.archived_at IS NOT NULL) as completed_tasks,
          (SELECT COUNT(*) FROM tasks t WHERE t.board_id = b.id AND t.deleted_at IS NULL AND t.archived_at IS NULL AND DATE(t.due_date) < DATE(?)) as overdue_tasks
        FROM boards b
        WHERE b.deleted_at IS NULL
        ORDER BY b.created_at DESC
      `).bind(r.todayStr).all()).results||[]).map(U=>({board_id:U.board_id,board_name:U.board_name,board_icon:U.board_icon||"📋",total_tasks:U.total_tasks,completed_tasks:U.completed_tasks,overdue_tasks:U.overdue_tasks,completion_rate:U.total_tasks+U.completed_tasks>0?Math.round(U.completed_tasks/(U.total_tasks+U.completed_tasks)*100):0})));const Or={total_tasks:i,completed_tasks:p,overdue_tasks:E,due_today:k,due_this_week:me,completed_this_week:lt,completed_this_month:q,tasks_by_status:Dt,tasks_by_priority:vr,completion_trend:Ir,velocity:xt,project_breakdown:At};return e.json({success:!0,data:Or})}catch(t){return m(e).error("Error fetching analytics",{},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to fetch analytics"}},500)}});Ot.get("/boards/:boardId",async e=>{try{const t=e.req.param("boardId"),r=new URL(e.req.url);return r.pathname="/api/analytics",r.searchParams.set("board_id",t),e.redirect(r.pathname+r.search)}catch(t){return m(e).error("Error fetching board analytics",{boardId:e.req.param("boardId")},t),e.json({success:!1,error:{code:"INTERNAL_ERROR",message:"Failed to fetch board analytics"}},500)}});function na(e){const t=e.trim();if(t===""||t===".")return"/";const r=t.startsWith("/")?t:`/${t}`;return r.endsWith("/")?r:`${r}/`}function oa(e){const t=na(e);return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TaskFlow</title>
  <base href="${t}">
  <link rel="icon" type="image/svg+xml" href="${t}logo.svg">
  <link rel="stylesheet" href="${t}static/main.css">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
  <!-- App Container -->
  <div id="app" class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      <div class="flex items-center gap-4">
        <a href="${t}" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="${t}logo.svg" alt="Task Manager" class="w-9 h-9" />
          <span class="text-xl font-bold text-gray-800 dark:text-gray-100 hidden sm:inline">TaskFlow</span>
        </a>
        
        <!-- Project Switcher -->
        <div class="project-switcher" id="project-switcher">
          <button class="project-switcher-btn" id="project-switcher-btn" onclick="toggleProjectSwitcher()">
            <span class="project-name" id="current-project-name">My Tasks</span>
            <i class="fas fa-chevron-down text-xs text-gray-400"></i>
          </button>
          
          <!-- Dropdown (hidden by default) -->
          <div class="project-switcher-dropdown hidden" id="project-switcher-dropdown">
            <div class="project-search">
              <input type="text" placeholder="Search projects..." id="project-search-input" oninput="filterProjects(this.value)">
            </div>
            <div class="project-list" id="project-list">
              <!-- Projects will be rendered here -->
            </div>
            <div class="project-actions">
              <button class="project-action-btn primary" onclick="openNewProjectModal()">
                <i class="fas fa-plus"></i>
                <span>New Project</span>
              </button>
              <button class="project-action-btn" onclick="openManageProjectsModal()">
                <i class="fas fa-cog"></i>
                <span>Manage Projects</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex items-center gap-3">
        <!-- View Toggle -->
        <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 view-toggle-container">
          <button id="btn-board-view" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-white dark:bg-gray-600 shadow-sm" onclick="setView('board')">
            <i class="fas fa-columns mr-1"></i>
            <span class="hidden sm:inline">Board</span>
          </button>
          <button id="btn-list-view" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 dark:text-gray-400" onclick="setView('list')">
            <i class="fas fa-list mr-1"></i>
            <span class="hidden sm:inline">List</span>
          </button>
          <button id="btn-calendar-view" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 dark:text-gray-400" onclick="setView('calendar')">
            <i class="fas fa-calendar-alt mr-1"></i>
            <span class="hidden sm:inline">Calendar</span>
          </button>
        </div>
        
        <!-- Undo/Redo Buttons -->
        <div class="flex items-center gap-1">
          <button id="undo-btn" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 opacity-50" onclick="UndoManager.undo()" title="Nothing to undo (Ctrl+Z)" disabled>
            <i class="fas fa-undo text-lg"></i>
          </button>
          <button id="redo-btn" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 opacity-50" onclick="UndoManager.redo()" title="Nothing to redo (Ctrl+Shift+Z)" disabled>
            <i class="fas fa-redo text-lg"></i>
          </button>
        </div>
        
        <!-- Global Search -->
        <button class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400" onclick="openGlobalSearch()" title="Search (/ or Cmd+F)">
          <i class="fas fa-search text-lg"></i>
        </button>
        
        <!-- Dashboard -->
        <button class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400" onclick="openDashboard()" title="Dashboard Analytics">
          <i class="fas fa-chart-pie text-lg"></i>
        </button>
        
        <!-- Overdue Tasks Indicator -->
        <div class="relative" id="overdue-indicator" title="Overdue tasks">
          <button class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400" onclick="showOverdueTasks()">
            <i class="fas fa-bell text-lg"></i>
          </button>
          <span id="overdue-count-badge" class="overdue-badge hidden">0</span>
        </div>
        
        <!-- Add Task Button -->
        <button class="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2" onclick="openNewTaskModal()">
          <i class="fas fa-plus"></i>
          <span class="hidden sm:inline">Add Task</span>
        </button>
        
        <!-- User Profile Menu -->
        <div class="relative" id="user-menu-container">
          <button id="user-menu-btn" class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onclick="toggleUserMenu()">
            <div class="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm">
              <i class="fas fa-user"></i>
            </div>
            <i class="fas fa-chevron-down text-xs text-gray-500 dark:text-gray-400 hidden sm:inline"></i>
          </button>
          
          <!-- Dropdown Menu -->
          <div id="user-menu-dropdown" class="hidden absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
            <!-- User Info -->
            <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold">
                  <i class="fas fa-user"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 dark:text-gray-100 truncate" id="user-display-name">Guest User</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400 truncate" id="user-email">Not signed in</p>
                </div>
              </div>
            </div>
            
            <!-- Menu Items -->
            <div class="py-1">
              <!-- Theme Selector -->
              <div class="theme-selector-container px-3 py-2.5">
                <div class="flex items-center gap-2.5 mb-2">
                  <i class="fas fa-palette text-gray-500 dark:text-gray-400 w-4 text-center text-xs"></i>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
                </div>
                <div class="theme-toggle-group">
                  <button id="theme-light" onclick="setTheme('light')" class="theme-toggle-btn" title="Light mode">
                    <i class="fas fa-sun"></i>
                    <span>Light</span>
                  </button>
                  <button id="theme-dark" onclick="setTheme('dark')" class="theme-toggle-btn" title="Dark mode">
                    <i class="fas fa-moon"></i>
                    <span>Dark</span>
                  </button>
                  <button id="theme-system" onclick="setTheme('system')" class="theme-toggle-btn" title="System preference">
                    <i class="fas fa-laptop"></i>
                    <span>Auto</span>
                  </button>
                </div>
              </div>
              
              <!-- Archive -->
              <button class="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between group" onclick="openArchive(); toggleUserMenu();">
                <div class="flex items-center gap-3">
                  <i class="fas fa-archive text-gray-500 dark:text-gray-400 group-hover:text-accent w-5 text-center"></i>
                  <span>Archive</span>
                </div>
                <span id="archive-count-menu" class="hidden text-xs bg-accent text-white px-2 py-0.5 rounded-full">0</span>
              </button>
              
              <!-- Trash -->
              <button class="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between group" onclick="openTrash(); toggleUserMenu();">
                <div class="flex items-center gap-3">
                  <i class="fas fa-trash text-gray-500 dark:text-gray-400 group-hover:text-accent w-5 text-center"></i>
                  <span>Trash</span>
                </div>
                <span id="trash-count-menu" class="hidden text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">0</span>
              </button>
              
              <!-- Activity Feed -->
              <button class="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 group" onclick="openActivityFeed(); toggleUserMenu();">
                <i class="fas fa-history text-gray-500 dark:text-gray-400 group-hover:text-accent w-5 text-center"></i>
                <span>Activity Feed</span>
              </button>
              
              <!-- Dashboard -->
              <button class="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 group" onclick="openDashboard(); toggleUserMenu();">
                <i class="fas fa-chart-pie text-gray-500 dark:text-gray-400 group-hover:text-accent w-5 text-center"></i>
                <span>Dashboard</span>
              </button>
              
              <!-- Change Background -->
              <button class="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 group" onclick="openBackgroundPicker(); toggleUserMenu();">
                <i class="fas fa-image text-gray-500 dark:text-gray-400 group-hover:text-accent w-5 text-center"></i>
                <span>Change Background</span>
              </button>
              
              <!-- Keyboard Shortcuts -->
              <button class="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 group" onclick="showKeyboardShortcuts(); toggleUserMenu();">
                <i class="fas fa-keyboard text-gray-500 dark:text-gray-400 group-hover:text-accent w-5 text-center"></i>
                <span>Keyboard Shortcuts</span>
              </button>
              
              <!-- Edit Project -->
              <button class="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 group" onclick="editCurrentProject(); toggleUserMenu();">
                <i class="fas fa-cog text-gray-500 dark:text-gray-400 group-hover:text-accent w-5 text-center"></i>
                <span>Project Settings</span>
              </button>
            </div>
            
            <!-- Divider -->
            <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
            
            <!-- Auth Section -->
            <div class="py-1">
              <button id="btn-sign-in" class="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 group" onclick="signIn(); toggleUserMenu();">
                <i class="fas fa-sign-in-alt text-gray-500 dark:text-gray-400 group-hover:text-accent w-5 text-center"></i>
                <span>Sign In</span>
              </button>
              <button id="btn-sign-out" class="hidden w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-red-500 hover:text-red-600" onclick="signOut(); toggleUserMenu();">
                <i class="fas fa-sign-out-alt w-5 text-center"></i>
                <span>Sign Out</span>
              </button>
            </div>
            
            <!-- Network Status (subtle indicator at bottom) -->
            <div class="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between">
                <p class="text-xs text-gray-400 dark:text-gray-500">TaskFlow v1.0.0</p>
                <div id="user-menu-network-status" class="flex items-center gap-1.5 text-xs">
                  <i class="fas fa-wifi text-gray-400 dark:text-gray-500"></i>
                  <span class="text-gray-400 dark:text-gray-500">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
    
    <!-- Offline Banner -->
    <div id="offline-banner" class="hidden bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium offline-banner">
      <i class="fas fa-wifi-slash mr-2"></i>
      You're offline. Changes will sync when you're back online.
      <button onclick="syncPendingOperations()" class="ml-2 px-2 py-0.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs font-medium transition-colors">
        <i class="fas fa-sync mr-1"></i>Retry Now
      </button>
    </div>
    
    <!-- Error Boundary Container (used by ErrorHandler) -->
    <div id="error-boundary"></div>
    
    <!-- Main Content -->
    <main id="main-content" class="flex-1 overflow-hidden relative bg-gray-50 dark:bg-gray-900 transition-all duration-300">
      <!-- Board View -->
      <div id="board-view" class="h-full p-4 pb-6 overflow-x-auto overflow-y-hidden">
        <div id="columns-container" class="flex gap-4 h-full">
          <!-- Columns will be rendered here -->
        </div>
      </div>
      
      <!-- Horizontal Scroll Indicators -->
      <div id="scroll-indicator-left" class="scroll-indicator scroll-indicator-left"></div>
      <div id="scroll-indicator-right" class="scroll-indicator scroll-indicator-right"></div>
      
      <!-- Custom Bottom Scrollbar (Trello-style) -->
      <div id="board-scrollbar" class="board-scrollbar">
        <div class="board-scrollbar-track">
          <div id="board-scrollbar-thumb" class="board-scrollbar-thumb"></div>
        </div>
      </div>
      
      <!-- List View -->
      <div id="list-view" class="hidden h-full p-4 overflow-auto">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <!-- Filters -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center">
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-400">Status:</label>
              <select id="filter-status" class="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-700" onchange="applyFilters()">
                <option value="">All</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-400">Priority:</label>
              <select id="filter-priority" class="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-700" onchange="applyFilters()">
                <option value="">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-400">Sort:</label>
              <select id="sort-by" class="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-700" onchange="applyFilters()">
                <option value="position">Position</option>
                <option value="due_date">Due Date</option>
                <option value="priority">Priority</option>
                <option value="updated_at">Last Updated</option>
              </select>
            </div>
          </div>
          
          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Task</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due Date</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tags</th>
                </tr>
              </thead>
              <tbody id="tasks-table-body" class="divide-y divide-gray-200 dark:divide-gray-700">
                <!-- Tasks will be rendered here -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Calendar View -->
      <div id="calendar-view" class="hidden h-full p-4 overflow-auto">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <!-- Calendar Header -->
          <div class="calendar-header p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button onclick="calendarPrevious()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Previous">
                <i class="fas fa-chevron-left"></i>
              </button>
              <button onclick="calendarToday()" class="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Today</button>
              <button onclick="calendarNext()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Next">
                <i class="fas fa-chevron-right"></i>
              </button>
              <h2 id="calendar-title" class="text-xl font-semibold ml-2">January 2026</h2>
            </div>
            <div class="flex items-center gap-3">
              <!-- Color Mode Toggle -->
              <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Color by:</span>
                <select id="calendar-color-mode" onchange="renderCalendar()" class="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-accent focus:border-transparent">
                  <option value="priority">Priority</option>
                  <option value="project">Project</option>
                </select>
              </div>
              <!-- View Mode Toggle -->
              <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button id="btn-month-view" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-white dark:bg-gray-600 shadow-sm" onclick="setCalendarView('month')">Month</button>
                <button id="btn-week-view" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 dark:text-gray-400" onclick="setCalendarView('week')">Week</button>
              </div>
            </div>
          </div>
          
          <!-- Calendar Grid -->
          <div id="calendar-grid" class="calendar-grid">
            <!-- Calendar content will be rendered here -->
          </div>
        </div>
      </div>
    </main>
  </div>
  
  <!-- Task Modal -->
  <div id="task-modal" class="hidden fixed inset-0 z-50">
    <div class="modal-backdrop absolute inset-0 bg-black/50" onclick="closeTaskModal()"></div>
    <div class="modal-content absolute inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div id="task-modal-content">
        <!-- Modal content will be rendered here -->
      </div>
    </div>
  </div>
  
  <!-- Trash Modal -->
  <div id="trash-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-6">
    <div class="modal-backdrop absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="closeTrashModal()"></div>
    <div class="modal-content utility-modal relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col w-full max-h-[80vh]" style="max-width: 400px;">
      <div class="utility-modal-header px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
            <i class="fas fa-trash text-red-500 text-sm"></i>
          </div>
          <div>
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Trash</h2>
          </div>
        </div>
        <button onclick="closeTrashModal()" class="w-7 h-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <i class="fas fa-times text-sm"></i>
        </button>
      </div>
      <div id="trash-content" class="utility-modal-body px-5 py-4 overflow-y-auto flex-1">
        <!-- Trash items will be rendered here -->
      </div>
    </div>
  </div>
  
  <!-- Toast Container -->
  <div id="toast-container" class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
    <!-- Toasts will be rendered here -->
  </div>
  
  <!-- Loading Overlay -->
  <div id="loading-overlay" class="hidden fixed inset-0 bg-white/80 dark:bg-gray-900/80 z-50 flex items-center justify-center">
    <div class="text-center">
      <i class="fas fa-spinner fa-spin text-4xl text-accent mb-4"></i>
      <p class="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>

  <!-- Demo Mode Banner -->
  <div id="demo-banner" class="fixed bottom-4 left-4 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-3 max-w-sm">
    <div class="flex-shrink-0">
      <i class="fas fa-flask text-lg"></i>
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium">Demo Mode</p>
      <p class="text-xs text-white/80">Data is stored locally in your browser</p>
    </div>
    <button onclick="document.getElementById('demo-banner').style.display='none'" class="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors" title="Dismiss">
      <i class="fas fa-times text-sm"></i>
    </button>
  </div>

  <!-- Demo API Scripts (must load before app.js) -->
  <script src="${t}static/demo-data.js"><\/script>
  <script src="${t}static/demo-api.js"><\/script>
  <script src="${t}static/app.js"><\/script>
</body>
</html>`}const R=new W;R.use("*",async(e,t)=>{const r=crypto.randomUUID();e.set("requestId",r),e.header("X-Request-ID",r),await t()});R.use("*",async(e,t)=>{const r=e.req.header("CF-Access-Jwt-Assertion"),s=e.req.header("CF-Access-Authenticated-User-Email"),a=e.req.header("CF-Access-Authenticated-User-Identity");s&&(e.set("userEmail",s),e.set("userIdentity",a||s),r&&e.set("accessJwt",r)),await t()});R.use("*",async(e,t)=>{const r=e.env.ENVIRONMENT,s=pr(r).withContext(e);e.set("logger",s),await t()});R.use("*",async(e,t)=>{const r=zs(e.env);r.warnings.length>0&&m(e).warn("Environment validation warnings",{warnings:r.warnings}),await t()});R.use("/api/*",gs({origin:(e,t)=>{const r=t.env.ENVIRONMENT||"development",s=t.env.ALLOWED_ORIGINS?t.env.ALLOWED_ORIGINS.split(",").map(a=>a.trim()):[];return r==="development"?e||"*":s.length===0?e||null:e&&s.includes(e)?e:null},credentials:!0,maxAge:86400,allowMethods:["GET","POST","PATCH","DELETE","OPTIONS"],allowHeaders:["Content-Type","Authorization","CF-Access-Jwt-Assertion","CF-Access-Authenticated-User-Email"]}));R.use("/api/*",async(e,t)=>{const r=e.req.header("content-length");if(r&&parseInt(r,10)>1024*1024)return e.json({success:!1,error:{code:"REQUEST_TOO_LARGE",message:"Request body exceeds maximum size of 1MB"}},413);await t()});R.use("/api/*",Gs());R.use("/api/*",async(e,t)=>{const r=e.get("userEmail");if((e.env.ENVIRONMENT||"development")==="production"&&!r)return e.json({success:!1,error:{code:"UNAUTHORIZED",message:"Authentication required via Cloudflare Access"}},401);await t()});R.use("*",_s());R.use("/api/*",async(e,t)=>{try{await vs(e.env.DB)}catch(r){m(e).error("Database initialization error",{error:r instanceof Error?r.message:"Unknown error"},r)}await t()});R.get("/api/health",async e=>{const t=m(e),r=new Date().toISOString();try{return await e.env.DB.prepare("SELECT 1").first(),e.json({status:"ok",timestamp:r,version:"1.0.0",database:"connected"})}catch(s){return t.error("Health check failed - database disconnected",{error:s instanceof Error?s.message:"Unknown error"},s),e.json({status:"degraded",timestamp:r,version:"1.0.0",database:"disconnected"},503)}});R.route("/api/boards",Le);R.route("/api",Ve);R.route("/api",C);R.route("/api",Ge);R.route("/api",Ae);R.route("/api/trash",Nt);R.route("/api",It);R.route("/api/analytics",Ot);R.get("/logo.svg",e=>e.body(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="10" y="4" width="26" height="26" rx="6" fill="#10B981" opacity="0.3"/>
  <rect x="6" y="8" width="26" height="26" rx="6" fill="#10B981" opacity="0.6"/>
  <rect x="2" y="12" width="26" height="26" rx="6" fill="url(#grad1)"/>
  <path d="M9 25L13.5 29.5L21 20" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,200,{"Content-Type":"image/svg+xml","Cache-Control":"public, max-age=31536000"}));R.get("/",e=>e.html(oa("/")));const kt=new W,fr=Object.assign({"/src/index.tsx":R});let mr=!1;for(const[,e]of Object.entries(fr))e&&(kt.all("*",t=>{let r;try{r=t.executionCtx}catch{}return e.fetch(t.req.raw,t.env,r)}),kt.notFound(t=>{let r;try{r=t.executionCtx}catch{}return e.fetch(t.req.raw,t.env,r)}),mr=!0);if(!mr)throw new Error("Can't import modules from ['/src/index.tsx']");const yr={},$t=new Set;for(const[e,t]of Object.entries(fr))for(const[r,s]of Object.entries(t))if(r!=="fetch"){if($t.has(r))throw new Error(`Handler "${r}" is defined in multiple entry files. Please ensure each handler (except fetch) is defined only once.`);$t.add(r),yr[r]=s}const ca={...yr,fetch:kt.fetch};export{ca as default};
