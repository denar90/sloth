const path = require('path');
const puppeteer = require('puppeteer');

const CRX_PATH = path.join(__dirname, '../fixtures');

const launchBrowserWithoutExtension = async () => {
  return await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--user-agent=PuppeteerAgentFast'
    ]
  });
};

const launchBrowserWithExtension = async () => {
  return await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--disable-extensions-except=${CRX_PATH}`,
      `--load-extension=${CRX_PATH}`,
      '--user-agent=PuppeteerAgentSlow'
    ]
  });
};

module.exports = { launchBrowserWithoutExtension, launchBrowserWithExtension };
