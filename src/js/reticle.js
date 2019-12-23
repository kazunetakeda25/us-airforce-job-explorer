var $ = require('jquery');

let reticleUrls = [
  "1.png",
  "2.png",
  "3.png",
  "4.png",
  "5.png",
  "6.png",
  "7.png",
  "8.png",
  "9.png",
  "10.png"
];

const scanningReticleUrls = [
  "loading_1.png",
  "loading_2.png",
  "loading_3.png",
  "loading_4.png",
  "loading_5.png",
];

const urlPrefix = "../resources/textures/reticle/";

const reticleSize = 2;

class Reticle{
    constructor(scene, camera, groundPlane){
      this.raycaster = new THREE.Raycaster();
      this.rayOrigin = new THREE.Vector2(0, 0);
      this.cursorLocation = new THREE.Vector3(0,0,0);
      this.cursorOffset = new THREE.Vector3(0, 0.01, 0);
      this.cursorRotation = new THREE.Vector3(0, 0, 0);
      this.camera = camera;
      this.scene = scene;
      this.groundPlane = groundPlane;
      this.loadManager = new THREE.LoadingManager();
      this.textureLoader = new THREE.TextureLoader(this.loadManager);
      this.scanningTextures = [];
      this.textures = [];
      this.loadComplete = false;
      if (window.location.pathname.includes('free-britney')) {
        reticleUrls = [];
      }
      for(let i=0; i<scanningReticleUrls.length; i++){
        this.scanningTextures.push(this.textureLoader.load(urlPrefix + "" + scanningReticleUrls[i]));
      }
      
      for(let i=0; i<reticleUrls.length; i++){
        this.textures.push(this.textureLoader.load(urlPrefix + "" + reticleUrls[i]));
      }
      this.material = new THREE.MeshBasicMaterial({map: this.scanningTextures[0], transparent: true});
      this.loadManager.onLoad = ()=>{
        this.mesh.rotation.set(-90 * (Math.PI/180), 0, 0);
        this.parent.add(this.mesh);
      };
      this.geo = new THREE.PlaneGeometry(reticleSize, reticleSize, 2, 2);
      this.mesh = new THREE.Mesh(this.geo, this.material);
      this.parent = new THREE.Group();
      this.index = 0;
      this.mesh.material.setValues({map: this.scanningTextures[0]});
      this.mesh.material.needsUpdate = true;
      this.scanningInverval = setInterval(this.animateScanning.bind(this), 200);
    }

    setPosition(){
      this.raycaster.setFromCamera(this.rayOrigin, this.camera);
      const intersects = this.raycaster.intersectObject(this.groundPlane, true);

      if (intersects.length > 0) {
        const [intersect] = intersects;
        this.cursorLocation = intersect.point.add(this.cursorOffset);
      }
      this.parent.position.lerp(this.cursorLocation, 0.4);

      this.cursorRotation.y = Math.atan2((this.camera.position.x - this.parent.position.x), (this.camera.position.z - this.parent.position.z));

      this.parent.rotation.y = this.cursorRotation.y;
    }

    animate(){
      if(this.index > 9){
        this.index = 0;
      }
      this.mesh.material.setValues({map: this.textures[this.index]});
      this.mesh.material.needsUpdate = true;
      this.index++;
    }

    animateScanning(){
      if(this.index > 4){
        this.index = 0;
      }
      this.mesh.material.setValues({map: this.scanningTextures[this.index]});
      this.mesh.material.needsUpdate = true;
      this.index++;
    }

    doneLoading(){
      clearInterval(this.scanningInverval);
      if (window.location.pathname.includes('free-britney')) {
        this.hide();
        return;
      }
      this.index = 0;
      this.mesh.material.setValues({map: this.textures[0]});
      this.mesh.material.needsUpdate = true;
      setInterval(this.animate.bind(this), 100); // by Rey 50 looks crazy... i think its too fast, just set it to 100 for preview... :)
      this.loadComplete = true;
    }

    hide(){
        this.scene.remove(this.parent);
    }

    show(){
        this.scene.add(this.parent);
    }
}

export default Reticle;
