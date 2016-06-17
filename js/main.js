var socket = io('http://localhost:8000');
var camera, controls, scene, renderer, stats;
var light, mesh;
var mixer, morphs = [];
var playerFactory, particle, color, id;
var players = [];
var bullets = [];
var xyzLimit = 500;
var clock = new THREE.Clock();
var textureLoader = new THREE.TextureLoader();
var bulletMap = textureLoader.load("textures/sprite.png");
var loader = new THREE.JSONLoader();

// Socket.io
socket.on('init', function (socketID) {
    id = socketID;
});
socket.on('player', function (player) {
    console.log(player);
    if ('online' in player) {
        playerHandler(player.online[0], player.online[1][0], player.online[1][1]);
    } else if ('offline' in player) {
        scene.remove(players[player.offline]);
        delete players[player.offline];
    }
});
socket.on('bullet', function (bullet) {
    console.log(bullet);
    var position = new THREE.Vector3(bullet[0].x, bullet[0].y, bullet[0].z);
    var speed = new THREE.Vector3(bullet[1].x, bullet[1].y, bullet[1].z);
    AddBullet(position, speed, bullet[2]);
});
socket.on('hit', function (data) {
    console.log(data);
    if (id == data.hit) {
        var answer = confirm("You are dead, play again?");
        if (answer) {
            window.location.reload();
        } else {
            window.location = "about:blank";
        }
    } else {
        if (id == data.by) {
            console.log("You killed: " + data.hit);
        }
        scene.remove(players[data.hit]);
    }
});
socket.on('connect', function () {
    console.log('Connected');
});
socket.on('disconnect', function () {
    console.log('Disconnected');
});
socket.on('reconnect', function () {
    console.log('Reconnected to server');
});
socket.on('reconnecting', function (nextRetry) {
    console.log('Attempting to re-connect to the server, next attempt in ' + nextRetry + 'ms');
});
socket.on('reconnect_failed', function () {
    console.log('Reconnected to server FAILED.');
});

init();
animate();

// Fire
$(this).click(function () {
    var speed = camera.getWorldDirection().multiplyScalar(20); // create speed vactor
    AddBullet(camera.position, speed);
    socket.emit('bullet', [controls.object.position, speed]);
});

function init() {
    // Stats Monitor
    stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);

    // Camera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(Math.random() * 600 - 300, 25, Math.random() * 600 - 300);// Random create initial position [-400, 400]

    // Scene
    scene = new THREE.Scene();
    //scene.fog = new THREE.FogExp2(0x000000, 0.0025);

    // Light
    light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 0.5, 1).normalize();
    scene.add(light);

    // Skybox
    var materials = [
        new THREE.MeshBasicMaterial({map: textureLoader.load('textures/cube/skybox/px.jpg')}), // right
        new THREE.MeshBasicMaterial({map: textureLoader.load('textures/cube/skybox/nx.jpg')}), // left
        new THREE.MeshBasicMaterial({map: textureLoader.load('textures/cube/skybox/py.jpg')}), // top
        new THREE.MeshBasicMaterial({map: textureLoader.load('textures/cube/skybox/ny.jpg')}), // bottom
        new THREE.MeshBasicMaterial({map: textureLoader.load('textures/cube/skybox/pz.jpg')}), // back
        new THREE.MeshBasicMaterial({map: textureLoader.load('textures/cube/skybox/nz.jpg')})  // front
    ];
    mesh = new THREE.Mesh(new THREE.BoxGeometry(10000, 10000, 10000, 7, 7, 7), new THREE.MultiMaterial(materials));
    mesh.position.y = 1000;
    mesh.scale.x = -1;
    scene.add(mesh);

    // Ground
    geometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
    geometry.rotateX(-Math.PI / 2);
    for (var i = 0, l = geometry.vertices.length; i < l; i++) {
        var vertex = geometry.vertices[i];
        vertex.x += Math.random() * 20 - 10;
        vertex.y += Math.random() * 2;
        vertex.z += Math.random() * 20 - 10;
    }
    for (var i = 0, l = geometry.faces.length; i < l; i++) {
        var face = geometry.faces[i];
        face.vertexColors[0] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
        face.vertexColors[1] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
        face.vertexColors[2] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);

    }
    material = new THREE.MeshBasicMaterial({vertexColors: THREE.VertexColors, opacity: 0.5, transparent: true});
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    //var helper = new THREE.GridHelper(500, 10, 0x444444, 0x444444);
    //helper.position.y = 0.1;
    //scene.add(helper);

    // Birds
    mixer = new THREE.AnimationMixer(scene);
    function addMorph(geometry, speed, duration, x, y, z, fudgeColor) {
        var material = new THREE.MeshLambertMaterial({
            color: 0xffaa55,
            morphTargets: true,
            vertexColors: THREE.FaceColors
        });
        if (fudgeColor) {
            material.color.offsetHSL(0, Math.random() * 0.5 - 0.25, Math.random() * 0.5 - 0.25);
        }
        var mesh = new THREE.Mesh(geometry, material);
        mesh.speed = speed;
        var clip = geometry.animations[0];
        mixer.clipAction(clip, mesh).setDuration(duration).// to shift the playback out of phase:
        startAt(-duration * Math.random()).play();
        mesh.position.set(x, y, z);
        mesh.rotation.y = Math.PI / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        morphs.push(mesh);
    }
    loader.load("models/animated/stork.js", function (geometry) {
        addMorph(geometry, 350, 1, 500 - Math.random() * 500, 0 + 350, 340, true);
    });
    loader.load("models/animated/parrot.js", function (geometry) {
        addMorph(geometry, 450, 0.5, 500 - Math.random() * 500, 0 + 300, 700, true);
    });

    // Renderer
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Controls
    controls = new THREE.FirstPersonControls(camera, renderer.domElement);
    controls.movementSpeed = 150;
    controls.lookSpeed = 0.3;
    controls.lookVertical = true;
    window.addEventListener('resize', onWindowResize, false);

    // Other Players
    loader.load('./models/skinned/simple/simple.js', function (geometry, materials) {
        for (var k in materials) {
            materials[k].skinning = true;
        }
        playerFactory = new THREE.SkinnedMesh(geometry, new THREE.MultiMaterial(materials));
        playerFactory.scale.set(2.5, 2.5, 2.5);
        playerFactory.position.set(0, 15, 0);
        playerFactory.skeleton.useVertexTexture = false;
        //scene.add( skinnedMesh ); // Not add to scene
        mixer = new THREE.AnimationMixer(playerFactory);
        mixer.clipAction(playerFactory.geometry.animations[0]).play();
    });
}

