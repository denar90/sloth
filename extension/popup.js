'use strict';

// Huge shot out to Lighthouse for const values
const LATENCY_FACTOR = 3.75;
const THROUGHPUT_FACTOR = 0.9;

const TARGET_LATENCY = 150; // 150ms
const TARGET_DOWNLOAD_THROUGHPUT = Math.floor(1.6 * 1024 * 1024 / 8); // 1.6Mbps
const TARGET_UPLOAD_THROUGHPUT = Math.floor(750 * 1024 / 8); // 750Kbps
const TARGET_CPU_RATE = 2;

const TYPICAL_MOBILE_THROTTLING_METRICS = {
  targetLatency: TARGET_LATENCY,
  latency: TARGET_LATENCY * LATENCY_FACTOR,
  targetDownloadThroughput: TARGET_DOWNLOAD_THROUGHPUT,
  downloadThroughput: TARGET_DOWNLOAD_THROUGHPUT * THROUGHPUT_FACTOR,
  targetUploadThroughput: TARGET_UPLOAD_THROUGHPUT,
  uploadThroughput: TARGET_UPLOAD_THROUGHPUT * THROUGHPUT_FACTOR,
  offline: false,
};

const getBackgroundPage = () => {
  return new Promise((resolve, reject) => {
    if (chrome.runtime.lastError) {
      reject('Background can\'t be get');
    }

    chrome.runtime.getBackgroundPage(resolve);
  });
};

(async() => {

  const background = await getBackgroundPage();

  const storage = background.storage;
  const chromeDebugger = background.chromeDebugger;
  const chromeTabs = background.chromeTabs;

  const enableThrottlingBtn = document.querySelector('.js-enable-throttling');
  const applyToAllTabsCheckbox = document.querySelector('.js-apply-to-all-tabs');
  const tabsOriginsSelect = document.querySelector('.js-tabs-origins');

  const toggleApplyThrottlingBtn = state => {
    enableThrottlingBtn.disabled = state;
  };

  const toggleApplyToAllTabsCheckbox = state => {
    applyToAllTabsCheckbox.checked = state;
  };

  const addOriginToUIList = origin => {
    tabsOriginsSelect.appendChild(createTabOriginOption(origin));
  };

  const createTabOriginOption = (value = '') => {
    const option = document.createElement('option');
    option.value = value;
    option.label = value;
    return option;
  };

  const getSelectedOrigin = () => tabsOriginsSelect.options[tabsOriginsSelect.selectedIndex].value;

  const setOriginToStorage = async newOrigin => {
    const data = await storage.get(storage.schema.tabsOrigins);
    if (data) {
      const origins = data.tabsOrigins || [];
      if (!origins.includes(newOrigin)) {
        origins.push(newOrigin);
        await storage.set(storage.schema.tabsOrigins, origins);
      }
    }
  };

  storage.get(storage.schema.applyToAllTabs).then(value => {
    if (value && typeof value.applyToAllTabs !== 'undefined') {
      applyToAllTabsCheckbox.checked = value.applyToAllTabs;
    }
  });

  storage.get(storage.schema.throttlingEnabled).then(value => {
    if (value && typeof value.throttlingEnabled !== 'undefined') {
      toggleApplyThrottlingBtn(value.throttlingEnabled);
    }
  });

  storage.onChanged(changes => {
    const storageChange = changes[storage.schema.throttlingEnabled];
    if (storageChange) {
      toggleApplyThrottlingBtn(storageChange.newValue);
    }
  });

  storage.onChanged(changes => {
    const storageChange = changes[storage.schema.applyToAllTabs];
    if (storageChange) {
      toggleApplyToAllTabsCheckbox(storageChange.newValue);
    }
  });

  const currentTab = await chromeTabs.getCurrentTab();
  if (currentTab.url) {
    const currentOrigin = new URL(currentTab.url).origin;
    addOriginToUIList(currentOrigin);
  }

  enableThrottlingBtn.addEventListener('click', enableThrottling);

  chromeTabs.onCreated(async tab => {
    const throttlingEnabled = await storage.getByName(storage.schema.throttlingEnabled);
    if (!throttlingEnabled) return;

    await attachDebuggerToNewTab(tab);
  });

  chromeTabs.onUpdated(async (tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete') return;
    if (!tab.url) return;

    await attachDebuggerToNewTab(tab);
  });

  const attachDebuggerToNewTab = async tab => {
    const throttlingEnabled = await storage.getByName(storage.schema.throttlingEnabled);
    if (!throttlingEnabled) return;

    const currentOrigin = new URL(tab.url).origin;
    const tabsOrigins = await storage.getByName(storage.schema.tabsOrigins);
    if (typeof tabsOrigins !== 'undefined' && tabsOrigins.length > 0) {
      if (tabsOrigins.includes(currentOrigin)) {
        await attachDebugger(tab);
      }
    }
  };

  async function enableThrottling() {
    try {
      const enabled = document.querySelector('.js-apply-to-tab').checked;
      const enabledToAll = applyToAllTabsCheckbox.checked;

      if (enabledToAll) {
        const tabs = await chromeTabs.getOpenedTabs();
        for (const tab of tabs) {
          await attachDebugger(tab);
        }
      } else if (enabled) {
        await attachDebugger(currentTab);
      } else {
        console.log(new Error('Throttling was not applied'));
        return;
      }

      await storage.set(storage.schema.throttlingEnabled, true);
      await storage.set(storage.schema.applyToAllTabs, enabledToAll);
      await setOriginToStorage(getSelectedOrigin());
    } catch (e) {
      console.log(e.message);
    }
  }

  async function attachDebugger(tab) {
    // try/catch to not fail on empty tabs
    try {
      const target = { tabId: tab.id };
      await chromeDebugger.attach(target, '1.1');

      await chromeDebugger.sendCommand(target, 'Network.enable');
      await chromeDebugger.sendCommand(target, 'Network.emulateNetworkConditions',  TYPICAL_MOBILE_THROTTLING_METRICS);
      await chromeDebugger.sendCommand(target, 'Emulation.setCPUThrottlingRate', { rate: TARGET_CPU_RATE });
    } catch(e) {
      throw e;
    }
  }
})();
