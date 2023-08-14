const puppeteer = require('puppeteer');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const navigateWithTimeout = async (page, url, timeout) => {
  return Promise.race([
    page.goto(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Navigation timeout')), timeout)
    )
  ]);
};

app.get('/scrape', async (req, res) => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: "new" });
  const page = await browser.newPage();

  const barcode = req.query.barcode;
  if (!barcode) {
    res.status(400).send("Please provide a barcode.");
    return;
  }

  try {
    await navigateWithTimeout(page, `https://www.tajimaya-cc.net/?s=${barcode}&search-type=products&submit=`, 15000);
  } catch (error) {
    await browser.close();
    res.status(500).send("Navigation timeout or an error occurred.");
    return;
  }

  const productURL = await page.$eval('ul.prod_list li a', el => el.href);

  await page.goto(productURL);

  const productName = await page.$eval('.tit_prod .tit_txt', el => el.textContent);

  let productDescription = 'Description not available';
  if (await page.$('#overview') !== null) {
    productDescription = await page.$eval('#overview', el => el.textContent.trim());
  }

  await browser.close();

  res.json({ productName, productDescription });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