function animate() {
    stats.begin();
    requestAnimationFrame(animate);
    socket.emit('player', [controls.object.position]);
    // update position of all the bullets
    for (var i = 0; i < bullets.length; i++) {
        var bullet = bullets[i].particle;
        if (bullet) {
            bullet.position.add(bullets[i].speed);
            if (( bullet.position.x >= xyzLimit || bullet.position.x <= -xyzLimit ) ||
                ( bullet.position.y >= 250 || bullet.position.y <= 0 ) ||
                ( bullet.position.z >= xyzLimit || bullet.position.z <= -xyzLimit )) {
                // Bullet reached limit?
                console.log("remove outbounded bullet");
                scene.remove(bullets[i].particle);
                bullets.splice(i, 1);
            }
            bullet.verticesNeedUpdate = true;
        }
    }
    restrictField(controls, xyzLimit);
    render();
    stats.end();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
}

function render() {
    var delta = clock.getDelta();
    for (var i = 0; i < morphs.length; i++) {
        morph = morphs[i];
        morph.position.x += morph.speed * delta;
        if (morph.position.x > 2000) {
            morph.position.x = -1000 - Math.random() * 500;
        }
    }
    controls.update(delta);
    if (mixer) mixer.update(delta);
    renderer.render(scene, camera);
}

function restrictField(controls, restrict) {
    if (controls.object.position.x > restrict) {
        controls.object.position.x = restrict;
    }
    if (controls.object.position.x < -restrict) {
        controls.object.position.x = -restrict;
    }
    controls.object.position.y = 25; // Height of view = 25
    if (controls.object.position.z > restrict) {
        controls.object.position.z = restrict;
    }
    if (controls.object.position.z < -restrict) {
        controls.object.position.z = -restrict;
    }
}

function playerHandler(id, position) {
    console.log("call");
    if (!players[id]) {
        console.log("add");
        addPlayer(id, position.x, position.y, position.z);
    } else {
        console.log("update");
        updatePlayer(id, position.x, position.y, position.z);
    }
}

function addPlayer(id, x, y, z) {
    var playerMesh = playerFactory.clone();
    playerMesh.position.set(x, y, z);
    scene.add(playerMesh);
    mixer = new THREE.AnimationMixer(playerMesh);
    mixer.clipAction(playerMesh.geometry.animations[0]).play();
    players[id] = playerMesh;

}

function updatePlayer(id, x, y, z) {
    var playerMesh = players[id];
    playerMesh.position.set(x, y, z);
}

function AddBullet(position, speed) {
    particle = new THREE.Sprite(new THREE.SpriteMaterial({map: bulletMap, color: 0xffffff, fog: true}));
    particle.position.x = position.x;
    particle.position.y = position.y;
    particle.position.z = position.z;
    particle.scale.x = particle.scale.y = 1.5;
    bullets.push(new Bullet(particle, speed));
    scene.add(particle);
}

function Bullet(particle, speed) {
    this.particle = particle;
    this.speed = speed;
    return this;
}