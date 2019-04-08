import Choices from 'choices.js';

export class PopupView {
  static get enableThrottlingBtn() {
    return document.querySelector('.js-enable-throttling');
  }

  static get tabsOriginsSelect() {
    return document.querySelector('.js-tabs-origins');
  }

  static get autoReloadEnabledCheckbox() {
    return document.querySelector('.js-reload-tabs');
  }

  static get currentOriginThrottlingDescription() {
    return document.querySelector('.js-current-origin-throttling-description');
  }

  static get allOriginsThrottlingDescription() {
    return document.querySelector('.js-all-origins-throttling-description');
  }

  get settingsBtn() {
    return document.querySelector('.js-settings-btn');
  }

  get closeBtn() {
    return document.querySelector('.js-close-btn');
  }

  get settingsContent() {
    return document.querySelector('.js-settings-content');
  }

  get mainContent() {
    return document.querySelector('.js-main-content');
  }

  constructor() {
    this.originsEl = new Choices(PopupView.tabsOriginsSelect, {
      removeItemButton: true,
    });
    this.isSettingContent = false;
  }

  static toggleApplyThrottlingBtn(state) {
    PopupView.enableThrottlingBtn.disabled = state;
  }

  static toggleAutoReloadEnabledCheckbox(state) {
    PopupView.autoReloadEnabledCheckbox.checked = state;
  }

  static toggleApplyThrottlingDescription(originValue) {
    if (originValue === 'all') {
      PopupView.currentOriginThrottlingDescription.classList.toggle('hide');
      PopupView.allOriginsThrottlingDescription.classList.toggle('hide');
    } else {
      PopupView.allOriginsThrottlingDescription.classList.toggle('hide');
      PopupView.currentOriginThrottlingDescription.classList.toggle('hide');
    }
  }

  static close() {
    window.close();
  }

  attachListeners() {
    PopupView.enableThrottlingBtn.addEventListener('click', this.onEnableThrottling);

    this.originsEl.passedElement.element.addEventListener('choice', event => {
      PopupView.toggleApplyThrottlingDescription(event.detail.choice.value)
    });

    this.settingsBtn.addEventListener('click', this.toggleSettingsContent.bind(this));
    this.closeBtn.addEventListener('click', PopupView.close);
  }

  onEnableThrottling() {
    throw new Error('Implement method onEnableThrottling');
  }

  toggleSettingsContent() {
    if (this.isSettingContent) {
      this.settingsContent.classList.toggle('hide');
      this.mainContent.classList.toggle('hide');
    } else {
      this.settingsContent.classList.toggle('hide');
      this.mainContent.classList.toggle('hide');
    }

    this.isSettingContent = !this.isSettingContent;
  }

  addOriginToUIList(origin) {
    this.originsEl.setChoices([{
      value: origin, label: origin, selected: true
    }], 'value', 'label', false);
  }
}
