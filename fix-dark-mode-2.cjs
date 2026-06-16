const fs = require('fs');
const files = [
  'src/pages/Home.tsx',
  'src/components/ProductCard.tsx',
  'src/pages/Products.tsx',
  'src/pages/Checkout.tsx',
  'src/components/Layout.tsx',
  'src/pages/Builder.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    
    // Replace border-slate-200 without dark:border-slate-xxx
    content = content.replace(/border-slate-200(?!\/)(?! dark:border-[s|r])/g, 'border-slate-200 dark:border-slate-800');
    // Replace border-slate-100 without dark:border-slate-xxx
    content = content.replace(/border-slate-100(?!\/)(?! dark:border-[s|r])/g, 'border-slate-100 dark:border-slate-800/60');
    // Replace text-[#111827] without dark:text-white
    content = content.replace(/text-\[\#111827\](?! dark:text-white)/g, 'text-[#111827] dark:text-white');
    // Replace text-slate-900 without dark:
    content = content.replace(/text-slate-900(?! dark:text)/g, 'text-slate-900 dark:text-slate-100');
    
    fs.writeFileSync(file, content);
  }
});
console.log('Fixed borders and texts');
