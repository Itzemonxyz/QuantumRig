import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.error('BROWSER PAGE ERROR:', err.toString()));
    
    await page.goto('http://localhost:3000/products', { waitUntil: 'networkidle2', timeout: 30000 });
    
    console.log("Hovering on filters...");
    
    // Hover on all label elements in the panel
    const labels = await page.$$('label');
    for (const label of labels) {
      await label.hover();
      // wait a bit
      await new Promise(r => setTimeout(r, 100));
    }
    
    // Click some checkboxes/radios
    const inputs = await page.$$('input[type="radio"], input[type="checkbox"]');
    for (let i = 0; i < Math.min(inputs.length, 3); i++) {
       await inputs[i].click();
       await new Promise(r => setTimeout(r, 200));
    }
    
    console.log("PUPPETEER TEST COMPLETED WITH NO CRASHES");
    await browser.close();
  } catch (err) {
    console.error("PUPPETEER EXCEPTION:", err);
  }
})();
