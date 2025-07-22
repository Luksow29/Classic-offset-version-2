import{m as l,j as r,t as e}from"./index-BQ92t-xb.js";const b=({title:s,children:n,className:i="",titleClassName:t="",interactive:a=!1,onClick:o})=>{const d=a?{initial:{scale:1,boxShadow:"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"},hover:{scale:1.02,boxShadow:"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",transition:{type:"spring",stiffness:300,damping:20}},tap:{scale:.98,transition:{type:"spring",stiffness:400,damping:25}}}:{},p=a?l.div:"div",x=a?{variants:d,initial:"initial",whileHover:"hover",whileTap:"tap",onClick:o}:{onClick:o};return r.jsxs(p,{...x,className:e(`
        bg-card text-card-foreground
        rounded-lg
        border border-border
        shadow-sm
        overflow-hidden
        transition-colors
      `,i),children:[s&&r.jsx("div",{className:e("p-6 border-b border-border flex items-center justify-between",t),children:r.jsx("h3",{className:"text-lg font-semibold leading-none tracking-tight",children:s})}),r.jsx("div",{className:e("",!s&&""),children:n})]})};export{b as C};
