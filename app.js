var express = require('express');
var app = express();
var http = require('http');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config = require('./config/app');
var mongo = require('./database/mongodb.js');
var common = require('./bin/common.js');
var request = require('request');
var WebSocket = require('ws');
var db;
var configApp = null;

var multiparty = require('multiparty');
var uuidv4 = require('uuid/v4');
var uuidv1 = require('uuid/v1');
var sha256 = require('sha256');

config.getConfig().then(success => {
	configApp = success;
	/*
	configurar cosas que se requieran en el cargue de la aplicacion
	 */
	setInterval(function ping() {
		try {
			wss.clients.forEach(function each(ws) {
				if (ws.isAlive === false) {
					console.log('Socket was closed');
					return ws.terminate();
				} else {
					console.log('Socket is open and ready to receive messages');
					ws.isAlive = false;
					ws.ping('', false, true);
				}
			});
		} catch (err) {
			console.log('Server error [./app/getConfig]: ' + err);
		}
	}, configApp.timePing);
}).catch(error => {
	configApp = error;
});

app.set('masterKey', process.env.MASTERKEY || config.masterKey);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('port', process.env.PORT || config.port);
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

/*app.use(bodyParser.json({
type: 'application/json'
}));
app.use(bodyParser.urlencoded({
extended: false
}));*/

app.use(bodyParser.json({
		limit: '1000mb'
	}));
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({
		limit: '1000mb',
		extended: true
	}));
app.use(cookieParser());

var server = http.createServer(app).on('error', function (err) {
		throw new Error('Server error [./app/createServer]: ' + err);
	}).on('listening', function () {
		console.log('Listening on port ' + app.get('port'));
	}).listen(app.get('port'));

Array.prototype.contains = function (element) {
	for (var i = 0; i < this.length; i++) {
		if (typeof(element) == 'object') {
			if (JSON.stringify(this[i]) === JSON.stringify(element)) {
				return true;
			}
		} else {
			if (this[i] === element) {
				return true;
			}
		}
	}
	return false;
};

var verifyAuthorization = function (req, res, next) {
	try {
		if (req.headers.authorization == app.get('masterKey') || req.headers.Authorization == app.get('masterKey')) {
			next();
		} else {
			res.status(401).json({
				error: false,
				result: 'This request is not authorized'
			});
		}
	} catch (err) {
		console.error('Server error [./app/verifyAuthorization]: ' + err);
		res.status(500).json({
			error: true,
			result: 'The request could not be verified due to an internal error'
		});
	}
};

var wss = new WebSocket.Server({
		server
	});

mongo.Connect(function (database) {
	db = database;
});

