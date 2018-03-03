const POPUP_URL = 'chrome-extension://daclkijhjpmgpmjnlppibebgficnlfop/popup.html';

const toggleThrottlingForAllTabs = async (page, state) => {
  await page.waitFor(1000);
  await page.evaluate(state => {
    document.querySelector('.js-apply-to-all-tabs').checked = state;
  }, state);
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

module.exports = { toggleThrottlingForAllTabs, openPopUp };