global.THREE = require('three');
import AssetLoader from './assetLoader';
import Reticle from './reticle';
var $ = require('jquery');
/*
const arSettings = {
  model:{
    url: "./resources/models/scene.glb?v12",
    scale: 1.5,
  },
  audio:{
    url: "./resources/audio/RPA_FINAL_1_15.wav",
  }
}
*/
//const arSettings.model.url = "./resources/models/scene.glb?v11";
//const arSettings.model.scale = 1.5;
//const arSettings.audio.url = "./resources/audio/RPA_FINAL_1_15.wav";
//const arSettings.video.url = '';//'./resources/videos/do_it_640.mp4';
const videoRelativeScale = 0.001;
const videoRelativeOffset = 2000;
//const markerModelURL = "./resources/models/TempMarker.glb"



class AnimatedModel {
    constructor(model, audioBuffer, audioListener) {
        this.model = model;
        this.mixer = new THREE.AnimationMixer(model.scene);
        /*this.mixer.addEventListener('loop', (e) => {
          this.stopAudio();
          this.playAudio()
          //lets just let the video loop for now
          //this.video.currentTime = 0;
        });
        */

        if (audioBuffer) {
            this.audio = new THREE.Audio(audioListener);
            this.model.scene.add(this.audio);
            this.audio.setBuffer(audioBuffer);
        }
    }
    play(animationIndex) {
        if (animationIndex == null) {
            animationIndex = 0;
        }
        let action = this.mixer.clipAction(this.model.animations[animationIndex]);
        action.reset();
        action.clampWhenFinished = true;
        action.loop = THREE.LoopOnce;
        action.play();
        this.playAudio();
    }
    playAll() {
        for (var i = 0; i < this.model.animations.length; i++) {
            let action = this.mixer.clipAction(this.model.animations[i]);
            action.reset();
            action.clampWhenFinished = true;
            action.loop = THREE.LoopOnce;
            action.play();
        }
        this.playAudio();
    }
    stop(animationIndex) {
        if (animationIndex == null) {
            animationIndex = 0;
        }
        this.mixer.clipAction(this.model.animations[animationIndex]).stop();
        this.stopAudio();
    }
    stopAudio() {
        if (this.audio) {
            this.audio.currentTime = 0;
            this.audio.stop();
        }
    }
    playAudio() {
        if (this.audio) {
            this.audio.currentTime = 0;
            this.audio.repeat = false;
            this.audio.setVolume(1);
            this.audio.play();
        } else {
            // if (audioBuffer) {
            //   this.audio = new THREE.Audio(audioListener);
            //   this.model.scene.add(this.audio);
            //   this.audio.setBuffer(audioBuffer);
            //   this.audio.currentTime = 0;
            //   this.audio.repeat = false;
            //   this.audio.setVolume(1);
            //   this.audio.play();
            // }
        }
    }
}

