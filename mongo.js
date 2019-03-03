
MongoClient = require('mongodb').MongoClient;
mongod = require('mongod');

module.exports = {

	insertOne: (collection, doc, callback) => {
		this.db.collection(collection).insertOne(doc, function(err, result) {
			if(!err) {
				// console.log("Inserted document(s): ", doc);
				if(callback) callback(result);
			}
			else console.log(err);
		});
	},
	find: (collection, doc, callback) => {
		this.db.collection(collection).find(doc).toArray(function(err, docs) {
			if(!err) {
				// console.log("Found "+docs.length+" document(s).");
				if(callback) callback(docs);
			}
			else console.log(err);
		});
	},
	updateOne: (collection, query, modifier, callback) => {
	  	this.db.collection(collection).updateOne(query, modifier, function(err, result) {
			if(!err) {
				// console.log("Matched " + result.matchedCount + ", modified " + result.modifiedCount + " documents.");
				if(callback) callback(result);
			}
			else console.log(err);
	  	});  
	},
	deleteOne: (collection, query, callback) => {
	  	this.db.collection(collection).deleteOne(query, function(err, result) {
			if(!err) {
				// console.log("Removed " + result.result.n + " documents.");
				if(callback) callback(result);
			}
			else console.log(err);
	  	});    
	},

	exit: () => {
		if(!this.db_client) {
			console.log('Closing Mongo DB...');
			this.db_client.close();
		}
	},

	start: () => {
		this.server = new mongod({ port: 27017, dbpath: 'data' });
		this.db_client = undefined;
		this.db = undefined;
		this.db_name = 'lambda';
		this.mongo_url = "mongodb://localhost:27017";
		this.server.open((err) => {
			if(err){
				if(String(err).endsWith('SocketException: Address already in use')) {
					console.log('Mongo Server already Running');
				}
				else console.log('Error while Starting Mongo Server:\n'+err);
			}
			else console.log('Mongo Server Started');

			this.db_client = new MongoClient(this.mongo_url, { useNewUrlParser: true });
			this.db_client.connect((err) => {
				if(err) console.log(err);
				else {
					console.log('MongoDB connected to:' + this.mongo_url + '/' + this.db_name);
					this.db = this.db_client.db(this.db_name);
				}
			});
		});
	}
}