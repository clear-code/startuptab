/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var StartupTab = {
  LOADING_URI: 'startuptab-loaded-uri',

  get prefs() {
    var { prefs } = Cu.import('resource://startuptab-modules/prefs.js', {});
    delete this.prefs;
    return this.prefs = prefs;
  },

  get tabmail() {
    return document.getElementById('tabmail');
  },

  get mode() {
    var mode = this.prefs.getPref('extensions.startuptab@clear-code.com.startup.mode');
    var defaultMode = this.MODE_OPEN_APPLICATION_STARTUP_PAGE;
    return mode === null ? defaultMode : mode;
  },
  MODE_NONE:                          -1,
  MODE_OPEN_APPLICATION_STARTUP_PAGE: 0,
  MODE_OPEN_SPECIFIED_PAGE:           1,
  MODE_OPEN_SPECIFIED_PAGES:          2,

  get pages() {
    switch (this.mode) {
      case this.MODE_OPEN_APPLICATION_STARTUP_PAGE:
        return this._getPagesFromPref('mailnews.start_page.url');
      case this.MODE_OPEN_SPECIFIED_PAGE:
        return this._getPagesFromPref('extensions.startuptab@clear-code.com.startup.page');
      case this.MODE_OPEN_SPECIFIED_PAGES: {
          let pages = this.prefs.getPref('extensions.startuptab@clear-code.com.startup.pages');
          try {
            return JSON.parse(pages || '[]');
          } catch(e) {
            return [];
          }
        }
      default:
        return [];
    }
  },
  _getPagesFromPref: function(aKey) {
    var uris = this.prefs.getPref(aKey);
    uris = (uris || '').split('|').filter(function(aURI) {
      return Boolean(aURI);
    });
    return uris.map(function(aURI) {
      return {
        uri:        aURI,
        background: this.background
      };
    }, this);
  },
  get background() {
    return this.prefs.getPref('extensions.startuptab@clear-code.com.startup.loadInBackground');
  },

  observe: function StartupTab_observe(aSubject, aTopic, aData) {
    switch (aTopic) {
      case 'mail-tabs-session-restored':
        return this.init();
    }
  },

  init: function StartupTab_init() {
    Services.obs.removeObserver(this, 'mail-tabs-session-restored');

    if (this.mode >= this.MODE_OPEN_APPLICATION_STARTUP_PAGE)
      this.pages.forEach(this.openPage, this);
  },
  preInit: function StartupTab_preInit() {
    try {
      specialTabs.contentTabType.__startuptab__openTab = specialTabs.contentTabType.openTab;
      specialTabs.contentTabType.openTab = this.newOpenTab;
      specialTabs.contentTabType.__startuptab__restoreTab = specialTabs.contentTabType.restoreTab;
      specialTabs.contentTabType.restoreTab = this.newRestoreTab;
      Services.obs.addObserver(this, 'mail-tabs-session-restored', false);
    }
    catch(error) {
      Cu.reportError(error);
    }
  },

  newOpenTab: function StartupTab_openTab(aTab, aArgs) {
    this.__startuptab__openTab.apply(this, arguments);
    aTab.tabNode.setAttribute(StartupTab.LOADING_URI, aArgs.contentPage);
  },

  newRestoreTab: function StartupTab_restoreTab(aTabmail, aPersistedState) {
    this.__startuptab__restoreTab.apply(this, arguments);
    var lastOpenedTab = aTabmail.tabContainer.lastChild;
    lastOpenedTab.setAttribute(StartupTab.LOADING_URI, aPersistedState.tabURI);
  },

  /**
   * PUBLIC API to open a new tab as a startup tab
   *
   * required properties of aPage:
   *   String  uri
   *
   * optional properties of aPage:
   *   Boolean background (default=extensions.startuptab@clear-code.com.startup.loadInBackground)
   *   Boolean canClose (default=true)
   */
  openPage: function StartupTab_openPage(aPage) {
    var background = this.background;
    if ('background' in aPage)
      background = Boolean(aPage.background);

    var canClose = true;
    if ('canClose' in aPage)
      canClose = Boolean(aPage.canClose);

    if (this.shouldOpen(aPage)) {
      tab = this.tabmail.openTab('contentTab', {
        contentPage: aPage.uri.trim(),
        background:  background
      })
      tab.canClose = canClose;
    }
    else {
      tab = this.getExistingTab(aPage.uri);
      if (tab)
        tab.canClose = canClose;
    }

    return tab;
  },
  shouldOpen: function StartupTab_shouldOpen(aPage) {
    var uri = (aPage.uri || '').trim();
    if (!uri)
      return false;

    return !this.getExistingTab(uri);
  },

  /**
   * PUBLIC API to get a tab from its content URI
   */
  getExistingTab: function StartupTab_getExistingTab(aURI) {
    var tabModes = this.tabmail.tabModes;
    var tab = null;
    Object.keys(tabModes).some(function(aMode) {
      var tabMode = tabModes[aMode];
      tabMode.tabs.some(function(aTab) {
        var uri = this.getLoadingURIFromTab(aTab) || this.getCurrentURIFromTab(aTab);
        if (uri == aURI) {
          tab = aTab;
          return true;
        }
        return false;
      }, this);
    }, this);
    return tab;
  },

  /**
   * PUBLIC API to get the content URI of a tab
   */
  getLoadingURIFromTab: function StartupTab_getLoadingURIFromTab(aTab) {
    return aTab.tabNode && aTab.tabNode.getAttribute(this.LOADING_URI).trim();
  },
  getCurrentURIFromTab: function StartupTab_getCurrentURIFromTab(aTab) {
    var browserFunc = aTab.mode.getBrowser || aTab.mode.tabType.getBrowser;
    if (!browserFunc)
      return null;

    var browser = browserFunc.call(aTab.mode.tabType, aTab);
    if (!browser)
      return null;

    var uri = browser.currentURI && browser.currentURI.spec;
    if (uri == 'about:blank')
      return null;

    return uri;
  }
};
StartupTab.preInit();
