import{a as d,b as v,c as p,j as e,L as i}from"./app-CN6CSxnb.js";/**
 * @license lucide-react v0.383.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=r=>r.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),l=(...r)=>r.filter((t,s,n)=>!!t&&n.indexOf(t)===s).join(" ");/**
 * @license lucide-react v0.383.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var b={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.383.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=d.forwardRef(({color:r="currentColor",size:t=24,strokeWidth:s=2,absoluteStrokeWidth:n,className:a="",children:o,iconNode:h,...x},u)=>d.createElement("svg",{ref:u,...b,width:t,height:t,stroke:r,strokeWidth:n?Number(s)*24/Number(t):s,className:l("lucide",a),...x},[...h.map(([m,f])=>d.createElement(m,f)),...Array.isArray(o)?o:[o]]));/**
 * @license lucide-react v0.383.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=(r,t)=>{const s=d.forwardRef(({className:n,...a},o)=>d.createElement(y,{ref:o,iconNode:t,className:l(`lucide-${g(r)}`,n),...a}));return s.displayName=`${r}`,s};/**
 * @license lucide-react v0.383.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=c("LayoutGrid",[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1",key:"1g98yp"}],["rect",{width:"7",height:"7",x:"14",y:"3",rx:"1",key:"6d4xhi"}],["rect",{width:"7",height:"7",x:"14",y:"14",rx:"1",key:"nxv5o0"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1",key:"1bb6yr"}]]);/**
 * @license lucide-react v0.383.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=c("Moon",[["path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",key:"a7tn18"}]]);/**
 * @license lucide-react v0.383.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=c("Sun",[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]]);/**
 * @license lucide-react v0.383.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=c("User",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]);function C(){const{theme:r,toggleTheme:t}=v(),{url:s}=p(),n=[{label:"Instructions",href:"/instructions"},{label:"Dashboard",href:"/dashboard"},{label:"Products",href:"/products"},{label:"Settings",href:"/settings"}];return e.jsxs("header",{className:"sticky top-0 z-50 bg-[var(--background)] border-b border-[var(--border)]",children:[e.jsxs("div",{className:"max-w-6xl mx-auto px-6 h-14 flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center",children:e.jsx(w,{className:"w-4 h-4 text-white"})}),e.jsx("span",{className:"font-semibold text-[var(--foreground)] text-base",children:"Quantix"})]}),e.jsx("nav",{className:"hidden md:flex items-center gap-1",children:n.map(a=>{const o=s.startsWith(a.href);return e.jsx(i,{href:a.href,className:`px-4 py-1.5 rounded-full text-sm transition-colors ${o?"bg-[var(--primary)] text-white font-medium":"text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"}`,children:a.label},a.href)})}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("div",{className:"flex items-center bg-[var(--muted)] rounded-full p-1 gap-1",children:[e.jsx("button",{onClick:()=>r!=="light"&&t(),className:`p-1.5 rounded-full transition-colors ${r==="light"?"bg-white shadow-sm text-[var(--primary)]":"text-[var(--muted-foreground)]"}`,children:e.jsx(k,{className:"w-3.5 h-3.5"})}),e.jsx("button",{onClick:()=>r!=="dark"&&t(),className:`p-1.5 rounded-full transition-colors ${r==="dark"?"bg-[var(--card)] shadow-sm text-[var(--primary)]":"text-[var(--muted-foreground)]"}`,children:e.jsx(j,{className:"w-3.5 h-3.5"})})]}),e.jsx("button",{className:"w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors",children:e.jsx(N,{className:"w-4 h-4"})})]})]}),e.jsx("div",{className:"md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto",children:n.map(a=>{const o=s.startsWith(a.href);return e.jsx(i,{href:a.href,className:`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${o?"bg-[var(--primary)] text-white font-medium":"text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"}`,children:a.label},a.href)})})]})}function $({children:r}){return e.jsxs("div",{className:"min-h-screen bg-[var(--background)] text-[var(--foreground)]",children:[e.jsx(C,{}),e.jsx("main",{className:"max-w-6xl mx-auto px-4 sm:px-6 py-8",children:r})]})}function M({children:r,className:t=""}){return e.jsx("div",{className:`bg-[var(--card)] border border-[var(--border)] rounded-xl ${t}`,children:r})}export{M as C,$ as L,c};
