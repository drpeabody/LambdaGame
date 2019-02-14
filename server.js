const app = require('http').createServer(handler);
const io = require('socket.io')(app);
const vm = require('vm');
const stdin = process.openStdin();
var fs = require('fs');
var mongo = require('./mongo.js');

var listOfObjects = [];
var userArray = [];

var playerSquareDimension = 10 ;


var mapSquareSize = 100000 ;
var playerSquareDimension = 10 ;
var playerSquareDimensions = 10 ;
var MapSize = 100000 ;
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
            // console.log(player);
			var ID = player.ID;
            var speed = 5;
			//userArray[ID-1].x = player.x;
			//userArray[ID-1].y = player.y;
            x = userArray[ID-1].x;
            y = userArray[ID-1].y;
            if (player.bWDown && (y - speed>= 0)){
                y -= speed; player.cameraY -= speed ;
            }
            if (player.bADown && (x - speed>= 0)){
                x -= speed; player.cameraX -= speed ;
            }
            if (player.bSDown && (y + playerSquareDimensions + speed <= MapSize)){
                y += speed; player.cameraY += speed ;
            }
            if (player.bDDown && (x + playerSquareDimensions + speed) <= MapSize){ 
                x += speed; player.cameraX += speed ;
            }
            userArray[ID-1].x = x;
            userArray[ID-1].y = y;
            // console.log(userArray[ID-1], listOfObjects[200000]);
			// console.log("Changed Position of User #" + (ID) + " to (" + userArray[ID-1].x + "," + userArray[ID-1].y + ").");
            //emitMap(player, player.ID);
            var emitObjects=[];//The list of objects within user's view
            for(var i = 0; i < listOfObjects.length; i++){
                obj = listOfObjects[i];
                if(obj.x + obj.l >= player.cameraX &&  obj.x <= player.cameraX + player.canvasWidth &&
                    obj.y + obj.b >= player.cameraY &&  obj.y <= player.cameraY + player.canvasHeight)
                    emitObjects.push(obj);
            }
            socket.emit('MapGen', {ObjectList : emitObjects,  UserPositionX : x, UserPositionY : y, curId : ID});
            // console.log('Emitted.', emitObjects.length);
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

    		// var user = new User(data.id, hash, Math.floor(Math.random() * (mapSquareSize- playerSquareDimension )) + 0, Math.floor(Math.random() * (mapSquareSize - playerSquareDimension)) + 0);
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