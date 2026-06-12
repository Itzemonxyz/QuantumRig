import fs from 'fs';
import path from 'path';

const replacements = [
  [/\bbg-white\b/g, 'bg-white dark:bg-slate-900'],
  [/\bbg-slate-50\b(?!\/|dark:)/g, 'bg-slate-50 dark:bg-slate-950'],
  [/\bbg-slate-100\b(?!\/|dark:)/g, 'bg-slate-100 dark:bg-slate-800'],
  [/\bbg-slate-200\b(?!\/|dark:)/g, 'bg-slate-200 dark:bg-slate-700'],
  [/\btext-slate-900\b/g, 'text-slate-900 dark:text-white'],
  [/\btext-slate-800\b/g, 'text-slate-800 dark:text-slate-200'],
  [/\btext-slate-700\b/g, 'text-slate-700 dark:text-slate-300'],
  [/\btext-slate-600\b/g, 'text-slate-600 dark:text-slate-400'],
  [/\btext-slate-500\b/g, 'text-slate-500 dark:text-slate-400'],
  [/\border-slate-200\b/g, 'border-slate-200 dark:border-slate-700'],
  [/\border-slate-100\b/g, 'border-slate-100 dark:border-slate-800'],
  [/\border-slate-300\b/g, 'border-slate-300 dark:border-slate-600'],
  [/\bhover:bg-slate-50\b/g, 'hover:bg-slate-50 dark:hover:bg-slate-800'],
  [/\bhover:bg-slate-100\b/g, 'hover:bg-slate-100 dark:hover:bg-slate-800']
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Apply replacements
      for (const [regex, replacement] of replacements) {
         // Avoid double replacing if it's already there
         content = content.replace(regex, (...args) => {
             const fullStr = args[args.length - 1];
             const offset = args[args.length - 2];
             const match = args[0];
             const nextChars = fullStr.substring(offset + match.length, offset + match.length + 5);
             if (nextChars === ' dark' || nextChars === 'dark:') return match;
             return replacement;
         });
      }

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

processDir(path.join(process.cwd(), 'src'));
