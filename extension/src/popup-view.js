import Choices from 'choices.js';

export class PopupView {
  static get enableThrottlingBtn() {
    return document.querySelector('.js-enable-throttling');
  }

  static get tabsOriginsSelect() {
    return document.querySelector('.js-tabs-origins');
  }

  get currentOriginThrottlingDescription() {
    return document.querySelector('.js-current-origin-throttling-description');
  }

  get allOriginsThrottlingDescription() {
    return document.querySelector('.js-all-origins-throttling-description');
  }

  get settingsBtn() {
    return document.querySelector('.js-settings-btn');
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

  attachListeners() {
    PopupView.enableThrottlingBtn.addEventListener('click', this.onEnableThrottling);

    this.originsEl.passedElement.element.addEventListener('choice', event => {
      this.toggleApplyThrottlingDescription(event.detail.choice.value)
    });

    this.settingsBtn.addEventListener('click', this.toggleSettingsContent.bind(this));
  }

  onEnableThrottling() {
    throw new Error('Implement method onEnableThrottling');
  }

  static toggleApplyThrottlingBtn(state) {
    PopupView.enableThrottlingBtn.disabled = state;
  };

  toggleApplyThrottlingDescription(originValue) {
    if (originValue === 'all') {
      this.currentOriginThrottlingDescription.classList.add('hide');
      this.allOriginsThrottlingDescription.classList.remove('hide');
    } else {
      this.allOriginsThrottlingDescription.classList.add('hide');
      this.currentOriginThrottlingDescription.classList.remove('hide');
    }
  };

  toggleSettingsContent() {
    if (this.isSettingContent) {
      this.settingsContent.classList.remove('hide');
      this.mainContent.classList.add('hide');
    } else {
      this.settingsContent.classList.add('hide');
      this.mainContent.classList.remove('hide');
    }

    this.isSettingContent = !this.isSettingContent;
  }

  addOriginToUIList(origin) {
    this.originsEl.setChoices([{
      value: origin, label: origin, selected: true
    }], 'value', 'label', false);
  }
}
