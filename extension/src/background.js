class Storage {
  constructor() {
    this.storage = chrome.storage;

    this.schema = {
      // deprecated field
      throttlingEnabled: 'throttlingEnabled',
      // deprecated field
      applyToAllTabs: 'applyToAllTabs',
      tabsOrigins: 'tabsOrigins',
      autoReloadEnabled: 'autoReloadEnabled'
    }
  }

  set(key, value) {
    const data = {};
    data[key] = value;
    return new Promise((resolve, reject) => {
      this.storage.sync.set(data, () => {
        if (chrome.runtime.lastError) {
          // The error from the extension has a `message` property that is the
          // stringified version of the actual protocol error object.
          const message = chrome.runtime.lastError.message || '';
          let errorMessage;
          try {
            errorMessage = JSON.parse(message).message;
          } catch (e) {}
          errorMessage = errorMessage || message || `Value '${value}' was not set`;

          return reject(new Error(errorMessage));
        }

        resolve();
      });
    })
  }

  get(key) {
    return new Promise((resolve, reject) => {
      this.storage.sync.get(key, value => {
        if (chrome.runtime.lastError) {
          reject('Value can\'t be get');
        }
        resolve(value);
      });
    });
  }

  getByName(name) {
    return new Promise((resolve, reject) => {
      this.storage.sync.get(name, value => {
        if (chrome.runtime.lastError ||
          !value)
        {
          reject('Value can\'t be get');
        }
        resolve(value[name]);
      });
    });
  }

  onChanged(cb) {
    this.storage.onChanged.addListener(cb);
  }
}

class Debugger {
  constructor() {
    this.debugger = chrome.debugger;
  }

  sendCommand(target, method, commandParams) {
    return new Promise((resolve, reject) => {
      this.debugger.sendCommand(target, method, commandParams || {}, result => {
        if (chrome.runtime.lastError) {
          // The error from the extension has a `message` property that is the
          // stringified version of the actual protocol error object.
          const message = chrome.runtime.lastError.message || '';
          let errorMessage;
          try {
            errorMessage = JSON.parse(message).message;
          } catch (e) {}
          errorMessage = errorMessage || message || 'Unknown debugger protocol error.';

          return reject(new Error(`Protocol error (${method}): ${errorMessage}`));
        }

        resolve(result);
      });
    });
  }

  attach(target, requiredVersion) {
    return new Promise((resolve,reject) => {
      this.debugger.attach(target, requiredVersion, () => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }

        resolve();
      });
    });
  }
}


class Tabs {
  constructor() {
    this.tabs = chrome.tabs;
  }

  getOpenedTabs() {
    return new Promise(resolve => {
      this.tabs.query({}, resolve);
    });
  }

  getCurrentTab() {
    const queryInfo = {
      active: true,
      currentWindow: true
    };

    return new Promise((resolve, reject) => {
      chrome.tabs.query(queryInfo, tabs => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        resolve(tabs[0]);
      });
    });
  }

  onCreated(cb) {
    this.tabs.onCreated.addListener(cb);
  }

  onUpdated(cb) {
    this.tabs.onUpdated.addListener(cb);
  }

  reloadTab(tabId) {
    this.tabs.reload(tabId);
  }
}

const storage = window.storage = new Storage();
const chromeDebugger = window.chromeDebugger = new Debugger();
const chromeTabs = window.chromeTabs = new Tabs();