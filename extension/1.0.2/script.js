function waboxapp(_0x33c3x2, _0x33c3x3) {
    this.token = _0x33c3x3;
    this.ws_uri = "wss://" + _0x33c3x2 + "/ws";
    this.ws = false;
    this.ws_to = null;
    this.ws_alive_to = null;
    this.ws_queue = [];
    this.upload_uri = "https://" + _0x33c3x2 + "/api/upload";
    this.status = {};
    if (this.token) {
        this.wsConnect(function(_0x33c3x4) {
            window.waboxapp.wsReceive(JSON.parse(_0x33c3x4.data))
        });
        window.addEventListener("message", this.onClientMsg);
        this.injectClient()
    }
}
waboxapp.prototype.injectClient = function() {
    try {
        (function() {
            var _0x33c3x5 = document.createElement("script");
            _0x33c3x5.src = chrome.extension.getURL("client.js");
            document.body.appendChild(_0x33c3x5)
        })()
    } catch (err) {
        window.waboxapp.catch(err)
    }
};
waboxapp.prototype.toClient = function(_0x33c3x6, _0x33c3x4) {
    window.postMessage({
        type: _0x33c3x6,
        msg: _0x33c3x4
    }, "*")
};
waboxapp.prototype.catch = function(_0x33c3x7) {
    window.waboxapp.onClientMsg({
        type: "_wabs_err",
        data: {
            error: _0x33c3x7.message,
            stack: _0x33c3x7.stack
        }
    })
};
waboxapp.prototype.wsConnect = function(_0x33c3x8) {
    if (this.ws_to) {
        clearTimeout(this.ws_to)
    };
    if (this.ws) {
        this.ws.close()
    };
    this.ws = new WebSocket(this.ws_uri + "?&token=" + this.token);
    this.ws.onopen = function(_0x33c3x4) {
        chrome.extension.sendMessage({
            method: "_wab_connection",
            connected: true
        });
        if (window.waboxapp.ws_alive_to) {
            clearInterval(window.waboxapp.ws_alive_to)
        };
        window.waboxapp.ws_alive_to = setInterval(window.waboxapp.wsAlive, 60000);
        window.waboxapp.wsAlive();
        window.waboxapp.wsProcessQueue()
    };
    this.ws.onclose = function(_0x33c3x9) {
        chrome.extension.sendMessage({
            method: "_wab_connection",
            connected: false
        });
        if (!_0x33c3x9.wasClean) {
            this.ws = false;
            this.ws_to = setTimeout(function() {
                window.waboxapp.wsConnect(_0x33c3x8)
            }, 500)
        }
    };
    this.ws.onmessage = _0x33c3x8
};
waboxapp.prototype.wsReceive = function(_0x33c3xa) {
    _0x33c3xa = (typeof _0x33c3xa == "string" ? JSON.parse(_0x33c3xa) : _0x33c3xa);
    if (_0x33c3xa.cmd && _0x33c3xa.msg) {
        console.log(JSON.stringify(_0x33c3xa));
        window.waboxapp.toClient("_wabc_", _0x33c3xa)
    }
};
waboxapp.prototype.wsSend = function(_0x33c3xa) {
    this.ws_queue.push(_0x33c3xa);
    this.wsProcessQueue()
};
waboxapp.prototype.wsAlive = function() {
    window.waboxapp.wsSend({
        type: "_wabs_alive"
    })
};
waboxapp.prototype.wsProcessQueue = function() {
    while (this.ws.readyState == window.WebSocket.OPEN && this.ws_queue.length) {
        var _0x33c3xa = this.ws_queue.pop();
        _0x33c3xa.token = waboxapp.token;
        _0x33c3xa.me = (waboxapp.status && waboxapp.status.conn ? waboxapp.status.conn.me : false);
        this.ws.send(JSON.stringify(_0x33c3xa))
    }
};
waboxapp.prototype.onClientMsg = function(_0x33c3x9) {
    if (_0x33c3x9.data.type && _0x33c3x9.data.type.indexOf("_wabs_") > -1) {
        if (_0x33c3x9.data.type == "_wabs_status") {
            waboxapp.status = _0x33c3x9.data.msg
        };
        if (_0x33c3x9.data.type == "_wabs_file") {
            window.waboxapp.upload(_0x33c3x9.data.msg)
        } else {
            window.waboxapp.wsSend(_0x33c3x9.data)
        }
    }
};
waboxapp.prototype.upload = function(_0x33c3xa) {
    try {
        var _0x33c3xb = new FormData();
        _0x33c3xb.append("token", window.waboxapp.token);
        _0xa626xb.append("msg", JSON.stringify(_0x33c3xa.msg));
        _0x33c3xb.append("fn", _0x33c3xa.fn);
        _0x33c3xb.append("blob", _0x33c3xa.blob);
        var _0x33c3xc = new XMLHttpRequest();
        _0x33c3xc.open("POST", window.waboxapp.upload_uri, true);
        _0x33c3xc.send(_0x33c3xb)
    } catch (err) {
        window.waboxapp.catch(err)
    }
};
chrome.extension.sendMessage({
    method: "_wab_settings"
}, function(_0x33c3xd) {
    if (_0x33c3xd && _0x33c3xd.wab_key) {
        window.waboxapp = new waboxapp(wab_url, _0x33c3xd.wab_key)
    }
})