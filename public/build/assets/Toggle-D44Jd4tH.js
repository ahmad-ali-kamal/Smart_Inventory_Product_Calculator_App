import{e as s,j as o}from"./app-DkHZ1snj.js";function u({checked:t,onChange:n,disabled:r=!1}){const{isAr:e}=s(),a=t?`translateX(${e?-20:20}px)`:"translateX(0px)";return o.jsx("button",{type:"button",role:"switch","aria-checked":t,"aria-label":e?"تبديل":"Toggle",onClick:()=>!r&&n(),disabled:r,className:`
                relative inline-flex items-center flex-shrink-0
                w-11 h-6 rounded-full border-none p-0 outline-none
                transition-[background-color] duration-250 ease-linear
                ${r?"cursor-not-allowed opacity-50":"cursor-pointer"}
            `,style:{backgroundColor:t?"var(--primary)":"#d1d5db"},children:o.jsx("span",{className:"absolute top-1 rtl:right-1 ltr:left-1 w-4 h-4 rounded-full bg-white",style:{boxShadow:"0 1px 3px rgba(0,0,0,0.2)",transform:a,transition:"transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",willChange:"transform"}})})}export{u as T};
