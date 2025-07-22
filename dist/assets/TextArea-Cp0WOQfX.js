import{j as e,t as o}from"./index-BQ92t-xb.js";const a=({id:t,label:l,error:s,className:d="",helperText:r,...i})=>e.jsxs("div",{className:o("w-full",d),children:[e.jsxs("label",{htmlFor:t,className:"block text-sm font-medium text-foreground mb-1.5",children:[l," ",i.required&&e.jsx("span",{className:"text-destructive",children:"*"})]}),e.jsx("textarea",{id:t,className:o(`
          w-full px-3 py-2 rounded-md border border-input bg-background text-foreground
          placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 
          focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed 
          disabled:opacity-50 transition-colors resize-y
          ${s?"border-destructive focus-visible:ring-destructive":""}
        `),...i}),r&&!s&&e.jsx("p",{className:"mt-1.5 text-xs text-muted-foreground",children:r}),s&&e.jsx("p",{className:"mt-1.5 text-xs text-destructive",children:s})]});export{a as T};
