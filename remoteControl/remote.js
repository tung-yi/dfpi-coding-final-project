// index.js
const alfrid = require('alfrid')
const io = require('socket.io-client')
const GL = alfrid.GL

// PUT YOUR OWN IP HERE
const socket = io('http://10.0.0.169:9876')

var clicked = false 

const widthOverHeight = window.innerWidth / window.innerHeight
//creates a new constant to create the 'click' portion of the remote control
const paperPortion = Math.ceil(100 * widthOverHeight);

//creates a new constant to create the 'rotate' portion of the remote control
const rotatePortion = Math.floor(100 - paperPortion);
console.log("paperPortion", paperPortion);
console.log("rotatePortion", rotatePortion);

//creates the paper 'click' remote view window - using the same form as originally created by Wen
//positioning the paperView accordingly to the rotateView 
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

const rotateView = document.createElement('canvas')
document.body.appendChild(rotateView)
rotateView.style.position = 'fixed'
rotateView.style.margin = 0
rotateView.style.padding = 0
rotateView.style.height = rotatePortion + "%";
rotateView.style.width = "100%";
rotateView.style.bottom = 0
rotateView.style.left = 0

GL.init(rotateView, { alpha: false })

function getAspectRatio() {
  return window.innerWidth / (window.innerHeight * (1 - widthOverHeight));
}

const camera = new alfrid.CameraPerspective()
//changing the camera perspective, Using Alfrid's predetermined aspect ratio format, this is redefining the expected dimensions.
camera.setPerspective(45 * Math.PI / 180, getAspectRatio(), 0.01, 1000)
//this ensures that the rotation occurs when you're pressing in the right portion of the screen
const orbitalControl = new alfrid.OrbitalControl(camera, rotateView, 5)
orbitalControl.rx.value = orbitalControl.ry.value = 0.3

// mouse position
rotateView.addEventListener('mousemove', (e) => {
  const mouseX = e.clientX / window.innerWidth
  const mouseY = e.clientY / window.innerHeight

  socket.emit('mousemove', {
    x: mouseX,
    y: mouseY
  })
})

// mouse position of the 'click' paperPortion
paperView.addEventListener('click', (e) => {
  clicked = !clicked
  const mouseX = e.clientX / window.innerWidth
  //mouseY constant is relative to the width of the remote window since the "click" space is a square
  const mouseY = e.clientY / window.innerWidth 
  //to further visualize and make more intuitive where the paper is being 'clicked,' 
  //I've visualized the clicked area through the following gradient
  //radial gradient from: https://developer.mozilla.org/en-US/docs/Web/CSS/radial-gradient
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
  console.log(e.touches.length)
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
