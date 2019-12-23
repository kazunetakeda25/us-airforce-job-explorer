let GLTFLoader = require('three-gltf-loader');
let Nanobar = require('nanobar');
let $ = require('jquery');

class AssetLoader {

  constructor(){
    this.modelSource = [];
    this.audioSource = [];
    this.modelLoader = new THREE.GLTFLoader()  // This comes from GLTFLoader.js.
    this.audioLoader = new THREE.AudioLoader();
    this.totalContentPieces = 0;
    this.nanobar;
    this.loadingAmounts = [];
    this.loadedModels = [];
    this.loadedAudio = [];
  }

  addModelToLoad(model) {
    this.modelSource.push(model);
    this.loadingAmounts.push(0);
  }

  addAudioToLoad(audio){
    this.audioSource.push(audio);
    this.loadingAmounts.push(0);
  }

  modelLoaded(model, source){
    console.log("Model loaded!");
    this.loadedModels.push(new loadedContent(model, source));
  }

  audioLoaded(audio, source){
    console.log("Audio loaded!");
    this.loadedAudio.push(new loadedContent(audio, source));
  }

  errorLoading(error){
    console.log("An error occured when loading the content");
    console.log(error);
  }

  updateProgressBar(){
    let amount = 0;
    console.log(this.loadingAmounts); 
    for(let i=0; i<this.loadingAmounts.length; i++){
      amount += this.loadingAmounts[i];
    }
    amount = amount/this.totalContentPieces;
    this.nanobar.go(amount * 100);
    if(amount >= 0.99){
      console.log("All done loading!");
    }
  }

  allDoneLoading(){
    for(let i=0; i<this.loadingAmounts.length; i++){
      if(this.loadingAmounts[i] < 0.9999999){
        return false;
      }
    }
    //$('#loadingBarContainer').hide();
    return true;
  }

  loadContent(contentLoaded){
    this.nanobar = new Nanobar({
      classname: 'nanobar',
      target: document.getElementById('loadingBarContainer')
    })
    //$('#loadingBarContainer').show();

    this.totalContentPieces = this.modelSource.length + this.audioSource.length;


    for(let i=0; i<this.modelSource.length; i++){
        this.modelLoader.load(this.modelSource[i],
          (model) => {
            this.loadingAmounts[i] = 1;
            this.modelLoaded(model, this.modelSource[i]);
            if(this.allDoneLoading()){
              contentLoaded(this.loadedModels, this.loadedAudio);
            }
            this.updateProgressBar();
          },
          (xhr) => {
          //console.log(`Model ${(xhr.loaded / xhr.total * 100 )}% loaded`);
          this.loadingAmounts[i] = (xhr.loaded/xhr.total);
          this.updateProgressBar();
        }, this.errorLoading);
    }

    for(let i=0; i<this.audioSource.length; i++){
        this.audioLoader.load(this.audioSource[i],
          (audio) => {
            this.loadingAmounts[this.modelSource.length + i] = 1;
            this.audioLoaded(audio, this.audioSource[i]);
            if(this.allDoneLoading()){
              contentLoaded(this.loadedModels, this.loadedAudio);
            }
            this.updateProgressBar();
          },
          (xhr) => {
          //console.log(`Audio ${(xhr.loaded / xhr.total * 100 )}% loaded`);
          this.loadingAmounts[this.modelSource.length + i] = (xhr.loaded/xhr.total);
          this.updateProgressBar();
        }, this.errorLoading)
    }

  }

}

class loadedContent{
  constructor(content, url){
    this.content = content;
    this.source = url;
  }
}

export default AssetLoader;
