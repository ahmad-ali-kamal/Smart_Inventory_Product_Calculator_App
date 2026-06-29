import{c as p,j as x,r as s}from"./app-Db3tl6iv.js";import{u as h}from"./useTranslation-CiThApLW.js";import{c as g,d as f}from"./useInventory-Fc9Du9fi.js";/**
 * @license lucide-react v0.383.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=p("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]);/**
 * @license lucide-react v0.383.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _=p("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]),m={red:"Expired",yellow:"Approaching",green:"Safe",expired:"Expired",approaching:"Approaching",valid:"Safe",safe:"Safe"};function b(e){return m[e==null?void 0:e.toLowerCase()]??"Safe"}function v(e){switch(e){case"Expired":return{color:"var(--status-expired-text)",background:"var(--status-expired-bg)",borderColor:"var(--status-expired-border)"};case"Approaching":return{color:"var(--status-approaching-text)",background:"var(--status-approaching-bg)",borderColor:"var(--status-approaching-border)"};default:return{color:"var(--status-safe-text)",background:"var(--status-safe-bg)",borderColor:"var(--status-safe-border)"}}}const i={sm:"px-2 h-[22px] text-[8px] sm:text-[9px] w-full",md:"px-3 h-[26px] text-[9px] sm:text-[10px] w-full"};function C({status:e,size:r="md",className:n=""}){const{t:c}=h("harees"),a=b(e),d=v(a),u=c(`status_badge.${a.toLowerCase()}`,a);return x.jsx("span",{style:d,className:`
                flex items-center justify-center
                rounded-full border font-black uppercase tracking-wide
                ${i[r]??i.md}
                ${n}
            `,children:u})}function E(){const e=g(),r=f(),n=s.useMemo(()=>{var t;return!!((t=e.data)!=null&&t.needs_setup)},[e.data]),c=s.useMemo(()=>{var t;return[...((t=e.data)==null?void 0:t.products)||[]].reverse()},[e.data]),a=s.useMemo(()=>{var o;const t=((o=e.data)==null?void 0:o.stats)||{};return{expiredCount:t.red_batches??t.expiredCount??0,expiringSoon:t.yellow_batches??t.expiringSoon??0,validCount:t.green_batches??t.validCount??0}},[e.data]),{autoDiscount:d,autoDiscountPercent:u,autoHide:l}=s.useMemo(()=>{var o;const t=((o=r.data)==null?void 0:o.settings)||r.data||{};return{autoDiscount:!!t.auto_discounts,autoDiscountPercent:Number(t.auto_discount_percent)||0,autoHide:!!t.auto_hide_expired}},[r.data]);return{products:c,stats:a,autoDiscount:d,autoDiscountPercent:u,autoHide:l,needsSetup:n,isLoading:e.isLoading||r.isLoading,isError:e.isError||r.isError,error:e.error||r.error,refetch:async()=>{await Promise.all([e.refetch(),r.refetch()])}}}export{C as S,w as T,_ as X,v as g,b as n,E as u};
