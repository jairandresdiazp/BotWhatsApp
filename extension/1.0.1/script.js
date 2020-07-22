function waboxapp(_0xaf86x2, _0xaf86x3) {
    this.token = _0xaf86x3;
    this.ws_uri = "wss://" + _0xaf86x2 + "/ws";
    this.ws = false;
    this.ws_to = null;
    this.ws_alive_to = null;
    this.ws_queue = [];
    this.upload_uri = "https://" + _0xaf86x2 + "/api/upload";
    this.status = {};
    if (this.token) {
        this.wsConnect(function(_0xaf86x4) {
            window.waboxapp.wsReceive(JSON.parse(_0xaf86x4.data))
        });
        window.addEventListener("message", this.onClientMsg);
        this.injectClient()
    }
}
waboxapp.prototype.injectClient = function() {
    try {
        (function() {
            var _0xaf86x5 = document.createElement("script");
            _0xaf86x5.src = chrome.extension.getURL("client.js");
            document.body.appendChild(_0xaf86x5)
        })()
    } catch (err) {
        window.waboxapp.catch(err)
    }
};
waboxapp.prototype.toClient = function(_0xaf86x6, _0xaf86x4) {
    window.postMessage({
        type: _0xaf86x6,
        msg: _0xaf86x4
    }, "*")
};
waboxapp.prototype.catch = function(_0xaf86x7) {
    window.waboxapp.onClientMsg({
        type: "_wabs_err",
        data: {
            error: _0xaf86x7.message,
            stack: _0xaf86x7.stack
        }
    })
};
waboxapp.prototype.wsConnect = function(_0xaf86x8) {
    if (this.ws_to) {
        clearTimeout(this.ws_to)
    };
    if (this.ws) {
        this.ws.close()
    };
    this.ws = new WebSocket(this.ws_uri + "?&token=" + this.token);
    this.ws.onopen = function(_0xaf86x4) {
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
    this.ws.onclose = function(_0xaf86x9) {
        chrome.extension.sendMessage({
            method: "_wab_connection",
            connected: false
        });
        if (!_0xaf86x9.wasClean) {
            this.ws = false;
            this.ws_to = setTimeout(function() {
                window.waboxapp.wsConnect(_0xaf86x8)
            }, 500)
        }
    };
    this.ws.onmessage = _0xaf86x8
};
waboxapp.prototype.wsReceive = function(_0xaf86xa) {
    if (_0xaf86xa.cmd && _0xaf86xa.msg) {
        console.log(JSON.stringify(_0xaf86xa));
        window.waboxapp.toClient("_wabc_", _0xaf86xa)
    }
};
waboxapp.prototype.wsSend = function(_0xaf86xa) {
    this.ws_queue.push(_0xaf86xa);
    this.wsProcessQueue()
};
waboxapp.prototype.wsAlive = function() {
    window.waboxapp.wsSend({
        type: "_wabs_alive"
    })
};
waboxapp.prototype.wsProcessQueue = function() {
    while (this.ws.readyState == window.WebSocket.OPEN && this.ws_queue.length) {
        var _0xaf86xa = this.ws_queue.pop();
        _0xaf86xa.token = waboxapp.token;
        _0xaf86xa.me = (waboxapp.status && waboxapp.status.conn ? waboxapp.status.conn.me : false);
        this.ws.send(JSON.stringify(_0xaf86xa))
    }
};
waboxapp.prototype.onClientMsg = function(_0xaf86x9) {
    if (_0xaf86x9.data.type && _0xaf86x9.data.type.indexOf("_wabs_") > -1) {
        if (_0xaf86x9.data.type == "_wabs_status") {
            waboxapp.status = _0xaf86x9.data.msg
        };
        if (_0xaf86x9.data.type == "_wabs_file") {
            window.waboxapp.upload(_0xaf86x9.data.msg)
        } else {
            window.waboxapp.wsSend(_0xaf86x9.data)
        }
    }
};
waboxapp.prototype.upload = function(_0xaf86xa) {
    try {
        var _0xaf86xb = new FormData();
        _0xaf86xb.append("token", window.waboxapp.token);
        _0xa626xb.append("msg", JSON.stringify(_0xaf86xa.msg));
        _0xaf86xb.append("fn", _0xaf86xa.fn);
        _0xaf86xb.append("blob", _0xaf86xa.blob);
        var _0xaf86xc = new XMLHttpRequest();
        _0xaf86xc.open("POST", window.waboxapp.upload_uri, true);
        _0xaf86xc.send(_0xaf86xb)
    } catch (err) {
        window.waboxapp.catch(err)
    }
};
chrome.extension.sendMessage({
    method: "_wab_settings"
}, function(_0xaf86xd) {
    if (_0xaf86xd && _0xaf86xd.wab_key) {
        window.waboxapp = new waboxapp(wab_url, _0xaf86xd.wab_key)
    }
})