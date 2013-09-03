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

  get page() {
    var mode = this.mode;
    if (mode == this.MODE_OPEN_APPLICATION_STARTUP_PAGE)
      return this.prefs.getPref('mailnews.start_page.url');
    else
      return this.prefs.getPref('extensions.startuptab@clear-code.com.startup.page');
  },

  get loadInBackground() {
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
    alert(this.loadInBackground);
      if (this.shouldOpen())
        this.tabmail.openTab('contentTab', {
          contentPage: this.page,
          background:  this.loadInBackground
        })
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

  shouldOpen: function StartupTab_shouldOpen() {
    var uri = this.page;
    if (!uri)
      return false;

    var tabs = document.querySelectorAll('tab.tabmail-tab');
    return Array.every(tabs, function checkTabOpened(aTab) {
      return aTab.getAttribute(this.LOADING_URI) != uri;
    }, this);
  }
};
StartupTab.preInit();
