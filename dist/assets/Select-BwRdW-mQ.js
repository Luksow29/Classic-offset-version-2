import{j as e,t as c,C as u}from"./index-BQ92t-xb.js";const m=({id:i,label:r,options:d,error:s,className:n="",placeholder:l,helperText:o,...a})=>e.jsxs("div",{className:c("w-full",n),children:[r&&e.jsxs("label",{htmlFor:i,className:"block text-sm font-medium text-foreground mb-1.5",children:[r," ",a.required&&e.jsx("span",{className:"text-destructive",children:"*"})]}),e.jsxs("div",{className:"relative",children:[e.jsxs("select",{id:i,className:c(`
            h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm 
            ring-offset-background placeholder:text-muted-foreground 
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
            disabled:cursor-not-allowed disabled:opacity-50 transition-colors
            ${s?"border-destructive focus-visible:ring-destructive":""}
            pr-10
          `,n),...a,children:[l&&e.jsx("option",{value:"",children:l}),d.map(t=>e.jsx("option",{value:t.value,children:t.label},t.value))]}),e.jsx("div",{className:"absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-muted-foreground",children:e.jsx(u,{className:"w-5 h-5"})})]}),o&&!s&&e.jsx("p",{className:"mt-1.5 text-xs text-muted-foreground",children:o}),s&&e.jsx("p",{className:"mt-1.5 text-xs text-destructive",children:s})]});export{m as S};
