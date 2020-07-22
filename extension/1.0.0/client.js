function waboxcli() {
    this.dtm = Math.floor(Date.now() / 1000) - 300;
    this.queue = [];
    this.uidsCache = {};
    window.addEventListener("message", this.onScriptMessage);
    var _0xe3c8x2 = setInterval(function() {
        if (typeof(window.Store) != "undefined" && typeof(window.Store.Stream) != "undefined" && typeof(window.Store.Conn) != "undefined" && typeof(window.Store.Msg) != "undefined") {
            clearInterval(_0xe3c8x2);
            window.waboxcli.onStatusChange();
            setInterval(window.waboxcli.onStatusChange, 90000);
            window.Store.Stream.listenTo(window.Store.Stream, "change:phoneAuthed change:info", window.waboxcli.onStatusChange);
            window.Store.Conn.listenTo(window.Store.Conn, "change:me change:ref", window.waboxcli.onStatusChange);
            window.Store.Msg.on("add change:mediaState", window.waboxcli.onMsg);
            window.Store.Msg.on("change:ack", window.waboxcli.onAck)
        }
    }, 1000)
}
waboxcli.prototype.onScriptMessage = function(_0xe3c8x3) {
    if (_0xe3c8x3.data.type && _0xe3c8x3.data.type.indexOf("_wabc_") > -1) {
        window.waboxcli.queue.push(_0xe3c8x3.data);
        window.waboxcli.processQueue()
    }
};
waboxcli.prototype.onStatusChange = function(_0xe3c8x3) {
    try {
        var _0xe3c8x4 = {
            stream: window.waboxcli.extract(window.Store.Stream.all),
            conn: window.waboxcli.extract(window.Store.Conn.all)
        };
        window.waboxcli.toScript("_wabs_status", _0xe3c8x4)
    } catch (err) {
        window.waboxcli.catch(err)
    }
};
waboxcli.prototype.onMsg = function(_0xe3c8x5) {
    var _0xe3c8x4;
    setTimeout(function() {
        try {
            if (_0xe3c8x5.t > window.waboxcli.dtm && !(_0xe3c8x5.id.id in window.waboxcli.uidsCache)) {
                if ((_0xe3c8x5.isMedia || _0xe3c8x5.isDoc || _0xe3c8x5.isMMS) && _0xe3c8x5.mediaData && _0xe3c8x5.mediaData.mediaStage.toLowerCase() != "resolved") {
                    _0xe3c8x5.mediaData.parent = _0xe3c8x5;
                    _0xe3c8x5.mediaData.on("change:mediaStage", window.waboxcli.onMediaData);
                    _0xe3c8x5.forceDownloadMedia()
                } else {
                    if (_0xe3c8x5.isMedia || _0xe3c8x5.isDoc || _0xe3c8x5.isMMS) {
                        window.waboxcli.blobToBase64(_0xe3c8x5.mediaData.mediaBlob._blob, function(_0xe3c8x6) {
                            if (_0xe3c8x6) {
                                var _0xe3c8x7 = window.waboxcli.randomFN(_0xe3c8x5.mimetype);
                                window.waboxcli.toScript("_wabs_file", {
									msg: window.waboxcli.extract(_0xe3c8x5.all),
                                    fn: _0xe3c8x7,
                                    blob: _0xe3c8x6
                                });
                                /*
								_0xe3c8x4 = {
                                    msg: window.waboxcli.extract(_0xe3c8x5.all),
                                    fn: _0xe3c8x7
                                };
                                window.waboxcli.toScript("_wabs_msg", _0xe3c8x4)
								*/
                            }
                        })
                    } else {
                        _0xe3c8x4 = {
                            msg: window.waboxcli.extract(_0xe3c8x5.all)
                        };
                        window.waboxcli.toScript("_wabs_msg", _0xe3c8x4)
                    }
                }
            }
        } catch (err) {
            window.waboxcli.catch(err)
        }
    }, 250)
};
waboxcli.prototype.onMediaData = function(_0xe3c8x8) {
    if (_0xe3c8x8.mediaStage.toLowerCase() == "resolved") {
        window.waboxcli.onMsg(_0xe3c8x8.parent)
    }
};
waboxcli.prototype.onAck = function(_0xe3c8x5) {
    try {
        var _0xe3c8x4 = {
            id: _0xe3c8x5.id.id,
            ack: _0xe3c8x5.ack,
            muid: window.waboxcli.uidsCache[_0xe3c8x5.id.id]
        };
        window.waboxcli.toScript("_wabs_ack", _0xe3c8x4);
        delete window.waboxcli.uidsCache[_0xe3c8x5.id.id]
    } catch (err) {
        window.waboxcli.catch(err)
    }
};
waboxcli.prototype.toScript = function(_0xe3c8x9, _0xe3c8xa) {
    window.postMessage({
        type: _0xe3c8x9,
        msg: _0xe3c8xa
    }, "*")
};
waboxcli.prototype.catch = function(_0xe3c8xb) {
    window.waboxcli.toScript("_wabs_err", {
        error: _0xe3c8xb.message,
        stack: _0xe3c8xb.stack
    })
};
waboxcli.prototype.processQueue = function() {
    try {
        var _0xe3c8xa, _0xe3c8xc, _0xe3c8xd;
        if (!window.Store.Conn.blockStoreAdds) {
            if (this.queue.length) {
                _0xe3c8xa = this.queue.pop().msg;
                if (_0xe3c8xc = window.waboxcli.getChat(_0xe3c8xa.msg.to)) {
                    switch (_0xe3c8xa.cmd) {
                        case "chat":
                            if (_0xe3c8xa.msg.body.text) {
                                _0xe3c8xc.sendMessage(_0xe3c8xa.msg.body.text);
                                if (_0xe3c8xd = _0xe3c8xc.msgs.models[_0xe3c8xc.msgs.models.length - 1].id.id) {
                                    window.waboxcli.uidsCache[_0xe3c8xd] = _0xe3c8xa.msg.custom_uid
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
waboxcli.prototype.getChat = function(_0xe3c8xe) {
    try {
        return window.Store.Chat.gadd(this.cuidToJid(_0xe3c8xe))
    } catch (err) {
        window.waboxcli.catch(err)
    }
};
waboxcli.prototype.cuidToJid = function(_0xe3c8xe) {
    return (_0xe3c8xe.indexOf("@") < 0 ? _0xe3c8xe + "@c.us" : _0xe3c8xe)
};
waboxcli.prototype.blobToBase64 = function(_0xe3c8xf, _0xe3c8x10) {
    try {
        var _0xe3c8x11 = new window.FileReader();
        _0xe3c8x11.readAsDataURL(_0xe3c8xf);
        _0xe3c8x11.onloadend = function() {
            _0xe3c8x10(_0xe3c8x11.result)
        }
    } catch (err) {
        window.waboxcli.catch(err)
    }
};
waboxcli.prototype.randomFN = function(_0xe3c8x12) {
    var _0xe3c8x13 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var _0xe3c8x14 = _0xe3c8x12.split("/")[1].substr(0, 3);
    var _0xe3c8x15 = "";
    if (_0xe3c8x14 == "jpe") {
        _0xe3c8x14 = "jpg"
    };
    for (var _0xe3c8x16 = 32; _0xe3c8x16 > 0; --_0xe3c8x16) {
        _0xe3c8x15 += _0xe3c8x13[Math.floor(Math.random() * _0xe3c8x13.length)]
    };
    return _0xe3c8x15 + "." + _0xe3c8x14
};
waboxcli.prototype.extract = function(_0xe3c8x17) {
    var _0xe3c8x15 = {};
    for (var _0xe3c8x18 in _0xe3c8x17) {
        if (typeof(_0xe3c8x17[_0xe3c8x18]) != "object" && typeof(_0xe3c8x17[_0xe3c8x18]) != "function") {
            _0xe3c8x15[_0xe3c8x18] = _0xe3c8x17[_0xe3c8x18]
        } else {
            if (_0xe3c8x18 == "chat" || _0xe3c8x18 == "senderObj") {
                _0xe3c8x15[_0xe3c8x18] = window.waboxcli.extract(_0xe3c8x17[_0xe3c8x18].all)
            } else {
                if (_0xe3c8x18 == "id") {
                    _0xe3c8x15[_0xe3c8x18] = window.waboxcli.extract(_0xe3c8x17[_0xe3c8x18])
                }
            }
        }
    };
    return _0xe3c8x15
};
window.waboxcli = new waboxcli()