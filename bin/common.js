var crypto = require('crypto');
var sha256 = require('sha256');
var sha1File = require('sha1-file');
var Mongo = require('../database/mongodb.js');
var request = require('request');
var config = require('../config/app');

module.exports = {
	SHA1: function (value) {
		try {
			return crypto.createHash('sha1').update(value).digest('hex');
		} catch (err) {
			return null;
		}
	},
	SHA1File: function (file) {
		try {
			return sha1File(file);
		} catch (err) {
			console.log('ERROR [./bin/common/SHA1]: ' + err);
			return null;
		}
	},
	Sha256: function (value) {
		try {
			return sha256(value);
		} catch (err) {
			return null;
		}
	},
	ObjectFindByKey: function (array, key, value) {
		try {
			for (var i = 0; i < array.length; i++) {
				if (array[i][key] === value) {
					return array[i];
				}
			}
			return null;
		} catch (err) {
			return null;
		}
	},
	CleanText: function (object) {
		try {
			var specialChars = '!@#$^&%*+=[]\/{}|:<>?,';
			for (var i = 0; i < specialChars.length; i++) {
				object = object.replace(new RegExp('\\' + specialChars[i], 'gi'), '');
			}
			object = object.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
			object = object.replace(/ /g, '-');
			object = object.replace(/�/g, '');
			return object;
		} catch (err) {
			console.log('ERROR [./bin/common/CleanText]: ' + err);
			return object;
		}
	},
	JSONescape: function (object) {
		try {
			if (typeof(object) == 'object') {
				object = JSON.stringify(object);
			}
			return object
			.replace(/[\\]/g, '\\\\')
			.replace(/[\']/g, '\\\'')
			.replace(/[\/]/g, '\\/')
			.replace(/[\b]/g, '\\b')
			.replace(/[\f]/g, '\\f')
			.replace(/[\n]/g, '\\n')
			.replace(/[\r]/g, '\\r')
			.replace(/[\t]/g, '\\t');
		} catch (err) {
			console.log('ERROR [./bin/common/JSONescape]: ' + err);
			return object;
		}
	},
	SendEmail: function (key, body, callback) {
		return new Promise(
			function (resolve, reject) {
			try {
				var options = {
					method: 'POST',
					url: 'https://api.sendgrid.com/v3/mail/send',
					headers: {
						'Content-Type': 'application/json',
						Authorization: 'Bearer ' + key
					},
					body: body,
					json: true
				};
				request(options, function (error, response, body) {
					if (error) {
						console.log('ERROR [./bin/common/JSONescape]: ' + error);
						if (callback && typeof(callback) == 'function') {
							return callback({
								error: true,
								message: error
							});
						} else {
							reject({
								error: true,
								message: error
							});
						}
					} else {
						if (response.statusCode === 202) {
							console.log('Common: the notification was sent');
							if (callback && typeof(callback) == 'function') {
								return callback({
									error: false,
									message: 'the notification was sent'
								});
							} else {
								resolve({
									error: false,
									message: 'the notification was sent'
								});
							}
						} else {
							console.log('ERROR [./bin/common/SendEmail]: the notification was not sent');
							if (callback && typeof(callback) == 'function') {
								return callback({
									error: true,
									message: 'the notification was not sent'
								});
							} else {
								reject({
									error: true,
									message: 'the notification was not sent'
								});
							}
						}
					}
				})
			} catch (err) {
				console.log('ERROR [./bin/common/SendEmail]: ' + err);
				if (callback && typeof(callback) == 'function') {
					return callback({
						error: true,
						message: 'the notification was not sent'
					});
				} else {
					reject({
						error: true,
						message: 'the notification was not sent'
					});
				}
			}
		});
	},
	ShotUrl: function (url, key, callback) {
		return new Promise(
			function (resolve, reject) {
			try {
				var options = {
					method: 'POST',
					url: 'https://www.googleapis.com/urlshortener/v1/url?key=' + key,
					body: {
						longUrl: url
					},
					json: true
				};
				request(options, function (error, response, body) {
					if (callback && typeof(callback) == 'function') {
						if (!error && body.id) {
							return callback({
								error: false,
								message: 'the URL was shortened',
								data: {
									id: body.id
								}
							});
						} else {
							return callback({
								error: true,
								message: 'the URL is not shortened',
							});
						}
					} else {
						if (!error && body.id) {
							resolve({
								error: false,
								message: 'the URL was shortened',
								data: {
									id: body.id
								}
							});
						} else {
							reject({
								error: true,
								message: 'the URL is not shortened',
							});
						}
					}
				});
			} catch (err) {
				console.log('ERROR [./bin/common/SendEmail]: ' + err);
				if (callback && typeof(callback) == 'function') {
					return callback({
						error: true,
						message: 'the URL is not shortened',
					})
				} else {
					reject({
						error: true,
						message: 'the URL is not shortened',
					});
				}
			}
		});
	},
	/*
	@authentication{
	'user':'3143277989',
	'pass':'body message'
	}
	@args{
	'phone':'3143277989',
	'message':'body message'
	}
	 */
	SendSMS: function (authentication, args, callback) {
		return new Promise(
			function (resolve, reject) {
			try {
				var options = {
					method: 'POST',
					url: 'https://www.elibom.com/messages',
					headers: {
						Authorization: 'Basic ' + Buffer.from(authentication.user + ':' + authentication.pass).toString('base64'),
						'Content-Type': 'application/json'
					},
					body: {
						to: args.phone,
						text: args.message
					},
					json: true
				};
				request(options, function (error, response, body) {
					if (error) {
						console.log('ERROR [./bin/common/JSONescape]: the notification was not sent');
						if (callback && typeof(callback) == 'function') {
							return callback({
								error: true,
								message: 'the notification was not sent'
							});
						} else {
							reject({
								error: true,
								message: 'the notification was not sent'
							});
						}
					} else {
						if (body.deliveryToken) {
							console.log('Common: the notification was sent ' + body.deliveryToken);
							if (callback && typeof(callback) == 'function') {
								return callback({
									error: false,
									message: 'the notification was sent ' + body.deliveryToken
								});
							} else {
								resolve({
									error: false,
									message: 'the notification was sent'
								});
							}
						} else {
							console.log('ERROR [./bin/common/SendEmail]: the notification was not sent');
							if (callback && typeof(callback) == 'function') {
								return callback({
									error: true,
									message: 'the notification was not sent'
								});
							} else {
								reject({
									error: true,
									message: 'the notification was not sent'
								});
							}
						}

					}
				});
			} catch (err) {
				console.log('ERROR [./bin/common/SendEmail]: ' + err);
				if (callback && typeof(callback) == 'function') {
					return callback({
						error: true,
						message: 'the notification was not sent'
					});
				} else {
					reject({
						error: true,
						message: 'the notification was not sent'
					});
				}
			}
		});
	},
	AuthorizedToken: function (token, callback) {
		try {
			Mongo.Connect(function (db) {
				db.collection('common.user').findOne({
					token: module.exports.Sha256(token),
				}, function (err, result) {
					if (err) {
						console.log('ERROR [./bin/common/AuthorizedToken]: ' + err);
						callback(401, {
							error: true,
							result: 'Server error: ' + err
						});
					} else {
						if (result != null) {
							callback(200, {
								error: false,
								result: 'Valid token'
							}, result);
						} else {
							callback(401, {
								error: true,
								result: 'Invalid token'
							});
						}
					}
					db.close();
				});
			});
		} catch (err) {
			console.log('ERROR [./bin/common/AuthorizedToken]: ' + err);
			callback(401, {
				error: true,
				result: 'Server error: ' + err
			});
		}
	},
	AddPhoneAcount: function (acount, phone, callback) {
		try {
			var profiles;
			Mongo.Connect(function (db) {
				if (acount['profiles']) {
					profiles = acount['profiles'];
				} else {
					profiles = [];
					acount['profiles'] = [];
				}
				if (module.exports.ObjectFindByKey(profiles, 'phone', phone) == null) {
					profiles.push({
						phone: phone,
						webhook: '',
						webhookToken: ''
					});
					acount['profiles'] = profiles.slice();
					db.collection('common.user').update({
						token: module.exports.Sha256(acount.token),
					}, acount, function (err, result) {
						if (err) {
							console.log('Error when adding the phone to the account: ' + err);
						} else {
							console.log('Phone added to the account ' + result.result.n);
						}
					});
				}
				db.close();
				callback(acount);
			});
		} catch (err) {
			console.log('ERROR [./bin/common/AddPhoneAcount]: ' + err);
		}
	},
	/*
	@args{
	'reCaptchaKeySecret':'3143277989',
	'token':'body message'
	}
	 */
	VerifyReCaptcha: function (args, callBack) {
		try {
			var options = {
				method: 'POST',
				url: 'https://www.google.com/recaptcha/api/siteverify',
				qs: {
					secret: args.reCaptchaKeySecret,
					response: args.token
				}
			};
			request(options, function (error, response, body) {
				body = JSON.parse(body);
				if (error) {
					callBack(false);
				} else {
					if (body.success == true) {
						callBack(true);
					} else {
						callBack(false);
					}
				}
			});
		} catch (err) {
			console.log('ERROR [./bin/common/VerifyReCaptcha]: ' + err);
		}
	}
};
