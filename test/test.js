/**
 * Note: Tests are applied ONLY for functionality when throttling applied to all tabs
 * @todo find the way to fix it
 */
const assert = require('assert');
const browserHelpers = require('./helpers/browser');
const pageHelpers = require('./helpers/page');
const timingsUtils = require('./utils/timings');

const TEST_TIMEOUT = 10 * 30000;

describe('Throttling extension', function () {
  describe('Popup state', function () {
    let browser;
    let browserWithoutExtension;

    beforeEach(async function () {
      browserWithoutExtension = await browserHelpers.launchBrowserWithoutExtension();
      browser = await browserHelpers.launchBrowserWithExtension();
    });

    afterEach(async function () {
      await browserWithoutExtension.close();
      await browser.close();
    });

    describe('throttling for all tabs', function () {
      it('should have disabled throttling for all tabs by default', async function () {
        this.timeout(TEST_TIMEOUT);

        const extensionPopUpPage = await pageHelpers.openExtensionPopUp(browser);
        const checkboxChecked = await extensionPopUpPage.evaluate(() => document.querySelector('.js-apply-to-all-tabs').checked);
        assert(!checkboxChecked);
      });

      it('should save stored popup state', async function () {
        this.timeout(TEST_TIMEOUT);

        let extensionPopUpPage = await pageHelpers.openExtensionPopUp(browser);
        await pageHelpers.toggleThrottlingForAllTabs(extensionPopUpPage, false);
        await extensionPopUpPage.close();

        extensionPopUpPage = await pageHelpers.openExtensionPopUp(browser);

        const checkboxChecked = await extensionPopUpPage.evaluate(() => document.querySelector('.js-apply-to-all-tabs').checked);
        assert(!checkboxChecked);
      });

      it('should be applied', async function () {
        this.timeout(TEST_TIMEOUT);

        const pageUrl = 'https://www.nytimes.com';
        const page = await browserWithoutExtension.newPage();
        await page.goto(pageUrl);
        const defaultTimings = await timingsUtils.measure(page);

        const browser = await browserHelpers.launchBrowserWithExtension();
        const throttledPage = await pageHelpers.applyThrottlingAllTabs(browser, pageUrl);
        const throttlingTimings = await timingsUtils.measure(throttledPage);
        await browser.close();

        assert(throttlingTimings.loadEventEnd > defaultTimings.loadEventEnd);
      });
    });

    describe('throttling for current tab', function () {
      it('should be applied', async function () {
        this.timeout(TEST_TIMEOUT);

        const pageUrl = 'https://www.nytimes.com';

        const page = await browserWithoutExtension.newPage();
        await page.goto(pageUrl);
        const defaultTimings = await timingsUtils.measure(page);

        const throttledPage = await pageHelpers.applyThrottlingForCurrentTab(browser, pageUrl);
        const throttlingTimings = await timingsUtils.measure(throttledPage);

        assert(throttlingTimings.loadEventEnd > defaultTimings.loadEventEnd);
      });

      it('should set current origin in a select', async function () {
        this.timeout(TEST_TIMEOUT);

        const extensionPopUpPage = await pageHelpers.openExtensionPopUp(browser);
        const selectedTabURLOrigin = await extensionPopUpPage.evaluate(() => document.querySelector('.js-tabs-origins').value);

        assert.equal(selectedTabURLOrigin, 'chrome-extension://daclkijhjpmgpmjnlppibebgficnlfop');
      });
    });
  });

  describe('Apply throttling', function () {
    let browser;

    beforeEach(async function () {
      browser = await browserHelpers.launchBrowserWithExtension();
    });

    afterEach(async function () {
      await browser.close();
    });

    it('should be enabled', async function () {
      this.timeout(TEST_TIMEOUT);

      const extensionPopUpPage = await pageHelpers.openExtensionPopUp(browser);

      const disabledButton = await extensionPopUpPage.evaluate(() => document.querySelector('.js-enable-throttling').disabled);
      assert(!disabledButton);
    });
  });
});
