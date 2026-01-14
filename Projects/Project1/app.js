/**
 * @author     : Francisco Rodrigues, 67753
 * @author     : Miguel Rosalino, 68210
 * P2
 * CGI Project 1, 2025/2026
 */

import { loadShadersFromURLS, buildProgramFromSources, setupWebGL } from "../../libs/utils.js";
import { vec2, flatten, sizeof } from "../../libs/MV.js";
import { Family1 } from "./CurveFamilies/SpecificFamilies/Family1.js";
import { Family2 } from "./CurveFamilies/SpecificFamilies/Family2.js";
import { Family3 } from "./CurveFamilies/SpecificFamilies/Family3.js";
import { Family4 } from "./CurveFamilies/SpecificFamilies/Family4.js";
import { Family5 } from "./CurveFamilies/SpecificFamilies/Family5.js";
import { Family6 } from "./CurveFamilies/SpecificFamilies/Family6.js";
import { CirclesHandler } from "./Circle/CirclesHandler.js";

const totalCirclePoints = 100.0; // Number of points to draw a circle
const maxNumberOfPoints = 60000.0;
const minNumberOfPoints = 500.0;
const stepNumberOfPoints = 500.0; // Increment/Decrement number of points by 500
const ZoomInFactor = 1.06; // Zoom in (shrink) by 6%
const ZoomOutFactor = 0.94; // Zoom out (grow) by 6%

let numberOfPoints = maxNumberOfPoints;
let drawLines = false;
let animateFlag = false;
let curveFamily = 1;
let ratio;
let vao;
let canvas;
let gl;
let program;
let curve, circles;

function zoomIn() {
    curve.zoom(ZoomInFactor); // shrink by 6%
}

function zoomOut() {
    curve.zoom(ZoomOutFactor); // grow by 6%
}

function resize(target) {
    // Aquire the new window dimensions
    const width = target.innerWidth;
    const height = target.innerHeight;

    // Set canvas size to occupy the entire window
    canvas.width = width;
    canvas.height = height;
    ratio = width / height;
    // Set the WebGL viewport to fill the canvas completely
    gl.viewport(0, 0, width, height);
}

function handleKeyDown(event) {
    switch (event.key) {
        case 'h':
            //toggle hide/show of panels
            const helpPanel = document.getElementById("overlay-bottom");
            helpPanel.style.display = (helpPanel.style.display === "none") ? "block" : "none";
            const infoLabel = document.getElementById("overlay-top");
            infoLabel.style.display = (infoLabel.style.display === "none") ? "block" : "none";
            const features = document.getElementById("overlay-right");
            features.style.display = (features.style.display === "none") ? "block" : "none";
            break;
        case '+':
            // Increase number of points
            if (numberOfPoints < maxNumberOfPoints)
                numberOfPoints += stepNumberOfPoints;
            break;
        case '-':
            // Decrease number of points
            if (numberOfPoints > minNumberOfPoints)
                numberOfPoints -= stepNumberOfPoints;
            break;
        case 'r':
            // Reset curve parameters
            curve.resetParameters();
            animateFlag = false;
            break;
        case ' ':
            // Toggle animation
            animateFlag = !animateFlag;
            break;
        case 'ArrowUp':
            // Increase current parameter
            curve.incrementCurrentParameter();
            animateFlag = false;
            break;
        case 'ArrowDown':
            // Decrease current parameter
            curve.decrementCurrentParameter();
            animateFlag = false;
            break;
        case 'ArrowLeft':
            // Choose previous parameter
            curve.previousParameter();
            break;
        case 'ArrowRight':
            // Choose next parameter
            curve.nextParameter();
            break;
        case 'PageUp':
            // Increase interval
            curve.incrementInterval();
            break;
        case 'PageDown':
            // Decrease interval
            curve.decrementInterval();
            break;
        case 'p':
            // Toggle draw lines/points
            drawLines = !drawLines;
            break;
        case '1':
            // Switch to curve family 1
            curve = new Family1();
            curveFamily = 1;
            animateFlag = false;
            break;
        case '2':
            // Switch to curve family 2
            curve = new Family2();
            curveFamily = 2;
            animateFlag = false;
            break;
        case '3':
            // Switch to curve family 3
            curve = new Family3();
            curveFamily = 3;
            animateFlag = false;
            break;
        case '4':
            // Switch to curve family 4
            curve = new Family4();
            curveFamily = 4;
            animateFlag = false;
            break;
        case '5':
            // Switch to curve family 5
            curve = new Family5();
            curveFamily = 5;
            animateFlag = false;
            break;
        case '6':
            // Switch to curve family 6
            curve = new Family6();
            curveFamily = 6;
            animateFlag = false;
            break;
        case 'a':
            // Add circle
            circles.createCircle(ratio);
            break;
        case 'd':
            // Remove circle
            circles.removeCircle();
            break;
    }
}

