
const MongoClient = require('mongodb').MongoClient;
const mongod = require('mongod');
// const exec = require('child_process').exec;
const mongo_url = "mongodb://localhost:27017";
const db_name = 'lambda';
const vm = require('vm');
const stdin = process.openStdin();
var db_client;
var db;
const server = new mongod({ port: 27017, dbpath: 'data' });

startup = () => {
	console.log('Attempting to Start Mongo Server');

	process.on('exit', () => {
		if(!db_client) {
			console.log('Closing Mongo DB...');
			db_client.close();
		}
	});

	server.open((err) => {
		if(err){
			if(String(err).endsWith('SocketException: Address already in use')) {
				console.log('Mongo Server already Running');
			}
			else console.log('Error while Starting Mongo Server:\n'+err);
		}
		else console.log('Mongo Server Started');
	});

	db_client = new MongoClient(mongo_url, { useNewUrlParser: true });
	db_client.connect((err) => {
		if(err) console.log(err);
		else {
			console.log('MongoDB connected to:' + mongo_url + '/' + db_name);
			db = db_client.db(db_name);
		}
	});
	
	console.log('Server Started');

	stdin.addListener("data", function(d) {
		var g = String(d).trim();
		try {
			console.log(eval(g));	
		} catch(err) {
			console.log(err);
		}
		console.log('>\b');
	});

}

startup();






