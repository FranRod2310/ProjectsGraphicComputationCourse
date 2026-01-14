import { buildProgramFromSources, loadShadersFromURLS, setupWebGL, loadJSONFile } from "../../libs/utils.js";
import { ortho, perspective, lookAt, flatten, vec4, vec3, mat4, inverse, mult, rotateX, rotateY, add, translate, vec2, rotateZ, scale } from "../../libs/MV.js";
import { modelView, loadMatrix, multRotationX, multRotationY, multRotationZ, multScale, multTranslation, popMatrix, pushMatrix, multMatrix } from "../../libs/stack.js";

import * as CUBE from '../../libs/objects/cube.js';
import * as CYLINDER from '../../libs/objects/cylinder.js'
import * as SPHERE from '../../libs/objects/sphere.js'

function setup(shaders, sceneGraph) {
    const totalTomatoes = 20;
    const maxTomatoesPerRow = 10;
    let tomatoesLeft = totalTomatoes;
    //tolerance for checking existing smashed tomatoes on that position
    const tolerance = 0.01;
    //limit for tank movement (so it doesn't go out of the ground)
    const limitMovement = 23.5;
    const zoomInLimitParallel = 2;
    const zoomOutLimitParallel = 30;
    const zoomInLimitPerspective = 0.1;
    const zoomOutLimitPerspective = 2;
    const defaultZoom = 15;
    const perspectiveZoom = 1;
    const moveFactor = 0.05;
    const axonometricValueToAdd = 0.3;
    const obliqueValueToAdd = 0.03;
    const zoomFactor = 1.1;
    const axonometricDefaultParams = vec2(5, 15);
    const obliqueDefaultParams = vec2(1, -0.5);
    const look = 50;
    const fovy = 50;
    let mView = mat4();
    let tankCenter = calcCenterTank();
    const tankCenterX = tankCenter[0];
    const tankCenterY = tankCenter[1];
    const tankCenterZ = tankCenter[2];
    let translationX = 0;

    let isPerspective = false;
    let axonometric = true;
    let multipleViews = false;  

    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;
    let zoom;
    let zoomInLimit = isPerspective ? zoomInLimitPerspective : zoomInLimitParallel;
    let zoomOutLimit = isPerspective ? zoomOutLimitPerspective : zoomOutLimitParallel;

    //params[0] = alpha/theta, params[1] = l/gamma
    let params = vec2(0, 0);
    let viewIndex = 4; 
    let mProjection;

    //initialize values and write info
    writeBottomOverlayInfo();
    writeTomatoField();
    resetZoom();
    resetValues();

    /** @type WebGL2RenderingContext */
    let gl = setupWebGL(canvas);

    // Drawing mode (gl.LINES or gl.TRIANGLES)
    let mode = gl.TRIANGLES;

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    resize_canvas();

    //event listeners
    window.addEventListener("resize", resize_canvas);
    document.getElementById("reload-button").addEventListener("click", () => {
        reloadTomatoes();
    });

    //reload tomatoes
    function reloadTomatoes() {
        tomatoesLeft = totalTomatoes;
        writeTomatoField();
    }

    //update aspect ratio
    function resize_canvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        aspect = canvas.width / canvas.height;
    }

    //upload projection matrix to shader
    function uploadProjection() {
        uploadMatrix("u_projection", mProjection);
    }

    //upload model view matrix to shader
    function uploadModelView() {
        uploadMatrix("u_model_view", modelView());
    }

    //upload matrix to shader
    function uploadMatrix(name, m) {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, name), false, flatten(m));
    }

    //write bottom overlay info
    function writeBottomOverlayInfo() {
        const helpPanel = document.getElementById("help_panel");
        helpPanel.innerText =
            "'h' - Toggle this panel\n" +
            "'0' : Toggle 1/4 views\n" +
            "'1' : Front view\n" +
            "'2' : Left view\n" +
            "'3' : Top view\n" +
            "'4' : 4th view\n" +
            "'8' : Toggle 4th view (Oblique vs Axonometric)\n" +
            "'9' : Parallel vs Perspective\n" +
            "' ' : Toggle wireframe/solid\n" +
            "'q' : Move forward\n" +
            "'e' : Move backward\n" +
            "'w' : Raise cannon\n" +
            "'s' : Lower cannon\n" +
            "'a' : Rotate cabin ccw\n" +
            "'d' : Rotate cabin cw\n" +
            "'z' : Shoot tomato\n" +
            "'r' : Reset view params\n" +
            "'←' : Increase theta/alpha\n" +
            "'→' : Decrease theta/alpha\n" +
            "'↑' : Increase gamma/l\n" +
            "'↓' : Decrease gamma/l\n"+
            "'p' : Reload tomatoes\n";
    }

    //write tomato field
    function writeTomatoField() {
        const container = document.getElementById("tomato-field");
        // Clear existing tomatoes
        container.innerHTML = "";
        container.innerText = "Tomatoes Left: " 
        // Calculate how many rows are needed
        const numRows = Math.ceil(totalTomatoes / maxTomatoesPerRow);

        for (let i = 0; i < numRows; i++) {
            const row = document.createElement("div");
            row.classList.add("row");
            const tomatoesInRow = Math.min(maxTomatoesPerRow, totalTomatoes - i * maxTomatoesPerRow);
            for (let j = 0; j < tomatoesInRow; j++) {
                //add tomato to row
                const tomato = document.createElement("div");
                //if used tomato
                if (totalTomatoes - (i * maxTomatoesPerRow + j) > tomatoesLeft)
                    tomato.classList.add("usedTomato");
                else
                    tomato.classList.add("tomato");
                row.appendChild(tomato);
            }
            //add row to tomato field
            container.appendChild(row);
        }
    }

    //zoom in/out with mouse wheel
    document.onwheel = function (event) {
        if (event.deltaY < 0 && zoom) {
            zoom /= zoomFactor;
        } else {
            zoom *= zoomFactor;
        }
        //limit zoom
        zoom = Math.max(Math.min(zoom, zoomOutLimit), zoomInLimit);
    }
    
    //reset view params
    function resetValues() {
        if (axonometric) {
            params[0] = axonometricDefaultParams[0];
            params[1] = axonometricDefaultParams[1];
        } else {
            params[0] = obliqueDefaultParams[0];
            params[1] = obliqueDefaultParams[1];
        }
    }

    //reset zoom values
    function resetZoom() {
        zoomInLimit = isPerspective ? zoomInLimitPerspective : zoomInLimitParallel;
        zoomOutLimit = isPerspective ? zoomOutLimitPerspective : zoomOutLimitParallel;
        if (isPerspective) 
            zoom = perspectiveZoom;
        else 
            zoom = defaultZoom;
    }

    //get value to add to params based on view type
    function getValueToAdd() {
        if(axonometric)
            return axonometricValueToAdd;
        else 
            return obliqueValueToAdd;
    }

    //updates view index
    function updateView(index){
        if (multipleViews) return;
        viewIndex = index;
        if(index == 4)
            resetValues();
        else
            axonometric = true;
    }

    document.onkeydown = function (event) {
        switch (event.key) {
            case 'h':
                // Toggle help panel
                const helpPanel = document.getElementById("overlay-bottom");
                helpPanel.style.display = (helpPanel.style.display === "none") ? "block" : "none";
                break;
            case '0':
                // Toggle 1/4 views
                multipleViews = !multipleViews;
                break;
            case '1':
                // Front view
                updateView(1);
                break;
            case '2':
                // Left view
                updateView(2);
                break;
            case '3':
                // Top view
                updateView(3);
                break;
            case '4':
                // 4th view
                updateView(4);
                break;
            case '8':
                // Toggle 4th view (Oblique vs Axonometric)
                if (viewIndex != 4 && !multipleViews) break;
                axonometric = !axonometric;
                isPerspective = false;
                resetValues();
                resetZoom();
                viewIndex = 4;
                break;
            case '9':
                // Parallel vs Perspective
                axonometric = true;
                isPerspective = !isPerspective;
                resetZoom();
                break;
            case ' ':
                // Toggle wireframe/solid
                mode = mode == gl.TRIANGLES ?  gl.LINES : gl.TRIANGLES;
                break;
            case 'q':
                // Move forward
                moveTank(1);
                break;
            case 'e':
                // Move backward
                moveTank(-1);
                break;
            case 'w':
                // Raise cannon
                addrotationCannon(-1);
                break;
            case 's':
                // Lower cannon
                addrotationCannon(1);
                break;
            case 'a':
                // Rotate cabin ccw
                addrotationCabin(1);
                break;
            case 'd':
                // Rotate cabin cw
                addrotationCabin(-1);
                break;
            case 'z':
                // Shoot tomato
                shootTomato();
                break;
            case 'r':
                // Reset view;
                resetValues();
                resetZoom();
                break;
            case 'ArrowLeft': 
                //increase alpha/theta
                if(viewIndex != 4 && !multipleViews) break;
                params[0] += getValueToAdd();
                break;
            case 'ArrowRight': 
                //decrease alpha/theta
                if(viewIndex != 4 && !multipleViews) break;
                params[0] -= getValueToAdd();
                break;
            case 'ArrowUp': 
                //increase l/gamma
                if(viewIndex != 4 && !multipleViews) break;
                params[1] += getValueToAdd();
                break;
            case 'ArrowDown': 
                //decrease l/gamma
                if(viewIndex != 4 && !multipleViews) break;
                params[1] -= getValueToAdd();
                break;
            case 'p':
                //reload tomatoes
                reloadTomatoes();
                break;
        }
    }

    // Set clear color and enable depth test
    gl.clearColor(0.549, 0.643, 0.718, 1.0);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test

    //initialize objects
    CUBE.init(gl);
    CYLINDER.init(gl);
    SPHERE.init(gl);
    // Start rendering
    window.requestAnimationFrame(render);

    //------------------ Move/Rotate functions ------------------//
    //rotate cabin
    function addrotationCabin(rotation) {
        let node = findNodeByName(sceneGraph, "cabinNode");
        node.transform.rotation[1] += rotation;
    }

    //rotate cannon
    function addrotationCannon(rotation) {
        let node = findNodeByName(sceneGraph, "cannonSupportNode");
        if (node.transform.rotation[2] + rotation > -45 && node.transform.rotation[2] + rotation < 10)
            node.transform.rotation[2] += rotation;
    }

    //move tank
    function moveTank(direction) {
        if (translationX - direction * moveFactor > limitMovement || translationX - direction * moveFactor < -limitMovement)
            return;
        let tankNode = findNodeByName(sceneGraph, "tankNode");
        translationX -= direction * moveFactor;
        tankNode.transform.translation[0] = translationX;
        rotateWheels(findNodeByName(tankNode, "leftWheelsNode"), direction);
        rotateWheels(findNodeByName(tankNode, "rightWheelsNode"), direction);

    }

    //rotate wheels (only when tank moves)
    function rotateWheels(node, direction) {
        let wheel = findPartByName("wheelNode");
        let perimeter = wheel.transform.scale[0] * Math.PI;
        for (let child of node.children)
            child.transform.rotation[2] += 360*(direction * moveFactor / perimeter);
    }

    //------------------ Graph functions ------------------//

    //find part in sceneGraph.parts 
    function findPartByName(name) {
        for (let part of sceneGraph.parts) {
            if (part.name == name) 
                return part;
        }
        return null;
    }

    //find node in sceneGraph 
    function findNodeByName(node, name) {
        if (node.name == name)
            return node;
        if (node.children) {
            for (let child of node.children) {
                let result = findNodeByName(child, name);
                if (result) return result;
            }
        }
        return null;
    }

    //insert node as child of parentNode
    function insertNode(parentNode, newNode) {
        if (!parentNode.children) {
            parentNode.children = [];
        }
        parentNode.children.push(newNode);
    }

    //copy ground node (to create tiles)
    function copyGroundNode(node) {
        if (node.name == "groundNode") {
            let newNode = {
                name: node.name,
                type: node.type,
                numTiles: node.numTiles,
                transform: {
                    translation: [0, 0, 0],
                    rotation: node.transform.rotation,
                    scale: node.transform.scale
                },
                tileTypes: node.tileTypes,
                pos: [node.pos[0], node.pos[1]]
            };
            return newNode;
        }
    }

    // Calculate the center position of the tank
    function calcCenterTank(){
        let ext = getTankExtremes();
        return vec3((ext[0] + ext[1]) / 2, (ext[2] + ext[3]) / 2, (ext[4] + ext[5]) / 2);
    }
    
    // Get tank extremes in each axis
    function getTankExtremes() {
        let draw = false;
        traverseNodeMatrix(sceneGraph, 0, draw);
        let tankNode = findNodeByName(sceneGraph, "tankNode");
        let x = [Infinity, -Infinity];
        let y = [Infinity, -Infinity];
        let z = [Infinity, -Infinity];

        //recursive function to get min and max coordinates of tank in each axis
        function getMinMax(node, tmpMat) {
            if (!node) return;
            if (node.type == "leaf") {
                let mat = mult(tmpMat, 
                    mult(translate(node.transform.translation), 
                    mult(rotateZ(node.transform.rotation[2]), 
                    mult(rotateY(node.transform.rotation[1]), 
                    rotateX(node.transform.rotation[0])))));
                let ext1 = mult(mat, translate(node.transform.scale[0]/2, node.transform.scale[1]/2, node.transform.scale[2]/2));
                let ext2 = mult(mat, translate(-node.transform.scale[0]/2, -node.transform.scale[1]/2, -node.transform.scale[2]/2));
                let xMin = Math.min(ext1[0][3], ext2[0][3]);
                let xMax = Math.max(ext1[0][3], ext2[0][3]);
                let yMin = Math.min(ext1[1][3], ext2[1][3]);
                let yMax = Math.max(ext1[1][3], ext2[1][3]);
                let zMin = Math.min(ext1[2][3], ext2[2][3]);
                let zMax = Math.max(ext1[2][3], ext2[2][3]);
                //if min/max are smaller/bigger than current extremes, update them
                if (xMin < x[0]) x[0] = xMin;
                if (xMax > x[1]) x[1] = xMax;
                if (yMin < y[0]) y[0] = yMin;
                if (yMax > y[1]) y[1] = yMax;
                if (zMin < z[0]) z[0] = zMin;
                if (zMax > z[1]) z[1] = zMax;
            } else {
                if (node.children) 
                    for (let child of node.children) 
                        getMinMax(child, node.localToWorld);
                if (node.uses)
                    getMinMax(findPartByName(node.uses), node.localToWorld);
            }
        }
        getMinMax(tankNode, tankNode.localToWorld);
        //return extremes
        return [x[0], x[1], y[0], y[1], z[0], z[1]];
    }

    //add smashed tomato node
    function addSmashedTomato(tomato) {
        let smashedTomatoPrimitive = findPartByName("smashedTomato");
        let smashedTomatoNode = {
            name: "smashedTomatoNode",
            type: "internal",
            transform: {
                translation: [tomato.position[0], smashedTomatoPrimitive.transform.scale[1] / 2, tomato.position[2]],
                rotation: [0, 0, 0],
                scale: [1, 1, 1]
            },
            uses: "smashedTomato"
        };
        insertNode(findNodeByName(sceneGraph, "onGroundNode"), smashedTomatoNode);
    }

    //check if smashed tomato already exists at tomato position
    function hasSmashedTomato(tomato) {
        let parentNode = findNodeByName(sceneGraph, "onGroundNode");
        for (let child of parentNode.children) {
            if (child.name == "smashedTomatoNode" && Math.abs(child.transform.translation[0] - tomato.position[0]) < tolerance && Math.abs(child.transform.translation[2] - tomato.position[2]) < tolerance) {
                return true;
            }
        }
        return false;
    }

    //remove 1st tomato found from scene graph and add smashed tomato
    function removeTomato() {
        let newChildren = [];
        let foundTomato = false;
        let tomato = null;
        let parentNode = findNodeByName(sceneGraph, "onGroundNode");
        for (let i = 0; i < parentNode.children.length; i++) {
            if (parentNode.children[i].name == "tomatoNode" && !foundTomato) {
                foundTomato = true;
                tomato = parentNode.children[i];
                continue;
            }
            newChildren.push(parentNode.children[i]);
        }
        sceneGraph.numTomatoes--;
        parentNode.children = newChildren;
        //add smashed tomato if there isn't one already at that position
        if(!hasSmashedTomato(tomato))
            addSmashedTomato(tomato);
    }

    //shoot tomato
    function shootTomato() {
        //check if there are tomatoes left
        if (tomatoesLeft <= 0) return;
        tomatoesLeft--;
        //update tomato field
        writeTomatoField();
        //increment tomato count
        if (!sceneGraph.numTomatoes)
            sceneGraph.numTomatoes = 0;
        sceneGraph.numTomatoes++;

        let cannonPrimitive = findPartByName("cannon");
        let tomatoPrimitive = findPartByName("tomato");
        let cannonNode = findNodeByName(sceneGraph, "cannonNode");
        //calculate tomato start position in world coordinates
        let tomatoStartPos = mult(cannonNode.localToWorld,
            translate(tomatoPrimitive.transform.scale[0]/2 - cannonPrimitive.transform.scale[1] / 2, 0, 0)
        );

        //add new tomato node
        let newTomatoNode = {
            name: "tomatoNode",
            type: "internal",
            transform: {
                translation: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1]
            },
            position: mult(tomatoStartPos, tomatoPrimitive.initPosition),
            speed: mult(tomatoStartPos, tomatoPrimitive.initSpeed),
            uses: "tomato",
            localToWorld: tomatoStartPos,
        };
        insertNode(findNodeByName(sceneGraph, "onGroundNode"), newTomatoNode);
    }

    //recursive function that traverses the scene graph and calls drawNode on leaf nodes if draw==true
    function traverseNodeMatrix(node, draw) {
        if (!node) return;
        pushMatrix();
        if(node.name == "tomatoNode"){
            //move tomato
            node.position = add(node.position, node.speed);
            //remove tomato from scene graph
            if(node.position[1] <= 0){
                removeTomato();
                popMatrix();
                return;
            }
            //apply gravity to tomato speed
            node.speed = add(node.speed, vec4(0, -0.001, 0, 0));
            node.transform.translation = [node.position[0], node.position[1], node.position[2]];   
        }
        
        //apply transformations
        multTranslation(node.transform.translation);
        multRotationZ(node.transform.rotation[2]);
        multRotationY(node.transform.rotation[1]);
        multRotationX(node.transform.rotation[0]);
        multScale(node.transform.scale);
        
        //calculate localToWorld
        node.localToWorld = (mult(inverse(mView), modelView()));
        
        // Draw leaf node primitives
        if (draw && node.type == "leaf") 
            drawNode(node);

        //create ground tiles
        if (node.name == "groundNode" && !node.children) {
            let evenTile = findPartByName(node.tileTypes[0]);
            let oddTile = findPartByName(node.tileTypes[1]);

            //add right tile            
            if (node.pos[0] < node.numTiles[0] - 1 ) {
                let newNode = copyGroundNode(node);
                newNode.pos[0] = node.pos[0] + 1;
                newNode.transform.translation[0] = evenTile.transform.scale[0];
                if (!newNode.uses) 
                    newNode.uses = ((node.pos[0] + 1 + node.pos[1]) % 2 == 0) ? evenTile.name : oddTile.name;
                insertNode(node, newNode);
            }
            //add down tile, only in the first column
            if (node.pos[1] < node.numTiles[1] - 1 && node.pos[0] == 0) {
                let newNode = copyGroundNode(node);
                newNode.pos[1] = node.pos[1] + 1;
                newNode.transform.translation[2] = evenTile.transform.scale[2];
                if (!newNode.uses) 
                    newNode.uses = ((node.pos[0] + 1 + node.pos[1]) % 2 == 0) ? evenTile.name : oddTile.name;
                insertNode(node, newNode);
            }
        }
        //recursive call for used parts
        if (node.uses) 
            traverseNodeMatrix(findPartByName(node.uses), draw);

        //recursive call for children nodes
        if (node.children) 
            for (let child of node.children) 
                traverseNodeMatrix(child, draw);
            
        popMatrix();
    }

    // Draw the node (only leaf nodes)
    function drawNode(node) {
        gl.uniform4fv(gl.getUniformLocation(program, "u_color"), node.color);
        uploadModelView();
        switch (node.primitive) {
            case "cube":
                CUBE.draw(gl, program, mode);
                break;
            case "cylinder":
                CYLINDER.draw(gl, program, mode);
                break;
            case "sphere":
                SPHERE.draw(gl, program, mode);
                break;
        }        
    }

    function render() {
        window.requestAnimationFrame(render);   
        // Clear the color and depth buffers
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(program);
        tankCenter = calcCenterTank();
        //calculate view matrix looking at tank center
        let frontView = lookAt([tankCenterX + translationX, tankCenterY, look], [tankCenterX + translationX, tankCenterY, tankCenter[2]], [0, 1, 0]);
        let leftView = lookAt([-look, tankCenterY, tankCenterZ], [tankCenterX + translationX, tankCenterY, tankCenterZ], [0, 1, 0]);
        let topView = lookAt([tankCenterX + translationX, look, tankCenterZ], [tankCenterX + translationX, tankCenterY, tankCenterZ], [0, 0, -1]);
        let obliqueCamTranslate = translate(tankCenterX - translationX, -tankCenterY, tankCenterZ - 10);
        let obliqueView = axonometric ? 
                    mult(frontView, mult(rotateX(params[0]), rotateY(params[1]))) :
                    mult(obliqueCamTranslate, 
                        mat4(
                        vec4(1,0,params[1] * Math.cos(params[0]),0),
                        vec4(0,1,params[1] * Math.sin(params[0]),0),
                        vec4(0,0,1,0), 
                        vec4(0,0,0,1)
                    ));

        //set view matrix
        switch (viewIndex) {
            case 1:
                mView = frontView;
                break;
            case 2:
                mView = leftView;
                break;
            case 3:
                mView = topView;
                break;
            case 4:
                mView = obliqueView;
                break;
        }
        
        //set projection matrix
        let ortoNear = -70 + look;
        let ortoFar = 70 + look;
        let perspectiveNear = -40 + look;
        let perspectiveFar = -60 + look;
        let orthoMatrix = ortho(-aspect * zoom, aspect * zoom, -zoom, zoom, ortoNear, ortoFar);
        let perspectiveMatrix = perspective(fovy *  zoom, aspect, perspectiveNear, perspectiveFar);
        mProjection = isPerspective ? perspectiveMatrix : orthoMatrix;
        uploadProjection(mProjection);

        let draw = true;
        //draw 4 views
        if (multipleViews) {            
            //front view - bottom-left
            gl.viewport(0, 0, canvas.width / 2, canvas.height / 2);
            mView = frontView;
            loadMatrix(mView);
            traverseNodeMatrix(sceneGraph, draw);

            //top view - top-left
            gl.viewport(0, canvas.height / 2, canvas.width / 2, canvas.height / 2);
            mView = topView;
            loadMatrix(mView);
            traverseNodeMatrix(sceneGraph, draw);

            //left view - bottom-right
            gl.viewport(canvas.width / 2, 0, canvas.width / 2, canvas.height / 2);
            mView = leftView;
            loadMatrix(mView);
            traverseNodeMatrix(sceneGraph, draw);

            //oblique view - top-right
            gl.viewport(canvas.width / 2, canvas.height / 2, canvas.width / 2, canvas.height / 2);
            mView = obliqueView;
            loadMatrix(mView);
            traverseNodeMatrix(sceneGraph, draw);
        } else {
            //single view
            loadMatrix(mView);
            gl.viewport(0, 0, canvas.width, canvas.height);
            traverseNodeMatrix(sceneGraph, draw);
        }
    }
}

const urls = ["shader.vert", "shader.frag"];
loadJSONFile('scene.json').then(json => loadShadersFromURLS(urls).then(shaders => setup(shaders, json)))