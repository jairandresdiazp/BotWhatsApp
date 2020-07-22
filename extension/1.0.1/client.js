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
waboxcli.prototype.onScriptMessage = function(_0xf141x2) {
    if (_0xf141x2.data.type && _0xf141x2.data.type.indexOf("_wabc_") > -1) {
        window.waboxcli.queue.push(_0xf141x2.data);
        window.waboxcli.processQueue()
    }
};
waboxcli.prototype.onStatusChange = function(_0xf141x2) {
    try {
        var _0xf141x3 = {
            stream: window.waboxcli.extract(window.Store.Stream.all),
            conn: window.waboxcli.extract(window.Store.Conn.all)
        };
        window.waboxcli.toScript("_wabs_status", _0xf141x3)
    } catch (err) {
        window.waboxcli.catch(err)
    }
};
waboxcli.prototype.onMsg = function(_0xf141x4) {
    var _0xf141x3;
    setTimeout(function() {
        try {
            if (_0xf141x4.t > window.waboxcli.dtm && !(_0xf141x4.id.id in window.waboxcli.uidsCache)) {
                if ((_0xf141x4.isMedia || _0xf141x4.isDoc || _0xf141x4.isMMS) && _0xf141x4.mediaData && _0xf141x4.mediaData.mediaStage.toLowerCase() != "resolved") {
                    _0xf141x4.mediaData.parent = _0xf141x4;
                    _0xf141x4.mediaData.on("change:mediaStage", window.waboxcli.onMediaData);
                    _0xf141x4.forceDownloadMedia()
                } else {
                    if (_0xf141x4.isMedia || _0xf141x4.isDoc || _0xf141x4.isMMS) {
                        window.waboxcli.blobToBase64(_0xf141x4.mediaData.mediaBlob._blob, function(_0xf141x5) {
                            if (_0xf141x5) {
                                var _0xf141x6 = window.waboxcli.randomFN(_0xf141x4.mimetype);
                                window.waboxcli.toScript("_wabs_file", {
                                    msg: window.waboxcli.extract(_0xf141x4.all),
                                    fn: _0xf141x6,
                                    blob: _0xf141x5
                                });
                                /*
                                _0xf141x3 = {
                                    msg: window.waboxcli.extract(_0xf141x4.all),
                                    fn: _0xf141x6
                                };
                                window.waboxcli.toScript("_wabs_msg", _0xf141x3)
                                */
                            }
                        })
                    } else {
                        _0xf141x3 = {
                            msg: window.waboxcli.extract(_0xf141x4.all)
                        };
                        window.waboxcli.toScript("_wabs_msg", _0xf141x3)
                    }
                }
            }
        } catch (err) {
            window.waboxcli.catch(err)
        }
    }, 250)
};
waboxcli.prototype.onMediaData = function(_0xf141x7) {
    if (_0xf141x7.mediaStage.toLowerCase() == "resolved") {
        window.waboxcli.onMsg(_0xf141x7.parent)
    }
};
waboxcli.prototype.onAck = function(_0xf141x4) {
    try {
        var _0xf141x3 = {
            id: _0xf141x4.id.id,
            ack: _0xf141x4.ack,
            muid: window.waboxcli.uidsCache[_0xf141x4.id.id]
        };
        window.waboxcli.toScript("_wabs_ack", _0xf141x3);
        delete window.waboxcli.uidsCache[_0xf141x4.id.id]
    } catch (err) {
        window.waboxcli.catch(err)
    }
};
waboxcli.prototype.toScript = function(_0xf141x8, _0xf141x9) {
    window.postMessage({
        type: _0xf141x8,
        msg: _0xf141x9
    }, "*")
};
waboxcli.prototype.catch = function(_0xf141xa) {
    window.waboxcli.toScript("_wabs_err", {
        error: _0xf141xa.message,
        stack: _0xf141xa.stack
    })
};
waboxcli.prototype.processQueue = function() {
    try {
        var _0xf141x9, _0xf141xb, _0xf141xc;
        if (!window.Store.Conn.blockStoreAdds) {
            if (this.queue.length) {
                _0xf141x9 = this.queue.pop().msg;
                if (_0xf141xb = window.waboxcli.getChat(_0xf141x9.msg.to)) {
                    switch (_0xf141x9.cmd) {
                        case "chat":
                            if (_0xf141x9.msg.body.text) {
                                _0xf141xb.sendMessage(_0xf141x9.msg.body.text);
                                if (_0xf141xc = _0xf141xb.msgs.models[_0xf141xb.msgs.models.length - 1].id.id) {
                                    window.waboxcli.uidsCache[_0xf141xc] = _0xf141x9.msg.custom_uid
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
waboxcli.prototype.getChat = function(_0xf141xd) {
    try {
        return window.Store.Chat.gadd(this.cuidToJid(_0xf141xd))
    } catch (err) {
        window.waboxcli.catch(err)
    }
};
waboxcli.prototype.cuidToJid = function(_0xf141xd) {
    return (_0xf141xd.indexOf("@") < 0 ? _0xf141xd + "@c.us" : _0xf141xd)
};
waboxcli.prototype.blobToBase64 = function(_0xf141xe, _0xf141xf) {
    try {
        var _0xf141x10 = new window.FileReader();
        _0xf141x10.readAsDataURL(_0xf141xe);
        _0xf141x10.onloadend = function() {
            _0xf141xf(_0xf141x10.result)
        }
    } catch (err) {
        window.waboxcli.catch(err)
    }
};
waboxcli.prototype.randomFN = function(_0xf141x11) {
    var _0xf141x12 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var _0xf141x13 = _0xf141x11.split("/")[1].substr(0, 3);
    var _0xf141x14 = "";
    if (_0xf141x13 == "jpe") {
        _0xf141x13 = "jpg"
    };
    for (var _0xf141x15 = 32; _0xf141x15 > 0; --_0xf141x15) {
        _0xf141x14 += _0xf141x12[Math.floor(Math.random() * _0xf141x12.length)]
    };
    return _0xf141x14 + "." + _0xf141x13
};
waboxcli.prototype.extract = function(_0xf141x16) {
    var _0xf141x14 = {};
    for (var _0xf141x17 in _0xf141x16) {
        if (typeof(_0xf141x16[_0xf141x17]) != "object" && typeof(_0xf141x16[_0xf141x17]) != "function") {
            _0xf141x14[_0xf141x17] = _0xf141x16[_0xf141x17]
        } else {
            if (_0xf141x17 == "chat" || _0xf141x17 == "senderObj") {
                _0xf141x14[_0xf141x17] = window.waboxcli.extract(_0xf141x16[_0xf141x17].all)
            } else {
                if (_0xf141x17 == "id") {
                    _0xf141x14[_0xf141x17] = window.waboxcli.extract(_0xf141x16[_0xf141x17])
                }
            }
        }
    };
    return _0xf141x14
};
window.waboxcli = new waboxcli()