import { buildProgramFromSources, loadShadersFromURLS, setupWebGL, loadJSONFile } from '../../libs/utils.js';
import { length, flatten, inverse, mult, normalMatrix, perspective, ortho, lookAt, vec4, vec3, vec2, subtract, add, scale, rotate, normalize, mat4, translate } from '../../libs/MV.js';

import * as dat from '../../libs/dat.gui.module.js';

import * as CUBE from '../../libs/objects/cube.js';
import * as BUNNY from '../../libs/objects/bunny.js';
import * as CYLINDER from '../../libs/objects/cylinder.js';
import * as TORUS from '../../libs/objects/torus.js';
import * as SPHERE from '../../libs/objects/sphere.js';

import * as STACK from '../../libs/stack.js';

function setup(phongShaders, gouraudShaders, sceneGraph) {
    const canvas = document.getElementById('gl-canvas');
    const gl = setupWebGL(canvas);
    let wireframe = false;

    //extra: lightshow variables
    let playLightShow = false;
    let currentLightShow = 0;
    let startTime = 0;
    const delayTime = 100;
    let timesPlayed = 0;
    const maxReplays = 3;
    const lightShowInfo = [
        //lightinfo position, axis, intensities, aperture, cutoff
        [vec4(2, 10, -2, 1), vec3(0, -5, 0), vec3(0, 0, 0), vec3(60, 0, 0), vec3(200, 0, 0), 10, 0, 1],
        [vec4(-2, 10, 2, 1), vec3(0, -5, 0), vec3(0, 0, 0), vec3(0, 0, 80), vec3(0, 0, 240), 10, 0, 1],
        [vec4(-2, 10, -2, 1), vec3(0, -5, 0), vec3(0, 0, 0), vec3(60, 60, 0), vec3(200, 200, 0), 10, 0, 1],
        [vec4(2, 10, 2, 1), vec3(0, -5, 0), vec3(0, 0, 0), vec3(0, 60, 0), vec3(0, 200, 0), 10, 0, 1]
    ];

    //extra: spotlight on object variables
    let spotlightOnObject = [vec3(0, -5, 0), vec3(50, 50, 50), vec3(60, 60, 60), vec3(200, 200, 200), 16, 0, 1];
    const spotlightHeight = 6;

    CUBE.init(gl);
    BUNNY.init(gl);
    CYLINDER.init(gl);
    TORUS.init(gl);
    SPHERE.init(gl);

    let lightsArray = [];
    //if needed to add more lights than the user can control
    const maxLights = 8;
    const maxUserLights = 3;

    let program = buildProgramFromSources(gl, phongShaders['shader2.vert'], phongShaders['shader2.frag']);

    // Camera  
    let camera = {
        eye: { x: 12, y: 5, z: -1 },
        at: { x: 0, y: 0, z: 0 },
        up: { x: 0, y: 1, z: 0 },
        fovy: 45,
        aspect: 1, // Updated further down
        near: 0.1,
        far: 20
    };

    let options = {
        "Backface Culling": true,
        "Depth Test": true
    };

    //light intensity
    let intensityFolder = {
        ambient: vec3(50, 50, 50),
        diffuse: vec3(60, 60, 60),
        specular: vec3(200, 200, 200)
    };

    //lights added dinamically
    let lights = {
        "Number of Lights": 3
    };

    //bunny materials
    let material = {
        Ka: vec3(150, 150, 150),
        Kd: vec3(150, 150, 150),
        Ks: vec3(200, 200, 200),
        shininess: 100
    };

    //update bunny materials
    function updateMaterial() {
        for (let j = 0; j < sceneGraph.children.length; j++) {
            if (sceneGraph.children[j].name == "objectsNode") {
                let objectsNode = sceneGraph.children[j];
                for (let k = 0; k < objectsNode.children.length; k++) {
                    if (objectsNode.children[k].name == "bunny") {
                        let bunnyNode = objectsNode.children[k];
                        bunnyNode.material.Ka = [material.Ka[0], material.Ka[1], material.Ka[2]];
                        bunnyNode.material.Kd = [material.Kd[0], material.Kd[1], material.Kd[2]];
                        bunnyNode.material.Ks = [material.Ks[0], material.Ks[1], material.Ks[2]];
                        bunnyNode.material.Shininess = material.shininess;
                    }
                }
            }
        }
    }

    updateMaterial();

    //shading types
    let shading = {
        Shading: 'phong'
    }

    //add light
    function createLight() {
        return {
            "On/Off": true,
            "Point/Directional/Spot": 'Point',
            "Camera/World coordinates": true,
            brightness: 1,
            position: { x: 0, y: 0, z: 0, w: 1 },
            intensity: intensityFolder,
            axis: { x: 0, y: 0, z: -1 },
            aperture: 10,
            cutoff: 10
        }
    }

    //------------------GUI Setup-----------------------//

    const gui = new dat.GUI();

    const optionsGui = gui.addFolder("Options");
    optionsGui.add(options, "Backface Culling");
    optionsGui.add(options, "Depth Test");

    const cameraGui = gui.addFolder("Camera");

    cameraGui.add(camera, "fovy").min(1).max(179).step(1).listen();

    cameraGui.add(camera, "near").min(0.1).max(20).step(0.01).listen().onChange(function (v) {
        camera.near = Math.min(camera.far - 0.5, v);
    });

    cameraGui.add(camera, "far").min(0.1).max(20).step(0.01).listen().onChange(function (v) {
        camera.far = Math.max(camera.near + 0.5, v);
    });
    let minEye = -20;
    let maxEye = 20;
    let minAt = -10;
    let maxAt = 10;
    let minUp = -10;
    let maxUp = 10;

    const eye = cameraGui.addFolder("eye");
    let eyeXController = eye.add(camera.eye, "x").min(minEye).max(maxEye).step(0.05).listen().onChange(function (v) {
        camera.eye.x = v;
    });
    let eyeYController = eye.add(camera.eye, "y").min(minEye).max(maxEye).step(0.05).listen().onChange(function (v) {
        camera.eye.y = v;
    });
    let eyeZController = eye.add(camera.eye, "z").min(minEye).max(maxEye).step(0.05).listen().onChange(function (v) {
        camera.eye.z = v;
    });

    const at = cameraGui.addFolder("at");
    at.add(camera.at, "x").min(minAt).max(maxAt).step(0.05).listen().onChange(function (v) {
        camera.at.x = v;
    });
    at.add(camera.at, "y").min(minAt).max(maxAt).step(0.05).listen().onChange(function (v) {
        camera.at.y = v;
    });
    at.add(camera.at, "z").min(minAt).max(maxAt).step(0.05).listen().onChange(function (v) {
        camera.at.z = v;
    });

    const up = cameraGui.addFolder("up");
    up.add(camera.up, "x").min(minUp).max(maxUp).step(0.05).listen().onChange(function (v) {
        camera.up.x = v;
    });
    up.add(camera.up, "y").min(minUp).max(maxUp).step(0.05).listen().onChange(function (v) {
        camera.up.y = v;
    });
    up.add(camera.up, "z").min(minUp).max(maxUp).step(0.05).listen().onChange(function (v) {
        camera.up.z = v;
    });

    const lightsGui = gui.addFolder("Lights");
    //update number of lights on gui and scene
    lightsGui.add(lights, "Number of Lights").min(0).max(maxUserLights).step(1).listen().onChange(function (v) {
        for (let i = 1; i <= maxUserLights; i++) {
            if (i <= v) {
                lightsGui.__folders["Light" + i].domElement.style.display = "block";
                addLightToScene(i);
            } else {
                lightsGui.__folders["Light" + i].domElement.style.display = "none";
                removeLightFromScene(i);
            }
        }

    });
    let aperture = [];
    let cutoff = [];
    let axis = [];
    for (let i = 0; i < maxUserLights; i++) {
        cutoff.push(null);
        axis.push(null);
        aperture.push(null);
    }
    //controllers to update spotlight on object
    let lightTypeControllers = [];
    let ambientControllers = [];
    let diffuseControllers = [];
    let specularControllers = [];
    for (let i = 1; i <= lights["Number of Lights"]; i++) {
        const lightGui = lightsGui.addFolder("Light" + i);
        const light = createLight();
        lightsArray.push(light);
        lightGui.add(light, "On/Off");
        //add or remove spotlight properties depending on light type
        lightTypeControllers.push(lightGui.add(light, "Point/Directional/Spot", ["Point", "Directional", "Spot"]).onChange(function (v) {
            if (v == "Point" || v == "Spot")
                light.position.w = 1;
            else
                light.position.w = 0;
            if (v != "Spot" && aperture[i - 1] != null && cutoff[i - 1] != null && axis[i - 1] != null) {
                lightGui.remove(aperture[i - 1]);
                lightGui.remove(cutoff[i - 1]);
                lightGui.removeFolder(axis[i - 1]);
                aperture[i - 1] = null;
                cutoff[i - 1] = null;
                axis[i - 1] = null;
            } else if (v == "Spot") {
                const axisGui = lightGui.addFolder("Axis");
                axisGui.add(light.axis, "x").step(1).listen();
                axisGui.add(light.axis, "y").step(1).listen();
                axisGui.add(light.axis, "z").step(1).listen();
                axis[i - 1] = axisGui;
                aperture[i - 1] = lightGui.add(light, "aperture").min(0).max(90).step(1).listen();
                cutoff[i - 1] = lightGui.add(light, "cutoff").min(0).max(90).step(1).listen();
            }
        }));
        lightGui.add(light, "Camera/World coordinates").listen();
        lightGui.add(light, "brightness").min(0).max(1.5).step(0.1).listen();
        const positionGui = lightGui.addFolder("Position/Direction");
        //update light position/direction when changed
        positionGui.add(light.position, "x").step(0.1).listen().onChange(function () { updateLightPosition(i) });
        positionGui.add(light.position, "y").step(0.1).listen().onChange(function () { updateLightPosition(i) });
        positionGui.add(light.position, "z").step(0.1).listen().onChange(function () { updateLightPosition(i) });
        positionGui.add(light.position, "w").step(0.1).listen().domElement.style.pointerEvents = "none";

        const intensityGui = lightGui.addFolder("Intensities");
        ambientControllers.push(intensityGui.addColor(light.intensity, "ambient"));
        diffuseControllers.push(intensityGui.addColor(light.intensity, "diffuse"));
        specularControllers.push(intensityGui.addColor(light.intensity, "specular"));
        if (light["Point/Directional/Spot"] == "Spot") {
            const axisGui = lightGui.addFolder("Axis");
            axisGui.add(light.axis, "x").step(1).listen();
            axisGui.add(light.axis, "y").step(1).listen();
            axisGui.add(light.axis, "z").step(1).listen();
            axis[i - 1] = axisGui;

            aperture[i - 1] = lightGui.add(light, "aperture").min(0).max(90).step(1).listen();
            cutoff[i - 1] = lightGui.add(light, "cutoff").min(0).max(90).step(1).listen();
        }
        addLightToScene(i);
    }

    //bunny material gui
    const materialGui = gui.addFolder("Material");
    materialGui.addColor(material, "Ka").listen().onChange(function () { updateMaterial(); });
    materialGui.addColor(material, "Kd").listen().onChange(function () { updateMaterial(); });
    materialGui.addColor(material, "Ks").listen().onChange(function () { updateMaterial(); });
    materialGui.add(material, "shininess").min(1).max(300).step(1).listen().onChange(function () { updateMaterial(); });

    const shadingGui = gui.addFolder("Shading");
    shadingGui.add(shading, "Shading", ['phong', 'gouraud']).listen().onChange(function (v) {
        if (v == 'phong') {
            gl.deleteProgram(program);
            program = buildProgramFromSources(gl, phongShaders['shader2.vert'], phongShaders['shader2.frag']);
        } else if (v == 'gouraud') {
            gl.deleteProgram(program);
            program = buildProgramFromSources(gl, gouraudShaders['shader1.vert'], gouraudShaders['shader1.frag']);
        }
    });

    //--------------sceneGraph manipulation functions--------------//

    //remove light to scene
    function removeLightFromScene(i) {
        let children = [];
        for (let j = 0; j < sceneGraph.children.length; j++) {
            if (sceneGraph.children[j].name == "lightNode" && sceneGraph.children[j].index == i)
                continue;
            children.push(sceneGraph.children[j]);
        }
        sceneGraph.children = children;
    }

    //add light to scene
    function addLightToScene(i) {
        let lightPrimitive = sceneGraph.lightPrimitive;
        let lightNode = {
            name: "lightNode",
            type: "internal",
            index: i,
            transform: {
                translation: [lightsArray[i - 1].position.x, lightsArray[i - 1].position.y, lightsArray[i - 1].position.z],
                rotation: [0, 0, 0],
                scale: [1, 1, 1]
            },
            children: [lightPrimitive]
        };
        sceneGraph.children.push(lightNode);
    }

    //update light position in scene
    function updateLightPosition(i) {
        for (let j = 0; j < sceneGraph.children.length; j++) {
            if (sceneGraph.children[j].name == "lightNode" && sceneGraph.children[j].index == i)
                sceneGraph.children[j].transform.translation = [lightsArray[i - 1].position.x, lightsArray[i - 1].position.y, lightsArray[i - 1].position.z];
        }
    }
    // matrices
    let mView, mProjection;

    let down = false;
    let lastX, lastY;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    resizeCanvasToFullWindow();

    window.addEventListener('resize', resizeCanvasToFullWindow);

    //zoom when wheel scrolling
    window.addEventListener('wheel', function (event) {
        const factor = 1 - event.deltaY / 1000;
        camera.fovy = Math.max(1, Math.min(100, camera.fovy * factor));
    });

    //reset camera to initial values
    function resetCamera() {
        camera.eye = { x: 12, y: 5, z: -1 };
        camera.at = { x: 0, y: 0, z: 0 };
        camera.up = { x: 0, y: 1, z: 0 };
        updateCameraEyeControllers();
    }

    resetCamera();

    //update camera values
    function updateCameraEyeControllers() {
        eyeXController.setValue(camera.eye.x);
        eyeYController.setValue(camera.eye.y);
        eyeZController.setValue(camera.eye.z);
    }

    document.onkeydown = function (event) {
        switch (event.key) {
            //toggle wireframe
            case ' ':
                wireframe = !wireframe;
                break;
            //move camera keys
            case 'w':
                camera.eye.y += 0.1;
                eyeYController.setValue(camera.eye.y);
                break;
            case 's':
                camera.eye.y -= 0.1;
                eyeYController.setValue(camera.eye.y);
                break;
            case 'a':
                camera.eye.x += 0.1;
                eyeXController.setValue(camera.eye.x);
                break;
            case 'd':
                camera.eye.x -= 0.1;
                eyeXController.setValue(camera.eye.x);
                break;
            case 'q':
                camera.eye.z += 0.1;
                eyeZController.setValue(camera.eye.z);
                break;
            case 'e':
                camera.eye.z -= 0.1;
                eyeZController.setValue(camera.eye.z);
                break;
            //reset camera
            case 'r':
                resetCamera();
                break;
            //play lightshow
            case 'p':
                playLightShow = true;
                break;
            //set spotlight on object
            case '1': //cube
                setSpotlight(getSpotlightPos("cube"));
                break;
            case '2': //cylinder
                setSpotlight(getSpotlightPos("cylinder"));
                break;
            case '3': //torus
                setSpotlight(getSpotlightPos("torus"));
                break;
            case '4': //bunny
                setSpotlight(getSpotlightPos("bunny"));
                break;
        }
    };

    function inCameraSpace(m) {
        const mInvView = inverse(mView);
        return mult(mInvView, mult(m, mView));
    }

    //rotate camera with dragging
    canvas.addEventListener('mousemove', function (event) {
        if (down) {
            const dx = event.offsetX - lastX;
            const dy = event.offsetY - lastY;

            if (dx != 0 || dy != 0) {
                const d = vec2(dx, dy);
                const axis = vec3(-dy, -dx, 0);

                const rotation = rotate(0.5 * length(d), axis);
                let eye = vec3(camera.eye.x, camera.eye.y, camera.eye.z);
                let at = vec3(camera.at.x, camera.at.y, camera.at.z);
                let eyeAt = subtract(eye, at);
                eyeAt = vec4(eyeAt[0], eyeAt[1], eyeAt[2], 0);
                eyeAt = mult(inCameraSpace(rotation), eyeAt);

                camera.eye.x = camera.at.x + eyeAt[0];
                camera.eye.y = camera.at.y + eyeAt[1];
                camera.eye.z = camera.at.z + eyeAt[2];

                lastX = event.offsetX;
                lastY = event.offsetY;
                updateCameraEyeControllers();
            }

        }
    });

    //detect click
    canvas.addEventListener('mousedown', function (event) {
        down = true;
        lastX = event.offsetX;
        lastY = event.offsetY;
        gl.clearColor(0.2, 0.0, 0.0, 1.0);
    });

    //detect release click
    canvas.addEventListener('mouseup', function (event) {
        down = false;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
    });

    window.requestAnimationFrame(render);

    //resize
    function resizeCanvasToFullWindow() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        camera.aspect = canvas.width / canvas.height;

        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    //get object by name
    let currentObject;
    function getObject(node, name){
        if(!node) return;

        if (node.name == name){
            currentObject = node;
            return;
        }

        if (node.children) {
            for (let child of node.children) {
                getObject(child, name);
            }
        }
    }

    //get spotlight position above object
    function getSpotlightPos(name){
        getObject(sceneGraph,name);
        let pos = currentObject.transform.translation;
        return vec4(pos[0], pos[1] + spotlightHeight, pos[2], 1.0);
    }

    //set spotlight on object
    function setSpotlight(pos){
        if (lightsArray.length == 0) return;
        //set light position
        lightsArray[0].position.x = pos[0];
        lightsArray[0].position.y = pos[1];
        lightsArray[0].position.z = pos[2];
        lightsArray[0].position.w = pos[3];
        updateLightPosition(1);

        //set light direction
        lightsArray[0].axis.x = spotlightOnObject[0][0];
        lightsArray[0].axis.y = spotlightOnObject[0][1];
        lightsArray[0].axis.z = spotlightOnObject[0][2];

        //set light intensities
        lightsArray[0].intensity.ambient = spotlightOnObject[1];
        lightsArray[0].intensity.diffuse = spotlightOnObject[2];
        lightsArray[0].intensity.specular = spotlightOnObject[3];
        ambientControllers[0].setValue([spotlightOnObject[1][0],spotlightOnObject[1][1],spotlightOnObject[1][2]]);
        diffuseControllers[0].setValue([spotlightOnObject[2][0],spotlightOnObject[2][1],spotlightOnObject[2][2]]);
        specularControllers[0].setValue([spotlightOnObject[3][0],spotlightOnObject[3][1],spotlightOnObject[3][2]]);

        //set spotlight properties
        lightsArray[0].aperture = spotlightOnObject[4];
        lightsArray[0].cutoff = spotlightOnObject[5];
        lightsArray[0].brightness = spotlightOnObject[6];

        lightsArray[0]["Camera/World coordinates"] = false;
        if (lightsArray[0]["Point/Directional/Spot"] != "Spot")
            lightTypeControllers[0].setValue("Spot");
    }


    //draw objects
    function drawSceneGraph(node) {
        if (!node) return;

        STACK.pushMatrix();

        //apply transformations
        STACK.multTranslation(node.transform.translation);
        STACK.multRotationZ(node.transform.rotation[2]);
        STACK.multRotationY(node.transform.rotation[1]);
        STACK.multRotationX(node.transform.rotation[0]);
        STACK.multScale(node.transform.scale);

        //update the light index
        if (node.name == "lightNode")
            sceneGraph.lightPrimitive.currentIndex = node.index - 1;

        //if leaf draw and update uniforms
        if (node.type == "leaf") {
            gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_mModelView"), false, flatten(STACK.modelView()));
            gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_mNormals"), false, flatten(normalMatrix(STACK.modelView())));
            gl.uniform1i(gl.getUniformLocation(program, "u_isBunny"), node.name == "bunny" ? 1 : 0);
            gl.uniform3fv(gl.getUniformLocation(program, "u_material.Ka"), flatten(node.material.Ka));
            gl.uniform3fv(gl.getUniformLocation(program, "u_material.Kd"), flatten(node.material.Kd));
            gl.uniform3fv(gl.getUniformLocation(program, "u_material.Ks"), flatten(node.material.Ks));
            gl.uniform1f(gl.getUniformLocation(program, "u_material.shininess"), node.material.Shininess);

            switch (node.primitive) {
                case "cube":
                    CUBE.draw(gl, program, wireframe ? gl.LINES : gl.TRIANGLES);
                    break;
                case "bunny":
                    BUNNY.draw(gl, program, wireframe ? gl.LINES : gl.TRIANGLES);
                    break;
                case "cylinder":
                    CYLINDER.draw(gl, program, wireframe ? gl.LINES : gl.TRIANGLES);
                    break;
                case "torus":
                    TORUS.draw(gl, program, wireframe ? gl.LINES : gl.TRIANGLES);
                    break;
                case "sphere":
                    //if light on
                    if (lightsArray[node.currentIndex]["On/Off"]) {
                        //if in camera position
                        if (lightsArray[node.currentIndex]["Camera/World coordinates"]) {
                            let cameraMatrix = inverse(mView);
                            let res = mult(cameraMatrix, STACK.modelView());
                            gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_mModelView"), false, flatten(res));
                            gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_mNormals"), false, flatten(normalMatrix(res)));
                        }
                        SPHERE.draw(gl, program, wireframe ? gl.LINES : gl.TRIANGLES);
                    }
                    break;
            }
        }
        //call children recursively
        if (node.children) {
            for (let child of node.children) {
                drawSceneGraph(child);
            }
        }
        STACK.popMatrix();
    }

    // Pass lights info
    function passInfoToShader() {
        let numLights = 0;
        if (!playLightShow){
            for (let i = 0; i < lights["Number of Lights"]; i++) {
                if (!lightsArray[i]["On/Off"])
                    continue;
                numLights++;
                let pos = vec4(lightsArray[i].position.x, lightsArray[i].position.y, lightsArray[i].position.z, lightsArray[i].position.w);
                let posCam = lightsArray[i]["Camera/World coordinates"] ? pos : mult(mView, pos);
                
                let axis = vec3(lightsArray[i].axis.x, lightsArray[i].axis.y, lightsArray[i].axis.z);
                let axisCam = lightsArray[i]["Camera/World coordinates"] ? axis : vec3(mult(mView, vec4(axis, 0.0)));
                
                let brightness = lightsArray[i].brightness;
                let ambient = lightsArray[i].intensity.ambient;
                let diffuse = lightsArray[i].intensity.diffuse;
                let specular = lightsArray[i].intensity.specular;
                let is_spotlight = lightsArray[i]["Point/Directional/Spot"] == "Spot" ? 1 : 0;
                let aperture = lightsArray[i].aperture;
                let cutoff = lightsArray[i].cutoff;
                
                passInfoForEachLight(i,brightness,ambient,diffuse,specular,posCam,is_spotlight,axisCam,aperture,cutoff);
            }
        } else {
            //if 'p' pressed
            for (let i = 0; i < maxUserLights; i++){
                numLights++;
                let pos = lightShowInfo[currentLightShow][0];
                let posCam = mult(mView, pos);
                
                let axis = lightShowInfo[currentLightShow][1];
                let axisCam = vec3(mult(mView, vec4(axis, 0.0)));
                
                let ambient = lightShowInfo[currentLightShow][2];
                let diffuse = lightShowInfo[currentLightShow][3];
                let specular = lightShowInfo[currentLightShow][4];
                let aperture = lightShowInfo[currentLightShow][5];
                let cutoff = lightShowInfo[currentLightShow][6];
                let brightness = lightShowInfo[currentLightShow][7];
                let is_spotlight = 1;
                
                passInfoForEachLight(i,brightness,ambient,diffuse,specular,posCam,is_spotlight,axisCam,aperture,cutoff);
            }
        }
        gl.uniform1i(gl.getUniformLocation(program, "u_n_lights"), numLights);
    }

    //pass info for each light to shader
    function passInfoForEachLight(i,brightness,ambient,diffuse,specular,posCam,is_spotlight,axisCam,aperture,cutoff){
        gl.uniform1f(gl.getUniformLocation(program, "u_lights[" + i + "].brightness"), brightness);
        gl.uniform3fv(gl.getUniformLocation(program, "u_lights[" + i + "].ambient"), flatten(ambient));
        gl.uniform3fv(gl.getUniformLocation(program, "u_lights[" + i + "].diffuse"), flatten(diffuse));
        gl.uniform3fv(gl.getUniformLocation(program, "u_lights[" + i + "].specular"), flatten(specular));

        gl.uniform4fv(gl.getUniformLocation(program, "u_lights[" + i + "].position"), flatten(posCam));
        gl.uniform1i(gl.getUniformLocation(program, "u_lights[" + i + "].is_spotlight"), is_spotlight);
        gl.uniform3fv(gl.getUniformLocation(program, "u_lights[" + i + "].axis"), flatten(axisCam));
        gl.uniform1f(gl.getUniformLocation(program, "u_lights[" + i + "].aperture"), aperture);
        gl.uniform1f(gl.getUniformLocation(program, "u_lights[" + i + "].cutoff"), cutoff);
    }

    function render(time) {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //change lightshow lights over time
        if (playLightShow){
            if (startTime == 0)
                 startTime = time;
            let timePassed = time - startTime;
            if (timePassed > delayTime){
                if(currentLightShow == lightShowInfo.length - 1){
                    currentLightShow = 0;
                    startTime = 0;
                    timesPlayed++;
                    if(timesPlayed == maxReplays){
                        playLightShow = false;
                        timesPlayed = 0;
                    }
                }else{
                    currentLightShow++;
                    startTime = time;
                }
            }
        }
        

        //turn on/off backface culling
        if (options["Backface Culling"])
            gl.enable(gl.CULL_FACE);
        else
            gl.disable(gl.CULL_FACE);

        //turn on/off depth test
        if (options["Depth Test"])
            gl.enable(gl.DEPTH_TEST);
        else
            gl.disable(gl.DEPTH_TEST);

        gl.useProgram(program);

        //transform camera to vec3
        let eye = vec3(camera.eye.x, camera.eye.y, camera.eye.z);
        let at = vec3(camera.at.x, camera.at.y, camera.at.z);
        let up = vec3(camera.up.x, camera.up.y, camera.up.z);
        //avoid problems when eye and up are the same
        if (eye[0] == up[0] && eye[1] == up[1] && eye[2] == up[2]) {
            eye[0] += 0.001;
        }

        mView = lookAt(eye, at, up);

        STACK.loadMatrix(mView);
        mProjection = perspective(camera.fovy, camera.aspect, camera.near, camera.far);

        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_mProjection"), false, flatten(mProjection));
        passInfoToShader();
        drawSceneGraph(sceneGraph);
    }
}

const phongUrls = ['shader2.vert', 'shader2.frag'];
const gouraudUrls = ['shader1.vert', 'shader1.frag'];
loadJSONFile('sceneGraph.json').then(json => loadShadersFromURLS(gouraudUrls).then(gouraudShaders => loadShadersFromURLS(phongUrls).then(phongShaders => setup(phongShaders, gouraudShaders, json))));