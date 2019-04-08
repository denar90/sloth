const assert = require('assert');
const { launchBrowserWithoutExtension, launchBrowserWithExtension } = require('./helpers/browser');
const { applyThrottlingAllTabs, openExtensionPopUp, applyThrottlingForCurrentTab, toggleThrottlingForAllTabs } = require('./helpers/page');
const timingsUtils = require('./utils/timings');

const TEST_TIMEOUT = 10 * 30000;

// @todo fix skipped test with fixing changeSelectedTabOriginValue

describe('Throttling extension', function () {
  describe('Popup state', function () {
    let browser;
    let browserWithoutExtension;

    beforeEach(async function () {
      browserWithoutExtension = await launchBrowserWithoutExtension();
      browser = await launchBrowserWithExtension();
    });

    afterEach(async function () {
      await browserWithoutExtension.close();
      await browser.close();
    });

    describe('throttling for all tabs', function () {
      it.skip('should be applied', async function () {
        this.timeout(TEST_TIMEOUT);

        const pageUrl = 'https://www.nytimes.com';
        const page = await browserWithoutExtension.newPage();
        await page.goto(pageUrl);
        const defaultTimings = await timingsUtils.measure(page);

        const browser = await launchBrowserWithExtension();
        const throttledPage = await applyThrottlingAllTabs(browser, pageUrl);
        const throttlingTimings = await timingsUtils.measure(throttledPage);
        await browser.close();

        assert(throttlingTimings.loadEventEnd > defaultTimings.loadEventEnd);
      });
    });

    describe('throttling for current tab', function () {
      it.skip('should be applied', async function () {
        this.timeout(TEST_TIMEOUT);

        const pageUrl = 'https://www.nytimes.com';

        const page = await browserWithoutExtension.newPage();
        await page.goto(pageUrl);
        const defaultTimings = await timingsUtils.measure(page);

        const throttledPage = await applyThrottlingForCurrentTab(browser, pageUrl);
        const throttlingTimings = await timingsUtils.measure(throttledPage);

        assert(throttlingTimings.loadEventEnd > defaultTimings.loadEventEnd);
      });

      it('should set current origin in a select', async function () {
        this.timeout(TEST_TIMEOUT);

        const extensionPopUpPage = await openExtensionPopUp(browser);
        const selectedTabURLOrigin = await extensionPopUpPage.evaluate(() => document.querySelector('.js-tabs-origins').value);

        assert.equal(selectedTabURLOrigin, 'chrome-extension://daclkijhjpmgpmjnlppibebgficnlfop');
      });
    });

    describe('Reload tab after throttling', function () {
      it('should be enabled by default', async function () {
        this.timeout(TEST_TIMEOUT);

        const extensionPopUpPage = await openExtensionPopUp(browser);
        const checkboxChecked = await extensionPopUpPage.evaluate(() => document.querySelector('.js-reload-tabs').checked);
        assert(checkboxChecked);
      });
      it('should reload current tab after throttling if enabled', async function() {
        this.timeout(TEST_TIMEOUT);
        try {
          const extensionPopUpPage = await openExtensionPopUp(browser);

          const [response] = await Promise.all([
            extensionPopUpPage.waitForNavigation(),
            extensionPopUpPage.click('.js-enable-throttling')
          ]);
          await browser.close();

          assert.ok(response.ok());
        } catch (e) {
          assert.fail(e.message);
        }
      });
      it.skip('should reload all tabs after throttling if enabled', async function() {
        this.timeout(TEST_TIMEOUT);

        const pageUrl1 = 'https://bing.com';
        const pageUrl2 = 'https://google.com';

        const page1 = await browser.newPage();
        await page1.goto(pageUrl1);
        const page2 = await browser.newPage();
        await page2.goto(pageUrl2);

        const extensionPopUpPage = await openExtensionPopUp(browser);
        const waitForOption = {
          waitUnitl: ['load', 'domcontentloaded'],
          timeout: 5000
        };
        await Promise.all([
          extensionPopUpPage.waitForNavigation(waitForOption),
          page1.waitForNavigation(waitForOption),
          page2.waitForNavigation(waitForOption),
          toggleThrottlingForAllTabs(extensionPopUpPage),
        ]).then(res => {
          assert.ok(res.every(item => {
            if (typeof item === 'undefined') {
              return true; // click method resolve promise and return undefined as a result
            }
            return true === item.ok();
          }));
        })
          .catch(err => {
            throw err;
          });
        await browser.close();
      })
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

      const extensionPopUpPage = await openExtensionPopUp(browser);

      const disabledButton = await extensionPopUpPage.evaluate(() => document.querySelector('.js-enable-throttling').disabled);
      assert(!disabledButton);
    });
  });
});
