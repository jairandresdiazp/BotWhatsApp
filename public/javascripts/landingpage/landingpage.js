$(document).on('ready', function() {
    $('#contact-form').submit(function(event) {
        event.preventDefault();
        grecaptcha.execute();
    });
});
var onSubmit = function(response) {
    var data = JSON.stringify({
        name: $('#name').val(),
        email: $('#email').val(),
        subject: $('#subject').val(),
        message: $('#txtmessage').val(),
        token: response
    });
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.addEventListener('readystatechange', function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                alert('We will respond as soon as possible');
            } else {
                alert('An error occurred, try again');
            }
        }
    });
    xhr.open('POST', 'app/lead');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', '6156badde217bf7a7050f51e266587e913f3c0d49e60ac87935a3776127bbb1834106a738ad79d15734b5ab8862526582e4f4c89204b50352d604b34093feeea');
    xhr.send(data);
    grecaptcha.reset();
    $('#contact-form')[0].reset();
};