const app = require('http').createServer(handler);
const io = require('socket.io')(app);
const vm = require('vm');
const stdin = process.openStdin();
var fs = require('fs');
var mongo = require('./mongo.js');

var listOfObjects = [];

var userNames=[];
var userHashes=[];
var userPositionsX = [];
var userPositionsY = [];
var userWindowHeight = [];
var userWindowWidth = []; //Get rid of this

// var ClientSchema = {
// 	socket: socket,
// 	userName: 'ewd',
// 	position: { x: x, y: y },
// 	hash: 'q3r234r23'
// }

var mapSquareSize = 100000 ;
function handler (req, res) {
	var headers = {
	    'Access-Control-Allow-Origin': '*',
	    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
	    'Access-Control-Max-Age': 2592000, // 30 days
	    // 'Content-Type': 'application/x-www-form-urlencoded'
	};

	let data = undefined;
	req.on('data', chunk => {
		try {
			data = JSON.parse(chunk);
		} catch (err) {
			data = chunk.toString();
		}
	});

	req.on('end', () => {
		res.writeHead(200, headers);
		if(req.url === '/'){
			fs.readFile('public/index.html', function (err, data) {
			    if (err) {
			      res.writeHead(500);
			      return res.end('Error loading index.html');
			    }

			    res.end(data);
			});
		}
		else if(req.url === '/register'){
			var username = data.username, pwd = data.pwd;
			res.writeHead(200, {"Content-Type": "application/json"});
			
			mongo.find('users', { username: username }, (docs) => {
				if(docs.length > 0){
					res.end('Username Already Exists');
				}
				else {
					mongo.insertOne('users', data);
					res.end('Registered');
				}			
			});
		}
		else if(req.url === '/login'){
			// var username = data.username, pwd = data.pwd;
			res.writeHead(200, {"Content-Type": "application/json"});

			mongo.find('users', data, (docs) => {
				if(docs.length < 1){
					res.end(JSON.stringify({
						status: false,
						desc: 'Username or Password Incorrect.',
					}));
				} else {
					//Generate User session hash and return for user login auth to work
					var hash = Math.random().toString(36).substring(2) + (new Date()).getTime();
					console.log('User', data.username, 'logged in with hash:', hash);
					res.end(JSON.stringify({
						status: true,
						desc: 'Logged in Successfully.',
						token: hash
					}));
				}
			});
		}
	});


}

startup = () => {
	console.log('Attempting to Start Mongo Server');

	process.on('exit', mongo.exit);

	mongo.start();

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

	// io.origins('*:*');
	io.on('connection', function (socket) {
		console.log('Connected');
		socket.on('UpdateCoords', function(player) {

			var ID = player.ID ;

			userPositionsX[ID] = player.x;
			userPositionsY[ID] = player.y;

			console.log("Changed Position of User #" + (ID+1) + " to (" + userPositionsX[ID] + "," + userPositionsY[ID] + ").");


		});
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

    		var curId = userNames.push(data.id) - 1;
    		console.log(curId);
    		userHashes.push(hash);
    		userWindowWidth.push(data.windowWidth);
    		userWindowHeight.push(data.windowHeight);
    		userPositionsX.push(Math.floor(Math.random() * (mapSquareSize - userWindowWidth[curId])) + 0);
    		userPositionsY.push(Math.floor(Math.random() * (mapSquareSize - userWindowHeight[curId])) + 0);
    		console.log("### CURRENT USER DETAILS : USER #" + (curId+1) + " ###");
    		console.log("Username = " + userNames[curId]);
    		console.log("Hash = " + userHashes[curId]);	
    		console.log("UserWindowWidth = " + userWindowWidth[curId]);	
    		console.log("UserWindowHeight = " + userWindowHeight[curId]);	
    		console.log("UserPositionX = " + userPositionsX[curId]);
    		console.log("UserPositionY = " + userPositionsY[curId]);

    		// Let's create tree objects
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
    		// Initialize all objects on Map like this and pass it to MapGen

    		socket.emit('MapGen', {ObjectList : listOfObjects,  UserPositionX : userPositionsX[curId], UserPositionY : userPositionsY[curId], curId : curId});

		});
	});

	console.log('Server Started');

}

try{
	startup();	
} catch(err) { console.log(err); }