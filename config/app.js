var request = require("request");

module.exports = {
    port: 443,
    URIMongo: "mongodb://usradmin:jBm0eVIY5jMiN0Df@clustermongodbatlas-shard-00-00-yzrwu.mongodb.net:27017,clustermongodbatlas-shard-00-01-yzrwu.mongodb.net:27017,clustermongodbatlas-shard-00-02-yzrwu.mongodb.net:27017/ApiWhatsApp?ssl=true&replicaSet=ClusterMongoDBAtlas-shard-0&authSource=admin",
    masterKey: "6156badde217bf7a7050f51e266587e913f3c0d49e60ac87935a3776127bbb1834106a738ad79d15734b5ab8862526582e4f4c89204b50352d604b34093feeea",
    baseURL: "https://web-whatsapp.azurewebsites.net",
    getConfig: function(callBack) {
        return new Promise(
            function(resolve, reject) {
                try {
                    var options = {
                        method: 'GET',
                        url: module.exports.baseURL + '/app/config',
                        headers: {
                            Authorization: module.exports.masterKey
                        }
                    };
                    request(options, function(error, response, body) {
                        if (error) {
                            reject(null);
                        } else {
                            if (body.error) {
                                reject(null);
                            } else {
                                try{
                                   body = JSON.parse(body); 
                                }catch(err){
                                    
                                };
                                resolve(body.data);
                            }
                        }
                    });
                } catch (err) {
                    console.log('ERROR [./config/app/getConfig]: ' + err);
                    reject(null);
                }
            }
        );
    }
};