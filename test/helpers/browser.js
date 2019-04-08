const path = require('path');
const puppeteer = require('puppeteer');

const CRX_PATH = path.join(__dirname, '../fixtures');

const args = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
];

const launchBrowserWithoutExtension = async () => {
  return await puppeteer.launch({
    headless: false,
    args: [...args, '--user-agent=PuppeteerAgentFast']
  });
};

const launchBrowserWithExtension = async () => {
  return await puppeteer.launch({
    headless: false,
    args: [
      ...args,
      `--disable-extensions-except=${CRX_PATH}`,
      `--load-extension=${CRX_PATH}`,
      '--user-agent=PuppeteerAgentSlow'
    ]
  });
};

module.exports = { launchBrowserWithoutExtension, launchBrowserWithExtension };
