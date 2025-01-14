const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    // เพิ่ม defaultViewport เพื่อให้มองเห็นได้ดีขึ้น
    defaultViewport: { width: 1280, height: 800 }
  });
  const page = await browser.newPage();

  // เพิ่มการดัก log ทุกประเภท
  page.on('console', (msg) => {
    const type = msg.type();
    console.log(`[${type.toUpperCase()}] ${msg.text()}`);
  });

  // เพิ่ม try-catch หลักเพื่อดักจับ error ทั้งหมด
  try {
    console.log('Starting the process...'); // เพิ่ม log เริ่มต้น

    await page.goto('https://poll.fm/14853820/embed');
    console.log('Page loaded successfully');

    while (true) {
      try {
        console.log('Starting new vote cycle...'); // เพิ่ม log รอบการทำงาน

        await page.waitForSelector('.css-answer-row input[type="radio"]');
        console.log('Found radio button');

        await page.click('.css-answer-row input[type="radio"]');
        console.log('Clicked radio button');

        await page.waitForSelector('#pd-vote-button14853820');
        console.log('Found vote button');

        await page.click('#pd-vote-button14853820');
        console.log('Clicked vote button');

        // เพิ่ม timeout และ log สำหรับ navigation
        await page.waitForNavigation({ timeout: 10000 })
          .then(() => console.log('Navigation completed'))
          .catch(e => console.log('Navigation timeout:', e.message));

        // ปรับปรุงการดึงข้อมูลโจทย์
        const captchaData = await page.evaluate(() => {
          const problemElement = document.querySelector('#captcha_14853820 p');
          if (!problemElement) {
            console.log('Captcha element not found');
            return null;
          }
          const problemText = problemElement.textContent.trim();
          console.log('Problem text:', problemText); // log ในบริบทของเบราว์เซอร์
          const [num1, , num2] = problemText.split(' ');
          return { 
            problemText, 
            result: parseInt(num1) + parseInt(num2)
          };
        });

        if (!captchaData) {
          throw new Error('Failed to get captcha data');
        }

        console.log(`Problem: ${captchaData.problemText}`);
        console.log(`Calculated answer: ${captchaData.result}`);

        await page.waitForSelector('#answer_14853820', { visible: true });
        console.log('Found answer input');

        await page.type('#answer_14853820', captchaData.result.toString());
        console.log('Typed answer');

        await page.waitForSelector('#pd-vote-button14853820');
        await page.click('#pd-vote-button14853820');
        console.log('Submitted answer');

        await page.waitForSelector('.pds-return-poll');
        console.log('Found return link');

        await page.click('.pds-return-poll');
        console.log('Clicked return link');

        await page.waitForNavigation({ timeout: 10000 });
        console.log('Returned to main page');

        // เพิ่มการหน่วงเวลาเล็กน้อยระหว่างรอบ
        await page.waitForTimeout(1000);

      } catch (error) {
        console.error('Error in vote cycle:', error);
        console.log('Attempting to restart cycle...');
        // ลองโหลดหน้าใหม่เมื่อเกิดข้อผิดพลาด
        await page.reload();
        continue;
      }
    }
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    console.log('Closing browser...');
    await browser.close();
  }
})();