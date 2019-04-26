const POPUP_URL = 'chrome-extension://daclkijhjpmgpmjnlppibebgficnlfop/popup.html';

const applyThrottling = async page => {
  page.click('.js-enable-throttling');
  await page.waitFor(2000);
};

const openPopUp = async page => {
  await page.goto(POPUP_URL);
  await page.waitFor(2000);
};

// @fixme add proper selection supported by Choices plugin on UI
const changeSelectedTabOriginValue = async (page, mockUrl) => {
  await page.evaluate(mockUrl => {
    const tabsSelect = document.querySelector('.js-tabs-origins');
    const selectedOption = tabsSelect.options[tabsSelect.selectedIndex];
    selectedOption.value = mockUrl;
    selectedOption.label = mockUrl;
  }, mockUrl);
};

const applyThrottlingForCurrentTab = async (browser, URL) => {
  try {
    const extensionPopUpPage = await openExtensionPopUp(browser);
    // stub select value
    await changeSelectedTabOriginValue(extensionPopUpPage, URL);
    await applyThrottling(extensionPopUpPage);

    const page = await browser.newPage();
    await page.goto(URL);
    await page.reload();

    return page;
  } catch (e) {
    throw e;
  }
};

const openExtensionPopUp = async browser => {
  const extensionPopUpPage = await browser.newPage();
  await openPopUp(extensionPopUpPage);
  return extensionPopUpPage;
};


module.exports = {
  openExtensionPopUp,
  applyThrottlingForCurrentTab,
};