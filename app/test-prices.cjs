const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  page.on("pageerror", (err) => {
    errors.push(err.message);
  });

  try {
    await page.goto("http://localhost:3000", {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await page.waitForTimeout(5000);

    // Check for price elements
    const priceElements = await page.$$eval("*", (els) => {
      return els
        .filter(
          (e) =>
            e.textContent &&
            /\$[\d,]+/.test(e.textContent) &&
            e.textContent.includes("SOL")
        )
        .map((e) => e.textContent.substring(0, 100));
    });

    console.log("=== Price Elements Found ===");
    console.log(priceElements.slice(0, 10).join("\n"));

    console.log("\n=== Console Errors ===");
    if (errors.length === 0) {
      console.log("No errors!");
    } else {
      errors.forEach((e) => console.log(e));
    }

    // Get page title
    const title = await page.title();
    console.log("\n=== Page Title ===");
    console.log(title);
  } catch (err) {
    console.log("Error:", err.message);
  } finally {
    await browser.close();
  }
})();
