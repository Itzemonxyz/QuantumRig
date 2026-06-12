import fs from 'fs';
import path from 'path';

function replaceChartColors(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceChartColors(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let modified = false;

      // CartesianGrid stroke
      if (content.includes('stroke="#e2e8f0"')) {
        content = content.replace(/stroke="#e2e8f0"/g, 'stroke="var(--chart-grid)"');
        modified = true;
      }
      
      // XAxis / YAxis stroke
      if (content.includes('stroke="#64748b"')) {
        content = content.replace(/stroke="#64748b"/g, 'stroke="var(--chart-text)"');
        modified = true;
      }

      // XAxis / YAxis fill
      if (content.includes("fill: '#64748b'")) {
        content = content.replace(/fill: '#64748b'/g, "fill: 'var(--chart-text)'");
        modified = true;
      }

      // Tooltip cursor fill
      if (content.includes("fill: 'rgba(241, 245, 249, 0.5)'")) {
        content = content.replace(/fill: 'rgba\(241, 245, 249, 0\.5\)'/g, "fill: 'var(--chart-grid)'");
        modified = true;
      }

      // fill="#cbd5e1" generally used for background bars, replace with chart-grid or generic
      if (content.includes('fill="#cbd5e1"')) {
        content = content.replace(/fill="#cbd5e1"/g, 'fill="var(--chart-grid)"');
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

replaceChartColors(path.join(process.cwd(), 'src'));
