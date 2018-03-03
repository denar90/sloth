/**
 * Note: Tests are applied ONLY for functionality when throttling applied to all tabs
 * @todo find the way to fix it
 */
const assert = require('assert');
const timings = require('./utils/timings');
const browserUtils = require('./utils/browser');
const pageUtils = require('./utils/page');

const TEST_TIMEOUT = 10 * 30000;

describe('Throttling extension', function () {
  describe('Throttled results', function () {
    it('should be slower', async function () {
      this.timeout(TEST_TIMEOUT);

      const page = 'https://www.nytimes.com/';

      const defaultTimings = await timings.getDefaultTimings(page);
      const throttlingTimings = await timings.getThrottledTimings(page);

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
      browser = await browserUtils.launchBrowserWithExtension();
    });

    afterEach(async function () {
      await browser.close();
    });

    it('should have enabled throttling for all tabs by default', async function () {
      this.timeout(TEST_TIMEOUT);

      const page = await browser.newPage();
      await pageUtils.openPopUp(page);
      await page.waitFor(1000);

      const checkboxChecked = await page.evaluate(() => document.querySelector('.js-apply-to-all-tabs').checked);
      assert(checkboxChecked);
    });

    it('should save stored popup state', async function () {
      this.timeout(TEST_TIMEOUT);

      let page = await browser.newPage();
      await pageUtils.openPopUp(page);
      await pageUtils.toggleThrottlingForAllTabs(page, false);
      await page.close();

      page = await browser.newPage();
      await pageUtils.openPopUp(page);
      await page.waitFor(1000);

      const checkboxChecked = await page.evaluate(() => document.querySelector('.js-apply-to-all-tabs').checked);
      assert(!checkboxChecked);
    });
  });

  describe('Apply throttling', function () {
    let browser;

    beforeEach(async function () {
      browser = await browserUtils.launchBrowserWithExtension();
    });

    afterEach(async function () {
      await browser.close();
    });

    it('should be enabled', async function () {
      this.timeout(TEST_TIMEOUT);

      let page = await browser.newPage();
      await pageUtils.openPopUp(page);

      const disabledButton = await page.evaluate(() => document.querySelector('.js-enable-throttling').disabled);
      assert(!disabledButton);
    });
  });
});
