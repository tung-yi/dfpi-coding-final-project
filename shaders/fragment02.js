  
// module.exports is the preserved word for exporting
// copy & paste the vertex shader from javascript file

module.exports = `
precision mediump float;
varying vec2 vUV;
varying vec3 vPosition;
void main() {
  //play here for colour
  vec3 colorPortion = vec3(0.945, 0.580, 0.513) * 0.5;
  vec3 depthPortion = vPosition.zzz * .5;

  gl_FragColor = vec4(colorPortion + depthPortion, 1.0);
}`