// Write info to the top left overlay panel
function writeTopOverlayInfo() {
    const infoLabel = document.getElementById("info_label");
    var interval = curve.getInterval();
    infoLabel.innerText =
        "Curve:\n" +
        `t min: ${interval[0].toFixed(2)} \n` +
        `t max: ${interval[1].toFixed(2)} \n`;
    var coefs = curve.getCoefs();
    var numOfCoefs = curve.getNumCoefs();
    infoLabel.innerText += `Coefs: [`
    for (let i = 0; i < numOfCoefs; i++) {
        infoLabel.innerText += `${coefs[i].toFixed(2)}${i < numOfCoefs - 1 ? ', ' : ''}`;
    }
    infoLabel.innerText += `]`;
}

// Write info to the bottom left overlay panel
function writeBottomOverlayInfo() {
    const helpPanel = document.getElementById("help_panel");
    helpPanel.innerText =
        "'h' - Toggle this panel\n" +
        "'1' : Curve 1\n" +
        "'2' : Curve 2\n" +
        "'3' : Curve 3\n" +
        "'4' : Curve 4\n" +
        "'5' : Curve 5\n" +
        "'6' : Curve 6\n" +
        "'↑' : Increase coefficient\n" +
        "'↓' : Decrease coefficient\n" +
        "'←' : Choose previous coefficient\n" +
        "'→' : Choose next coefficient\n" +
        "'Pg Up' : Increase upper limit\n" +
        "'Pg Down' : Decrease upper limit\n" +
        "' ' : Toggle animation\n" +
        "'r' : Reset coefficients\n" +
        "'p' : Toggle Lines/Points\n" +
        "'+' : Increase number of points\n" +
        "'-' : Decrease number of points";
}

// Write info to the right overlay panel
function writeRightOverlayInfo() {
    const features = document.getElementById("features");
    features.innerText =
        "'a' : Add Circle\n" +
        "'d' : Remove Circle\n" +
        "Max number of circles: " + circles.getMaxNumberOfCircles() + "\n" +
        "......................................................\n" +
        "Circles do not overlap and \nbounce when they collide\n" +
        "Curve segments increment pixel \nsize gradually if they are in a circle\n" +
        "......................................................\n" +
        "Made by: \nFrancisco Rodrigues | 67753\n&\nMiguel Rosalino | 68210";
}

