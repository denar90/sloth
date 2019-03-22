'use strict';

import { contentLoaded } from 'document-promises';
import { PopupView } from './popup-view';
import '../styles/styles.scss';

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

contentLoaded.then(async () => {
  const background = await getBackgroundPage();
  const storage = background.storage;
  const chromeDebugger = background.chromeDebugger;
  const chromeTabs = background.chromeTabs;

  const view = new PopupView();
  view.onEnableThrottling = async () => {
    try {
      const selectedOriginValue = view.originsEl.getValue();
      const enabledToAll = selectedOriginValue === 'all';
      const enabledAutoReloadTabs = view.autoReloadEnabledCheckbox.checked;

      if (enabledToAll) {
        const tabs = await chromeTabs.getOpenedTabs();
        for (const tab of tabs) {
          await attachDebugger(tab);
          if (enabledAutoReloadTabs) await reloadTab(tab);
        }
      } else {
        await attachDebugger(currentTab);
        if (enabledAutoReloadTabs) await reloadTab(currentTab);
      }

      await storage.set(storage.schema.throttlingEnabled, true);
      await storage.set(storage.schema.applyToAllTabs, enabledToAll);
      await storage.set(storage.schema.autoReloadEnabled, enabledAutoReloadTabs);
      await setOriginToStorage(selectedOriginValue);
    } catch (e) {
      console.log(e.message);
    }
  };
  view.attachListeners();

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

  storage.get(storage.schema.throttlingEnabled).then(value => {
    if (value && typeof value.throttlingEnabled !== 'undefined') {
      PopupView.toggleApplyThrottlingBtn(value.throttlingEnabled);
    }
  });

  storage.get(storage.schema.autoReloadEnabled).then(value => {
    if (value && typeof value.autoReloadEnabled !== 'undefined') {
      autoReloadEnabledCheckbox.checked = value.autoReloadEnabled;
    }
  });

  storage.onChanged(changes => {
    const storageChange = changes[storage.schema.throttlingEnabled];
    if (storageChange) {
      PopupView.toggleApplyThrottlingBtn(storageChange.newValue);
    }
  });

  storage.onChanged(changes => {
    const storageChange = changes[storage.schema.applyToAllTabs];
    if (storageChange) {
      view.toggleApplyThrottlingDescription(storageChange.newValue)
    }
  });

  storage.onChanged(changes => {
    const storageChange = changes[storage.schema.autoReloadEnabled];
    if (storageChange) {
      toggleautoReloadEnabledCheckbox(storageChange.newValue);
    }
  });

  const currentTab = await chromeTabs.getCurrentTab();

  if (currentTab.url) {
    const currentOrigin = new URL(currentTab.url).origin;
    view.addOriginToUIList(currentOrigin);
  }

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

  async function attachDebugger(tab) {
    // try/catch to not fail on empty tabs

    try {
      const target = { tabId: tab.id };
      await chromeDebugger.attach(target, '1.1');

      await chromeDebugger.sendCommand(target, 'Network.enable');
      await chromeDebugger.sendCommand(target, 'Network.emulateNetworkConditions',  TYPICAL_MOBILE_THROTTLING_METRICS);
      await chromeDebugger.sendCommand(target, 'Emulation.setCPUThrottlingRate', { rate: TARGET_CPU_RATE });
    } catch(e) {
      console.log(e.message);
    }
  }

  async function reloadTab(tab) {
    try {
      chrome.tabs.reload(tab.id);
    } catch (e) {
      console.log(e.message);
    }
  }

}).catch(e => {
  console.log(e.message);
});
