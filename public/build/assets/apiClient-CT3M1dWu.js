var Ue=e=>{throw TypeError(e)};var xe=(e,t,s)=>t.has(e)||Ue("Cannot "+s);var n=(e,t,s)=>(xe(e,t,"read from private field"),s?s.call(e):t.get(e)),w=(e,t,s)=>t.has(e)?Ue("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,s),y=(e,t,s,r)=>(xe(e,t,"write to private field"),r?r.call(e,s):t.set(e,s),s),x=(e,t,s)=>(xe(e,t,"access private method"),s);import{S as Je,p as ze,f as k,s as me,g as re,n as pe,h as je,k as He,t as ut,l as de,m as ht,o as ft,q as Be,v as be,w as Ke,x as mt,r as h,y as Pe,u as qe,c as et,j as c,e as pt,C as gt,R as bt,E as vt,z as yt}from"./app-DkHZ1snj.js";import{H as xt}from"./Header-CU1x6GBx.js";import{u as tt}from"./useTranslation-Ci484Hv5.js";import{C as wt}from"./circle-check-DEYzoE95.js";var S,g,ae,C,W,G,T,U,ie,J,q,X,V,z,ee,v,se,Ee,_e,Ce,Re,Se,Oe,Ne,st,Ze,jt=(Ze=class extends Je{constructor(t,s){super();w(this,v);w(this,S);w(this,g);w(this,ae);w(this,C);w(this,W);w(this,G);w(this,T);w(this,U);w(this,ie);w(this,J);w(this,q);w(this,X);w(this,V);w(this,z);w(this,ee,new Set);this.options=s,y(this,S,t),y(this,U,null),y(this,T,ze()),this.bindMethods(),this.setOptions(s)}bindMethods(){this.refetch=this.refetch.bind(this)}onSubscribe(){this.listeners.size===1&&(n(this,g).addObserver(this),We(n(this,g),this.options)?x(this,v,se).call(this):this.updateResult(),x(this,v,Re).call(this))}onUnsubscribe(){this.hasListeners()||this.destroy()}shouldFetchOnReconnect(){return ke(n(this,g),this.options,this.options.refetchOnReconnect)}shouldFetchOnWindowFocus(){return ke(n(this,g),this.options,this.options.refetchOnWindowFocus)}destroy(){this.listeners=new Set,x(this,v,Se).call(this),x(this,v,Oe).call(this),n(this,g).removeObserver(this)}setOptions(t){const s=this.options,r=n(this,g);if(this.options=n(this,S).defaultQueryOptions(t),this.options.enabled!==void 0&&typeof this.options.enabled!="boolean"&&typeof this.options.enabled!="function"&&typeof k(this.options.enabled,n(this,g))!="boolean")throw new Error("Expected enabled to be a boolean or a callback that returns a boolean");x(this,v,Ne).call(this),n(this,g).setOptions(this.options),s._defaulted&&!me(this.options,s)&&n(this,S).getQueryCache().notify({type:"observerOptionsUpdated",query:n(this,g),observer:this});const i=this.hasListeners();i&&Xe(n(this,g),r,this.options,s)&&x(this,v,se).call(this),this.updateResult(),i&&(n(this,g)!==r||k(this.options.enabled,n(this,g))!==k(s.enabled,n(this,g))||re(this.options.staleTime,n(this,g))!==re(s.staleTime,n(this,g)))&&x(this,v,Ee).call(this);const o=x(this,v,_e).call(this);i&&(n(this,g)!==r||k(this.options.enabled,n(this,g))!==k(s.enabled,n(this,g))||o!==n(this,z))&&x(this,v,Ce).call(this,o)}getOptimisticResult(t){const s=n(this,S).getQueryCache().build(n(this,S),t),r=this.createResult(s,t);return _t(this,r)&&(y(this,C,r),y(this,G,this.options),y(this,W,n(this,g).state)),r}getCurrentResult(){return n(this,C)}trackResult(t,s){return new Proxy(t,{get:(r,i)=>(this.trackProp(i),s==null||s(i),i==="promise"&&(this.trackProp("data"),!this.options.experimental_prefetchInRender&&n(this,T).status==="pending"&&n(this,T).reject(new Error("experimental_prefetchInRender feature flag is not enabled"))),Reflect.get(r,i))})}trackProp(t){n(this,ee).add(t)}getCurrentQuery(){return n(this,g)}refetch({...t}={}){return this.fetch({...t})}fetchOptimistic(t){const s=n(this,S).defaultQueryOptions(t),r=n(this,S).getQueryCache().build(n(this,S),s);return r.fetch().then(()=>this.createResult(r,s))}fetch(t){return x(this,v,se).call(this,{...t,cancelRefetch:t.cancelRefetch??!0}).then(()=>(this.updateResult(),n(this,C)))}createResult(t,s){var Qe;const r=n(this,g),i=this.options,o=n(this,C),a=n(this,W),l=n(this,G),u=t!==r?t.state:n(this,ae),{state:m}=t;let d={...m},b=!1,p;if(s._optimisticResults){const N=this.hasListeners(),te=!N&&We(t,s),oe=N&&Xe(t,r,s,i);(te||oe)&&(d={...d,...ft(m.data,t.options)}),s._optimisticResults==="isRestoring"&&(d.fetchStatus="idle")}let{error:j,errorUpdatedAt:$,status:_}=d;p=d.data;let Y=!1;if(s.placeholderData!==void 0&&p===void 0&&_==="pending"){let N;o!=null&&o.isPlaceholderData&&s.placeholderData===(l==null?void 0:l.placeholderData)?(N=o.data,Y=!0):N=typeof s.placeholderData=="function"?s.placeholderData((Qe=n(this,q))==null?void 0:Qe.state.data,n(this,q)):s.placeholderData,N!==void 0&&(_="success",p=Be(o==null?void 0:o.data,N,s),b=!0)}if(s.select&&p!==void 0&&!Y)if(o&&p===(a==null?void 0:a.data)&&s.select===n(this,ie))p=n(this,J);else try{y(this,ie,s.select),p=s.select(p),p=Be(o==null?void 0:o.data,p,s),y(this,J,p),y(this,U,null)}catch(N){y(this,U,N)}n(this,U)&&(j=n(this,U),p=n(this,J),$=Date.now(),_="error");const Z=d.fetchStatus==="fetching",R=_==="pending",K=_==="error",Fe=R&&Z,$e=p!==void 0,Q={status:_,fetchStatus:d.fetchStatus,isPending:R,isSuccess:_==="success",isError:K,isInitialLoading:Fe,isLoading:Fe,data:p,dataUpdatedAt:d.dataUpdatedAt,error:j,errorUpdatedAt:$,failureCount:d.fetchFailureCount,failureReason:d.fetchFailureReason,errorUpdateCount:d.errorUpdateCount,isFetched:t.isFetched(),isFetchedAfterMount:d.dataUpdateCount>u.dataUpdateCount||d.errorUpdateCount>u.errorUpdateCount,isFetching:Z,isRefetching:Z&&!R,isLoadingError:K&&!$e,isPaused:d.fetchStatus==="paused",isPlaceholderData:b,isRefetchError:K&&$e,isStale:De(t,s),refetch:this.refetch,promise:n(this,T),isEnabled:k(s.enabled,t)!==!1};if(this.options.experimental_prefetchInRender){const N=Q.data!==void 0,te=Q.status==="error"&&!N,oe=ce=>{te?ce.reject(Q.error):N&&ce.resolve(Q.data)},Ae=()=>{const ce=y(this,T,Q.promise=ze());oe(ce)},le=n(this,T);switch(le.status){case"pending":t.queryHash===r.queryHash&&oe(le);break;case"fulfilled":(te||Q.data!==le.value)&&Ae();break;case"rejected":(!te||Q.error!==le.reason)&&Ae();break}}return Q}updateResult(){const t=n(this,C),s=this.createResult(n(this,g),this.options);if(y(this,W,n(this,g).state),y(this,G,this.options),n(this,W).data!==void 0&&y(this,q,n(this,g)),me(s,t))return;y(this,C,s);const r=()=>{if(!t)return!0;const{notifyOnChangeProps:i}=this.options,o=typeof i=="function"?i():i;if(o==="all"||!o&&!n(this,ee).size)return!0;const a=new Set(o??n(this,ee));return this.options.throwOnError&&a.add("error"),Object.keys(n(this,C)).some(l=>{const f=l;return n(this,C)[f]!==t[f]&&a.has(f)})};x(this,v,st).call(this,{listeners:r()})}onQueryUpdate(){this.updateResult(),this.hasListeners()&&x(this,v,Re).call(this)}},S=new WeakMap,g=new WeakMap,ae=new WeakMap,C=new WeakMap,W=new WeakMap,G=new WeakMap,T=new WeakMap,U=new WeakMap,ie=new WeakMap,J=new WeakMap,q=new WeakMap,X=new WeakMap,V=new WeakMap,z=new WeakMap,ee=new WeakMap,v=new WeakSet,se=function(t){x(this,v,Ne).call(this);let s=n(this,g).fetch(this.options,t);return t!=null&&t.throwOnError||(s=s.catch(pe)),s},Ee=function(){x(this,v,Se).call(this);const t=re(this.options.staleTime,n(this,g));if(je.isServer()||n(this,C).isStale||!He(t))return;const r=ut(n(this,C).dataUpdatedAt,t)+1;y(this,X,de.setTimeout(()=>{n(this,C).isStale||this.updateResult()},r))},_e=function(){return(typeof this.options.refetchInterval=="function"?this.options.refetchInterval(n(this,g)):this.options.refetchInterval)??!1},Ce=function(t){x(this,v,Oe).call(this),y(this,z,t),!(je.isServer()||k(this.options.enabled,n(this,g))===!1||!He(n(this,z))||n(this,z)===0)&&y(this,V,de.setInterval(()=>{(this.options.refetchIntervalInBackground||ht.isFocused())&&x(this,v,se).call(this)},n(this,z)))},Re=function(){x(this,v,Ee).call(this),x(this,v,Ce).call(this,x(this,v,_e).call(this))},Se=function(){n(this,X)!==void 0&&(de.clearTimeout(n(this,X)),y(this,X,void 0))},Oe=function(){n(this,V)!==void 0&&(de.clearInterval(n(this,V)),y(this,V,void 0))},Ne=function(){const t=n(this,S).getQueryCache().build(n(this,S),this.options);if(t===n(this,g))return;const s=n(this,g);y(this,g,t),y(this,ae,t.state),this.hasListeners()&&(s==null||s.removeObserver(this),t.addObserver(this))},st=function(t){be.batch(()=>{t.listeners&&this.listeners.forEach(s=>{s(n(this,C))}),n(this,S).getQueryCache().notify({query:n(this,g),type:"observerResultsUpdated"})})},Ze);function Et(e,t){return k(t.enabled,e)!==!1&&e.state.data===void 0&&!(e.state.status==="error"&&k(t.retryOnMount,e)===!1)}function We(e,t){return Et(e,t)||e.state.data!==void 0&&ke(e,t,t.refetchOnMount)}function ke(e,t,s){if(k(t.enabled,e)!==!1&&re(t.staleTime,e)!=="static"){const r=typeof s=="function"?s(e):s;return r==="always"||r!==!1&&De(e,t)}return!1}function Xe(e,t,s,r){return(e!==t||k(r.enabled,e)===!1)&&(!s.suspense||e.state.status!=="error")&&De(e,s)}function De(e,t){return k(t.enabled,e)!==!1&&e.isStaleByTime(re(t.staleTime,e))}function _t(e,t){return!me(e.getCurrentResult(),t)}var P,H,O,D,L,he,Me,Ge,Ct=(Ge=class extends Je{constructor(s,r){super();w(this,L);w(this,P);w(this,H);w(this,O);w(this,D);y(this,P,s),this.setOptions(r),this.bindMethods(),x(this,L,he).call(this)}bindMethods(){this.mutate=this.mutate.bind(this),this.reset=this.reset.bind(this)}setOptions(s){var i;const r=this.options;this.options=n(this,P).defaultMutationOptions(s),me(this.options,r)||n(this,P).getMutationCache().notify({type:"observerOptionsUpdated",mutation:n(this,O),observer:this}),r!=null&&r.mutationKey&&this.options.mutationKey&&Ke(r.mutationKey)!==Ke(this.options.mutationKey)?this.reset():((i=n(this,O))==null?void 0:i.state.status)==="pending"&&n(this,O).setOptions(this.options)}onUnsubscribe(){var s;this.hasListeners()||(s=n(this,O))==null||s.removeObserver(this)}onMutationUpdate(s){x(this,L,he).call(this),x(this,L,Me).call(this,s)}getCurrentResult(){return n(this,H)}reset(){var s;(s=n(this,O))==null||s.removeObserver(this),y(this,O,void 0),x(this,L,he).call(this),x(this,L,Me).call(this)}mutate(s,r){var i;return y(this,D,r),(i=n(this,O))==null||i.removeObserver(this),y(this,O,n(this,P).getMutationCache().build(n(this,P),this.options)),n(this,O).addObserver(this),n(this,O).execute(s)}},P=new WeakMap,H=new WeakMap,O=new WeakMap,D=new WeakMap,L=new WeakSet,he=function(){var r;const s=((r=n(this,O))==null?void 0:r.state)??mt();y(this,H,{...s,isPending:s.status==="pending",isSuccess:s.status==="success",isError:s.status==="error",isIdle:s.status==="idle",mutate:this.mutate,reset:this.reset})},Me=function(s){be.batch(()=>{var r,i,o,a,l,f,u,m;if(n(this,D)&&this.hasListeners()){const d=n(this,H).variables,b=n(this,H).context,p={client:n(this,P),meta:this.options.meta,mutationKey:this.options.mutationKey};if((s==null?void 0:s.type)==="success"){try{(i=(r=n(this,D)).onSuccess)==null||i.call(r,s.data,d,b,p)}catch(j){Promise.reject(j)}try{(a=(o=n(this,D)).onSettled)==null||a.call(o,s.data,null,d,b,p)}catch(j){Promise.reject(j)}}else if((s==null?void 0:s.type)==="error"){try{(f=(l=n(this,D)).onError)==null||f.call(l,s.error,d,b,p)}catch(j){Promise.reject(j)}try{(m=(u=n(this,D)).onSettled)==null||m.call(u,void 0,s.error,d,b,p)}catch(j){Promise.reject(j)}}}this.listeners.forEach(d=>{d(n(this,H))})})},Ge),rt=h.createContext(!1),Rt=()=>h.useContext(rt);rt.Provider;function St(){let e=!1;return{clearReset:()=>{e=!1},reset:()=>{e=!0},isReset:()=>e}}var Ot=h.createContext(St()),Nt=()=>h.useContext(Ot),kt=(e,t,s)=>{const r=s!=null&&s.state.error&&typeof e.throwOnError=="function"?Pe(e.throwOnError,[s.state.error,s]):e.throwOnError;(e.suspense||e.experimental_prefetchInRender||r)&&(t.isReset()||(e.retryOnMount=!1))},Mt=e=>{h.useEffect(()=>{e.clearReset()},[e])},It=({result:e,errorResetBoundary:t,throwOnError:s,query:r,suspense:i})=>e.isError&&!t.isReset()&&!e.isFetching&&r&&(i&&e.data===void 0||Pe(s,[e.error,r])),Tt=e=>{if(e.suspense){const s=i=>i==="static"?i:Math.max(i??1e3,1e3),r=e.staleTime;e.staleTime=typeof r=="function"?(...i)=>s(r(...i)):s(r),typeof e.gcTime=="number"&&(e.gcTime=Math.max(e.gcTime,1e3))}},Pt=(e,t)=>e.isLoading&&e.isFetching&&!t,Dt=(e,t)=>(e==null?void 0:e.suspense)&&t.isPending,Ve=(e,t,s)=>t.fetchOptimistic(e).catch(()=>{s.clearReset()});function Lt(e,t,s){var b,p,j,$;const r=Rt(),i=Nt(),o=qe(),a=o.defaultQueryOptions(e);(p=(b=o.getDefaultOptions().queries)==null?void 0:b._experimental_beforeQuery)==null||p.call(b,a);const l=o.getQueryCache().get(a.queryHash);a._optimisticResults=r?"isRestoring":"optimistic",Tt(a),kt(a,i,l),Mt(i);const f=!o.getQueryCache().get(a.queryHash),[u]=h.useState(()=>new t(o,a)),m=u.getOptimisticResult(a),d=!r&&e.subscribed!==!1;if(h.useSyncExternalStore(h.useCallback(_=>{const Y=d?u.subscribe(be.batchCalls(_)):pe;return u.updateResult(),Y},[u,d]),()=>u.getCurrentResult(),()=>u.getCurrentResult()),h.useEffect(()=>{u.setOptions(a)},[a,u]),Dt(a,m))throw Ve(a,u,i);if(It({result:m,errorResetBoundary:i,throwOnError:a.throwOnError,query:l,suspense:a.suspense}))throw m.error;if(($=(j=o.getDefaultOptions().queries)==null?void 0:j._experimental_afterQuery)==null||$.call(j,a,m),a.experimental_prefetchInRender&&!je.isServer()&&Pt(m,r)){const _=f?Ve(a,u,i):l==null?void 0:l.promise;_==null||_.catch(pe).finally(()=>{u.updateResult()})}return a.notifyOnChangeProps?m:u.trackResult(m)}function zs(e,t){return Lt(e,jt)}function Hs(e,t){const s=qe(),[r]=h.useState(()=>new Ct(s,e));h.useEffect(()=>{r.setOptions(e)},[r,e]);const i=h.useSyncExternalStore(h.useCallback(a=>r.subscribe(be.batchCalls(a)),[r]),()=>r.getCurrentResult(),()=>r.getCurrentResult()),o=h.useCallback((a,l)=>{r.mutate(a,l).catch(pe)},[r]);if(i.error&&Pe(r.options.throwOnError,[i.error]))throw i.error;return{...i,mutate:o,mutateAsync:i.mutate}}/**
 * @license lucide-react v0.383.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ft=et("CircleX",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]]);/**
 * @license lucide-react v0.383.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $t=et("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);let Qt={data:""},At=e=>{if(typeof window=="object"){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||Qt},Ut=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,zt=/\/\*[^]*?\*\/|  +/g,Ye=/\n+/g,A=(e,t)=>{let s="",r="",i="";for(let o in e){let a=e[o];o[0]=="@"?o[1]=="i"?s=o+" "+a+";":r+=o[1]=="f"?A(a,o):o+"{"+A(a,o[1]=="k"?"":t)+"}":typeof a=="object"?r+=A(a,t?t.replace(/([^,])+/g,l=>o.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,f=>/&/.test(f)?f.replace(/&/g,l):l?l+" "+f:f)):o):a!=null&&(o=/^--/.test(o)?o:o.replace(/[A-Z]/g,"-$&").toLowerCase(),i+=A.p?A.p(o,a):o+":"+a+";")}return s+(t&&i?t+"{"+i+"}":i)+r},I={},at=e=>{if(typeof e=="object"){let t="";for(let s in e)t+=s+at(e[s]);return t}return e},Ht=(e,t,s,r,i)=>{let o=at(e),a=I[o]||(I[o]=(f=>{let u=0,m=11;for(;u<f.length;)m=101*m+f.charCodeAt(u++)>>>0;return"go"+m})(o));if(!I[a]){let f=o!==e?e:(u=>{let m,d,b=[{}];for(;m=Ut.exec(u.replace(zt,""));)m[4]?b.shift():m[3]?(d=m[3].replace(Ye," ").trim(),b.unshift(b[0][d]=b[0][d]||{})):b[0][m[1]]=m[2].replace(Ye," ").trim();return b[0]})(e);I[a]=A(i?{["@keyframes "+a]:f}:f,s?"":"."+a)}let l=s&&I.g?I.g:null;return s&&(I.g=I[a]),((f,u,m,d)=>{d?u.data=u.data.replace(d,f):u.data.indexOf(f)===-1&&(u.data=m?f+u.data:u.data+f)})(I[a],t,r,l),a},Bt=(e,t,s)=>e.reduce((r,i,o)=>{let a=t[o];if(a&&a.call){let l=a(s),f=l&&l.props&&l.props.className||/^go/.test(l)&&l;a=f?"."+f:l&&typeof l=="object"?l.props?"":A(l,""):l===!1?"":l}return r+i+(a??"")},"");function ve(e){let t=this||{},s=e.call?e(t.p):e;return Ht(s.unshift?s.raw?Bt(s,[].slice.call(arguments,1),t.p):s.reduce((r,i)=>Object.assign(r,i&&i.call?i(t.p):i),{}):s,At(t.target),t.g,t.o,t.k)}let it,Ie,Te;ve.bind({g:1});let F=ve.bind({k:1});function Kt(e,t,s,r){A.p=t,it=e,Ie=s,Te=r}function B(e,t){let s=this||{};return function(){let r=arguments;function i(o,a){let l=Object.assign({},o),f=l.className||i.className;s.p=Object.assign({theme:Ie&&Ie()},l),s.o=/ *go\d+/.test(f),l.className=ve.apply(s,r)+(f?" "+f:"");let u=e;return e[0]&&(u=l.as||e,delete l.as),Te&&u[0]&&Te(l),it(u,l)}return t?t(i):i}}var Wt=e=>typeof e=="function",ge=(e,t)=>Wt(e)?e(t):e,Xt=(()=>{let e=0;return()=>(++e).toString()})(),nt=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),Vt=20,Le="default",ot=(e,t)=>{let{toastLimit:s}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,s)};case 1:return{...e,toasts:e.toasts.map(a=>a.id===t.toast.id?{...a,...t.toast}:a)};case 2:let{toast:r}=t;return ot(e,{type:e.toasts.find(a=>a.id===r.id)?1:0,toast:r});case 3:let{toastId:i}=t;return{...e,toasts:e.toasts.map(a=>a.id===i||i===void 0?{...a,dismissed:!0,visible:!1}:a)};case 4:return t.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(a=>a.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let o=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(a=>({...a,pauseDuration:a.pauseDuration+o}))}}},fe=[],lt={toasts:[],pausedAt:void 0,settings:{toastLimit:Vt}},M={},ct=(e,t=Le)=>{M[t]=ot(M[t]||lt,e),fe.forEach(([s,r])=>{s===t&&r(M[t])})},dt=e=>Object.keys(M).forEach(t=>ct(e,t)),Yt=e=>Object.keys(M).find(t=>M[t].toasts.some(s=>s.id===e)),ye=(e=Le)=>t=>{ct(t,e)},Zt={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},Gt=(e={},t=Le)=>{let[s,r]=h.useState(M[t]||lt),i=h.useRef(M[t]);h.useEffect(()=>(i.current!==M[t]&&r(M[t]),fe.push([t,r]),()=>{let a=fe.findIndex(([l])=>l===t);a>-1&&fe.splice(a,1)}),[t]);let o=s.toasts.map(a=>{var l,f,u;return{...e,...e[a.type],...a,removeDelay:a.removeDelay||((l=e[a.type])==null?void 0:l.removeDelay)||(e==null?void 0:e.removeDelay),duration:a.duration||((f=e[a.type])==null?void 0:f.duration)||(e==null?void 0:e.duration)||Zt[a.type],style:{...e.style,...(u=e[a.type])==null?void 0:u.style,...a.style}}});return{...s,toasts:o}},Jt=(e,t="blank",s)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...s,id:(s==null?void 0:s.id)||Xt()}),ne=e=>(t,s)=>{let r=Jt(t,e,s);return ye(r.toasterId||Yt(r.id))({type:2,toast:r}),r.id},E=(e,t)=>ne("blank")(e,t);E.error=ne("error");E.success=ne("success");E.loading=ne("loading");E.custom=ne("custom");E.dismiss=(e,t)=>{let s={type:3,toastId:e};t?ye(t)(s):dt(s)};E.dismissAll=e=>E.dismiss(void 0,e);E.remove=(e,t)=>{let s={type:4,toastId:e};t?ye(t)(s):dt(s)};E.removeAll=e=>E.remove(void 0,e);E.promise=(e,t,s)=>{let r=E.loading(t.loading,{...s,...s==null?void 0:s.loading});return typeof e=="function"&&(e=e()),e.then(i=>{let o=t.success?ge(t.success,i):void 0;return o?E.success(o,{id:r,...s,...s==null?void 0:s.success}):E.dismiss(r),i}).catch(i=>{let o=t.error?ge(t.error,i):void 0;o?E.error(o,{id:r,...s,...s==null?void 0:s.error}):E.dismiss(r)}),e};var qt=1e3,es=(e,t="default")=>{let{toasts:s,pausedAt:r}=Gt(e,t),i=h.useRef(new Map).current,o=h.useCallback((d,b=qt)=>{if(i.has(d))return;let p=setTimeout(()=>{i.delete(d),a({type:4,toastId:d})},b);i.set(d,p)},[]);h.useEffect(()=>{if(r)return;let d=Date.now(),b=s.map(p=>{if(p.duration===1/0)return;let j=(p.duration||0)+p.pauseDuration-(d-p.createdAt);if(j<0){p.visible&&E.dismiss(p.id);return}return setTimeout(()=>E.dismiss(p.id,t),j)});return()=>{b.forEach(p=>p&&clearTimeout(p))}},[s,r,t]);let a=h.useCallback(ye(t),[t]),l=h.useCallback(()=>{a({type:5,time:Date.now()})},[a]),f=h.useCallback((d,b)=>{a({type:1,toast:{id:d,height:b}})},[a]),u=h.useCallback(()=>{r&&a({type:6,time:Date.now()})},[r,a]),m=h.useCallback((d,b)=>{let{reverseOrder:p=!1,gutter:j=8,defaultPosition:$}=b||{},_=s.filter(R=>(R.position||$)===(d.position||$)&&R.height),Y=_.findIndex(R=>R.id===d.id),Z=_.filter((R,K)=>K<Y&&R.visible).length;return _.filter(R=>R.visible).slice(...p?[Z+1]:[0,Z]).reduce((R,K)=>R+(K.height||0)+j,0)},[s]);return h.useEffect(()=>{s.forEach(d=>{if(d.dismissed)o(d.id,d.removeDelay);else{let b=i.get(d.id);b&&(clearTimeout(b),i.delete(d.id))}})},[s,o]),{toasts:s,handlers:{updateHeight:f,startPause:l,endPause:u,calculateOffset:m}}},ts=F`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,ss=F`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,rs=F`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,as=B("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${ts} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${ss} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${rs} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,is=F`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,ns=B("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${is} 1s linear infinite;
`,os=F`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,ls=F`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,cs=B("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${os} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${ls} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,ds=B("div")`
  position: absolute;
`,us=B("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,hs=F`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,fs=B("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${hs} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,ms=({toast:e})=>{let{icon:t,type:s,iconTheme:r}=e;return t!==void 0?typeof t=="string"?h.createElement(fs,null,t):t:s==="blank"?null:h.createElement(us,null,h.createElement(ns,{...r}),s!=="loading"&&h.createElement(ds,null,s==="error"?h.createElement(as,{...r}):h.createElement(cs,{...r})))},ps=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,gs=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,bs="0%{opacity:0;} 100%{opacity:1;}",vs="0%{opacity:1;} 100%{opacity:0;}",ys=B("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,xs=B("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,ws=(e,t)=>{let s=e.includes("top")?1:-1,[r,i]=nt()?[bs,vs]:[ps(s),gs(s)];return{animation:t?`${F(r)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${F(i)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},js=h.memo(({toast:e,position:t,style:s,children:r})=>{let i=e.height?ws(e.position||t||"top-center",e.visible):{opacity:0},o=h.createElement(ms,{toast:e}),a=h.createElement(xs,{...e.ariaProps},ge(e.message,e));return h.createElement(ys,{className:e.className,style:{...i,...s,...e.style}},typeof r=="function"?r({icon:o,message:a}):h.createElement(h.Fragment,null,o,a))});Kt(h.createElement);var Es=({id:e,className:t,style:s,onHeightUpdate:r,children:i})=>{let o=h.useCallback(a=>{if(a){let l=()=>{let f=a.getBoundingClientRect().height;r(e,f)};l(),new MutationObserver(l).observe(a,{subtree:!0,childList:!0,characterData:!0})}},[e,r]);return h.createElement("div",{ref:o,className:t,style:s},i)},_s=(e,t)=>{let s=e.includes("top"),r=s?{top:0}:{bottom:0},i=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:nt()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(s?1:-1)}px)`,...r,...i}},Cs=ve`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,ue=16,Rs=({reverseOrder:e,position:t="top-center",toastOptions:s,gutter:r,children:i,toasterId:o,containerStyle:a,containerClassName:l})=>{let{toasts:f,handlers:u}=es(s,o);return h.createElement("div",{"data-rht-toaster":o||"",style:{position:"fixed",zIndex:9999,top:ue,left:ue,right:ue,bottom:ue,pointerEvents:"none",...a},className:l,onMouseEnter:u.startPause,onMouseLeave:u.endPause},f.map(m=>{let d=m.position||t,b=u.calculateOffset(m,{reverseOrder:e,gutter:r,defaultPosition:t}),p=_s(d,b);return h.createElement(Es,{id:m.id,key:m.id,onHeightUpdate:u.updateHeight,className:m.visible?Cs:"",style:p},m.type==="custom"?ge(m.message,m):i?i(m):h.createElement(js,{toast:m,position:d}))}))},Bs=E;function Ss({toast:e}){const{t}=tt("shared"),s=e.type==="success",r=e.type==="error",i=e.type==="loading";return c.jsxs("div",{style:{animation:e.visible?"toastSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards":"toastSlideOut 0.25s ease-in forwards"},className:`\r
                flex items-start gap-3 w-full max-w-sm\r
                bg-[var(--card)] border border-[var(--border)]\r
                rounded-2xl px-4 py-3.5\r
                shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]\r
                backdrop-blur-sm\r
            `,children:[c.jsxs("div",{className:"flex-shrink-0 mt-0.5",children:[s&&c.jsx("div",{className:"w-8 h-8 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center",children:c.jsx(wt,{size:16,className:"text-[var(--primary)]"})}),r&&c.jsx("div",{className:"w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center",children:c.jsx(Ft,{size:16,className:"text-red-500"})}),i&&c.jsx("div",{className:"w-8 h-8 rounded-xl bg-[var(--muted)] flex items-center justify-center",children:c.jsx($t,{size:16,className:"text-[var(--muted-foreground)] animate-spin"})})]}),c.jsxs("div",{className:"flex-1 min-w-0",children:[c.jsx("p",{className:"text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)] mb-0.5",children:t(s?"toast.toast_label_success":r?"toast.toast_label_error":"toast.toast_label_loading")}),c.jsx("p",{className:"text-sm font-medium text-[var(--foreground)] leading-snug",children:typeof e.message=="string"?e.message:t("toast.toast_fallback_message")})]}),!i&&c.jsx("div",{className:"absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl overflow-hidden",children:c.jsx("div",{className:`h-full ${s?"bg-[var(--primary)]":"bg-red-500"}`,style:{animation:e.visible?`toastProgress ${e.duration||4e3}ms linear forwards`:"none"}})}),c.jsx("style",{children:`
                @keyframes toastSlideIn {
                    from { opacity: 0; transform: translateX(20px) scale(0.95); }
                    to   { opacity: 1; transform: translateX(0)    scale(1);    }
                }
                @keyframes toastSlideOut {
                    from { opacity: 1; transform: translateX(0)    scale(1);    }
                    to   { opacity: 0; transform: translateX(20px) scale(0.95); }
                }
                @keyframes toastProgress {
                    from { width: 100%; }
                    to   { width: 0%;   }
                }
            `})]})}function Os(){return c.jsx(Rs,{position:"bottom-right",gutter:12,toastOptions:{duration:4e3,style:{background:"transparent",boxShadow:"none",padding:0,maxWidth:"380px"}},children:e=>c.jsx(Ss,{toast:e})})}function we({children:e}){const{isAr:t,dir:s,ff:r}=pt();return h.useEffect(()=>{document.documentElement.dir=s,document.documentElement.lang=t?"ar":"en",document.documentElement.style.setProperty("--font-sans",r),document.body.style.fontFamily=r},[s,r,t]),c.jsxs("div",{dir:s,style:{fontFamily:r},className:"min-h-screen bg-[var(--background)] text-[var(--foreground)]",children:[c.jsx(xt,{}),c.jsx(Os,{}),c.jsx("main",{className:"w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10",style:{maxWidth:"min(90vw, 80rem)"},role:"main","aria-label":t?"المحتوى الرئيسي":"Main content",children:e})]})}function Ns({rows:e=5}){return c.jsx("div",{className:"divide-y divide-[var(--border)]",children:Array.from({length:e}).map((t,s)=>c.jsxs("div",{className:"grid grid-cols-[2fr_1fr_1fr_100px] gap-6 px-8 py-6 items-center",children:[c.jsxs("div",{className:"flex items-center gap-4",children:[c.jsx("div",{className:"w-14 h-14 rounded-2xl bg-[var(--muted)] animate-pulse"}),c.jsxs("div",{className:"space-y-2",children:[c.jsx("div",{className:"h-4 w-48 bg-[var(--muted)] rounded animate-pulse"}),c.jsx("div",{className:"h-3 w-32 bg-[var(--muted)] opacity-60 rounded animate-pulse"})]})]}),c.jsx("div",{className:"flex justify-center",children:c.jsx("div",{className:"h-3 w-20 bg-[var(--muted)] opacity-40 rounded-full animate-pulse"})}),c.jsx("div",{className:"flex justify-center",children:c.jsx("div",{className:"h-3 w-24 bg-[var(--muted)] opacity-40 rounded-full animate-pulse"})}),c.jsx("div",{className:"flex justify-end",children:c.jsx("div",{className:"w-10 h-10 rounded-full bg-[var(--muted)] opacity-40 animate-pulse"})})]},s))})}function ks(){return c.jsxs("div",{className:"p-6 space-y-6",children:[c.jsxs("div",{className:"flex justify-between items-center mb-8",children:[c.jsxs("div",{className:"space-y-3",children:[c.jsx("div",{className:"h-6 w-40 bg-[var(--muted)] rounded-lg animate-pulse"}),c.jsx("div",{className:"h-4 w-64 bg-[var(--muted)] opacity-50 rounded-md animate-pulse"})]}),c.jsx("div",{className:"h-11 w-36 bg-[var(--muted)] rounded-full animate-pulse"})]}),c.jsxs("div",{className:"bg-[var(--card)] rounded-[2rem] border border-[var(--border)] overflow-hidden shadow-sm",children:[c.jsx("div",{className:"bg-[var(--muted)] bg-opacity-20 px-8 py-4 border-b border-[var(--border)]",children:c.jsx("div",{className:"h-4 w-full bg-[var(--muted)] rounded animate-pulse"})}),c.jsx(Ns,{rows:6})]})]})}function Ms(e){if(!e||typeof e!="object")return null;const t=Object.values(e).flat().filter(s=>typeof s=="string"&&s.trim()!=="");return t.length?t.join(" "):null}function Is(e,t,s){var a;const r=s?t("error_state.load_failed",{context:t(`error_state.context.${s}`,{defaultValue:t("error_state.context.page")})}):null,i=(e==null?void 0:e.status)??((a=e==null?void 0:e.response)==null?void 0:a.status)??null,o=(e==null?void 0:e.userMessage)??null;if(!(e!=null&&e.response))return e!=null&&e.isTimeout?{heading:r??t("error_state.timeout_heading"),message:t("error_state.timeout_message")}:{heading:r??t("error_state.network_heading"),message:t("error_state.network_message")};if(i===422){const l=Ms(e.validationErrors)??o;return{heading:r??t("error_state.validation_heading"),message:l||t("error_state.validation_message")}}return i===401||i===403?{heading:r??t("error_state.auth_heading"),message:t("error_state.auth_message")}:i===404?{heading:r??t("error_state.not_found_heading"),message:t("error_state.not_found_message")}:i===429?{heading:r??t("error_state.rate_limit_heading"),message:t("error_state.rate_limit_message")}:i>=500?{heading:r??t("error_state.server_error_heading"),message:t("error_state.server_error_message")}:{heading:r??t("error_state.heading"),message:t("error_state.default_message")}}function Ts({error:e,context:t,onRetry:s}){const{t:r}=tt("shared"),{heading:i,message:o}=Is(e,r,t);return c.jsxs("div",{className:"flex flex-col items-center justify-center py-32 px-6 text-center animate-in fade-in duration-500",children:[c.jsx("div",{className:"w-20 h-20 bg-[var(--muted)] bg-opacity-50 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-6 border border-[var(--border)]",children:c.jsx(gt,{className:"w-10 h-10 text-[var(--muted-foreground)] opacity-60",strokeWidth:1.5})}),c.jsx("h3",{className:"text-xl font-bold text-[var(--foreground)] mb-2",children:i}),c.jsx("p",{className:"text-[var(--muted-foreground)] max-w-sm mb-10 text-sm leading-relaxed",children:o}),s&&c.jsxs("button",{onClick:s,className:"flex items-center gap-2 px-8 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-black/5",children:[c.jsx(bt,{className:"w-4 h-4"}),r("error_state.cta_label")]})]})}function Ks({isLoading:e,isError:t,error:s,context:r,onRetry:i,children:o}){return e?c.jsx(we,{children:c.jsx(ks,{})}):t?c.jsx(we,{children:c.jsx(Ts,{error:s,context:r,onRetry:i})}):c.jsx(we,{children:c.jsx(vt,{children:o})})}const Ps=yt.create({baseURL:"/",withCredentials:!0,timeout:2e4,headers:{Accept:"application/json","X-Requested-With":"XMLHttpRequest"}});Ps.interceptors.response.use(e=>e,e=>{var s,r;const t=(s=e.response)==null?void 0:s.data;return e.status=((r=e.response)==null?void 0:r.status)??null,e.userMessage=typeof(t==null?void 0:t.message)=="string"?t.message:null,e.validationErrors=t!=null&&t.errors&&typeof t.errors=="object"?t.errors:null,e.isTimeout=e.code==="ECONNABORTED",e.isNetworkError=!e.response,Promise.reject(e)});export{$t as L,Ks as P,Ps as a,we as b,zs as c,E as n,Hs as u,Bs as z};
