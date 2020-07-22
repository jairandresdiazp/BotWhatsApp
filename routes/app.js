var express = require('express');
var router = express.Router();
var request = require('request');
var common = require('../bin/common.js');

router.get('/', function(req, res) {
    res.render('message', {
        headtitle: 'APP',
        messagetitle: 'APP',
        message: 'This is not a public route or is inaccessible by the client'
    });
});

router.post('/config', function(req, res) {
    try {
        req.db.collection('common.config').drop(function(errDrop, resultDrop) {
            req.db.collection('common.config').insert(req.body, function(err, result) {
                if (err) {
                    res.status(500).json({
                        error: true,
                        message: 'The configuration not modified' + err
                    });
                } else {
                    res.status(200).json({
                        error: false,
                        message: 'The configuration is modified'
                    });
                }
            });
        });
    } catch (err) {
        console.log('Server error [./routes/app/router.post/config]: ' + err);
        res.status(500).json({
            error: true,
            result: 'Server error: ' + err
        });
    }
});

router.get('/config', function(req, res) {
    try {
        req.db.collection('common.config').findOne({}, function(err, result) {
            if (err) {
                res.status(500).json({
                    error: true,
                    message: 'The configuration does not exist' + err
                });
            } else {
                try {
                    delete result._id;
                } catch (err) {

                }
                res.status(200).json({
                    error: false,
                    message: 'The configuration is available',
                    data: result
                });
            }
        });
    } catch (err) {
        console.log('Server error [./routes/app/router.get/config]: ' + err);
        res.status(500).json({
            error: true,
            result: 'Server error: ' + err
        });
    }
});

router.post('/acount/create', function(req, res) {
    try {
        req.db.collection('common.user').find({
            phone: req.body.phone
        }).toArray(function(err, result) {
            if (result.length > 0) {
                res.status(200).json({
                    error: true,
                    result: 'User already exists'
                });
            } else {
                user = req.body;
                token = uuidv4();
                user['token'] = sha256(token);
                req.db.collection('common.user').insert(user, function(err, result) {
                    if (err) {
                        res.status(500).json({
                            error: true,
                            result: 'Server error: ' + err
                        });
                    } else {
                        res.status(200).json({
                            error: false,
                            result: 'Created user',
                            data: {
                                token: token
                            }
                        });
                    }
                });
            }
        });
    } catch (err) {
        console.log('Server error [./routes/app/router.post/acount/create]: ' + err);
        res.status(500).json({
            error: true,
            result: 'Server error: ' + err
        });
    }
});

router.post('/lead', function(req, res) {
    try {
        args = {
            reCaptchaKeySecret: req.configApp.reCaptchaKeySecret,
            token: req.body.token
        };
        common.VerifyReCaptcha(args, function(valid) {
            if (valid == true) {
                var bodyEmail = common.ObjectFindByKey(req.configApp.notification, 'name', 'lead');
                if (bodyEmail != null) {
                    bodyEmail = JSON.stringify(bodyEmail.email);
                    bodyEmail = bodyEmail.replace(/\{\{name\}\}/g, req.body.name);
                    bodyEmail = bodyEmail.replace(/\{\{to\}\}/g, req.body.email);
                    bodyEmail = bodyEmail.replace(/\{\{message\}\}/g, req.body.message);
                    bodyEmail = bodyEmail.replace(/\{\{subject\}\}/g, req.body.subject);
                    bodyEmail = JSON.parse(bodyEmail);
                    common.SendEmail(req.configApp.sendGridKey, bodyEmail, function(callBack) {
                        if (callBack.error == true) {
                            console.error('ERROR [./routes/app/router.post/lead]: ' + callBack.message);
                            res.status(500).json({
                                error: true,
                                result: 'The notification was not sent'
                            });
                        } else {
                            console.info('INFO : The notification was sent');
                            res.status(200).json({
                                error: false,
                                result: 'The notification was sent'
                            });
                        }
                    });
                } else {
                    res.status(500).json({
                        error: true,
                        result: 'The notification was not sent'
                    });
                }
            } else {
                res.status(500).json({
                    error: true,
                    result: 'This request does not legitimize can not be processed'
                });
            }
        });
    } catch (err) {
        console.log('Server error [./routes/app/router.post/lead]: ' + err);
        res.status(500).json({
            error: true,
            result: 'Server error: ' + err
        });
    }
});

router.post('/thumbnails', function(req, res) {
    try {
        data = req.configApp.thumbnails;
        options = {
            method: 'GET',
            url: req.body.url,
            rejectUnauthorized: false,
            requestCert: true,
            agent: false,
            encoding: 'binary'
        };
        request(options, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                if (response.headers['content-type'].toLowerCase().indexOf('image') > -1) {
                    data = new Buffer(body, 'binary').toString('base64');
                };
            }
            res.status(200).json({
                error: false,
                result: data
            });
        });
    } catch (err) {
        console.log('Server error [./routes/app/router.post/thumbnails]: ' + err);
        res.status(500).json({
            error: false,
            result: data
        });
    }
});

module.exports = router;