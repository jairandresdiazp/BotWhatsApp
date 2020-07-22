if (document.querySelector("#wab_link")) {
    if (localStorage.wab_key) {
        document.querySelector(".wab_status.ko").style.display = "none";
        document.querySelector(".wab_status.ok").style.display = "block"
    }
};
if (document.querySelector("#wab_validate")) {
    document.querySelector("#wab_key").value = (typeof(localStorage.wab_key) != "undefined" ? localStorage.wab_key : "");
    document.querySelector("#wab_validate").addEventListener("click", function() {
        document.querySelector(".wab_validated.ok").style.display = "none";
        document.querySelector(".wab_validated.ko").style.display = "none";
        document.querySelector("#wab_validate").disabled = true;
        document.querySelector("#wab_validate").value = "...";
        var _0x2197x1 = new XMLHttpRequest();
        var _0x2197x2 = document.querySelector("#wab_key").value;
        _0x2197x1.open("POST", "https://"+ wab_url + "/api/validate", false);
        _0x2197x1.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        _0x2197x1.send(JSON.stringify({token: _0x2197x2}));
        document.querySelector("#wab_validate").disabled = false;
        document.querySelector("#wab_validate").value = "Validate";
        if (_0x2197x1.readyState == 4 && _0x2197x1.status == 200) {
            document.querySelector(".wab_validated.ok").style.display = "block";
            localStorage.wab_key = document.querySelector("#wab_key").value
        } else {
            localStorage.wab_key = "";
            document.querySelector(".wab_validated.ko").style.display = "block"
        }
    })
}