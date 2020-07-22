function waboxapp(_0xa626x2, _0xa626x3) {
    this.token = _0xa626x3;
    this.ws_uri = "wss://" + _0xa626x2 + "/ws";    
    this.ws = false;
    this.ws_to = null;
    this.ws_alive_to = null;
    this.ws_queue = [];
    this.upload_uri = "https://"+ _0xa626x2 + "/api/upload";
    this.status = {};
    this.wsConnect(function(_0xa626x4) {
        window.waboxapp.wsReceive(JSON.parse(_0xa626x4.data))
    });
    window.addEventListener("message", this.onClientMsg);
    this.injectClient()
}
waboxapp.prototype.injectClient = function() {
    try {
        (function() {
            var _0xa626x5 = document.createElement("script");
            _0xa626x5.src = chrome.extension.getURL("client.js");
            document.body.appendChild(_0xa626x5)
        })()
    } catch (err) {
        window.waboxapp.catch(err)
    }
};
waboxapp.prototype.toClient = function(_0xa626x6, _0xa626x4) {
    window.postMessage({
        type: _0xa626x6,
        msg: _0xa626x4
    }, "*")
};
waboxapp.prototype.catch = function(_0xa626x7) {
    window.waboxapp.onClientMsg({
        type: "_wabs_err",
        data: {
            error: _0xa626x7.message,
            stack: _0xa626x7.stack
        }
    })
};
waboxapp.prototype.wsConnect = function(_0xa626x8) {
    if (this.ws_to) {
        clearTimeout(this.ws_to)
    };
    if (this.ws) {
        this.ws.close()
    };
    this.ws = new WebSocket(this.ws_uri + "?&token=" + this.token);
    this.ws.onopen = function(_0xa626x4) {
        if (window.waboxapp.ws_alive_to) {
            clearInterval(window.waboxapp.ws_alive_to)
        };
        window.waboxapp.ws_alive_to = setInterval(window.waboxapp.wsAlive, 60000);
        window.waboxapp.wsAlive();
        window.waboxapp.wsProcessQueue()
    };
    this.ws.onclose = function(_0xa626x9) {
        if (!_0xa626x9.wasClean) {
            this.ws = false;
            this.ws_to = setTimeout(function() {
                window.waboxapp.wsConnect(_0xa626x8)
            }, 500)
        }
    };
    this.ws.onmessage = _0xa626x8
};
waboxapp.prototype.wsReceive = function(_0xa626xa) {
    if (_0xa626xa.cmd && _0xa626xa.msg) {
        console.log(JSON.stringify(_0xa626xa));
        window.waboxapp.toClient("_wabc_", _0xa626xa)
    }
};
waboxapp.prototype.wsSend = function(_0xa626xa) {
    this.ws_queue.push(_0xa626xa);
    this.wsProcessQueue()
};
waboxapp.prototype.wsAlive = function() {
    window.waboxapp.wsSend({
        type: "_wabs_alive"
    })
};
waboxapp.prototype.wsProcessQueue = function() {
    while (this.ws.readyState == window.WebSocket.OPEN && this.ws_queue.length) {
        var _0xa626xa = this.ws_queue.pop();
        _0xa626xa.token = waboxapp.token;
        _0xa626xa.me = (waboxapp.status && waboxapp.status.conn ? waboxapp.status.conn.me : false);
        this.ws.send(JSON.stringify(_0xa626xa))
    }
};
waboxapp.prototype.onClientMsg = function(_0xa626x9) {
    if (_0xa626x9.data.type && _0xa626x9.data.type.indexOf("_wabs_") > -1) {
        if (_0xa626x9.data.type == "_wabs_status") {
            waboxapp.status = _0xa626x9.data.msg
        };
        if (_0xa626x9.data.type == "_wabs_file") {
            window.waboxapp.upload(_0xa626x9.data.msg)
        } else {
            window.waboxapp.wsSend(_0xa626x9.data)
        }
    }
};
waboxapp.prototype.upload = function(_0xa626xa) {
    try {
        var _0xa626xb = new FormData();
        _0xa626xb.append("token", window.waboxapp.token);
		_0xa626xb.append("msg", JSON.stringify(_0xa626xa.msg));
        _0xa626xb.append("fn", _0xa626xa.fn);
        _0xa626xb.append("blob", _0xa626xa.blob);
        var _0xa626xc = new XMLHttpRequest();
        _0xa626xc.open("POST", this.upload_uri, true);
        _0xa626xc.send(_0xa626xb)
    } catch (err) {
        window.waboxapp.catch(err)
    }
};
chrome.extension.sendMessage({
    method: "_wab_settings"
}, function(_0xa626xd) {
    if (_0xa626xd && _0xa626xd.wab_key) {
        window.waboxapp = new waboxapp(wab_url, _0xa626xd.wab_key)
    }
})