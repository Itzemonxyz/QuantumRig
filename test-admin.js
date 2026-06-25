import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.error('BROWSER PAGE ERROR:', err.toString()));
    
    await page.goto('http://localhost:3000/admin-login', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log("Admin login page loaded");
    await new Promise(r => setTimeout(r, 1000));
    
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log("Admin Dashboard page loaded");
    await new Promise(r => setTimeout(r, 1000));
    
    await browser.close();
  } catch (err) {
    console.error("PUPPETEER ERROR:", err);
  }
})();
