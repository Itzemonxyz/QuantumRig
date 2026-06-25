import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'src/pages/admin');
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace all dark classes
    content = content.replace(/\bdark:[a-zA-Z0-9/\-:]+/g, '');
    
    // Clean up double spaces inside strings
    content = content.replace(/className="([^"]*)"/g, (match, p1) => {
        return `className="${p1.replace(/\s+/g, ' ').trim()}"`;
    });
    
    content = content.replace(/className=\{`([^`]*)`\}/g, (match, p1) => {
        // Just remove extra spaces inside backticks, but carefully
        return `className={\`${p1.replace(/ +/g, ' ').trim()}\`}`;
    });
    
    fs.writeFileSync(filePath, content, 'utf-8');
  }
});
console.log('Removed dark mode classes.');
