const puppeteer = require('puppeteer');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port if available

app.get('/scrape', async (req, res) => {
  // Use the new headless mode
  process.env.PUPPETEER_CACHE_DIR = '/opt/render/project/.chrome';
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Use the barcode from the query parameter
  const barcode = req.query.barcode;
  if (!barcode) {
    res.status(400).send("Please provide a barcode.");
    return;
  }

  await page.goto(`https://www.tajimaya-cc.net/?s=${barcode}&search-type=products&submit=`);

  // Extract the product URL from the search result
  const productURL = await page.$eval('ul.prod_list li a', el => el.href);

  // Navigate to the product page
  await page.goto(productURL);

  // Extract the product name and description
  const [productName, productDescription] = await Promise.all([
    page.$eval('.tit_prod .tit_txt', el => el.textContent),
    page.$eval('#overview', el => el.textContent.trim())
  ]);

  await browser.close();

  res.json({ productName, productDescription });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
