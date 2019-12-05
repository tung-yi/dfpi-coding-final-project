var regl = require('regl')()
var glm = require('gl-matrix')
var mat4 = glm.mat4

const io = require('socket.io-client')

// Update IP address here to connect to server, IP will differ between each internet connection
const socket = io('http://10.0.0.169:9876')

socket.on('cameramove', function (objReceived) {
  // o.view is the view matrix from the remote control
  // viewMatrix is our local view matrix

  mat4.copy(viewMatrix, objReceived.view)
  // gl-matrix.net
})

// import the shader from external files
// we are going to use different shader here because the 3D model doesn't have 'color' attributes
// we are going to use the 'uv' attribute instead
var vertStr = require('./shaders/vertex02.js')
var fragStr = require('./shaders/fragment02.js')

// import the loadObj tool - see line 100 in 'frontend'
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

//storing 'click' information (mouse x & mouse y) for when creating the 'click' event
var clickedX = 0;
var clickedY = 0;

var clear = () => {
  regl.clear({
    color: [.341, .486, .541, 1] // sets the background colour
  })
}

//creating variables
var currTime = 0
var r = 0.7
var mouseX = 0
var mouseY = 0
var seed = Math.random () * 1000
var foldingStrength = 0.0
var targetFoldingValue = 0.0

// this section creates the mapping function to map the mouse position to camera position
//the function 'map' will be used later when creating a click event (see line 76)
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
//this is the code to generate a new seed 'new fold'
//listens to server for the 'click' control sent from the remote
socket.on('click', function (event) {
  console.log(event)
  //the following if/else statement structures when the 'folding' occurs. 
  //When the event is 'clicked' (1.0), the model will generate a pattern of 'random' folds as mapped onto the model
  //When the event is 'clicked' (0.0), the model will resume back its original state.
  //The if/else statement sets the instructions for when the paper 'folds.'
  if (targetFoldingValue == 0.0){ 
    targetFoldingValue= 1.0
    seed = Math.random () * 1000
    clickedX = map (event.x, 0, 1, -2, 2) 
    clickedY = map (event.y, 0, 1, 2, -2)
  } else {
    targetFoldingValue = 0.0
  }
    console.log('New seed :', seed)
})

// create event listener for mouse move event in order to get mouse position
window.addEventListener('mousemove', function (event) {
  var x = event.clientX // get the mosue position from the event
  var y = event.clientY
//FOLLOW UP ON THIS
  mouseX = map(x, 0, window.innerWidth, -5, 5)
  mouseY = -map(y, 0, window.innerHeight, -5, 5)
})

// create a variable for draw call
var drawPaper

// instead of creating the attributes, this loads the 3D model (C4D file) 
loadObj('./assets/plane1.obj', function (obj) {
  console.log('Model Loaded', obj)

  // create attributes, CLARIFY
  const attributes = {
    aPosition: regl.buffer(obj.positions),
    aUV: regl.buffer(obj.uvs)
  }

  // create the draw call and assign to the drawPaper, variables that has been created
  // Call the drawPaper in the render function
  drawPaper = regl({
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

//function render () {

  regl.frame(({time}) => {
    regl.clear({
      color: [1, 1, 1, 1]
    })
    
  currTime += 0.01

  //increase the folding strength each fold
  foldingStrength = foldingStrength + (targetFoldingValue - foldingStrength) * 0.05

  // clear the background
  clear()

  // 3d model takes time to load, therefore check if drawCube is exist first before calling it
  if (drawPaper !== undefined) {
    // create an object for uniform
    var obj = {
      time: currTime,
      projection: projectionMatrix,
      view: viewMatrix,
      translate: [0, 0, 0],
      touch: [clickedX, clickedY, 0],
      seed: seed,
      foldingStrength: foldingStrength
    }

    // draw the cube, don't forget the pass the obj in for uniform
    drawPaper(obj)
  }
})
