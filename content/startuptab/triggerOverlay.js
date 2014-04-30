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
      case this.MODE_OPEN_SPECIFIED_PAGES:
        let (pages = this.prefs.getPref('extensions.startuptab@clear-code.com.startup.pages')) {
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
    });
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

    if (this.mode >= this.MODE_OPEN_APPLICATION_STARTUP_PAGE) {
      this.pages.forEach(function(aPage) {
        let background = this.loadInBackground;
        if ('background' in aPage)
          background = Boolean(aPage.background);
        let canClose = true;
        if ('canClose' in aPage)
          canClose = Boolean(aPage.canClose);
        if (this.shouldOpen(aPage)) {
          let tab = this.tabmail.openTab('contentTab', {
            contentPage: aPage.uri,
            background:  background
          })
          tab.canClose = canClose;
        }
      }, this);
    }
  },
  preInit: function StartupTab_preInit() {
    try {
      specialTabs.contentTabType.__startuptab__openTab = specialTabs.contentTabType.openTab;
      specialTabs.contentTabType.openTab = this.newOpenTab;
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

  shouldOpen: function StartupTab_shouldOpen(aPage) {
    if (!aPage.uri)
      return false;

    var tabs = document.querySelectorAll('tab.tabmail-tab');
    return Array.every(tabs, function checkTabOpened(aTab) {
      return aTab.getAttribute(this.LOADING_URI) != aPage.uri;
    }, this);
  }
};
StartupTab.preInit();
