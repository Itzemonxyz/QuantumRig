const fs = require('fs');

let content = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

// Replace standard iconClass text colors with dark variants
const replacements = [
  { p: /text-indigo-600/g, r: 'text-indigo-600 dark:text-indigo-400' },
  { p: /text-violet-600/g, r: 'text-violet-600 dark:text-violet-400' },
  { p: /text-teal-600/g, r: 'text-teal-600 dark:text-teal-400' },
  { p: /text-emerald-600/g, r: 'text-emerald-600 dark:text-emerald-400' },
  { p: /text-rose-600/g, r: 'text-rose-600 dark:text-rose-400' },
  { p: /text-amber-600/g, r: 'text-amber-600 dark:text-amber-400' },
  { p: /text-blue-600/g, r: 'text-blue-600 dark:text-blue-400' },
  { p: /text-cyan-600/g, r: 'text-cyan-600 dark:text-cyan-400' },
  { p: /text-purple-600/g, r: 'text-purple-600 dark:text-purple-400' },
  { p: /text-fuchsia-600/g, r: 'text-fuchsia-600 dark:text-fuchsia-400' },
  { p: /text-orange-600/g, r: 'text-orange-600 dark:text-orange-400' },
];

replacements.forEach(({p, r}) => {
  // Try to prevent double replacement
  content = content.replace(p, match => {
    // We can just use string replace. But wait, `p` is global.
    return match;
  });
});

// A better way: Just alter the properties inside Home.tsx getCategoryMeta
content = content.replace(/iconClass: "text-([a-z]+)-600"/g, 'iconClass: "text-$1-600 dark:text-$1-400"');

// And remove inline `color: meta.textColor` from Mobile
content = content.replace(/<span className="text-\[10px\] font-extrabold uppercase tracking-widest block" style={{ color: meta.textColor }}>{meta.tagline}<\/span>/g, '<span className={`text-[10px] font-extrabold uppercase tracking-widest block ${meta.iconClass}`}>{meta.tagline}</span>');

// And remove inline `color: meta.textColor` from Desktop tag lines! Wait, Desktop tagline uses `text-slate-400`. We shouldn't change the tagline there.
content = content.replace(/color: meta\.textColor/g, '/* color: meta.textColor */');

// And we must add `${meta.iconClass}` to the border container of the icon.
// For Mobile:
content = content.replace(/className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"/g, 'className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${meta.iconClass}`}');
// For desktop:
content = content.replace(/className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-inner border"/g, 'className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-inner border ${meta.iconClass}`}');

// Also fix dark mode background in meta.bgColor if needed? Well, with dark container it's fine if the text is right.

fs.writeFileSync('src/pages/Home.tsx', content);
console.log('Fixed icon class in Home.tsx');
