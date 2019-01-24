
const mongodb = require('mongodb');
const mongod = require('mongod');
// const exec = require('child_process').exec;
const mongo_url = "mongodb://localhost:27017";
const vm = require('vm');
const stdin = process.openStdin();
var db = undefined;
// console.log('Yolo');
const server = new mongod({ port: 27017, dbpath: 'data' });
// console.log('uded');

startup = () => {
	console.log('Attempting to Start Mongo Server');

	process.on('exit', () => {
		if(!db) {
			console.log('Closing Mongo DB...');
			db.close();
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

	mongodb.connect(mongo_url, { useNewUrlParser: true }, function(err) {
		if (err) console.log(err);
		console.log("Database connected@" + mongo_url);
		db = mongodb.MongoClient.db('lambda');
		console.log("Database contains " + db.find({}).toArray().length)
	});
	console.log('Server Started');
}

startup();

stdin.addListener("data", function(d) {
	var g = String(d).trim();
	try {
		console.log(eval(g));	
	} catch(err) {
		console.log(err);
	}
});





