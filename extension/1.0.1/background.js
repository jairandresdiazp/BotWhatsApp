chrome.webRequest.onHeadersReceived.addListener(function(_0x6c5fx1) {}, {
    urls: ["<all_urls>"],
    types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
}, ["blocking", "responseHeaders"]);
chrome.extension.onMessage.addListener(function(_0x6c5fx2, _0x6c5fx3, _0x6c5fx4) {
    if (_0x6c5fx2.method == "_wab_settings") {
        wbxValidate();
        _0x6c5fx4(localStorage)
    } else {
        if (_0x6c5fx2.method == "_wab_connection") {
            chrome.browserAction.setIcon({
                path: (_0x6c5fx2.connected ? "icon48.png" : "icon48_off.png")
            })
        }
    }
});

function wbxValidate() {
    var _0x6c5fx6 = new XMLHttpRequest();
    _0x6c5fx6.open("POST", "https://" + wab_url + "/api/validate", false);
    _0x6c5fx6.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    _0x6c5fx6.send(JSON.stringify({token: localStorage.wab_key}));
    if (_0x6c5fx6.readyState == 4 && _0x6c5fx6.status != 200) {
        localStorage.wab_key = ""
    }
}
wbxValidate()