/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var StartupTab = {
  get prefs() {
    var { prefs } = Cu.import('resource://startuptab-modules/prefs.js', {});
    delete this.prefs;
    return this.prefs = prefs;
  },

  get tabmail() {
    return document.getElementById('tabmail');
  },

  get mode() {
    var mode = this.prefs.getPref('extensions.staruptab@clear-code.com.startup.mode');
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
      return this.prefs.getPref('extensions.staruptab@clear-code.com.startup.page');
  },

  handleEvent: function StartupTab_handleEvent(aEvent) {
    switch (aEvent.type) {
      case 'load':
        return this.init();
    }
  },

  init: function StartupTab_init() {
    window.removeEventListener('load', this, false);

    if (this.mode > this.MODE_OPEN_APPLICATION_STARTUP_PAGE) {
      if (this.shouldOpen())
        tabmail.openTab('contentTab', { contentPage: this.page })
    }
  },
  preInit: function StartupTab_preInit() {
    window.addEventListener('load', this, false);
  },

  shouldOpen: function StartupTab_shouldOpen() {
    var uri = this.page;
    if (!uri)
      return false;

    var browsers = document.querySelectorAll('.contentTabInstance browser');
    return Array.every(browsers, function checkTabOpened(aBrowser) {
      return aBrowser.currentURI.spec != uri;
    }, this);
  }
};
StartupTab.preInit();
