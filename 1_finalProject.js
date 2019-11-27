// ********************************
// I'm cleaning some of the comments as it start getting messy.
// If there's any confusing points please go back to previous files for the comments
// ********************************

var regl = require('regl')()
var glm = require('gl-matrix')
var mat4 = glm.mat4

const io = require('socket.io-client')

// PUT YOUR IP HERE TOO
const socket = io('http://192.168.0.16:9876')

socket.on('cameramove', function (objReceived) {
  // o.view is the view matrix from the remote control
  // viewMatrix is our local view matrix

  // console.log('obj received :', objReceived.viewMatrix, objReceived.view)
  mat4.copy(viewMatrix, objReceived.view)
  // gl-matrix.net
})

//CREATE new socket.on

// import the shader from external files
// we are going to use different shader here because the 3D model doesn't have 'color' attributes
// we are going to use the 'uv' attribute instead
var vertStr = require('./shaders/vertex02.js')
var fragStr = require('./shaders/fragment02.js')

// import the loadObj tool
var loadObj = require('./utils/loadObj.js')

// create the projection matrix for field of view
var projectionMatrix = mat4.create()
var fov = 75 * Math.PI / 180
var aspect = window.innerWidth / window.innerHeight
var near = 0.01
var far = 1000
mat4.perspective(projectionMatrix, fov, aspect, near, far)

// create the view matrix for defining where the camera is looking at
var viewMatrix = mat4.create()
var eye = [0, 0, 5]
var center = [0, 0, 0]
var up = [0, 1, 0]
mat4.lookAt(viewMatrix, eye, center, up)

var clear = () => {
  regl.clear({
    color: [.9, .9, .9, 1] // white
  })
}

var currTime = 0
var r = 0.5
var mouseX = 0
var mouseY = 0
var seed = Math.random () * 1000
var foldingStrength = 0.0
var targetFoldingValue = 0.0

// create mapping function to map the mouse position to camera position
function map (value, start, end, newStart, newEnd) {
  var percent = (value - start) / (end - start)
  if (percent < 0) {
    percent = 0
  }
  if (percent > 1) {
    percent = 1
  }
  var newValue = newStart + (newEnd - newStart) * percent
  return newValue
}
//generate a new seed 'new fold'
window.addEventListener('click', function (event) {
if (targetFoldingValue == 0.0){ 
  targetFoldingValue= 1.0
  seed = Math.random () * 1000
} else {
  targetFoldingValue = 0.0
}
  console.log('New seed :', seed)
})

// create event listener for mouse move event in order to get mouse position

window.addEventListener('mousemove', function (event) {
  var x = event.clientX // get the mosue position from the event
  var y = event.clientY

  mouseX = map(x, 0, window.innerWidth, -5, 5)
  mouseY = -map(y, 0, window.innerHeight, -5, 5)
})

// create a variable for draw call
var drawCube

// instead of creating the attributes ourselves, now loading the 3d model instead
loadObj('./assets/plane1.obj', function (obj) {
  console.log('Model Loaded', obj)

  // create attributes
  const attributes = {
    aPosition: regl.buffer(obj.positions),
    aUV: regl.buffer(obj.uvs)
  }

  // create the draw call and assign to the drawCube variable that we created
  // so we can call the drawCube in the render function
  drawCube = regl({
    uniforms: {
      uTime: regl.prop('time'),
      uProjectionMatrix: regl.prop('projection'),
      uViewMatrix: regl.prop('view'),
      uTranslate: regl.prop('translate'),
      uTouch: regl.prop('touch'),
      uSeed: regl.prop('seed'),
      uFoldingStrength: regl.prop('foldingStrength')
    },
    vert: vertStr,
    frag: fragStr,
    attributes: attributes,
    count: obj.count // don't forget to use obj.count as count
  })
})

function render () {
  currTime += 0.01

  //increase the folding strength each fold
  foldingStrength = foldingStrength + (targetFoldingValue - foldingStrength) * 0.05

  // clear the background
  clear()



  // 3d model takes time to load, therefore check if drawCube is exist first before calling it
  if (drawCube !== undefined) {
    // create an object for uniform
    var obj = {
      time: currTime,
      projection: projectionMatrix,
      view: viewMatrix,
      translate: [0, 0, 0],
      touch: [0, 0, 0],
      seed: seed,
      foldingStrength: foldingStrength
    }

    // draw the cube, don't forget the pass the obj in for uniform
    drawCube(obj)
  }

  // make it loop
  window.requestAnimationFrame(render)
}

render()