wss.on('connection', function connection(ws, req) {
	try {
		if (req.headers.origin == 'https://web.whatsapp.com') {
			ws.on('message', function incoming(input) {
				console.log('Total Socket ' + wss.clients.size);
				try {
					input = JSON.parse(input);
				} catch (err) {
					console.log('Error parsing the message to JSON format [./app/wss.on]' + input);
				}
				common.AuthorizedToken(input.token, function (status, message, acount) {
					if (status == 200) {
						console.log('*****************************');
						console.log('*****************************');
						console.log('The message was received ' + input.type);
						console.log(JSON.stringify(input));
						console.log('*****************************');
						console.log('*****************************');
						ws['token'] = input.token;
						if (input.type == '_wabs_msg' && input.msg.msg.chat != null && input.msg.msg.isSentByMe == false && input.msg.msg.to != null) {
							ws['phone'] = input.msg.msg.to.split('@')[0];
							ws['phoneconect'] = true;
							var profiles;
							var bodyrequest;
							switch (input.msg.msg.type) {
							case 'chat':
								bodyrequest = {
									acountId: acount._id,
									from: input.msg.msg.from.split('@')[0],
									name: input.msg.msg.chat.name,
									to: ws['phone'],
									isGroup: input.msg.msg.isGroupMsg,
									type: input.msg.msg.type,
									message: {
										body: input.msg.msg.body
									}
								};
								break;
							case 'location':
								bodyrequest = {
									acountId: acount._id,
									from: input.msg.msg.from.split('@')[0],
									name: input.msg.msg.chat.name,
									to: ws['phone'],
									isGroup: input.msg.msg.isGroupMsg,
									type: input.msg.msg.type,
									message: {
										location: {
											type: 'Point',
											coordinates: [input.msg.msg.lat, input.msg.msg.lng]
										}
									}
								};
								break;
							case 'image':
								bodyrequest = {};
								break;
							case 'video':
								bodyrequest = {};
								break;
							case 'document':
								bodyrequest = {};
								break;
							case 'audio':
								bodyrequest = {};
								break;
							};
							db.collection('message.whatsapp').insert(bodyrequest, function (err, result) {
								if (err) {
									console.log('Error insert document [./app/wss.on]: ' + err);
								} else {
									console.log('Document inserted ' + result.result.n);
								}
							});
							common.AddPhoneAcount(acount, ws['phone'], function (updateAcount) {
								profiles = common.ObjectFindByKey(updateAcount.profiles, 'phone', ws['phone']);
								if (profiles != null) {
									var webhook = profiles.webhook;
									var webhookToken = (profiles.webhookToken == '' ? null : profiles.webhookToken);
									if (webhook != '') {
										var options = {
											method: 'POST',
											url: webhook,
											headers: {
												'Content-Type': 'application/json',
												Authorization: webhookToken
											},
											body: bodyrequest,
											json: true
										};
										request(options, function (error, response, body) {
											if (!error && response.statusCode == 200) {
												console.log('Send to WebHook ' + input.type);
											} else {
												console.log('Error send to WebHook ' + error + ' ' + response + ' ' + response.statusCode);
											}
										});
									}
								}
							});
						} else if (input.type == '_wabs_msg' && input.msg.msg.chat != null && input.msg.msg.isSentByMe != false && input.msg.msg.to != null) {
							ws['phone'] = input.msg.msg.to.split('@')[0];
							ws['phoneconect'] = true;
						} else if (input.type == '_wabs_alive' || input.type == '_wabs_status') {
							if (input.me != null && input.me != false) {
								ws['phone'] = input.me.split('@')[0];
								ws['phoneconect'] = true;
								common.AddPhoneAcount(acount, ws['phone'], function (updateAcount) {});
							} else {
								ws['phoneconect'] = false;
								console.log('The message was not received because it is unknown or the phone is not connected to the internet ' + input.type);
							}
						} else if (input.type == '_wabs_ack') {
							switch (input.ack) {
							case 0:
								input['description'] = 'Message still not sent to WhatsApp servers';
								break;
							case 1:
								input['description'] = 'Message sent to WhatsApp servers';
								break;
							case 2:
								input['description'] = 'Message delivered to recipient';
								break;
							case 3:
								input['description'] = 'Message read by recipient (note: it can be masked as status "2" depending on recipient privacy settings)';
								break;
							};
						}
						ws.send(JSON.stringify({
								error: false,
								result: 'Connected websocket'
							}));
					} else {
						ws.send(JSON.stringify(message));
						ws.close();
					}
				});
			});
			ws.isAlive = true;
			ws.on('pong', heartbeat);
		} else {
			console.log(req.headers.origin + ' domain not allowed');
			ws.send(JSON.stringify({
					error: true,
					result: req.headers.origin + ' domain not allowed'
				}));
			ws.close();
		}
	} catch (err) {
		console.log('Server error [./app/wss.on]:' + err);
	}
});

function heartbeat() {
	this.isAlive = true;
}

app.use((error, request, response, next) => {
  if (error !== null) {
    return response.status(500).json({
            error: true,
            result: 'The information was not received due to an internal error '+error
        });
  }
  next();
});

app.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
	req.db = db;
	next();
});

app.use(function (req, res, next) {
	config.getConfig().then(success => {
		configApp = success;
	}).catch(error => {
		configApp = error;
	});
	req.configApp = configApp;
	next();
});

app.get('/test', function (req, res) {
	res.status(200).json(configApp);
});

app.post('/api/validate', function (req, res) {
	try {
		common.AuthorizedToken(req.body.token, function (status, message, acount) {
			res.status(status).json(message);
		});
	} catch (err) {
		console.log('Server error [./app/app.post/api/validate]: ' + err);
		res.status(401).json({
			error: true,
			result: 'Server error: ' + err
		});
	}
});