function setup(shaders) {
    curve = new Family1();
    circles = new CirclesHandler();
    circles.createCircle(ratio);
    canvas = document.getElementById("gl-canvas");
    gl = setupWebGL(canvas, { alpha: true, preserveDrawingBuffer: false });
    // Create WebGL programs
    program = buildProgramFromSources(gl, shaders["shader1.vert"], shaders["shader1.frag"]);
    //write initial info to overlay panels
    writeTopOverlayInfo();
    writeBottomOverlayInfo();
    writeRightOverlayInfo();
    // Set up keyboard event handler
    window.onkeydown =  (event) => {
        handleKeyDown(event);
    };

    resize(window);

    // Handle resize events 
    window.addEventListener("resize", (event) => {
        resize(event.target);
    });

    // Handle mouse wheel events for zooming
    canvas.addEventListener("wheel", (event) => {
        if (event.deltaY < 0) {
            zoomIn();
        } else {
            zoomOut();
        }
    });
    
    // Handle mouse events for moving the curve
    var grabbing = false;
    var mousePos;

    window.addEventListener("mouseup", () => {
        grabbing = false;
    });

    canvas.addEventListener("mousedown", (event) => {
        grabbing = true;
        mousePos = vec2(event.clientX, event.clientY);
    });

    window.addEventListener("mousemove", (event) => {
        if (grabbing) {
            const newMousePos = vec2(event.clientX, event.clientY);
            const delta = vec2(mousePos[0] - newMousePos[0], mousePos[1] - newMousePos[1]);
            mousePos = newMousePos;
            curve.moveCurve(delta, canvas.width, canvas.height);
        }
    });

    // Create and bind buffers with the number of points for circles and curve
    const points = [];
    for (let i = 0.0; i < totalCirclePoints * CirclesHandler.maxNumberOfCircles; i++) {
        points.push(i);
    }

    for (let i = 0.0; i < numberOfPoints; i++) {
        points.push(i);
    }

    const aBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, aBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const a_numberOfCurrentPoint = gl.getAttribLocation(program, "a_numberOfCurrentPoint");

    gl.vertexAttribPointer(a_numberOfCurrentPoint, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_numberOfCurrentPoint);

    gl.bindVertexArray(null);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    window.requestAnimationFrame(animate);
}

function animate() {
    window.requestAnimationFrame(animate);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    gl.bindVertexArray(vao);
    // Draw circles
    gl.uniform1i(gl.getUniformLocation(program, "u_isCircle"), true);
    gl.uniform1f(gl.getUniformLocation(program, "u_ratio"), ratio);
    gl.uniform1f(gl.getUniformLocation(program, "u_numberOfCirclePoints"), totalCirclePoints);
    // Update circle positions after moving
    circles.updateCircles(ratio);

    // Draw each circle
    const it = circles.getCirclesIterator();
    while (it.hasNext()) {
        const circle = it.next();
        gl.uniform3fv(gl.getUniformLocation(program, "u_circle"), circle.getCircle());
        gl.drawArrays(gl.TRIANGLE_FAN, 0, totalCirclePoints);
    }
    // if animateFlag is true, increment the current parameter each frame
    if (animateFlag) {
        curve.incrementCurrentParameter();
    }
    //update info in top panel
    writeTopOverlayInfo();
    // Draw curve
    gl.uniform1i(gl.getUniformLocation(program, "u_curveFamily"), curveFamily);
    gl.uniform3fv(gl.getUniformLocation(program, "u_coefs"), curve.getCoefs());
    gl.uniform2fv(gl.getUniformLocation(program, "u_t"), curve.getInterval());
    gl.uniform1f(gl.getUniformLocation(program, "u_numberOfPoints"), numberOfPoints);
    gl.uniform4fv(gl.getUniformLocation(program, "u_curveLimits"), curve.getLimits());
    gl.uniform1i(gl.getUniformLocation(program, "u_isCircle"), false);
    // Pass circle centers to the shader
    const circleCenters = [];
    const it2 = circles.getCirclesIterator();
    while (it2.hasNext()) {
        const circle = it2.next();
        circleCenters.push(vec2(circle.centerX, circle.centerY));
    }
    const numberOfCircles = circles.getNumberOfCircles();
    gl.uniform1i(gl.getUniformLocation(program, "u_numberOfCircles"), numberOfCircles);
    if (numberOfCircles != 0)
        gl.uniform2fv(gl.getUniformLocation(program, "u_circleCenters"), flatten(circleCenters));
    // Draw the curve as a line strip or as points based on drawLines flag
    gl.drawArrays(drawLines ? gl.LINE_STRIP : gl.POINTS, totalCirclePoints * CirclesHandler.maxNumberOfCircles, numberOfPoints);
    
    // Deactivate the vertex array object since drawing is complete
    gl.bindVertexArray(null);

    gl.useProgram(null);
}

loadShadersFromURLS(["shader1.vert", "shader1.frag"]).then(shaders => setup(shaders));
