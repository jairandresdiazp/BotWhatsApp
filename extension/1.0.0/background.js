chrome.webRequest.onHeadersReceived.addListener(function(_0x9d20x1) {}, {
    urls: ["<all_urls>"],
    types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
}, ["blocking", "responseHeaders"]);
chrome.extension.onMessage.addListener(function(_0x9d20x2, _0x9d20x3, _0x9d20x4) {
    if (_0x9d20x2.method == "_wab_settings") {
        _0x9d20x4(localStorage)
    }
})