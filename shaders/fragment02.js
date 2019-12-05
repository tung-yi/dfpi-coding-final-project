  
// module.exports is the preserved word for exporting
// copy & paste the vertex shader from javascript file

module.exports = `
precision mediump float;
varying vec2 vUV;
varying vec3 vPosition;
void main() {
  //sets the colour here of the 'paper' as seen in the frontend display screen
  vec3 colorPortion = vec3(0.964, 0.772, 0.333) * 0.85;
  vec3 depthPortion = vPosition.zzz * .5;

  gl_FragColor = vec4(colorPortion + depthPortion, 1.0);
}`
