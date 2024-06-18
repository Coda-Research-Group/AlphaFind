const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    // Navigate to your web application
    await page.goto('http://localhost:8081/search?q=A0A0C5PVI1&limit=51');

    // Perform actions or assertions on the page
    const title = await page.title();
    console.log('Page title:', title);

    // Wait for 5 seconds (adjust as needed) before checking for the element
    await page.waitFor(5000);

    // Check if the text "A0A0C5PVI1" exists on the page
    const textExists = await page.evaluate(() => {
      const searchText = 'A0A0C5PVI1';
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.some(el => el.textContent.includes(searchText));
    });

    if (textExists) {
      console.log('Text "A0A0C5PVI1" found on the page.');
    } else {
      console.log('Text "A0A0C5PVI1" not found on the page.');
      process.exit(1); // Exit with a non-zero status to indicate failure
    }

    await browser.close();
    process.exit(0); // Exit with a zero status to indicate success
  } catch (error) {
    console.error('Error:', error);
    await browser.close();
    process.exit(1); // Exit with a non-zero status on error
  }
})();