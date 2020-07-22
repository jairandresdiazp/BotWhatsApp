var express = require('express');
var router = express.Router();
var config = require('../config/app');

router.get('/bin/www', function (req, res) {
	res.redirect('/');
});

router.get('/comercialpage', function (req, res) {
	res.render('commercialpage', {
		headtitle: 'WhatsApp API'
	});
});

router.get('/', function (req, res) {
	res.render('landingpage', {
		headtitle: 'WhatsApp API',
		recaptchakey: config.ReCaptchaKeyPlublic
	});
});

module.exports = router;
