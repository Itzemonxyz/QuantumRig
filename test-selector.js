import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    await page.goto('http://localhost:3000/admin-login');
    await page.type('input[type="email"]', 'admin@quantumrig.tech');
    await page.type('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    await page.goto('http://localhost:3000/admin/users');
    await new Promise(r => setTimeout(r, 2000));
    
    const selector = "div#root:nth-of-type(1) > div:nth-of-type(1) > main:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > main:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > table:nth-of-type(1) > thead:nth-of-type(1) > tr:nth-of-type(1) > th:nth-of-type(1)";
    
    const html = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el ? el.outerHTML : 'NOT FOUND';
    }, selector);
    
    console.log("HTML in users tab:", html);
    
    // Also try checking other common paths to see if we can find any table that matches
    const allThs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('th')).map(th => {
        return {
          html: th.outerHTML,
          path: (function getPath(el) {
            let path = [];
            while(el && el.nodeName !== 'HTML') {
              let tag = el.nodeName.toLowerCase();
              let id = el.id ? '#' + el.id : '';
              let index = 1;
              let sib = el.previousElementSibling;
              while(sib) {
                if (sib.nodeName === el.nodeName) index++;
                sib = sib.previousElementSibling;
              }
              path.unshift(`${tag}${id}:nth-of-type(${index})`);
              el = el.parentElement;
            }
            return path.join(' > ');
          })(th)
        };
      });
    });
    
    console.log("All TH paths in users tab:", JSON.stringify(allThs, null, 2));

    await browser.close();
  } catch (err) {
    console.error("PUPPETEER EXCEPTION:", err);
  }
})();
