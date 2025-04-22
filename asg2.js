// Sabrina Lee
// saemlee@ucsc.edu
// asg2.js

// vertex shader
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_GlobalTranslateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_GlobalTranslateMatrix * u_ModelMatrix * a_Position;
  }`

//fragment shader
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// global vars
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_GlobalTranslateMatrix;

let g_animationActive = true;
let g_animationShift = false;

let g_cameraAngleX = 30.0;
let g_cameraAngleY = 30.0;
let g_cameraAngleZ = 0.0;

let g_deltaX = 0;
let g_deltaY = 0;


//body camera control angles
var g_headAngle = [0.0, 0.0, 0.0];
var g_flAngle = 5.0;
var g_frAngle = 5.0;
var g_flLowerAngle = 0.0;
var g_frLowerAngle = 0.0;
var g_blAngle = -15.0;
var g_brAngle = -15.0;
var g_blLowerAngle = 30.0;
var g_brLowerAngle = 30.0;
var g_tailAngle = 0.0;

function setUpWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if(!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if(!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  u_GlobalTranslateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalTranslateMatrix');
  if(!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_GlobalTranslateMatrix');
    return;
  }

  let x = new Matrix4();
  
  gl.uniformMatrix4fv(u_ModelMatrix, false, x.elements);
}

function addActionListeners() {
  // buttons
  document.getElementById('toggle-animation').onclick = function() {g_animationActive = !g_animationActive;};
  document.getElementById('toggle-shift').onclick = function() {g_animationShift = !g_animationShift;};
  
  // sliders
  document.getElementById('h-slider-x').addEventListener('mousemove', function() {g_headAngle[0] = this.value; renderAllShapes();});
  document.getElementById('h-slider-y').addEventListener('mousemove', function() {g_headAngle[1] = this.value; renderAllShapes();});
  document.getElementById('h-slider-z').addEventListener('mousemove', function() {g_headAngle[2] = this.value; renderAllShapes();});

  document.getElementById('front-left-leg-upper-slider').addEventListener('mousemove', function() {g_flAngle = this.value; renderAllShapes();});
  document.getElementById('front-left-leg-lower-slider').addEventListener('mousemove', function() {g_flLowerAngle = this.value; renderAllShapes();});

  document.getElementById('front-right-leg-upper-slider').addEventListener('mousemove', function() {g_frAngle = this.value; renderAllShapes();});
  document.getElementById('front-right-leg-lower-slider').addEventListener('mousemove', function() {g_frLowerAngle = this.value; renderAllShapes();});

  document.getElementById('back-left-leg-upper-slider').addEventListener('mousemove', function() {g_blAngle = this.value; renderAllShapes();});
  document.getElementById('back-left-leg-lower-slider').addEventListener('mousemove', function() {g_blLowerAngle = this.value; renderAllShapes();});

  document.getElementById('back-right-leg-upper-slider').addEventListener('mousemove', function() {g_brAngle = this.value; renderAllShapes();});
  document.getElementById('back-right-leg-lower-slider').addEventListener('mousemove', function() {g_brLowerAngle = this.value; renderAllShapes();});

  document.getElementById('cam-angle-x').addEventListener('mousemove', function() {g_cameraAngleX = this.value; renderAllShapes();});
  document.getElementById('cam-angle-y').addEventListener('mousemove', function() {g_cameraAngleY = this.value; renderAllShapes();});
  document.getElementById('cam-angle-z').addEventListener('mousemove', function() {g_cameraAngleZ = this.value; renderAllShapes();});


  //mouse controls
  document.getElementById('display-container').addEventListener('click', function(ev) {
    if(ev.shiftKey) {
      g_animationShift = !g_animationShift;
    }
  });

  canvas.onmousemove = function(ev) {
    let [x, y] = convertMouseToEventCoords(ev);
    if(ev.buttons == 1) {
      g_cameraAngleY -= (x - g_deltaX) * 120;
      g_cameraAngleX -= (y - g_deltaY) * 120;
      g_deltaX = x;
      g_deltaY = y;
    } else {
      g_deltaX = x;
      g_deltaY = y;
    }
  }
}

function convertMouseToEventCoords(ev) {
  var x = ev.clientX; 
  var y = ev.clientY; 
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return([x, y]);
}

function renderAllShapes() {
  var start_time = performance.now();
  var globalRotMat = new Matrix4().rotate(-g_cameraAngleX*1, 1, 0, 0);
  globalRotMat.rotate(g_cameraAngleY*1, 0, 1, 0);
  globalRotMat.rotate(g_cameraAngleZ*1, 0, 0, 1);
  var globalTMat = new Matrix4().translate(0, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  gl.uniformMatrix4fv(u_GlobalTranslateMatrix, false, globalTMat.elements);
  // rabbit body vars
  var body = new Cube();

  // rabbit legs
  let legFL_1 = new Cube();
  let legFL_2 = new Cube();
  let legFL_3 = new Cube();
  let legFR_1 = new Cube();
  let legFR_2 = new Cube();
  let legFR_3 = new Cube();
  let legBL_1 = new Cube();
  let legBL_2 = new Cube();
  let legBL_3 = new Cube();
  let legBR_1 = new Cube();
  let legBR_2 = new Cube();
  let legBR_3 = new Cube();

  // rabbit tail vars
  let tail = new Cube();

  // rabbit head vars
  let head = new Cube(); 
  let neck = new Cube();
  let snout = new Cube();
  let nose = new Cube();
  let eyeL = new Cube();
  let eyeR = new Cube();

  //rabbit ears
  let earL = new Cube();
  let earR = new Cube();

  let innerEarL = new Cube();
  let innerEarR = new Cube();

  var l_flAngle = g_flAngle;
  var l_frAngle = g_frAngle;
  var l_flLowerAngle = g_flLowerAngle;
  var l_frLowerAngle = g_frLowerAngle;
  var l_blAngle = g_blAngle;
  var l_brAngle = g_brAngle;
  var l_blLowerAngle = g_blLowerAngle;
  var l_brLowerAngle = g_brLowerAngle;
  var l_neckAngle = [g_headAngle[0], g_headAngle[1], g_headAngle[2]];
  var l_tailAngle = g_tailAngle;
  var speedMultiplier = 5;
  var distLowerMultiplier = 15;
  var distUpperMultiplier = 20;
  var neckMultiplier = 5;

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if(g_animationShift) {
    var earSwivelAngle = 15 * Math.sin(g_seconds*5); // Swivel angle for ears
  }

  if(g_animationActive) {
    // front left leg animation
    l_flAngle = g_flAngle*1 + distUpperMultiplier * Math.sin(g_seconds*speedMultiplier);
    l_flLowerAngle = g_flLowerAngle*1 -10 + distLowerMultiplier * Math.sin(g_seconds*speedMultiplier);
    l_frAngle = g_frAngle*1 + distUpperMultiplier * Math.sin(g_seconds*speedMultiplier + Math.PI);
    l_frLowerAngle = g_frLowerAngle*1 -10 + distLowerMultiplier * Math.sin(g_seconds*speedMultiplier + Math.PI);

    l_blAngle = g_blAngle*1 + 0.75*distUpperMultiplier * Math.sin(g_seconds*speedMultiplier + Math.PI);
    l_brAngle = g_brAngle*1 + 0.75*distUpperMultiplier * Math.sin(g_seconds*speedMultiplier);
    l_blLowerAngle = g_blLowerAngle*1 + distLowerMultiplier * Math.sin(g_seconds*speedMultiplier + Math.PI);
    l_brLowerAngle = g_brLowerAngle*1 + distLowerMultiplier * Math.sin(g_seconds*speedMultiplier);

    l_neckAngle[2] = g_headAngle[2]*1 + neckMultiplier * Math.sin(g_seconds*5);
    l_neckAngle[0] = g_headAngle[0]*1 + neckMultiplier * Math.cos(g_seconds*5);

    l_tailAngle = g_tailAngle*1 + 10 * Math.sin(g_seconds*5);
  }
    
  // rabbit main body
  {
    body.color = [0.7, 0.7, 0.7, 1.0]; // Gray color
    body.matrix.scale(0.4, 0.4, 0.7); // Shorter, rounder body
    body.matrix.translate(-0.5, -0.5, -0.5);
    body.render();
    
    // Fluffy tail
    tail.color = [1.0, 1.0, 1.0, 1.0]; // White cotton tail
    tail.matrix.translate(-0.07, 0.1, 0.3);
    tail.matrix.rotate(l_tailAngle, 0, 1, 0);
    tail.matrix.scale(0.15, 0.15, 0.15); // Rounder, puffier tail
    tail.render();
  }

  {
    neck.color = [0.7, 0.7, 0.7, 1.0];
    neck.matrix.translate(0, -0.05, -0.3);
    neck.matrix.rotate(-30, 1, 0, 0); // Less angled neck
    neck.matrix.rotate(l_neckAngle[0], 1, 0, 0);
    neck.matrix.rotate(l_neckAngle[1], 0, 1, 0);
    neck.matrix.rotate(l_neckAngle[2], 0, 0, 1);
    var n_mat = new Matrix4(neck.matrix);
    neck.matrix.scale(0.2, 0.2, 0.1); // Thinner neck
    neck.matrix.translate(-0.5,0.7, 0);
    neck.render();

    head.color = [0.7, 0.7, 0.7, 1.0];
    head.matrix = n_mat;
    head.matrix.translate(-0.125, 0.35, -0.1); // Higher head position
    head.matrix.rotate(30, 1, 0, 0);
    var head_mat = new Matrix4(head.matrix);
    head.matrix.scale(0.25, 0.25, 0.25); // Rounder head
    head.render();

    // Longer, more upright ears with swivel animation
    earL.color = [0.6, 0.6, 0.6, 1.0];
    earL.matrix = new Matrix4(head_mat);
    earL.matrix.translate(0.15, 0.25, 0.2);
    if(g_animationShift) {
      earL.matrix.rotate(90 + earSwivelAngle, 0, 1, 0); // Add swivel to left ear
    } else {
      earL.matrix.rotate(90, 0, 1, 0); // Default position
    }
    earL.matrix.scale(0.05, 0.4, 0.1);
    earL.render();

    // Left inner ear (pink)
    innerEarL.color = [1.0, 0.7, 0.8, 1.0];
    innerEarL.matrix = new Matrix4(head_mat);
    innerEarL.matrix.translate(0.17, 0.25, 0.18);
    if(g_animationShift) {
      innerEarL.matrix.rotate(90 + earSwivelAngle, 0, 1, 0); // Match outer ear swivel
    } else {
      innerEarL.matrix.rotate(90, 0, 1, 0);
    }
    innerEarL.matrix.translate(0, 0, -0.01);
    innerEarL.matrix.scale(0.04, 0.35, 0.08);
    innerEarL.render();

    earR.color = [0.6, 0.6, 0.6, 1.0];
    earR.matrix = new Matrix4(head_mat);
    earR.matrix.translate(0.01, 0.25, 0.2);
    if(g_animationShift) {
      earR.matrix.rotate(90 - earSwivelAngle, 0, 1, 0); // Opposite swivel for right ear
    } else {
      earR.matrix.rotate(90, 0, 1, 0);
    }
    earR.matrix.scale(0.05, 0.4, 0.1);
    earR.render();

    // Right inner ear (pink)
    innerEarR.color = [1.0, 0.7, 0.8, 1.0];
    innerEarR.matrix = new Matrix4(head_mat);
    innerEarR.matrix.translate(0.031, 0.25, 0.18);
    if(g_animationShift) {
      innerEarR.matrix.rotate(90 - earSwivelAngle, 0, 1, 0); // Match outer ear swivel
    } else {
      innerEarR.matrix.rotate(90, 0, 1, 0);
    }
    innerEarR.matrix.translate(0, 0, -0.01);
    innerEarR.matrix.scale(0.04, 0.35, 0.08);
    innerEarR.render();

    // Bigger eyes - white part
    eyeL.color = [1.0, 1.0, 1.0, 1.0];
    eyeL.matrix = new Matrix4(head_mat);
    eyeL.matrix.translate(0.21, 0.15, 0.05);
    eyeL.matrix.scale(0.07, 0.07, 0.07);
    eyeL.render();
    
    eyeR.color = [1.0, 1.0, 1.0, 1.0];
    eyeR.matrix = new Matrix4(head_mat);
    eyeR.matrix.translate(-0.03, 0.15, 0.05);
    eyeR.matrix.scale(0.07, 0.07, 0.07);
    eyeR.render();

    // Pupils
    eyeL.color = [0.0, 0.0, 0.0, 1.0];
    eyeL.matrix = new Matrix4(head_mat);
    eyeL.matrix.translate(0.25, 0.155, 0.065);  // Slightly adjusted position
    eyeL.matrix.scale(0.04, 0.04, 0.04);        // Slightly smaller pupil
    eyeL.render();

    eyeR.color = [0.0, 0.0, 0.0, 1.0];
    eyeR.matrix = new Matrix4(head_mat);
    eyeR.matrix.translate(-0.035, 0.155, 0.065); // Slightly adjusted position
    eyeR.matrix.scale(0.04, 0.04, 0.04);         // Slightly smaller pupil
    eyeR.render();
    
    // Smaller snout
    snout.color = [0.6, 0.6, 0.6, 1.0];
    snout.matrix = head_mat;
    snout.matrix.translate(0.03, 0, -0.1);
    var snout_mat = new Matrix4(snout.matrix);
    snout.matrix.scale(0.2, 0.1, 0.1);
    snout.render();

    nose.color = [1.0, 0.7, 0.8, 1.0];
    nose.matrix = snout_mat;
    nose.matrix.translate(0.06, 0.05, -0.03);
    nose.matrix.scale(0.08, 0.06, 0.08);
    nose.render();
  }

  {
    legFL_1.color = [0.6, 0.6, 0.6, 1.0];
    legFL_1.matrix.setTranslate(0.12, -0.05, -0.25);
    legFL_1.matrix.rotate(l_flAngle, 1, 0, 0);
    var fl_matrix = new Matrix4(legFL_1.matrix);
    legFL_1.matrix.rotate(180, 1, 0, 0);
    legFL_1.matrix.scale(0.1, 0.17, 0.13); // Shorter legs
    legFL_1.render();

    legFL_2.color = [0.6, 0.6, 0.6, 1.0];
    legFL_2.matrix = fl_matrix;
    legFL_2.matrix.translate(0.01, -0.01, -0.1); // Shorter segments
    legFL_2.matrix.rotate(180, 1, 0, 0);
    legFL_2.matrix.rotate(l_flLowerAngle, 1, 0, 0);
    var fl2_matrix = new Matrix4(legFL_2.matrix);
    legFL_2.matrix.scale(0.08, 0.25, 0.08);
    legFL_2.render();

    legFL_3.color = [0.9, 0.9, 0.9, 1.0];
    legFL_3.matrix = fl2_matrix;
    legFL_3.matrix.translate(0, 0.15, 0.01);
    legFL_3.matrix.scale(0.1, 0.1, 0.1);
    legFL_3.render();
  }

  // Front right leg
  {
    legFR_1.color = [0.6, 0.6, 0.6, 1.0];
    legFR_1.matrix.setTranslate(-0.22, -0.05, -0.25);
    legFR_1.matrix.rotate(l_frAngle, 1, 0, 0);
    var fr_matrix = new Matrix4(legFR_1.matrix);
    legFR_1.matrix.rotate(180, 1, 0, 0);
    legFR_1.matrix.scale(0.1, 0.17, 0.13);
    legFR_1.render();

    legFR_2.color = [0.6, 0.6, 0.6, 1.0];
    legFR_2.matrix = fr_matrix;
    legFR_2.matrix.translate(0.01, -0.01, -0.1);
    legFR_2.matrix.rotate(180, 1, 0, 0);
    legFR_2.matrix.rotate(l_frLowerAngle, 1, 0, 0);
    var fr2_matrix = new Matrix4(legFR_2.matrix);
    legFR_2.matrix.scale(0.08, 0.18, 0.08);
    legFR_2.render();

    legFR_3.color = [0.9, 0.9, 0.9, 1.0];
    legFR_3.matrix = fr2_matrix;
    legFR_3.matrix.translate(0, 0.15, 0.01);
    legFR_3.matrix.scale(0.1, 0.1, 0.1);
    legFR_3.render();
  }

  // Back legs (more powerful hind legs)
  {
    legBL_1.color = [0.6, 0.6, 0.6, 1.0];
    legBL_1.matrix.translate(0.1, -0.01,0.35);
    legBL_1.matrix.rotate(180, 1, 0, 0);
    legBL_1.matrix.rotate(l_blAngle, 1, 0, 0);
    var bl_matrix = new Matrix4(legBL_1.matrix);
    legBL_1.matrix.scale(0.2, 0.2, 0.3); // Thicker hind legs
    legBL_1.render();

    legBL_2.color = [0.6, 0.6, 0.6, 1.0];
    legBL_2.matrix = bl_matrix;
    legBL_2.matrix.translate(0.13, 0.1, 0.1);
    legBL_2.matrix.rotate(l_blLowerAngle, 1, 0, 0);
    var bl2_matrix = new Matrix4(legBL_2.matrix);
    legBL_2.matrix.scale(0.1, 0.25, 0.1); // Longer hind legs
    legBL_2.render();

    legBL_3.color = [0.9, 0.9, 0.9, 1.0];
    legBL_3.matrix = bl2_matrix;
    legBL_3.matrix.translate(0.05, 0.4, 0.05);
    legBL_3.matrix.scale(0.12, 0.12, 0.12);
    legBL_3.matrix.translate(-0.5, -2, -0.5);
    legBL_3.render();
  }
  // Back right leg
  {
    legBR_1.color = [0.6, 0.6, 0.6, 1.0];
    legBR_1.matrix.translate(-0.3, 0.01, 0.35);
    legBR_1.matrix.rotate(180, 1, 0, 0);
    legBR_1.matrix.rotate(l_brAngle, 1, 0, 0);
    var br_matrix = new Matrix4(legBR_1.matrix);
    legBR_1.matrix.scale(0.2, 0.2, 0.3);
    legBR_1.render();

    legBR_2.color = [0.6, 0.6, 0.6, 1.0];
    legBR_2.matrix = br_matrix;
    legBR_2.matrix.translate(-0.03, 0.1, 0.1);
    legBR_2.matrix.rotate(l_brLowerAngle, 1, 0, 0);
    var br2_matrix = new Matrix4(legBR_2.matrix);
    legBR_2.matrix.scale(0.1, 0.25, 0.1);
    legBR_2.render();

    legBR_3.color = [0.9, 0.9, 0.9, 1.0];
    legBR_3.matrix = br2_matrix;
    legBR_3.matrix.translate(0., 0.4, 0.05);
    legBR_3.matrix.scale(0.12, 0.12, 0.12);
    legBR_3.matrix.translate(-0.2, -2, -0.5);
    legBR_3.render();
  }

  var duration = performance.now() - start_time;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration), 'performance-display');
}

function sendTextToHTML(txt, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if(!htmlID) {
    console.log("Failed to get " + htmlID + " from HTML.");
    return;
  }
  htmlElm.innerHTML = txt;
}
var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

function tick() {
  g_seconds = performance.now()/1000.0 - g_startTime;
  renderAllShapes();
  requestAnimationFrame(tick);
}

function main() {
  setUpWebGL();
  connectVariablesToGLSL();
  addActionListeners();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  renderAllShapes();
  requestAnimationFrame(tick);
}
