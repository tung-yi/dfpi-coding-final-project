// index.js
const alfrid = require('alfrid')
const io = require('socket.io-client')
const GL = alfrid.GL

// Update IP address here to connect to server, IP will differ between each internet connection
const socket = io('http://10.93.1.150:9876')

//this keeps track of whether the window is currently in a 'clicked' state
var clicked = false 

//aspect ratio for entire remote control screen
const widthOverHeight = window.innerWidth / window.innerHeight
// creates a new constant which contains the percentage of the screen (vertically) dedicated to
// the 'click' portion of the remote control.
// on a screen that is longer vertically than horizontally (i.e. a phone screen), this ensures that the paperPortion is a square
// to reflect the frontend paper dimensions
// Math.ceil rounds up the number to the nearest whole number i.e. 101.2 = 102
const paperPortion = Math.ceil(100 * widthOverHeight);

// creates a new constant to contains the percentage of the screen (vertically) 
// dedicated to the 'rotate' portion of the remote control.
// the 'rotate' portion is calculated as the remaining screen after the paperPortion
// Math.floor rounds down the number to the nearest whole number i.e. 101.9 = 101
const rotatePortion = Math.floor(100 - paperPortion);
console.log("paperPortion", paperPortion);
console.log("rotatePortion", rotatePortion);

// creates the clickable remote view window that reflects the paper
// fixes the paperView to the top of the screen and defines the visual traits of it
const paperView = document.createElement('div')
document.body.appendChild(paperView)
paperView.style.position = 'fixed'
paperView.style.margin = 0
paperView.style.padding = 0
paperView.style.height = paperPortion + "%";
paperView.style.width = "100%";
paperView.style.top = 0
paperView.style.left = 0
paperView.style.background = '#F6C555';

//creating a new element for instructions for paperView
var paperViewText = document.createElement('div')
document.body.appendChild(paperViewText)
paperViewText.style.position = 'fixed'
paperViewText.style.margin = 0
paperViewText.style.padding = 0
paperViewText.style.width = "100%";
paperViewText.style.top = 0
paperViewText.innerText = 'Click Here'
paperViewText.style.fontFamily = '"Helvetica", sans-serif'
paperViewText.style.fontSize = '40px'
paperViewText.style.textAlign = 'center'
paperViewText.style.color = '#577C8A'

// a fix for clicking through the text, found here: https://stackoverflow.com/a/4839672
paperViewText.style.pointerEvents = 'none';

// creates the rotate-able remote view window
// fixes the rotateView to the bottom of the screen
const rotateView = document.createElement('canvas')
document.body.appendChild(rotateView)
rotateView.style.position = 'fixed'
rotateView.style.margin = 0
rotateView.style.padding = 0
rotateView.style.height = rotatePortion + "%";
rotateView.style.width = "100%";
rotateView.style.bottom = 0
rotateView.style.left = 0

//creating a new element for instructions for rotateView
var rotateViewText = document.createElement('div')
document.body.appendChild(rotateViewText)
rotateViewText.style.position = 'fixed'
rotateViewText.style.margin = 0
rotateViewText.style.padding = 0
rotateViewText.style.width = "100%";
rotateViewText.style.bottom = 0
rotateViewText.innerText = 'Rotate Here'
rotateViewText.style.fontFamily = '"Helvetica", sans-serif'
rotateViewText.style.fontSize = '40px'
rotateViewText.style.textAlign = 'center'
rotateViewText.style.color = '#577C8A'

// a fix for clicking through the text, found here: https://stackoverflow.com/a/4839672
rotateViewText.style.pointerEvents = 'none';

GL.init(rotateView, { alpha: false })

// gets AspectRatio for the rotateView where the height is multiplied by portion of screen it occupies 
// normally AspectRatio defines the whole screen, however in this case, the rotateView only occupies (1 - (width/height)) * 100% of the screen  
function getAspectRatio() {
  return window.innerWidth / (window.innerHeight * (1 - widthOverHeight));
}

const camera = new alfrid.CameraPerspective()

//changing the camera perspective, using my getAspectRatio function, this is redefining the expected dimensions.
camera.setPerspective(45 * Math.PI / 180, getAspectRatio(), 0.01, 1000)

//this gives rotateView orbital controls, which allows rotating around a center in 3D 
const orbitalControl = new alfrid.OrbitalControl(camera, rotateView, 5)
orbitalControl.rx.value = orbitalControl.ry.value = 0.3

// listens to mouse position event and sends to the server
rotateView.addEventListener('mousemove', (e) => {
  const mouseX = e.clientX / window.innerWidth
  const mouseY = e.clientY / window.innerHeight

  socket.emit('mousemove', {
    x: mouseX,
    y: mouseY
  })
})

// listens to mouse 'click' on paperPortion and sends it to the server
// this also switches between 'click' being true or false
paperView.addEventListener('click', (e) => {
  clicked = !clicked

  if (paperViewText) {
    paperViewText.remove()
    paperViewText = undefined;
  }

  const mouseX = e.clientX / window.innerWidth
  // mouseY constant is relative to the width of the remote window since the "click" space is a square
  const mouseY = e.clientY / window.innerWidth 
  // to further visualize and make more intuitive where the paper is being 'clicked,' 
  // I've visualized the clicked area through the following gradient
  // radial gradient from: https://developer.mozilla.org/en-US/docs/Web/CSS/radial-gradient 
  if (clicked){
    paperView.style.background = `radial-gradient(farthest-corner at ${e.clientX}px ${e.clientY}px, #BA9132 0%, #F6C555 50%)`;
  } else {
    paperView.style.background = '#F6C555';
  }

  socket.emit('click', {
    x: mouseX,
    y: mouseY
  }) 
})

// below is from the original remote control code provided by Wen
const bAxis = new alfrid.BatchAxis()
const bDots = new alfrid.BatchDotsPlane()

const fs = `
precision mediump float;

uniform mat3 uNormalMatrix;
varying vec3 vNormal;

float diffuse(vec3 n, vec3 l) {
  return max(dot(normalize(n), normalize(l)), 0.0);
}

#define LIGHT vec3(0.25, .5, 1.0)

void main() {
  float d = diffuse(uNormalMatrix * vNormal, LIGHT);
  d = mix(d, 1.0, .2);
  gl_FragColor = vec4(vec3(d), 1.0);
}
`
const drawCube = new alfrid.Draw()
  .setMesh(alfrid.Geom.cube(1, 1, 1))
  .useProgram(alfrid.ShaderLibs.basicVert, fs)

function render () {
  GL.clear(0, 0, 0, 1)

  GL.setMatrices(camera)
  bAxis.draw()
  bDots.draw()
  drawCube.draw()

  socket.emit('cameramove', {
    view: camera.matrix,
    projection: camera.projection
  })
}

alfrid.Scheduler.addEF(render)

rotateView.addEventListener('touchmove', (e) => {
  if (rotateViewText) {
    rotateViewText.remove()
    rotateViewText = undefined
  }
  if (e.touches.length > 1) {
    e.preventDefault()
  }
}, false)

window.ondeviceorientationabsolute = (e) => {
  // console.log('orientation absolute', e.alpha, e.beta, e.gamma)
  socket.emit('tilt', {
    alpha: e.alpha,
    beta: e.beta,
    gamma: e.gamma
  })
}
