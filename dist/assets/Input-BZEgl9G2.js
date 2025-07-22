import{j as e,t as c}from"./index-BQ92t-xb.js";const f=({label:n,id:l,icon:s,error:t,className:r="",as:i="input",children:u,helperText:o,...d})=>{const m=`
    flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm 
    ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium 
    placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 
    focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed 
    disabled:opacity-50 transition-colors
    ${t?"border-destructive focus-visible:ring-destructive":""}
    ${s?"pl-10":""}
  `,a=i==="select"?"select":"input";return e.jsxs("div",{className:c("w-full",i==="input"?r:""),children:[n&&e.jsxs("label",{htmlFor:l,className:"block text-sm font-medium text-foreground mb-1.5",children:[n," ",d.required&&e.jsx("span",{className:"text-destructive",children:"*"})]}),e.jsxs("div",{className:"relative",children:[s&&e.jsx("div",{className:"absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground",children:s}),e.jsx(a,{id:l,className:c(m,i==="select"?r:""),...d,children:u})]}),o&&!t&&e.jsx("p",{className:"mt-1.5 text-xs text-muted-foreground",children:o}),t&&e.jsx("p",{className:"mt-1.5 text-xs text-destructive",children:t})]})};export{f as I};
