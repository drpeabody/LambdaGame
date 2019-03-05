const app = require('http').createServer(handler);
const io = require('socket.io')(app);
const vm = require('vm');
const stdin = process.openStdin();
const fs = require('fs');
const RTree = require("rtree")

const mongo = require('./mongo.js');
const Map = require("./MapGenTest");
const Weapons = require("./Weapons");

global.userArray = [];
var clientSockets = [];

var playerRectWidth = Map.getPlayerWidth();
var playerRectHeight = Map.getPlayerHieght();
// var MapSize = Map.mapSquareSize ; // cannot be done rn since map is localized
var MapSize = Map.getMapSize();

function User(userName, userHash, x, y)
{
	return {
        userName : userName,
    	userHash : userHash,
    	x : x,
    	y : y,
    	h : playerRectHeight,
    	w : playerRectWidth,
        color : "#441111",
        currentObjects : [],
        weapons : [],
        currentWeapon : null,
        health : 100,
        ticksSinceLastAttack: 0,
        isAttacked : false,
        attackPartner : null,
        np : null,
        attackTime : null
    }
}


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

			res.writeHead(200, {"Content-Type": "application/json"});
            
			mongo.find('users', data, (docs) => {
				if(docs.length < 1){
					res.end(JSON.stringify({
						status: false,
						desc: 'Username or Password Incorrect.',
					}));
				} else {
                    if(isLoggedIn(data.username)){
                        res.end(JSON.stringify({
                            status: false,
                            desc: 'UserName is already Logged in.',
                        }));
                        return;
                    }

					//Generate User session hash and return for user login auth to work
					var hash = genHash();
					console.log('User', data.username, ' initted with hash:', hash);
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

isValidHash = (hash) => {
    return /^([a-z0-9]{19}155[0-9]{10})/.test(hash);
}

genHash = () => {
    // Regex for the hash: /^([a-z0-9]{19}155[0-9]{10})/
    // Length of random Part: 19
    // Length of fixed Part: 13 [0-9]
    // Total size: 256 bit
    var x = Math.random().toString(36).substring(2);
    var y = (new Date()).getTime();
    x = x.repeat(Math.ceil(19 / x.length)).substring(0, 19);
    return x.concat(y);
}

authenticate = (socket, hash) => {
    return (clientSockets[socket.id] === hash);
}

isLoggedIn = (username) => {
    return !(!(userArray.find((s) => s.userName === username)));
}

insertUser = (username, hash, socket) => {
    var user = User(username, hash, 1000,1000);
    var curId = userArray.push(user);
    userArray[curId-1].np = curId-1 ;
    console.log("USER", user.userName, "("+curId+") @", "("+user.x+", "+user.y+")", hash);
    rtree.insert({ 
        x: user.x,
        y: user.y,
        w: playerRectWidth,
        h: playerRectHeight
    },11);

    socket.emit('UserId', {x:user.x, y:user.y, ID:curId});
}

coll = (rectangle, pos, speed, pred) => {
    if (pred(pos + speed)){

        var willCollide = false;
        var arr = rtree.search(rectangle);
        
        if(arr.length > 1) willCollide = true;// Collides with an object other than itself
        else pos += speed;

        return {
            pos: pos,
            status: willCollide,
            arr: arr,
            rect: rectangle
        }
    } else return {
        pos: pos,
        status: false
    }
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

    io.use((socket, next) => {
        var hash = socket.request._query['hash'];
        var username = socket.request._query['name'];
        console.log("Connecting ", username, hash, socket.id);

        if(!isValidHash(hash)){
            console.log("Hash found invalid, closing connection to", username);
            // socket.close();
            return;
        }

        insertUser(username, hash, socket);

        clientSockets[socket.id] = hash;
        next();
    }); 

	io.on('connection', function (socket) {

        socket.on('disconnect', function () {
            if(!clientSockets[socket.id]) {
                console.log('Something has gone wrong, A socket just disconnected that wasnt in' + 
                    ' the Hash Auth Array. This means we dont have the hash the socket was using, ' +
                    'worst case, we cant remove this user from the userArray, and he cant ' + 
                    'login ever again, as the server will report he is already logged in.');
            }
            else {
                var idx = userArray.findIndex((s) => s.userHash === clientSockets[socket.id]);
                var user = userArray[idx];
                rtree.remove({x: user.x, y: user.y, w: playerRectWidth, h: playerRectHeight});
                userArray[idx] = {};
                console.log('Disconnected', clientSockets[socket.id], user.userName);
                delete clientSockets[socket.id];
            }
        });


		socket.on('tick', function(player) {
            if(!authenticate(socket, player.hash)){
                return;
            }
            
			var ID = player.ID;
            var speed = 5, attackTimeout = 20;

            var x = userArray[ID-1].x, oldX = x;
            var y = userArray[ID-1].y, oldY = y;

            var currentObjects = userArray[ID-1].currentObjects;
            userArray[ID-1].ticksSinceLastAttack++;

            if (player.mouseDown && Map.findNearestPlayer(ID-1) != -1) {
                if(userArray[ID-1].ticksSinceLastAttack > attackTimeout){
                    userArray[ID-1].attackTime = Date.now();
                    userArray[ID-1].ticksSinceLastAttack = 0;
                    userArray[ID-1].np = Map.findNearestPlayer(ID-1), factor = 1;
                    userArray[ID-1].isAttacked = true ;
                    userArray[ID-1].attackPartner = userArray[ID-1].np ;
                    userArray[userArray[ID-1].np].attackPartner = ID-1 ;
                    userArray[userArray[ID-1].np].isAttacked = true ;
                    if (userArray[ID-1].currentWeapon != null) {
                        factor = userArray[ID-1].currentWeapon.damage ;
                    }
                    if (userArray[ID-1].np >= 0 && userArray[userArray[ID-1].np].health > 0) {
                        userArray[userArray[ID-1].np].health -= factor;
                        console.log('Add an attack indicator here');

                        if (userArray[userArray[ID-1].np].health <= 0) {
                            rtree.remove({x: userArray[userArray[ID-1].np].x, y: userArray[userArray[ID-1].np].y, w: playerRectWidth, h: playerRectHeight});
                            userArray[userArray[ID-1].np] = User(userArray[userArray[ID-1].np].userName, userArray[userArray[ID-1].np].userHash, 1000,1000);
                            userArray[userArray[ID-1].np].np = userArray[ID-1].np ;
                            userArray[userArray[ID-1].np].attackPartner = null ;
                            userArray[userArray[ID-1].np].isAttacked = false ;
                            rtree.insert({
                                x: userArray[userArray[ID-1].np].x,
                                y: userArray[userArray[ID-1].np].y,
                                w: playerRectWidth,
                                h: playerRectHeight
                            },11);          
                        }
                    }
                }
            }

            if (userArray[ID-1].health <= 0) {
                // Remove from rtree
                socket.emit('UserId', {x:userArray[ID-1].x, y:userArray[ID-1].y, ID:(ID-1)})                
            }
            if (userArray[ID-1].attackTime)
            {
                if (Date.now() - userArray[ID-1].attackTime >= 5000)
                {
                    userArray[ID-1].np = ID-1;
                    userArray[ID-1].isAttacked = false ;
                    userArray[ID-1].attackPartner = null ;
                    userArray[userArray[ID-1].np].attackPartner = null ;
                    userArray[userArray[ID-1].np].isAttacked = false ;
                }
            }
            var res = null;
            if(player.bWDown) {
                res = coll({x:player.x,y:player.y-speed,w:playerRectWidth,h:playerRectHeight}, y, -speed, (s) => s >= 0);
                if (res) if (res.pos!=null && !res.status) y = res.pos;
            }
            if(player.bADown) {
                res = coll({x:player.x-speed,y:player.y,w:playerRectWidth,h:playerRectHeight}, x, -speed, (s) => s >= 0);
                if (res) if (res.pos!=null && !res.status) x = res.pos;
            }
            if(player.bSDown) {
                res = coll({x:player.x,y:player.y+speed,w:playerRectWidth,h:playerRectHeight}, y, speed, (s) => s <= MapSize - playerRectHeight);
                if (res) if (res.pos!=null && !res.status) y = res.pos;
            }
            if(player.bDDown) {
                res = coll({x:player.x+speed,y:player.y,w:playerRectWidth,h:playerRectHeight}, x, speed, (s) => s <= MapSize - playerRectWidth);
                if (res) if (res.pos!=null && !res.status) x = res.pos;
            }

            if(res && res.status) {
                if(Weapons.isWeapon(res.arr[1])){
                    Weapons.weaponRemove(res.rect);
                    Weapons.updateWeapon(res.arr[1],ID-1);
                }
            }

            rtree.remove({x: oldX, y: oldY, w: playerRectWidth, h: playerRectHeight});
            rtree.insert({x: x, y: y, w: playerRectWidth, h: playerRectHeight}, 11);
            userArray[ID-1].x = x;
            userArray[ID-1].y = y;

            //The list of objects within user's view
           	var emitObjects = rtree.search({x:player.cameraX,y:player.cameraY,w:player.canvasWidth,h:player.canvasHeight},true);
            
            userArray[ID-1].currentObjects = emitObjects.slice();

            socket.emit('MapGen', {ObjectList : emitObjects,  UserPositionX : x, UserPositionY : y, curId : ID, weapons : userArray[ID-1].weapons, health : userArray[ID-1].health, isAttacked : userArray[ID-1].isAttacked, attackPartner : userArray[ID-1].attackPartner, partnerHealth : userArray[userArray[ID-1].np].health, partnerX : userArray[userArray[ID-1].np].x, partnerY : userArray[userArray[ID-1].np].y});
		});

	});

    console.log('Server Started\n\n');
	console.log('Resolve update() -> "UpdateCoords" -> "MapGen" -> draw()');
    console.log('3 RTrees 1) static colliders, 2) items 3) Biomes')
    console.log('Merge Client Sockets and User Array into single array');
    console.log('Implement a Server and Client timeout after you press mouse button');
    console.log('Implement Damage Indicator client Side');
    console.log('Eliminate findNearestPlayer() and use a range instead');
    console.log('Why is there slicing on line 315?');
    console.log('Items class and make it collide with the RTree\n\n');

}

try{
	startup();	
} catch(err) { console.log(err); }
