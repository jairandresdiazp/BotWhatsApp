function waboxcli() {
    this.dtm = Math.floor(Date.now() / 1000) - 300;
    this.queue = [];
    this.uidsCache = {};
    window.addEventListener("message", this.onScriptMessage);
    setTimeout(function() {
        window.waboxcli.onStatusChange();
        setInterval(window.waboxcli.onStatusChange, 90000);
        window.Store.Stream.listenTo(window.Store.Stream, "change:phoneAuthed change:info", window.waboxcli.onStatusChange);
        window.Store.Conn.listenTo(window.Store.Conn, "change:me change:ref", window.waboxcli.onStatusChange);
        window.Store.Msg.on("add change:mediaState", window.waboxcli.onMsg);
        window.Store.Msg.on("change:ack", window.waboxcli.onAck)
    }, 5000)
}
waboxcli.prototype.onScriptMessage = function(_0x96cax2) {
    if (_0x96cax2.data.type && _0x96cax2.data.type.indexOf("_wabc_") > -1) {
        window.waboxcli.queue.push(_0x96cax2.data);
        window.waboxcli.processQueue()
    }
};
waboxcli.prototype.onStatusChange = function(_0x96cax2) {
    try {
        var _0x96cax3 = {
            stream: window.waboxcli.extract(window.Store.Stream.all),
            conn: window.waboxcli.extract(window.Store.Conn.all)
        };
        window.waboxcli.toScript("_wabs_status", _0x96cax3)
    } catch (err) {
        window.waboxcli.catch(err)
    }
};
waboxcli.prototype.onMsg = function(_0x96cax4) {
    var _0x96cax3;
    setTimeout(function() {
        try {
            if (_0x96cax4.t > window.waboxcli.dtm && !(_0x96cax4.id.id in window.waboxcli.uidsCache)) {
                if ((_0x96cax4.isMedia || _0x96cax4.isDoc || _0x96cax4.isMMS) && _0x96cax4.mediaData && _0x96cax4.mediaData.mediaStage.toLowerCase() != "resolved") {
                    _0x96cax4.mediaData.parent = _0x96cax4;
                    _0x96cax4.mediaData.on("change:mediaStage", window.waboxcli.onMediaData);
                    _0x96cax4.forceDownloadMedia()
                } else {
                    if (_0x96cax4.isMedia || _0x96cax4.isDoc || _0x96cax4.isMMS) {
                        window.waboxcli.blobToBase64(_0x96cax4.mediaData.mediaBlob._blob, function(_0x96cax5) {
                            if (_0x96cax5) {
                                var _0x96cax6 = window.waboxcli.randomFN(_0x96cax4.mimetype);
                                window.waboxcli.toScript("_wabs_file", {
                                    msg: window.waboxcli.extract(_0x96cax4.all),
                                    fn: _0x96cax6,
                                    blob: _0x96cax5
                                });
                                /*
                                _0x96cax3 = {
                                    msg: window.waboxcli.extract(_0x96cax4.all),
                                    fn: _0x96cax6
                                };
                                window.waboxcli.toScript("_wabs_msg", _0x96cax3)
                                */
                            }
                        })
                    } else {
                        _0x96cax3 = {
                            msg: window.waboxcli.extract(_0x96cax4.all)
                        };
                        window.waboxcli.toScript("_wabs_msg", _0x96cax3)
                    }
                }
            }
        } catch (err) {
            window.waboxcli.catch(err)
        }
    }, 250)
};
waboxcli.prototype.onMediaData = function(_0x96cax7) {
    if (_0x96cax7.mediaStage.toLowerCase() == "resolved") {
        window.waboxcli.onMsg(_0x96cax7.parent)
    }
};
waboxcli.prototype.onAck = function(_0x96cax4) {
    try {
        var _0x96cax3 = {
            id: _0x96cax4.id.id,
            ack: _0x96cax4.ack,
            muid: window.waboxcli.uidsCache[_0x96cax4.id.id]
        };
        window.waboxcli.toScript("_wabs_ack", _0x96cax3);
        delete window.waboxcli.uidsCache[_0x96cax4.id.id]
    } catch (err) {
        window.waboxcli.catch(err)
    }
};
waboxcli.prototype.toScript = function(_0x96cax8, _0x96cax9) {
    window.postMessage({
        type: _0x96cax8,
        msg: _0x96cax9
    }, "*")
};
waboxcli.prototype.catch = function(_0x96caxa) {
    window.waboxcli.toScript("_wabs_err", {
        error: _0x96caxa.message,
        stack: _0x96caxa.stack
    })
};
waboxcli.prototype.processQueue = function() {
    try {
        var _0x96cax9, _0x96caxb, _0x96caxc;
        if (!window.Store.Conn.blockStoreAdds) {
            if (this.queue.length) {
                _0x96cax9 = this.queue.pop().msg;
                if (_0x96caxb = window.waboxcli.getChat(_0x96cax9.msg.to)) {
                    switch (_0x96cax9.cmd) {
                        case "chat":
                            if (_0x96cax9.msg.body.text) {
                                _0x96caxb.sendMessage(_0x96cax9.msg.body.text);
                                if (_0x96caxc = _0x96caxb.msgs.models[_0x96caxb.msgs.models.length - 1].id.id) {
                                    window.waboxcli.uidsCache[_0x96caxc] = _0x96cax9.msg.custom_uid
                                }
                            };
                            break;
                        case "media":
                            if (_0x96cax9.msg.body.url) {
                                _0x96caxb.sendMessage(_0x96cax9.msg.body.url, {
                                    title: _0x96cax9.msg.body.title,
                                    description: _0x96cax9.msg.body.desc,
                                    canonicalUrl: _0x96cax9.msg.body.url,
                                    matchedText: _0x96cax9.msg.body.url,
                                    thumbnail: _0x96cax9.msg.body.thumb
                                });
                                if (_0x96caxc = _0x96caxb.msgs.models[_0x96caxb.msgs.models.length - 1].id.id) {
                                    window.waboxcli.uidsCache[_0x96caxc] = _0x96cax9.msg.custom_uid
                                }
                            };
                            break
                    }
                }
            }
        }
    } catch (err) {
        window.waboxcli.catch(err)
    }
};
waboxcli.prototype.getChat = function(_0x96caxd) {
    try {
        return window.Store.Chat.gadd(this.cuidToJid(_0x96caxd))
    } catch (err) {
        window.waboxcli.catch(err)
    }
};
waboxcli.prototype.cuidToJid = function(_0x96caxd) {
    return (_0x96caxd.indexOf("@") < 0 ? _0x96caxd + "@c.us" : _0x96caxd)
};
waboxcli.prototype.blobToBase64 = function(_0x96caxe, _0x96caxf) {
    try {
        var _0x96cax10 = new window.FileReader();
        _0x96cax10.readAsDataURL(_0x96caxe);
        _0x96cax10.onloadend = function() {
            _0x96caxf(_0x96cax10.result)
        }
    } catch (err) {
        window.waboxcli.catch(err)
    }
};
waboxcli.prototype.randomFN = function(_0x96cax11) {
    var _0x96cax12 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var _0x96cax13 = _0x96cax11.split("/")[1].substr(0, 3);
    var _0x96cax14 = "";
    if (_0x96cax13 == "jpe") {
        _0x96cax13 = "jpg"
    };
    for (var _0x96cax15 = 32; _0x96cax15 > 0; --_0x96cax15) {
        _0x96cax14 += _0x96cax12[Math.floor(Math.random() * _0x96cax12.length)]
    };
    return _0x96cax14 + "." + _0x96cax13
};
waboxcli.prototype.extract = function(_0x96cax16) {
    var _0x96cax14 = {};
    for (var _0x96cax17 in _0x96cax16) {
        if (typeof(_0x96cax16[_0x96cax17]) != "object" && typeof(_0x96cax16[_0x96cax17]) != "function") {
            _0x96cax14[_0x96cax17] = _0x96cax16[_0x96cax17]
        } else {
            if (_0x96cax17 == "chat" || _0x96cax17 == "senderObj") {
                _0x96cax14[_0x96cax17] = window.waboxcli.extract(_0x96cax16[_0x96cax17].all)
            } else {
                if (_0x96cax17 == "id") {
                    _0x96cax14[_0x96cax17] = window.waboxcli.extract(_0x96cax16[_0x96cax17])
                }
            }
        }
    };
    return _0x96cax14
};
window.waboxcli = new waboxcli()