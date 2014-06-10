startuptab
==========

Opens specified page as a tab, on the startup of Thunderbird.

First, define the mode.

    lockPref("extensions.startuptab@clear-code.com.startup.mode", 0);

Possible values:

 * -1: do nothing.
 * 0: open the startup page specified by the Thunderbird's preference. (default)
 * 1: open the startup page specified by the URI, given as `extensions.startuptab@clear-code.com.startup.page`.
 * 2: open the startup page specified by the JSON, given as `extensions.startuptab@clear-code.com.startup.pages`.

Then, define pages to be opened in startup tabs.

If you choose the mode `1`, specify tabs as a pipe-separated list of URIs, like:

    lockPref("extensions.startuptab@clear-code.com.startup.page",
             "about:support|about:config");
    // optional: open startup tabs in background
    lockPref("extensions.startuptab@clear-code.com.startup.loadInBackground",
             true);

If you choose the mode `2`, specify tabs as a JSON array, like:

    lockPref("extensions.startuptab@clear-code.com.startup.pages",
             "[{\"uri\":\"about:support\"},{\"uri\":\"about:config\"}]");

JSON object for each tab can have following information:

 * `uri` (`String`, required):
   the URI of the page.
 * `canClose` (`Boolean`, default value is `true`):
   the tab cannot be closed if `true`.
 * `background` (`Boolean`, default value is `false`):
   the tab is opened in the background if `true`.

