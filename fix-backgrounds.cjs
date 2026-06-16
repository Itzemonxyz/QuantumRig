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
    
    // Replace bg-slate-50 without dark:bg
    content = content.replace(/bg-slate-50(?!\/)(?! dark:bg)/g, 'bg-slate-50 dark:bg-slate-900/50');
    // Replace inline transparent backgrounds that might be missing dark:bg
    content = content.replace(/bg-white(?!\/)(?! dark:bg)/g, 'bg-white dark:bg-slate-900');
    
    fs.writeFileSync(file, content);
  }
});
console.log('Fixed backgrounds');
