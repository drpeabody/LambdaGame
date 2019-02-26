const app = require('http').createServer(handler);
const io = require('socket.io')(app);
const vm = require('vm');
const stdin = process.openStdin();
var fs = require('fs');
var mongo = require('./mongo.js');
const RTree = require("rtree")
const Map = require("./MapGenTest")
var userArray = [];
var clientSockets = [];

var mapSquareSize = 2000000 ;
var playerSquareDimension = 30 ;
var playerSquareDimensions = playerSquareDimension ;
var MapSize = mapSquareSize ;
function User(userName, userHash, x, y)
{
	return {
        userName : userName,
    	userHash : userHash,
    	x : x,
    	y : y,
    	l : playerSquareDimension,
    	b : playerSquareDimension,
        color : "#441111",
        currentObjects : [],
        weapons : [],
        userState : 11,   
        baseState : 11,
        whichFoot : true // true for right, false for left
    }
}


/*
	RTREE Type Chart :
    -1 : Grass
	 1 : Rock
	 2 : Tree
     3 : Short Range Weapon
     11 : Player
*/


global.rtree = RTree(100);

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

insertUser = (username, hash, socket) => {
    var user = User(username, hash, 1000,1000);
    var curId = userArray.push(user);

    console.log("### CURRENT USER DETAILS : USER #" + (curId+1) + " ###");
    console.log("Username = " + user.userName);
    console.log("Hash = " + user.userHash); 
    console.log("UserPositionX = " + user.x);
    console.log("UserPositionY = " + user.y);
    rtree.insert({
        x: user.x,
        y: user.y,
        w: playerSquareDimension,
        h: playerSquareDimension
    },11);

    socket.emit('UserId', {x:user.x, y:user.y, ID:curId});
}

