const puppeteer = require('puppeteer');
const browserUtils = require('./browser');
const pageUtils = require('./page');

const measure = async page => {
  const performanceTiming = JSON.parse(
    await page.evaluate(() => JSON.stringify(window.performance.timing))
  );

  return extractDataFromPerformanceTiming(
    performanceTiming,
    'responseEnd',
    'domInteractive',
    'domContentLoadedEventEnd',
    'loadEventEnd'
  );
};

const extractDataFromPerformanceTiming = (timing, ...dataNames) => {
  const navigationStart = timing.navigationStart;

  const extractedData = {};
  dataNames.forEach(name => {
    extractedData[name] = timing[name] - navigationStart;
  });

  return extractedData;
};

const getDefaultTimings = async URL => {
  try {
    const browser = await browserUtils.launchBrowserWithoutExtension();
    const page = await browser.newPage();
    await page.goto(URL);
    const result = await measure(page);
    await browser.close();

    return result;
  } catch(e) {
    throw e;
  }
};

const getThrottledTimings = async URL => {
  try {
    const browser = await browserUtils.launchBrowserWithExtension();

    const page = await browser.newPage();
    await page.goto(URL);

    const extensionPage = await browser.newPage();
    await pageUtils.openPopUp(extensionPage);
    await pageUtils.toggleThrottlingForAllTabs(extensionPage, true);
    await page.reload();

    const result = await measure(page);
    await browser.close();

    return result;
  } catch (e) {
    throw e;
  }
};

module.exports = { getDefaultTimings, getThrottledTimings };