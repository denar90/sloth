/**
 * Note: Tests are applied ONLY for functionality when throttling applied to all tabs
 * @todo find the way to fix it
 */
const path = require('path');
const puppeteer = require('puppeteer');
const assert = require('assert');

const CRX_PATH = path.join(__dirname, '/fixtures');
const URL = 'https://www.nytimes.com/';
const POPUP_URL = 'chrome-extension://daclkijhjpmgpmjnlppibebgficnlfop/popup.html';
const TEST_TIMEOUT = 10 * 30000;

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

const getDefaultTimings = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        '--user-agent=PuppeteerAgentFast'
      ]
    });
    const page = await browser.newPage();
    await page.goto(URL);
    const result = await measure(page, 'Fast folk');
    await browser.close();

    return result;
  } catch(e) {
    throw e;
  }
};

const getThrottledTimings = async () => {
  try {
    const browser = await launchBrowserWithExtension();

    const page = await browser.newPage();
    await page.goto(URL);

    const extensionPage = await browser.newPage();
    await openPopUp(extensionPage);
    await enableThrottlingForAllTabs(extensionPage);
    await page.reload();

    const result = await measure(page, 'Slow folk');
    await browser.close();

    return result;
  } catch (e) {
    throw e;
  }
};

const launchBrowserWithExtension = async () => {
  return await puppeteer.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${CRX_PATH}`,
      `--load-extension=${CRX_PATH}`,
      '--user-agent=PuppeteerAgentSlow'
    ]
  });
};

const enableThrottlingForAllTabs = async page => {
  await page.waitFor(1000);
  await page.evaluate(() => {
    document.querySelector('.js-apply-to-all-tabs').checked = true;
  });
  await applyThrottling(page);
};

const applyThrottling = async page => {
  page.click('.js-enable-throttling');
  // await to apply extension changes
  await page.waitFor(2000);
};

const openPopUp = async page => {
  await page.goto(POPUP_URL);
};

describe('Throttling extension', function () {
  describe('Throttled results', function () {
    it('should be slower', async function () {
      this.timeout(TEST_TIMEOUT);

      const defaultTimings = await getDefaultTimings();
      const throttlingTimings = await getThrottledTimings();

      assert(throttlingTimings.responseEnd > defaultTimings.responseEnd);
      assert(throttlingTimings.domInteractive > defaultTimings.domInteractive);
      assert(throttlingTimings.domContentLoadedEventEnd > defaultTimings.domContentLoadedEventEnd);
      assert(throttlingTimings.loadEventEnd > defaultTimings.loadEventEnd);
    });

    // @todo add test when throttling applied but new tab was opened
  });

  describe('Popup state', function () {
    let browser;

    beforeEach(async function () {
      browser = await launchBrowserWithExtension();
    });

    afterEach(async function () {
      await browser.close();
    });

    it('should not have enabled throttling for all tabs', async function () {
      this.timeout(TEST_TIMEOUT);

      const page = await browser.newPage();
      await openPopUp(page);
      await page.waitFor(1000);

      const checkboxChecked = await page.evaluate(() => document.querySelector('.js-apply-to-all-tabs').checked);
      assert(!checkboxChecked);
    });

    it('should save stored popup state', async function () {
      this.timeout(TEST_TIMEOUT);

      let page = await browser.newPage();
      await openPopUp(page);
      await enableThrottlingForAllTabs(page);
      await page.close();

      page = await browser.newPage();
      await openPopUp(page);
      await page.waitFor(1000);

      const checkboxChecked = await page.evaluate(() => document.querySelector('.js-apply-to-all-tabs').checked);
      assert(checkboxChecked);
    });
  });

  describe('Apply throttling', function () {
    let browser;

    beforeEach(async function () {
      browser = await launchBrowserWithExtension();
    });

    afterEach(async function () {
      await browser.close();
    });

    it('should be enabled', async function () {
      this.timeout(TEST_TIMEOUT);

      let page = await browser.newPage();
      await openPopUp(page);

      const disabledButton = await page.evaluate(() => document.querySelector('.js-enable-throttling').disabled);
      assert(!disabledButton);
    });

    it('should be disabled if throttling applied', async function () {
      this.timeout(TEST_TIMEOUT);

      let page = await browser.newPage();
      await openPopUp(page);
      await enableThrottlingForAllTabs(page);
      await page.close();

      page = await browser.newPage();
      await openPopUp(page);

      const disabledButton = await page.evaluate(() => document.querySelector('.js-enable-throttling').disabled);
      assert(disabledButton);
    });
  });
});