const AirForceARPipelineModule = () => { // 3D model to spawn at tap

    const raycaster = new THREE.Raycaster()
    const tapPosition = new THREE.Vector2()
    const clock = new THREE.Clock();
    const listener = new THREE.AudioListener()

    let clockDelta = 0;
    let animModelLength = 0;
    let surface // Transparent surface for raycasting for object placement.
    let animatedModels = [];
    let sceneref;
    let cameraref;
    let objectPlaced = false;
    let readyToPlace = false;
    let doneLoading = false;
    let usingVideoTexture = false;
    let videoSrc;
    let videoTexture;
    let sceneCollection = new THREE.Group();
    let loader = new AssetLoader();
    let reticle;
    let loadingTimeStart;
    let isSpecialist = false;
    let isParachute = false;
    // Populates some object into an XR scene and sets the initial camera position. The scene and
    // camera come from xr3js, and are only available in the camera loop lifecycle onStart() or later.
    const initXrScene = ({ scene, camera }) => {
        //$('#loadingBarContainer').hide();
        console.log('initXrScene')
            /*
            let renderer = XR8.Threejs.xrScene().renderer;

            renderer.shadowMapEnabled = true;
            renderer.shadowMap.type = THREE.BasicShadowMap;

            renderer.shadowCameraNear = 0.1
            renderer.shadowCameraFar = 10;
            //renderer.shadowCameraFov = 50;

            renderer.shadowMapBias = 5;
            //renderer.shadowMapDarkness = 0.5;
            //renderer.shadowMapWidth = 1024;
            //renderer.shadowMapHeight = 1024;
            */

        cameraref = camera;
        sceneref = scene;
        surface = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100, 1, 1),
            new THREE.MeshPhongMaterial({
                color: 0xffff00,
                //transparent: true,
                //opacity: 0.0,
                side: THREE.DoubleSide,
                colorWrite: false
            })
        )

        surface.receiveShadow = true;

        surface.rotateX(-Math.PI / 2)
        surface.position.set(0, 0, 0)
        scene.add(surface)
            /*
            //scene.add(new THREE.AmbientLight( 0x404040, 5 ))  // Add soft white light to the scene.
            const light1 = new THREE.DirectionalLight(new THREE.Color(0xffffff), 1);
            light1.position.set(5, 10, 7);
            light1.castShadow = true;
            light1.shadow.mapSize.width = 2048;
            light1.shadow.mapSize.height = 2048;
            light1.shadow.radius = 15;
            //scene.add(light1);
            */

        let ambLight;
        if (window.location.pathname.includes('nuclear') || window.location.pathname.includes('space-operations-officer')) {
            ambLight = new THREE.AmbientLight(0xffffff, 2.5); // soft white light
        } else {
            ambLight = new THREE.AmbientLight(0xffffff, 1.5); // soft white light
        }
        scene.add(ambLight);

        // Set the initial camera position relative to the scene we just laid out. This must be at a
        // height greater than y=0.
        camera.position.set(0, 3, 0)
        camera.add(listener);

        loadContent();
        console.log(surface);
        reticle = new Reticle(scene, camera, surface);
        reticle.show();
    }

    //"#PointCameraContainer"
    const loadContent = () => {
        if (arSettings.model.url) {
            loader.addModelToLoad(arSettings.model.url);
            if (arSettings.model.url.indexOf('specialist') !== -1) {
                isSpecialist = true;
            } else if (arSettings.model.url.indexOf('parachute') !== -1) {
                isParachute = true;
            }
        }
        if (arSettings.audio && arSettings.audio.url) {
            loader.addAudioToLoad(arSettings.audio.url);
        }
        loader.loadContent(contentLoaded);
        $("#PointCameraContainer").show();
        loadingTimeStart = Date.now();
    }


    // Load the glb model at the requested point on the surface.
    const placeObject = (point) => {

        if (!readyToPlace) {
            return;
        }

        if (!objectPlaced) {
            XR8.Threejs.xrScene().scene.add(sceneCollection);
            sceneCollection.rotation.y = reticle.cursorRotation.y;
            reticle.hide();
            $("#TapToPlace").hide();
        } else {
            return;
        }
        sceneCollection.position.copy(point);
        objectPlaced = true;

        animatedModels[0].model.scene.scale.multiplyScalar(0);
        new TWEEN.Tween(animatedModels[0].model.scene.scale).to({
            x: arSettings.model.scale,
            y: arSettings.model.scale,
            z: arSettings.model.scale
        }, 500).easing(TWEEN.Easing.Cubic.In).start();
        //animatedModels[0].model.scene.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.2);
        if (isSpecialist == true) {
            setInterval(() => {
                const rotation = animatedModels[0].model.scene.rotation;
                animatedModels[0].model.scene.rotation.set(rotation.x, rotation.y + 0.02, rotation.z);
            }, 60);
        } else if (isParachute == true) {
            const rotation = animatedModels[0].model.scene.rotation;
            animatedModels[0].model.scene.rotation.set(rotation.x, -90, rotation.z);
        }

        for (let i = 0; i < animatedModels.length; i++) {
            animatedModels[i].playAll();
        }

        //for now lets grab the first animation and put the listener on that once
        //to switch back to the reticle
        if (animatedModels.length > 0 && animatedModels[0].audio) {
            animatedModels[0].audio.source.onended = contentFinished;
        }
    }

    const contentFinished = () => {

        readyToPlace = true;
        objectPlaced = false;

        XR8.Threejs.xrScene().scene.remove(sceneCollection);

        var modal = document.getElementById("goToUrlModalContainer");
        var span = document.getElementsByClassName("close")[0];
        span.onclick = function() {
            modal.style.display = "none";
            reticle.show();
            $("#TapToPlace").show();
        }
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
                reticle.show();
                $("#TapToPlace").show();
            }
        }
        modal.style.display = "flex";
    }

    const contentLoaded = (models, audio) => {

        if (loadingTimeStart + 5000 > Date.now()) {
            setTimeout(() => {
                contentLoaded(models, audio);
            }, Date.now() - (loadingTimeStart + 5000));
            return;
        }

        doneLoading = true;
        reticle.doneLoading();
        $("#TapToPlace").show();
        $("#PointCameraContainer").hide();
        readyToPlace = true;

        let animatedModel;

        if (audio.length > 0) {
            let audioListener = new THREE.AudioListener();

            cameraref.add(audioListener);

            animatedModel = new AnimatedModel(models[0].content, audio[0].content, audioListener);
        } else {
            animatedModel = new AnimatedModel(models[0].content);
        }
        animatedModels.push(animatedModel);

        let position = new THREE.Vector3();
        let rotation = new THREE.Vector3();
        if (arSettings.model.rotation) {
            rotation.set(arSettings.model.rotation.x * (Math.PI / 180),
                arSettings.model.rotation.y * (Math.PI / 180),
                arSettings.model.rotation.z * (Math.PI / 180));
        }

        animatedModel.model.scene.scale.multiplyScalar(0);
        animatedModel.model.scene.position.set(position.x, position.y, position.z);
        animatedModel.model.scene.rotation.set(rotation.x, rotation.y, rotation.z);
        animatedModel.model.scene.traverse(function(child) {
            if ((child).isMesh) {
                var m = child
                m.receiveShadow = true;
                m.castShadow = true;
                m.frustumCulled = false;
            }
        });

        //if we have a video texture, let's add it to the model here

        if (usingVideoTexture) {
            var movieMaterial = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide });
            movieMaterial.needsUpdate = true;
            var movieScreen = models[0].content.scene.getObjectByName("Plane", true);
            movieScreen.material = movieMaterial;
        }

        sceneCollection.add(animatedModel.model.scene);
    }

    const placeObjectTouchHandler = async(e) => {
        console.log('placeObjectTouchHandler');

        if (videoSrc) {
            await videoSrc.play();
            videoSrc.muted = false;
            if (usingVideoTexture) {
                videoSrc.onended = contentFinished;
            }
        }

        if (e.touches.length == 2) {
            XR8.XrController.recenter()
        }

        if (e.touches.length > 2) {
            return
        }

        placeObject(reticle.cursorLocation);
    }

    return {
        // Pipeline modules need a name. It can be whatever you want but must be unique within your app.
        name: 'Airforce AR Template',

        // onStart is called once when the camera feed begins. In this case, we need to wait for the
        // XR8.Threejs scene to be ready before we can access it to add content. It was created in
        // XR8.Threejs.pipelineModule()'s onStart method.
        onStart: ({ canvas, canvasWidth, canvasHeight }) => {
            const { scene, camera } = XR8.Threejs.xrScene() // Get the 3js scene from xr3js.
            console.log("Initing the scene");
            initXrScene({ scene, camera }) // Add objects to the scene and set starting camera position.
            console.log("Adding touch event");
            canvas.addEventListener('touchstart', placeObjectTouchHandler, true) // Add touch listener.
            canvas.addEventListener('touchmove', placeObjectTouchHandler, true) // Add touch listener.

            if (arSettings.video && arSettings.video.url) {
                //add our video file to the page, and begin preloading it
                usingVideoTexture = true;
                $('#movieTextureContainer video').append("<source src=\"" + arSettings.video.url + "\" type=\"video/mp4\">");
                videoSrc = $("#movieTextureSrc")[0];
                videoSrc.load();
                videoTexture = new THREE.VideoTexture(videoSrc);
                videoTexture.minFilter = THREE.LinearFilter;
                videoTexture.magFilter = THREE.LinearFilter;
            }

            // Enable TWEEN animations.
            animate()

            function animate(time) {
                requestAnimationFrame(animate)
                animModelLength = animatedModels.length;
                clockDelta = clock.getDelta();
                reticle.setPosition();
                for (var i = 0; i < animModelLength; i++) {
                    animatedModels[i].mixer.update(clockDelta);
                }
                TWEEN.update(time)
            }

            // Sync the xr controller's 6DoF position and camera paremeters with our scene.
            XR8.XrController.updateCameraProjectionMatrix({
                origin: camera.position,
                facing: camera.quaternion,
            })
        },
    }
}

