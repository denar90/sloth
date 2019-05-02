'use strict';

import { contentLoaded } from 'document-promises';
import { PopupView } from './popup-view';
import '../styles/styles.scss';

// Huge shot out to Lighthouse for const values
const DEVTOOLS_RTT_ADJUSTMENT_FACTOR = 3.75;
const DEVTOOLS_THROUGHPUT_ADJUSTMENT_FACTOR = 0.9;
const TARGET_CPU_RATE = 4;

const throttlingSettings = {
  rttMs: 150,
  throughputKbps: 1.6 * 1024,
  requestLatencyMs: 150 * DEVTOOLS_RTT_ADJUSTMENT_FACTOR,
  downloadThroughputKbps: 1.6 * 1024 * DEVTOOLS_THROUGHPUT_ADJUSTMENT_FACTOR,
  uploadThroughputKbps: 750 * DEVTOOLS_THROUGHPUT_ADJUSTMENT_FACTOR,
  cpuSlowdownMultiplier: 4,
};

const conditions = {
  offline: false,
  latency: throttlingSettings.requestLatencyMs || 0,
  downloadThroughput: throttlingSettings.downloadThroughputKbps || 0,
  uploadThroughput: throttlingSettings.uploadThroughputKbps || 0,
};

conditions.downloadThroughput = Math.floor(conditions.downloadThroughput * 1024 / 8);
conditions.uploadThroughput = Math.floor(conditions.uploadThroughput * 1024 / 8);

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

  const currentTab = await chromeTabs.getCurrentTab();
  const attachDebugger = async tab => {
    // try/catch to not fail on empty tabs

    try {
      const target = { tabId: tab.id };
      await chromeDebugger.attach(target, '1.1');
      await chromeDebugger.sendCommand(target, 'Network.enable');
      await chromeDebugger.sendCommand(target, 'Network.emulateNetworkConditions', conditions);
      await chromeDebugger.sendCommand(target, 'Emulation.setCPUThrottlingRate', { rate: TARGET_CPU_RATE });
    } catch(e) {
      console.log(e.message);
    }
  };

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

  const view = new PopupView();
  view.onEnableThrottling = async () => {
    const selectedOriginValue = view.originsEl.getValue().value;
    const enabledAutoReloadTabs = PopupView.autoReloadEnabledCheckbox.checked;

    await attachDebugger(currentTab);
    if (enabledAutoReloadTabs) await chromeTabs.reloadTab(currentTab.id);

    await storage.set(storage.schema.throttlingEnabled, true);
    await storage.set(storage.schema.autoReloadEnabled, enabledAutoReloadTabs);
    await setOriginToStorage(selectedOriginValue);
    PopupView.close();
  };
  view.attachListeners();

  if (currentTab.url) {
    const currentOrigin = new URL(currentTab.url).origin;
    view.addOriginToUIList(currentOrigin);
  }

  storage.get(storage.schema.throttlingEnabled).then(value => {
    if (value && typeof value.throttlingEnabled !== 'undefined') {
      PopupView.toggleApplyThrottlingBtn(value.throttlingEnabled);
    }
  });

  storage.get(storage.schema.autoReloadEnabled).then(value => {
    if (value && typeof value.autoReloadEnabled !== 'undefined') {
      PopupView.autoReloadEnabledCheckbox.checked = value.autoReloadEnabled;
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
      PopupView.toggleApplyThrottlingDescription(storageChange.newValue)
    }
  });

  storage.onChanged(changes => {
    const storageChange = changes[storage.schema.autoReloadEnabled];
    if (storageChange) {
      PopupView.toggleAutoReloadEnabledCheckbox(storageChange.newValue);
    }
  });

  chromeTabs.onCreated(async tab => {
    const throttlingEnabled = await storage.getByName(storage.schema.throttlingEnabled);
    if (!throttlingEnabled) return;

    await attachDebuggerToNewTab(tab);
  });

  chromeTabs.onUpdated(async (tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete') return;
    if (tabId === tab.id) return;

    await attachDebuggerToNewTab(tab);
  });
  storage.set(storage.schema.throttlingEnabled, false);
  chromeDebugger.debugger.onDetach.addListener(() => {
    storage.set(storage.schema.throttlingEnabled, false);
  });
}).catch(e => {
  // @todo better error catching like https://github.com/GoogleChrome/lighthouse/blob/v4.3.1/clients/extension/scripts/popup.js#L192
  storage.set(storage.schema.throttlingEnabled, false);
  console.error(e.message);
});
