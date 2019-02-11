const app = require('http').createServer(handler);
const io = require('socket.io')(app);
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
var fs = require('fs');

var listOfObjects = [];

// var userNames=[];
// var userHashes=[];
// var userPositionsX = [];
// var userPositionsY = [];
// var userWindowHeight = [];
// var userWindowWidth = [];
var userArray = [];

var playerSquareDimension = 10 ;


function User(userName, userHash, x, y)
{
	return {
        userName : userName,
    	userHash : userHash,
    	x : x,
    	y : y,
    	l : playerSquareDimension,
    	b : playerSquareDimension,
        color : "#441111"
    }
}

var mapSquareSize = 100000 ;
for (var i = 1 ; i <= 100000 ; i++)
{
    var tree = new Object();
    tree.x = Math.floor(Math.random() * (mapSquareSize)) + 0 ;
    tree.y = Math.floor(Math.random() * (mapSquareSize)) + 0 ;
    tree.l = 10 ;
    tree.b = 20 ;
    tree.color = "#111199";
    listOfObjects.push(tree);
}
for (var i = 1 ; i <= 100000 ; i++)
{
    var rock = new Object();
    rock.x = Math.floor(Math.random() * (mapSquareSize)) + 0 ;
    rock.y = Math.floor(Math.random() * (mapSquareSize)) + 0 ;
    rock.l = 10 ;
    rock.b = 10 ;
    rock.color = "#000000";
    listOfObjects.push(rock);
}
function handler (req, res) {
	var headers = {
	    'Access-Control-Allow-Origin': '*',
	    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
	    'Access-Control-Max-Age': 2592000, // 30 days
	    // 'Content-Type': 'contentType'
	};

	res.writeHead(200, headers);
	if(req.url === '/')
		fs.readFile('public/index.html', function (err, data) {
		    if (err) {
		      res.writeHead(500);
		      return res.end('Error loading index.html');
		    }

		    res.end(data);
		});

}

mongoInsertOne = (collection, doc, callback) => {
	db.collection(collection).insertOne(doc, function(err, result) {
		if(!err) {
			console.log("Inserted document(s): ", doc);
			if(callback) callback(result);
		}
		else console.log(err);
	});
}
mongoFind = (collection, doc, callback) => {
	db.collection(collection).find(doc).toArray(function(err, docs) {
		if(!err) {
			console.log("Found "+docs.length+" document(s).");
			if(callback) callback(docs);
		}
		else console.log(err);
	});
}
mongoUpdateOne = (collection, query, modifier, callback) => {
  	db.collection(collection).updateOne(query, modifier, function(err, result) {
		if(!err) {
			console.log("Matched " + result.matchedCount + ", modified " + result.modifiedCount + " documents.");
			if(callback) callback(result);
		}
		else console.log(err);
  	});  
}
mongoDeleteOne = (collection, query, callback) => {
  	db.collection(collection).deleteOne(query, function(err, result) {
		if(!err) {
			console.log("Removed " + result.result.n + " documents.");
			if(callback) callback(result);
		}
		else console.log(err);
  	});    
}


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

		db_client = new MongoClient(mongo_url, { useNewUrlParser: true });
		db_client.connect((err) => {
			if(err) console.log(err);
			else {
				console.log('MongoDB connected to:' + mongo_url + '/' + db_name);
				db = db_client.db(db_name);
			}
		});
	});

	stdin.addListener("data", function(d) {
		var g = String(d).trim();
		if(g === 'exit') process.exit();
		try {
			console.log(eval(g));	
		} catch(err) {
			console.log(err);
		}
	});

	app.listen(8080);

	io.origins('*:*');
	io.on('connection', function (socket) {
		console.log('Connected');
		socket.on('UpdateCoords', function(player) {
            console.log(player);
			var ID = player.ID - 1;
			userArray[ID].x = player.x;
			userArray[ID].y = player.y;

            console.log(listOfObjects[0]);
			console.log("Changed Position of User #" + (ID+1) + " to (" + userArray[ID].x + "," + userArray[ID].y + ").");
            //emitMap(player, player.ID);
            socket.emit('MapGen', {ObjectList : listOfObjects,  UserPositionX : player.x, UserPositionY : player.y, curId : ID});

		});
        /*emitMap = (user, curId) =>{
            // Filter only in scope objects from listOfObjects here
            //curId starts from zero
            socket.emit('MapGen', {ObjectList : listOfObjects,  UserPositionX : user.x, UserPositionY : user.y, curId : curId});

        }*/
		socket.on('Username', function (data) {
			var doesHashExist = 1 ;
			while (doesHashExist == 1)
			{
				var hash = '';	
				var chars = '0123456789abcdefghijklmnopqrstuvwxyz';
	    		for (var i = 4; i > 0; --i) hash += chars[Math.floor(Math.random() * chars.length)];
	    		doesHashExist = 0 ; // replace this later	
	    		// set doesHashExist = 0 if mongodb doesn't have this hash
	    	}  		
    		var doesAccountExist = 0 ;
    		// Add user to MongoDB if user has not already registered. 
    		// Set doesAccountExist = 1 if user has registered. 
    		if (doesAccountExist == 1)
    		{
    			socket.emit('AccountExists', doesAccountExist);
    			return ;
    		}
    		console.log("New user " + data.id + " registered. Assigned Hash key " + hash);
    		// Make mongoDB account. 
    		console.log("Logging in");

    		//var user = new User(data.id, hash, Math.floor(Math.random() * (mapSquareSize- playerSquareDimension )) + 0, Math.floor(Math.random() * (mapSquareSize - playerSquareDimension)) + 0);
    		var user = User(data.id, hash, 99500,99500);
    		var curId = userArray.push(user);

    		console.log("### CURRENT USER DETAILS : USER #" + (curId+1) + " ###");
    		console.log("Username = " + user.userName);
    		console.log("Hash = " + user.userHash);	
    		console.log("UserPositionX = " + user.x);
    		console.log("UserPositionY = " + user.y);
    		listOfObjects.push(user);
    		//emitMap(user, curId);
            socket.emit('UserId', {x:user.x, y:user.y, ID:curId});
		});
	});

	console.log('Server Started');

}

try{
	startup();	
} catch(err) { console.log(err); }