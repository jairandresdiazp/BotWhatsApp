var config = require('../config/app');
var MongoClient = require('mongodb').MongoClient;

module.exports = {
	Connect: function(Connection) {
        MongoClient.connect(config.URIMongo, function(err, db) {
            if (err) {
                throw new Error("Error data base: " + JSON.stringify(err));
                Connection(null);
            } else {
                Connection(db);
            }
        });
    }
}