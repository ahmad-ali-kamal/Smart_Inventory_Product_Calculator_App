import{c as p,j as x,r as s}from"./app-Cj3zYbEE.js";import{u as g}from"./useTranslation-Ch_jYSP-.js";import{b as f,c as b}from"./useInventory-Bonyo7ge.js";/**
 * @license lucide-react v0.383.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=p("Eye",[["path",{d:"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z",key:"rwhkz3"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.383.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=p("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]),h={red:"Expired",yellow:"Approaching",green:"Safe",expired:"Expired",approaching:"Approaching",valid:"Safe",safe:"Safe"};function m(e){return h[e==null?void 0:e.toLowerCase()]??"Safe"}function v(e){switch(e){case"Expired":return{color:"var(--status-expired-text)",background:"var(--status-expired-bg)",borderColor:"var(--status-expired-border)"};case"Approaching":return{color:"var(--status-approaching-text)",background:"var(--status-approaching-bg)",borderColor:"var(--status-approaching-border)"};default:return{color:"var(--status-safe-text)",background:"var(--status-safe-bg)",borderColor:"var(--status-safe-border)"}}}const i={sm:"px-2 h-[22px] text-[8px] sm:text-[9px] w-full",md:"px-3 h-[26px] text-[9px] sm:text-[10px] w-full"};function _({status:e,size:r="md",className:n=""}){const{t:c}=g("harees"),a=m(e),u=v(a),d=c(`status_badge.${a.toLowerCase()}`,a);return x.jsx("span",{style:u,className:`
                flex items-center justify-center
                rounded-full border font-black uppercase tracking-wide
                ${i[r]??i.md}
                ${n}
            `,children:d})}function C(){const e=f(),r=b(),n=s.useMemo(()=>{var t;return!!((t=e.data)!=null&&t.needs_setup)},[e.data]),c=s.useMemo(()=>{var t;return[...((t=e.data)==null?void 0:t.products)||[]].reverse()},[e.data]),a=s.useMemo(()=>{var o;const t=((o=e.data)==null?void 0:o.stats)||{};return{expiredCount:t.red_batches??t.expiredCount??0,expiringSoon:t.yellow_batches??t.expiringSoon??0,validCount:t.green_batches??t.validCount??0}},[e.data]),{autoDiscount:u,autoDiscountPercent:d,autoHide:l}=s.useMemo(()=>{var o;const t=((o=r.data)==null?void 0:o.settings)||r.data||{};return{autoDiscount:!!t.auto_discounts,autoDiscountPercent:Number(t.auto_discount_percent)||0,autoHide:!!t.auto_hide_expired}},[r.data]);return{products:c,stats:a,autoDiscount:u,autoDiscountPercent:d,autoHide:l,needsSetup:n,isLoading:e.isLoading||r.isLoading,isError:e.isError||r.isError,error:e.error||r.error,refetch:async()=>{await Promise.all([e.refetch(),r.refetch()])}}}export{k as E,_ as S,w as X,v as g,m as n,C as u};
