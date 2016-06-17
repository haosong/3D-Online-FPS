<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Document of Ad Web Homework 2

**Table of Contents**

- [Document of Ad Web Homework 2](#document-of-ad-web-homework-2)
  - [概述](#%E6%A6%82%E8%BF%B0)
  - [1. 项目下载和部署](#1-%E9%A1%B9%E7%9B%AE%E4%B8%8B%E8%BD%BD%E5%92%8C%E9%83%A8%E7%BD%B2)
    - [1.1 项目下载](#11-%E9%A1%B9%E7%9B%AE%E4%B8%8B%E8%BD%BD)
    - [1.2 项目部署](#12-%E9%A1%B9%E7%9B%AE%E9%83%A8%E7%BD%B2)
  - [2. Three.js](#2-threejs)
    - [2.1 Scene](#21-scene)
    - [2.2 Light](#22-light)
    - [2.3 Camera](#23-camera)
    - [2.4 Geometry](#24-geometry)
    - [2.5 Material](#25-material)
    - [2.6 TextureLoader](#26-textureloader)
    - [2.7 Skybox](#27-skybox)
    - [2.8 Ground](#28-ground)
    - [2.9 Bullet](#29-bullet)
    - [2.10 Player](#210-player)
    - [2.11 Birds](#211-birds)
    - [2.12 Control](#212-control)
    - [2.13 Renderer](#213-renderer)
    - [2.14 Animate](#214-animate)
    - [2.15 Stats.js](#215-statsjs)
  - [3. Socket.io](#3-socketio)
    - [3.1 Socket核心操作](#31-socket%E6%A0%B8%E5%BF%83%E6%93%8D%E4%BD%9C)
      - [3.1.1 发送](#311-%E5%8F%91%E9%80%81)
      - [3.1.2 接收](#312-%E6%8E%A5%E6%94%B6)
      - [3.1.3 广播](#313-%E5%B9%BF%E6%92%AD)
    - [3.1 客户端Socket](#31-%E5%AE%A2%E6%88%B7%E7%AB%AFsocket)
    - [3.2 服务端Socket](#32-%E6%9C%8D%E5%8A%A1%E7%AB%AFsocket)
  - [4. Node.js](#4-nodejs)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## 概述

选题"基于WebGL的web3D的实践和开发"

Homework 2利用Three.js, Socket.io和Node.js技术，搭建了一个简易的多玩家3D射击游戏网站。这份文档将介绍搭建这个游戏网站所运用到的部分技术。
- Repo Link: [Github](https://github.com/song-hao/AdWebHW2)

## 1. 项目下载和部署

### 1.1 项目下载
```
$ git clone https://github.com/song-hao/AdWebHW2.git
$ npm install
```
- 项目配置了package.json，使用 npm 进行包管理。node_modules加入.gitignore内，所以需要使用 ``$ npm install`` 下载项目所需的 Socket.io 和 Three.js。
- Repo中有两个分支 ``master`` 和 ``gh-pages``，``gh-pages``为纯静态项目，所有后台数据已存入 ``services_local.js`` 中。[Demo](http://song-hao.github.io/AdWebHW2) 

### 1.2 项目部署
进入项目文件目录，然后再终端中输入以下命令来开启Node.js Server。
```
$ node app.js
```
运行后再浏览器中输入地址：http://localhost:8000/ 即可运行项目。

## 2. Three.js

### 2.1 Scene
Scene，即场景。是一个Three.js应用中的基础。所有后续的物体、灯光、控制等部件都会被添加到一个场景中。
```javascript
var scene = new THREE.Scene();
```
定义完Scene后，我们可以设置Scene的Fog属性，来营造烟雾效果。即离得越远的物品可见度越低。
```javascript
scene.fog = new THREE.FogExp2(0x000000, 0.0025);
```
之后所有的物件都会被Add到Scene之上：
```
scene.add(someObject);
```

### 2.2 Light
Light, 即灯光。有了场景之后我们需要在场景中添加上灯光。灯光的种类有很多，在Three.js的官方API中有九种灯光，我们选择最简单的一种DirectionalLight，然后通过 ``.position.set`` 来设置位置，再通过 ``scene.add`` 将灯光添加到场景中。
```
var light = new THREE.DirectionalLight(0xffffff);
light.position.set(0, 0.5, 1).normalize();
scene.add(light);
```

### 2.3 Camera
Camera，即模拟查看场景的摄像机。Three.js有三类摄像机。较常用的两种是OrthographicCamera正投影相机和PerspectiveCamera透视投影相机。下图比较直观的展示了两种相机的成相区别：

![](https://raw.githubusercontent.com/song-hao/AdWebHW2/master/img/camera.png)

在本项目中我们采用近大远小的透视投影相机，可以更好得模拟第一视角游戏：
```
camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
camera.position.set(Math.random() * 600 - 300, 25, Math.random() * 600 - 300);
```

### 2.4 Geometry
Geometry包含描述一个3D模型所需的所有形状信息。最原始的办法你可以一个个点的往里放去描述一个形状：
```javascript
var geometry = new THREE.Geometry();
geometry.vertices.push(
	new THREE.Vector3( -10,  10, 0 ),
	new THREE.Vector3( -10, -10, 0 ),
	new THREE.Vector3(  10, -10, 0 )
);
```
但实际的应用中，很大一部分Geomety是很类似的。例如所有的立方体，都可以简单的用长宽高，三个属性去唯一确定出一个立方体的形状。所以Three.js的Geometry下预设有30个常用Geometry，以立方体为例：
```javascript
var geometry = new THREE.BoxGeometry( 1, 1, 1 );
```
这样简单的一行代码，就创建除了一个长宽高为1的立方体。

### 2.5 Material
有了一个物体的样式之后，我们需要给这个物体一些外观的样式。Three.js预设13种材质。其中比较常用的材质如，Basic类材质即不考虑光照的影响，是最简单的材料。Lambert类材质，即物体表面为朗伯面，各向同性反射。Phong材质，即冯氏面，一种有光泽的表面，介于镜面反射和朗伯反射之间的反射，描述真实世界的反射。

### 2.6 TextureLoader
上面这些Material有时显得太过原始，不够酷炫。那么Three.js提供的TextureLoader是一种很有用的工具。它可以帮助我们把一张照片映射到某种材质之上。例如：
```javascript
var material = new THREE.MeshBasicMaterial({map: textureLoader.load('textures/cube/skybox/px.jpg')}),
```
上述代码把一张名叫px.jpg的照片map到Basic材质之上，那么这种材质的表面便会显示盖章照片。

### 2.7 Skybox
有了上述知识，我们可以构件出本项目中的整个外围场景。
首先我们创建一个长宽高为10000的立方体的Geometry:
```javascript
var geometry = new THREE.BoxGeometry(10000, 10000, 10000, 7, 7, 7)
```
然后一个立方体有6个面，所以我们用6张照片创建6个material:
```javascript
var materials = [
        new THREE.MeshBasicMaterial({map: textureLoader.load('textures/cube/skybox/px.jpg')}), // right
        new THREE.MeshBasicMaterial({map: textureLoader.load('textures/cube/skybox/nx.jpg')}), // left
        new THREE.MeshBasicMaterial({map: textureLoader.load('textures/cube/skybox/py.jpg')}), // top
        new THREE.MeshBasicMaterial({map: textureLoader.load('textures/cube/skybox/ny.jpg')}), // bottom
        new THREE.MeshBasicMaterial({map: textureLoader.load('textures/cube/skybox/pz.jpg')}), // back
        new THREE.MeshBasicMaterial({map: textureLoader.load('textures/cube/skybox/nz.jpg')})  // front
    ];
```
确定了形状及材质后，我们就唯一确定了一个物体：
```javascript
var mesh = new THREE.Mesh(geometry, new THREE.MultiMaterial(materials));
```
至此整个项目的外部环境被成功构造完了。本质上这个游戏世界就是一个贴了6张图的边长为10000的正方体。

### 2.8 Ground
由于是一个射击游戏，我们不能让玩家在这个10000的正方体里到处飞，所以我们创建一块地，来作为玩家的战场。我们用Three.js自带的PlaneGeometry来创建一个大小为1000*1000的平面作为战场：
```javascript
geometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
```
有了Geometry之后，我们开始考虑地板的材质。传统的纯色地板或是简单的贴一张图已经不能够展现这个游戏的浮夸了，所以我们用Three.js中的face类，创建出一个个三角形，然后为每个三角形设置随机的vertexColors。最后把这些三角形铺设在这个PlaneGeometry上。
```
for (var i = 0, l = geometry.faces.length; i < l; i++) {
    var face = geometry.faces[i];
    face.vertexColors[0] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
    face.vertexColors[1] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
    face.vertexColors[2] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
}
var material = new THREE.MeshBasicMaterial({vertexColors: THREE.VertexColors, opacity: 0.5, transparent: true});
mesh = new THREE.Mesh(geometry, material);
```

### 2.9 Bullet
战场有了以后，我们开始设计发射子弹的样式。我们运用Three.js中的SpriteMaterial材质，然后将一张金属玻璃弹珠的照片map到这个材质上，于是子弹的样式就有了。
```javascript
particle = new THREE.Sprite(new THREE.SpriteMaterial({map: textureLoader.load("textures/sprite.png"), color: 0xffffff, fog: true}));
```
关于子弹的飞行动画在后文中介绍

### 2.10 Player
现在我们开始创建你眼里其他玩家的样子。这部分主要运用了三个技术：JSONLoader，SkinnedMesh和AnimationMixer。篇幅有限，简而言之，我们把Player的样式和动画写在外部json文件中，然后用JSONLoader加载进我们的项目，然后用SkinnedMesh把其中样式赋给我们的Player，最后通过AnimationMixer管理这个Player的动画效果：
```javascript
loader.load('./models/skinned/simple/simple.js', function (geometry, materials) {
    for (var k in materials) {
        materials[k].skinning = true;
    }
    playerFactory = new THREE.SkinnedMesh(geometry, new THREE.MultiMaterial(materials));
    playerFactory.scale.set(2.5, 2.5, 2.5);
    playerFactory.position.set(0, 15, 0);
    playerFactory.skeleton.useVertexTexture = false;
    mixer = new THREE.AnimationMixer(playerFactory);
    mixer.clipAction(playerFactory.geometry.animations[0]).play();
});
```
由于时间所限，现在这个玩家只有两条腿，前后迈动。不过这已经可以完全的展现以上技术了。Three.js的社区及Example中有很多非常酷炫的模型，也都可以通过以上技术来加入到项目中。

### 2.11 Birds
利用类似的技术，我们从Three.js的Example中找了一些飞鸟的js模型加入到我们的天空中。
```
loader.load("models/animated/stork.js", function (geometry) {
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
    mixer.clipAction(clip, mesh).setDuration(duration).
    startAt(-duration * Math.random()).play();
    mesh.position.set(x, y, z);
    mesh.rotation.y = Math.PI / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    morphs.push(mesh);
});
```
最后我们在html中再加入两张枪支的照片放在页面左右下角。至此所有游戏中的场景元素都已经完成。截图如下：

![](https://raw.githubusercontent.com/song-hao/AdWebHW2/master/img/demo.png)


### 2.12 Control
有了界面以后，我们需要动态的控制我们的人物去运动。本质上我们就是控制场景中的Camera随着鼠标的移动以及键盘的操作，来进行相应的运动。我们使用FirstPersonControls这个控制类。在实现原理上，FirstPersonControls.js监听来自WASD以及上下左右键的事件，然后吧camera的position进行相应的移动。同时监听鼠标的移动操作，获取当前鼠标位置与页面中心点的位置偏差，然后利用这个位置偏差计算camera的lookAt角度。用以上两点，来模拟出这个第一视角控制类。我们通过如下代码添加这个control。
```javascript
controls = new THREE.FirstPersonControls(camera, renderer.domElement);
controls.movementSpeed = 150;
controls.lookSpeed = 0.3;
controls.lookVertical = true;
```
在本项目中，上文我们将战场设置为1000*1000，因此我们需要自己写一个额外的函数，来使得这个controls始终在我们的战场中，不会一路走出去：
```javascript
restrictField(controls, 500);
function restrictField(controls, restrict) {
    if (controls.object.position.x > restrict) {
        controls.object.position.x = restrict;
    }
    if (controls.object.position.x < -restrict) {
        controls.object.position.x = -restrict;
    }
    if (controls.object.position.z > restrict) {
        controls.object.position.z = restrict;
    }
    if (controls.object.position.z < -restrict) {
        controls.object.position.z = -restrict;
    }
    controls.object.position.y = 25; // Height of Camera
}
```

### 2.13 Renderer
最后我们需要把上述构造的东西全部渲染到浏览器进行显示。这部分可以交给Three.js来做，通常可以选择WebGLRenderer或者CanvasRenderer。前者使用WebGL技术，后者使用Canvas 2D技术。由于后者性能较差，所以在本项目中我们选择WebGL来渲染：
```javascript
var renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
```

### 2.14 Animate
以上所有的场景渲染都被放入 ``init()`` 函数，然后我们需要有个函数 ``animate()`` 来控制每帧画面的变化。首先我们要管理我们的子弹。实现方法是我们创建一个子弹的数组，每次用户开枪，或者接收到别的用户开枪的数据，我们就把那颗子弹存入数组中，包括它的位置信息和速度信息。然后每一帧画面我们遍历这个数组，把位置向量加上速度向量，来更新子弹的位置。同时判断子弹有没有被射出界，如果出界就删除子弹。
```
for (var i = 0; i < bullets.length; i++) {
    var bullet = bullets[i].particle;
    if (bullet) {
        bullet.position.add(bullets[i].speed);
        if (( bullet.position.x >= xyzLimit || bullet.position.x <= -xyzLimit ) ||
            ( bullet.position.y >= xyzLimit || bullet.position.y <= 0 ) ||
            ( bullet.position.z >= xyzLimit || bullet.position.z <= -xyzLimit )) {
            // Bullet reached limit?
            console.log("remove outbounded bullet");
            scene.remove(bullets[i].particle);
            bullets.splice(i, 1);
        }
        bullet.verticesNeedUpdate = true;
    }
}
```
然后我们还要控制其他玩家的迈腿动作，天上各种鸟的飞行动作以及镜头的变化：
```javascript
var delta = clock.getDelta();
for (var i = 0; i < morphs.length; i++) {
    // Update birds
    morph = morphs[i];
    morph.position.x += morph.speed * delta;
    if (morph.position.x > 2000) {
        morph.position.x = -1000 - Math.random() * 500;
    }
}
controls.update(delta); // Update controls
mixer.update(delta); // Update players
```
animate函数中会申请下一帧动画然后继续调用animate，即重复嵌套不断调用animate：
```javascript
requestAnimationFrame(animate);
```
可能会有疑问为什么不直接用最原始的SetIntervel来固定频率调用。我查到的解释是，这个函数会根据画面渲染时间来决定实际帧数，而不像SetIntervel那样固定FPS。因此如果你的渲染非常大，那可能你的设备并不能完成一秒60次的渲染，那么用setIntervel固定FPS就会使得某些帧无法得到渲染。而使用requestAnimationFrame，它会动态得改变FPS，比如一段高强度渲染，设备无法跟上FPS60，那就自动降到合适的FPS，保证每帧渲染都能完成。

### 2.15 Stats.js
那么既然requestAnimationFrame会降低我们的FPS，那我们需要一个小插件来实时的查看FPS，以此检测自己的程序性能。Three.js的作者为我们完成了这个小插件，即stats.js。
我们首先声明这个小插件，并将它添加到页面中：
```javascript
stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);
```
然后我们在 ``animate()`` 的前后加上两个stats函数：
```
function animate() {
    stats.begin();
    // Your Code ...
    stats.end();
}
```
这样就完成了。可以在前面的截图中看到右上角显示着FPS信息。这个功能可以帮助你定量的衡量程序性能。只要能做到60FPS即表示当前设备可以流程运行该项目。
实际编写中，曾经为每个子弹和玩家去重新new他们，FPS低于60。后来采用了clone()的技巧，目前程序理论上可以跑满60FPS。


## 3. Socket.io
要实现多人对战，最先想到的做法是用轮询，不断地发起请求。但射击游戏实时性很高，一直发HTTP请求太不优雅。而且由于HTTP是被动请求，服务器端算出来死了一个人不能主动发出请求，所以不太可信。
WebSocket是一个可行的方法，建立一个长链接，然后传输各个用户操作和状态到服务器端。这意味着我们需要实现一个符合Websocket协议规范的服务器。在这个作业中我们使用Socket.io 这个WebSocket库。可以通过Node.js来实现WebSocket服务端。同时Socket.io实现了实时双向的基于事件的通讯机制，模糊化各种传输机制。我们的射击游戏无非就是移动，开枪，被杀这些事件。
才外Socket.io其实支持WebSocket、htmlfile、xhr-polling、jsonp-polling，四种协议，因此在不支持WebSocket的客户端上，我们也能使用Socket.io。

### 3.1 Socket核心操作
Socket核心操作即发送，接受和广播操作。

#### 3.1.1 发送
Socket的发送函数是 ``emit()``，调用时声明事件、数据：
```javascript
socket.emit('someEvent', { data: 'someData' });
```
这个函数表明 ``someEvent`` 这个事件，发送了数据 ``someData``。

#### 3.1.2 接收
Socket的接收函数是 ``on()``，调用时声明事件、数据：
```javascript
socket.on('someEvent', function (someData) {
    console.log(data);
 });
```
这个函数表明从 ``someEvent`` 这个事件中，接收到数据 ``someData``。

#### 3.1.3 广播
Socket的广播操作有两类: ``io.sockets.emit`` 和 ``socket.broadcast.emit``。区别是前者发送给所有socket，后者发送给除当前socket外的所有socket。
```
socket.broadcast.emit('someEvent', someData);
```
该函数向除当前socket外所有socket广播一个事件 ``someEvent``，内容为 ``someData``。

### 3.1 客户端Socket
客户端（main.js）建立Socket:
```
var socket = io.connect('http://localhost:8000');
```
并在html中引入 ``<script>`` :
```
<script src="/socket.io/socket.io.js"></script>
```
在客户端中我们主要需要处理四类接收到的时间，分别是init事件表明你已经与服务器完成连接，player事件即其他用户位置变化，bullet事件即其他用户发射了新的子弹，hit事件即你击杀了其他玩家或被杀：
```
socket.on('init', function (socketID) {
// 记录自己的id
});
socket.on('player', function (player) {
// 更新玩家为之
});
socket.on('bullet', function (bullet) {
// 画出新的Bullet
});
socket.on('hit', function (data) {
// 移除被杀玩家，或弹窗告知自己被杀
});
```
然后客户端中有两个发送事件，即开枪事件和位置移动事件：
```
socket.emit('bullet', [controls.object.position, speed]);
socket.emit('player', [controls.object.position]);
```

### 3.2 服务端Socket
服务端（app.js）首先添加Socket.io的依赖
```javascript
var io = require('socket.io')(app);
```
然后开启socket
```javascript
io.on('connection', function (socket) {
// Your code
}
```
服务端主要接收三个事件：player事件即用户位置信息，bullet事件即有用户开枪，disconnet事件即有用户下线。
```javascript
socket.on('player', function (data) {
// 广播给其他所有玩家该玩家的信息，客户端接收后重画该玩家位置
    socket.broadcast.emit('player', {online: [socketid, data]});
});

socket.on('bullet', function (data) {
// 广播给其他所有玩家有新的子弹被射出，客户端接收后添加该子弹
    socket.broadcast.emit('bullet', data);
});

socket.on('disconnect', function () {
// 广播给其他所有玩家该玩家下线，客户端接收后移除该玩家
    socket.broadcast.emit('player', {'offline': socketid});
})
```
除此以外后台还需要计算是否有某颗子弹击中某个玩家，如果击中则广播hit事件：
```
io.sockets.emit('hit', {hit: player, by: bullets[i].clientOrigin}
```
具体判断细节在下一节阐述：

客户端根据相应的事件进行处理并广播给其他所有玩家，其他所有玩家根据上节所写的处理方式处理相应事件。

## 4. Node.js
在app.js中添加相应依赖，并监听端口8000：
```
var app = require('http').createServer(server);
var io = require('socket.io')(app);
var fs = require('fs');
var url = require('url');
var THREE = require('three');
app.listen(8000);
```
然后搭建一个http server，利用Nodejs的fs文件系统，获取用户请求路径的文件，并传回。使得用户可以直接进入localhost:8000开始游戏：
```
function server(req, res) {
    var path = url.parse(req.url).pathname;
    if (path == '/') path = '/index.html';
    fs.readFile(__dirname + path, function (err, data) {
        if (err) {
            res.writeHead(404);
            res.write('404 not found: ' + path);
        } else {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data, 'utf8');
        }
        res.end();
    });
}
```

也可以使用Express，简化上述代码：
```
var app = require('express')();

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});
```
然后后台以60帧的频率计算子弹是否击中玩家或已出界。我们设定当子弹与玩家距离小于10即判断成功击杀。
```
for (var player in players) {
    if (player != bullets[i].clientOrigin) {
        var playerVector = new THREE.Vector3(players[player][0].x, players[player][0].y, players[player][0].z);
        var distance = bulletVector.distanceTo(playerVector);
        if (distance <= 10) {
            // To All Sockets!
            return io.sockets.emit('hit', {hit: player, by: bullets[i].clientOrigin});
        }
    }
}
```
可以看到之前都使用 ``socket.boardcast.emit()`` 进行广播，因为之前的广播信息都是当前某个socket的数据，不需要传回该socket。例如有A, B, C三个玩家。前台玩家A开枪，emit bullet事件，后台on bullet收到后，只需要发给B，C玩家，让他们在页面上画出A玩家所射的子弹。同理，前台A玩家移动，emit player事件，后台收到on player事件后，只需要告诉B，C让他们重新画A的位置即可。

然而，此处的击杀信息是需要使用 ``io.sockets.emit()`` 广播给所有人的。因为这个信息是后台计算所得，A玩家开枪后也不知道自己能否击中，他和B，C玩家一样，需要靠后台计算后发出信息，来决定前端的具体处理。

通过这一点，我们也看了Socket技术的主动性，不像HTTP请求那么被动。



宋浩 13302010005
