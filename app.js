var app = require('http').createServer(server);
var io = require('socket.io')(app);
var fs = require('fs');
var url = require('url');
var THREE = require('three');
var xyzLimit = 500;
var players = [];
var bullets = [];

app.listen(8000);
console.log("\nGame Log:\n");

// Set up the Server
function server(req, res) {
    var path = url.parse(req.url).pathname;
    if (path == '/') path = '/index.html'; // Set default path = index.html
    fs.readFile(__dirname + path, function (err, data) {
        if (err) {
            console.log("404 not found: " + path);
            res.writeHead(404);
            res.write('404 not found: ' + path);
        } else {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data, 'utf8');
        }
        res.end();
    });
}

// Socket.io 
io.on('connection', function (socket) {
    // Create Player's ID
    var socketid = socket.id;
    socket.emit('init', socketid); // Emit the ID back to the Player
    console.log('Player ' + socketid + ' connected.\n');

    // Update Player's Status
    socket.on('player', function (data) {
        players[socketid] = data;
        socket.broadcast.emit('player', {online: [socketid, data]});
    });

    // Receive Player's Fire Action
    socket.on('bullet', function (data) {
        console.log('Player ' + socketid + ' fired.\n');
        bullets[bullets.length] = {'position': data[0], 'speed': data[1], 'clientOrigin': socketid};
        socket.broadcast.emit('bullet', data);
    });

    // Receive Player's Offline Action
    socket.on('disconnect', function () {
        console.log('Player ' + socketid + ' disconnected.\n');
        delete players[socketid];
        socket.broadcast.emit('player', {'offline': socketid});
    })
});

setInterval(bulletHandler, 1000 / 60);

// Bullet Logic Handler (hits player / Out of bounds?)
function bulletHandler() {
    for (var i = 0; i < bullets.length; i++) {
        // Update the position of bullets via speed vector
        var x = bullets[i].position.x;
        var y = bullets[i].position.y;
        var z = bullets[i].position.z;
        var dx = bullets[i].speed.x;
        var dy = bullets[i].speed.y;
        var dz = bullets[i].speed.z;
        var bulletVector = new THREE.Vector3(x, y, z);
        bullets[i].position.x = x + dx;
        bullets[i].position.y = y + dy;
        bullets[i].position.z = z + dz;
        for (var player in players) {
            if (player != bullets[i].clientOrigin) {
                var playerVector = new THREE.Vector3(players[player][0].x, players[player][0].y, players[player][0].z);
                var distance = bulletVector.distanceTo(playerVector);
                if (distance <= 10) {
                    console.log(bullets[i].clientOrigin + " killed " + player + "!\n");
                    players[player][0].x = 9999; // remove the dead player out of the battle field
                    return io.sockets.emit('hit', {hit: player, by: bullets[i].clientOrigin});
                    //bullets.splice(i,1);
                }
            }
        }
        // Remove outbounded bullet
        if (( bulletVector.x >= xyzLimit || bulletVector.x <= -xyzLimit ) ||
            ( bulletVector.y >= xyzLimit || bulletVector.y <= 0 ) ||
            ( bulletVector.z >= xyzLimit || bulletVector.z <= -xyzLimit )) {
            bullets.splice(i, 1);
        }
    }
}