startup = () => {
	console.log('Attempting to Start Mongo Server');

	process.on('exit', mongo.exit);

	mongo.start();

    Map.MapGen();

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

    io.use((socket, next) => {
        var hash = socket.request._query['hash'];
        var username = socket.request._query['name'];
        console.log("middleware:", hash, username);

        insertUser(username, hash, socket);

        clientSockets[hash] = socket;
        next();
    });

	io.on('connection', function (socket) {
		console.log('Connected');
		socket.on('UpdateCoords', function(player) {
            player = player;
			emitObjects = [];
            // console.log(player);
			var ID = player.ID;
            var speed = 5;
			//userArray[ID-1].x = player.x;
			//userArray[ID-1].y = player.y;
            x = userArray[ID-1].x;
            y = userArray[ID-1].y;
            var oldX = x ;
            var oldY = y ;

            // if (userArray[ID-1].userState == 15 || userArray[ID-1].userState == 16)
            //     userArray[ID-1].baseState = 11 ;
            // else if (userArray[ID-1].userState == 17 || userArray[ID-1].userState == 18)
            //     userArray[ID-1].baseState = 12 ;
            // else if (userArray[ID-1].userState == 19 || userArray[ID-1].userState == 20)
            //     userArray[ID-1].baseState = 13 ;
            // else if (userArray[ID-1].userState == 21 || userArray[ID-1].userState == 22)
            //     userArray[ID-1].baseState = 14 ;

            // if (!player.bWDown || !player.bADown || !player.bSDown || !player.bDDown)
            //     userArray[ID-1].userState = userArray[ID-1].baseState ;
            
            // Check for collisions
            // console.log(userArray[ID-1].userState0);
            var currentObjects = userArray[ID-1].currentObjects ;
            // var waitDurationMS = 0 ;

            if (player.bWDown && (y - speed>= 0)){
                var willCollide = false ;
                
                for (var ctr = 0 ; ctr < currentObjects.length ; ctr++)
                {
                    if ((y-speed > currentObjects[ctr].y)&&(y - speed < currentObjects[ctr].y + currentObjects[ctr].h) && (x + playerSquareDimensions > currentObjects[ctr].x) && (x < currentObjects[ctr].x + currentObjects[ctr].w))
					{
                    	willCollide = true;
                        //If it is a short range weapon
                        if(currentObjects[ctr].leaf == 3){
                            weaponRemove(currentObjects[ctr]);
                            updateWeapon(3);
                        }
                        if (currentObjects[ctr].leaf == 6 || currentObjects[ctr].leaf == 7)
                        {
                            willCollide = false ;
                        }
                    }
				}        
				if (!willCollide)
				{
                	y -= speed; player.cameraY -= speed ;
                    // if (userArray[ID-1].userState == 15)
                    // {
                    //     userArray[ID-1].userState = 16
                    //     console.log("CHECK ITS WORKING");
                    //     wait(waitDurationMS);
                    // }
                    // else if (userArray[ID-1].userState == 16)
                    // {
                    //     userArray[ID-1].userState = 15 ; 
                    //     wait(waitDurationMS);
                    // }
                    // else
                    // {
                    //     userArray[ID-1].userState = 15 ;
                    //     wait(waitDurationMS);
                    // }
				}
            }
            if (player.bADown && (x - speed>= 0)){
            	var willCollide = false ;
            	
                for (var ctr = 0 ; ctr < currentObjects.length ; ctr++)
                {	
                    if ((x - speed > currentObjects[ctr].x) && (x - speed < currentObjects[ctr].x + currentObjects[ctr].w) && (y + playerSquareDimensions > currentObjects[ctr].y) && (y < currentObjects[ctr].y + currentObjects[ctr].h))
					{
                        willCollide = true;
                        //If it is a short range weapon
                        if(currentObjects[ctr].leaf == 3){
                            weaponRemove(currentObjects[ctr]);
                            updateWeapon(3);
                        }
                        if (currentObjects[ctr].leaf == 6 || currentObjects[ctr].leaf == 7)
                        {
                            willCollide = false ;
                        }
                     }
				}        
				if (!willCollide)
                {
                	x -= speed; player.cameraX -= speed ;
                    // if (userArray[ID-1].userState == 17)
                    // {
                    //     userArray[ID-1].userState = 18 ;
                    //     wait(waitDurationMS);
                    // }
                    // else if (userArray[ID-1].userState == 18)
                    // {
                    //     userArray[ID-1].userState = 17 ; 
                    //     wait(waitDurationMS);
                    // }
                    // else
                    // {
                    //     userArray[ID-1].userState = 17 ;
                    //     wait(waitDurationMS);
                    // }
                }	
            }
            if (player.bSDown && (y + playerSquareDimensions + speed <= MapSize))
            {
            	var willCollide = false ;
                for (var ctr = 0 ; ctr < userArray[ID-1].currentObjects.length ; ctr++)
                {
                    if ((y + speed + playerSquareDimensions > currentObjects[ctr].y) && (y + speed + playerSquareDimensions < currentObjects[ctr].y + currentObjects[ctr].h) && (x + playerSquareDimensions > currentObjects[ctr].x) && (x < currentObjects[ctr].x + currentObjects[ctr].w))
					{
                        willCollide = true;
                        //If it is a short range weapon
                        if(currentObjects[ctr].leaf == 3){
                            weaponRemove(currentObjects[ctr]);
                            updateWeapon(3);
                        }
                        if (currentObjects[ctr].leaf == 6 || currentObjects[ctr].leaf == 7)
                        {
                            willCollide = false ;
                        }
                     }
				}        
				if (!willCollide)
                {
                	y += speed; 
                	player.cameraY += speed ;
                    // if (userArray[ID-1].userState == 21)
                    // {
                    //     userArray[ID-1].userState = 22 ;
                    //     wait(waitDurationMS);
                    // }
                    // else if (userArray[ID-1].userState == 22)
                    // {
                    //     userArray[ID-1].userState = 21 ; 
                    //     wait(waitDurationMS);
                    // }
                    // else
                    // {
                    //     userArray[ID-1].userState = 21 ;
                    //     wait(waitDurationMS);
                    // }
                }
            }
            if (player.bDDown && (x + playerSquareDimensions + speed) <= MapSize){ 
            	var willCollide = false ;
                for (var ctr = 0 ; ctr < userArray[ID-1].currentObjects.length ; ctr++)
                {
                    if ((x + speed + playerSquareDimensions > currentObjects[ctr].x) && (x + speed + playerSquareDimensions < currentObjects[ctr].x + currentObjects[ctr].w) && (y + playerSquareDimensions > currentObjects[ctr].y) && (y < currentObjects[ctr].y + currentObjects[ctr].h))
					{
                        willCollide = true;
                        //If it is a short range weapon
                        if(currentObjects[ctr].leaf == 3){
                            weaponRemove(currentObjects[ctr]);
                            updateWeapon(3);
                        }
                        if (currentObjects[ctr].leaf == 6 || currentObjects[ctr].leaf == 7)
                        {
                            willCollide = false ;
                        }
                     }
				}        
				if (!willCollide)
                {
                	x += speed; 
                	player.cameraX += speed ;
                    // if (userArray[ID-1].userState == 19)
                    // {
                    //     userArray[ID-1].userState = 20 ;
                    //     wait(waitDurationMS);
                    // }
                    // else if (userArray[ID-1].userState == 20)
                    // {
                    //     userArray[ID-1].userState = 19 ; 
                    //     wait(waitDurationMS);
                    // }
                    // else
                    // {
                    //     userArray[ID-1].userState = 19 ;
                    //     wait(waitDurationMS);
                    // }
                }
            }
            weaponRemove = (obj) =>{
                rtree.remove({x: obj.x, y: obj.y, w: obj.w, h: obj.h});
            }
            updateWeapon = (weaponID) =>{
                switch(weaponID){
                case 3:
                    userArray[ID-1].weapons["SRW"] = true;

                break;
                }
            }
            rtree.remove({x: oldX, y: oldY, w: playerSquareDimensions, h: playerSquareDimensions});
            rtree.insert({x: x, y: y, w: playerSquareDimensions, h: playerSquareDimensions}, 11);
            userArray[ID-1].x = x;
            userArray[ID-1].y = y;

            var emitObjects=[];//The list of objects within user's view

           	emitObjects = emitObjects.concat(rtree.search({x:player.cameraX,y:player.cameraY,w:player.canvasWidth,h:player.canvasHeight},true));
            //console.log(rtree.search({x:player.cameraX,y:player.cameraY,w:player.canvasWidth,h:player.canvasHeight},true));
            userArray[ID-1].currentObjects = emitObjects.slice();
            socket.emit('MapGen', {ObjectList : emitObjects,  UserPositionX : x, UserPositionY : y, curId : ID, weapons : userArray[ID-1].weapons});
            // console.log('Emitted.', emitObjects.length);
		});

	});

    console.log('Server Started\n\n');
    console.log('Implement User Logout on Disconnect');
    console.log('Removing and reinserting on RTrees?');
    console.log('Somebody move the collision to rely on the rTree.');
	console.log('Resolve update() -> "UpdateCoords" -> "MapGen" -> draw()');
    console.log("Handle Invalid Hash and Usernames by implementing auth function.\n\n");

}

try{
	startup();	
} catch(err) { console.log(err); }