const onxrloaded = () => {
    XR8.addCameraPipelineModules([ // Add camera pipeline modules.
        // Existing pipeline modules.
        XR8.GlTextureRenderer.pipelineModule(), // Draws the camera feed.
        XR8.Threejs.pipelineModule(), // Creates a ThreeJS AR Scene.
        XR8.XrController.pipelineModule(), // Enables SLAM tracking.
        XRExtras.AlmostThere.pipelineModule(), // Detects unsupported browsers and gives hints.
        XRExtras.FullWindowCanvas.pipelineModule(), // Modifies the canvas to fill the window.
        XRExtras.Loading.pipelineModule(), // Manages the loading screen on startup.
        XRExtras.RuntimeError.pipelineModule(), // Shows an error image on runtime error.
        // Custom pipeline modules.
        AirForceARPipelineModule(),
    ])

    //XR8.XrController.configure({enableLighting: true})

    // Open the camera and start running the camera run loop.
    XR8.run({ canvas: document.getElementById('camerafeed') })
    XRExtras.MediaRecorder.initRecordButton();
    XRExtras.MediaRecorder.setCaptureMode('fixed');
    XRExtras.MediaRecorder.configure({
        "request-mic": "auto",
        "include-scene-audio": "true"
    });
    XRExtras.MediaRecorder.initMediaPreview();
}

const load = () => { XRExtras.Loading.showLoading({ onxrloaded }) }
window.onload = () => { window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load) }