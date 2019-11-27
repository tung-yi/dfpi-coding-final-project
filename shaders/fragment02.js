  
// module.exports is the preserved word for exporting
// copy & paste the vertex shader from javascript file

module.exports = `
precision mediump float;
varying vec2 vUV;
varying vec3 vPosition;
void main() {
  //play here for colour
  gl_FragColor = vec4(vPosition.zzz * .5 + .5, 1.0);
}`
