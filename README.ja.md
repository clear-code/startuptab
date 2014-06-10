startuptab
==========

Thunderbird起動時に、指定されたページをタブで開きます。

まず、モードを選択します。

    lockPref("extensions.startuptab@clear-code.com.startup.mode", 0);

指定可能な値は以下の通りです:

 * -1: 何もしない。
 * 0: Thunderbirdのホームページを開く。（既定の動作）
 * 1: `extensions.startuptab@clear-code.com.startup.page` で示されたURIに基づいてタブを開く。
 * 2: `extensions.startuptab@clear-code.com.startup.pages` で示されたJSONに基づいてタブを開く。

モードの選択後に、タブで開くページを指定します。

モードとして `1` を選択した場合は、タブをパイプ区切りのURIのリストで示します:

    lockPref("extensions.startuptab@clear-code.com.startup.page",
             "about:support|about:config");
    // オプション。タブをバックグラウンドで開く。
    lockPref("extensions.startuptab@clear-code.com.startup.loadInBackground",
             true);

モードとして `2` を選択した場合は、タブをJSONの配列で示します:

    lockPref("extensions.startuptab@clear-code.com.startup.pages",
             "[{\"uri\":\"about:support\"},{\"uri\":\"about:config\"}]");

個々のタブの情報を表すJSONオブジェクトは以下の情報を持ちます:

 * `uri` (`String`, 必須):
   ページのURI。
 * `canClose` (`Boolean`, 既定値は `true`):
   `true` の場合、タブが閉じられなくなります。
 * `background` (`Boolean`, 既定値は `false`):
   `true` の場合、タブがバックグラウンドで開かれます。