app.post('/api/upload', function (req, res) {
	var form = new multiparty.Form();
	var binary;
	var msg;
	var profiles;
	var phone;
	try {
		form.parse(req, function (err, fields, files) {
			common.AuthorizedToken(fields.token[0], function (status, message, acount) {
				if (status == 200) {
					try {
						msg = JSON.parse(fields.msg[0]);
					} catch (err) {
						console.log('Server error [./app/app.post/api/upload]: ' + err);
					}
					if (msg.chat != null && msg.isSentByMe == false && msg.to != null) {
						phone = msg.to.split('@')[0];
						common.AddPhoneAcount(acount, phone, function (updateAcount) {
							profiles = common.ObjectFindByKey(updateAcount.profiles, 'phone', phone);
							if (profiles != null) {
								var webhook = profiles.webhook;
								var webhookToken = (profiles.webhookToken == '' ? null : profiles.webhookToken);
								if (webhook != '') {
									var data = fields.blob[0].split(';');
									var mimetype = data[0].split(':');
									var base64 = data[1].split(',');
									binary = {
										name: fields.fn[0],
										mimetype: mimetype[1],
										data: base64[1]
									};
									var options = {
										method: 'POST',
										url: webhookUrl,
										headers: {
											'Content-Type': 'aplication/json',
											Authorization: webhookToken
										},
										body: {
											cmd: 'upload',
											file: binary.name,
											msg: {
												body: binary
											}
										},
										json: true
									};
									request(options, function (error, response, body) {
										if (!error && response.statusCode == 200) {
											res.status(200).json({
												error: false,
												result: 'Sent to the webhook'
											});
										} else {
											res.status(415).json({
												error: true,
												result: 'Error when uploading the binary in WebHook'
											});
										}
									});
								}
							}
						});
					}
				} else {
					res.status(status).json(message);
				}
			});
		});
	} catch (err) {
		console.log('Server error [./app/app.post/api/upload]: ' + err);
		res.status(415).json({
			error: true,
			result: 'Server error: ' + err
		});
	}
});

app.post('/api/send/chat', function (req, res) {
	try {
		common.AuthorizedToken(req.headers.token, function (status, message, acount) {
			if (status == 200) {
				if (req.body.cmd && req.body.msg) {
					if (typeof(wss) !== 'undefined') {
						console.log('The object socket exist an have ' + wss.clients.size + ' conection');
						if (wss.clients.size <= 0) {
							res.status(200).json({
								error: true,
								result: 'No connections available'
							});
						} else {
							wss.clients.forEach(function each(ws) {
								if (ws.readyState === 1 && ws.phoneconect === true && ws.phone === req.body.msg.from && ws.token === req.headers.token) {
									if (req.body.msg.body.url) {
										common.ShotUrl(req.body.msg.body.url, function (errorurl, responseurl, bodyurl) {
											if (!errorurl && bodyurl.id) {
												req.body.msg.body.url = bodyurl.id;
											}
										});
									}
									var from = req.body.msg.from;
									delete req.body.msg.from;
									req.body.msg['custom_uid'] = common.SHA1(uuidv4() + uuidv4);
									ws.send(JSON.stringify(req.body));
									req.body.msg['messageId'] = req.body.msg.custom_uid;
									delete req.body.msg.custom_uid;
									req.body.msg['from'] = from;
									req.body.msg['acountId'] = acount._id;
									console.log('Comand API Send');
									req.db.collection('message.api').insert(req.body, function (err, result) {
										if (err) {
											console.log('Error insert document: ' + err);
										} else {
											console.log('Document inserted ' + result.result.n);
										}
									});
									res.status(200).json({
										error: false,
										result: 'Message sent',
										data: {
											messageId: req.body.msg.messageId
										}
									});
								} else {
									res.status(200).json({
										error: true,
										result: 'Message not sent there is no socket matching the account'
									});
								}
							});
						}

					} else {
						res.status(200).json({
							error: true,
							result: 'There is no connection available verify that your account is linked'
						});
					}
				} else {
					res.status(200).json({
						error: true,
						result: 'The cmd and msg fields are required'
					});
				}
			} else {
				res.status(status).json(message);
			}
		});
	} catch (err) {
		console.log('server error [./app/app.post/api/send/chat]: ' + err);
		res.status(500).json({
			error: true,
			result: 'Message not sent'
		});
	}
});

var indexRoute = require('./routes/index');
var appRoute = require('./routes/app');
app.use('/', indexRoute);
app.use('/app', verifyAuthorization, appRoute);

app.use(function (req, res) {
	res.status(404);
	res.render('message', {
		headtitle: 'Error 404 | WhatsApp API',
		messagetitle: 'Error 404',
		message: 'This route is not defined validate that it is a correct request.'
	});
});

app.use(function (err, req, res, next) {
	console.error(err.stack);
	res.status(500);
	res.render('message', {
		headtitle: 'Error 500 | WhatsApp API',
		messagetitle: 'Error 500',
		message: err.stack
	});
});
