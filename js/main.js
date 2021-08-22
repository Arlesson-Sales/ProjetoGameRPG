const canvas = document.querySelector("canvas");
const game = new GameJS(canvas);
const gameSettings = {
  currentControl: null,
  scenesNames: ["city-1"],
  sceneDatas: null,
};

const inputs = {
  all: document.querySelectorAll(".game-input,.important-input"),
  names: ["top","left","right","bottom"],
  start: false,
  select: false,

  upper: false,
  middle: false,
  lower: false,

  top: false,
  left: false,
  right: false,
  bottom: false,
};

//Carregamentos
async function start() {
  try {
    await loadScenesData();
    await loadScreensData();
    await loadNpcsData();
    await loadItemsData();

    game.draw = drawGameScreens;
    game.preload = main;
    game.start();
  } catch(error) {
    window.alert(error.message);
  }
}

async function fetchData(dataName) {
  const request = await fetch(`./data/${dataName}-data.json`);
  const data = await request.json();
  return data;
}

//Carregamento dos mapas do jogo
function getSceneProps(name,dataJson) {
  const { width, height, layers, tilewidth } = dataJson;
  const data = [...layers[0].data, ...layers[1].data];

  return { name, width, height, data, tilewidth };
}

async function fetchSceneData(name) {
  const request = await fetch(`./data/maps/${name}.json`);
  const data = await request.json();
  return getSceneProps(name,data);
}

async function loadScenesData() {
  const sceneNames = gameSettings.scenesNames;
  const sceneDatas = [];
  for(let name of sceneNames) {
    const data = await fetchSceneData(name);
    sceneDatas.push(data);
  }
  gameSettings.sceneDatas = sceneDatas;
  game.defineGlobalSourceCoords(16,9,16);
  createGameImages();
  createAllScenes();
}

function defineCameraSettings(camera) {
  const cameraMeasure = { width: 0, height: 0 };
  if(window.innerWidth >= 700) {
    cameraMeasure.width = 352;
    cameraMeasure.height = 352;
  } else {
    cameraMeasure.width = 256;
    cameraMeasure.height = 256;
  }
  camera.width = cameraMeasure.width;
  camera.height = cameraMeasure.height;
}

//Carregamento dos npcs do jogo
async function loadNpcsData() {
  const data = await fetchData("npcs");
  createGameNpcs(data);
}

function createGameNpcs(data) {
  data.npcs.forEach(npcData => {
    const {
      id,
      type,
      name,
      message,
      storeList,
      imageName,
      x, y, layer, sceneName
    } = npcData;
    
    const scene = game.getScene(sceneName);
    const npc = new Character(imageName,x,y,16,16,1);
    
    npc.setAnimation(2,16,true);
    npc.message = message;
    npc.id = id;
    npc.type = type;
    npc.name = name;
    npc.storeList = storeList;
    npc.events.action = npcInteraction;
    scene.addSprite(layer,npc,true);
  });
}

//Acoes de controle do game
function loadInputsEvents(character) {
  const names = ["start","select","top","left","right","bottom","upper","middle","lower"];
  const inputsList = inputs.all;
  for(let index = 0; index < 9; index++) {
    let inputName = names.shift();
    let touchAction = null;
    inputsList[index].addEventListener("click",readInputs);
    
    if(index > 1 && index < 6) {
      touchAction = character.touchControl.bind(character,inputName);
      inputsList[index].addEventListener("touchstart",touchAction);
      inputsList[index].addEventListener("touchend",touchAction);
    }
  }

  //adiconando eventos de movimento ao teclado
  document.body.addEventListener("keydown",readInputs);
  document.body.addEventListener("keyup",clearCharacterMoves);
}

function readInputs(event) {
  const keyValue = event?.target.dataset.value ?? convertKey(event.keyCode);
  const eventType = (event.type === "keydown"); //true = apertou, false = soltou

  if(floatScreens.thereScreenOpen) {
    controlGameScreens(keyValue);
    return;
  }

  if(inputs.names.includes(keyValue)) {
    gameSettings.currentControl.keyboardControl(keyValue,eventType);
    return;
  }

  switch(keyValue) {
    case "start":
      openCharacterMenu();
    break;
    case "middle":
      realizeInteraction();
    break;
  }
}

function convertKey(keyCode) {
  switch(keyCode) {
    case 32: return "start";
    case 100:
    case 37: return "left";
    case 104:
    case 38: return "top";
    case 102:
    case 39: return "right";
    case 98:
    case 40: return "bottom";
    case 65: return "upper";
    case 101:
    case 83: return "middle";
    case 68: return "lower";
  }
}

function realizeInteraction() {
  const player = gameSettings.currentControl;
  const target = player.target;
  if(target && player.inside(target)) {
    player.target = null;
    target?.events.action?.call(target);
  }
}

function clearCharacterMoves(event) {
  const keyValue = convertKey(event.keyCode);
  const character = gameSettings.currentControl;
  character[`move_${keyValue}`] = false;
}

//Comportamento e criação do tiles
function createAllScenes() {
  const sceneDatas = gameSettings.sceneDatas;
  const imageName = "Tileset";

  sceneDatas.forEach(dataInfos => {
    const { name, width, height, tilewidth, data } = dataInfos;
    const scene = game.createScene(name,width,height,tilewidth);
    scene.createSceneTiles(2,imageName,data,null,manageTileCreation);
  });
}

function manageTileCreation(tile,id,scene) {
  const collidersIds = [
    1,2,3,4,5,6,7,8,9,10,11,12,16,22,23,25,26,27,
    28,31,32,38,39,40,41,44,45,46,55,57,59,61,63,64,
    68,69,70,71,73,74,77,95,96,111,112,125,126,127,128
  ];
  const colliders = scene.colliders;
  if(collidersIds.includes(++id)) {
    colliders.push(tile);
  }
  defineTileBehavior(tile,id);
}

function defineTileBehavior(tile,id) {
  switch(id) {
    case 16:
      tile.id = "plaque";
    break;
    case 25:
      tile.id = "chest";
      tile.open = false;
      tile.events.action = interactAction;
    break;
    case 26:
      tile.id = "chest";
      tile.open = true;
      tile.events.action = interactAction;
    break;
    case 27: 
      tile.id = "torch";
      tile.setAnimation(2,10,true);
    break;
    case 29: tile.id = "up-stairs"; break;
    case 30: tile.id = "low-stairs"; break;
    case 33: 
      tile.id = "water"; 
      tile.setAnimation(2,10,true);
    break;
    case 41:
      tile.id = "jar";
      tile.broken = false;
      tile.events.action = interactAction;
    break;
    case 46: tile.id = "pit"; break;
    case 48: tile.id = "book"; break;
    case 57:
      tile.id = "door";
      tile.events.collide = interactAction;
    break;
    case 59: tile.id = "iron-door"; break;
    case 61: tile.id = "handler"; break;
    case 63:
      tile.id = "fireplace";
      tile.setAnimation(2,10,true);
    break;
    case 65:
      tile.id = "lava";
      tile.setAnimation(2,10,true);
    break;
    case 75: tile.id = "cave-entrance"; break;
    case 76: tile.id = "temple"; break;
    case 77: tile.id = "city"; break;
    case 78:
      tile.id = "trap";
      tile.setAnimation(3,20,true);
    break;
  }
}

//Comportamento do jogo
function createGameImages() {
  game.addImage("Tileset","./assets/tileset.png");
  //Carregando images dos personagens
  let characterIndex = 6;
  while(characterIndex > 0) {
    let current = `npc-${characterIndex}`;
    game.addImage(current,`./assets/tile-${current}.png`);
    characterIndex--;
  }
}

function npcInteraction() {
  const message = this.message;
  const storeList = this.storeList;

  if(this.id === "merchant") {
    openDialogBox(message,() => {
      openGoldScreen(3,60);
      const tradeSelector = floatScreens.open("trade-selector");
      tradeSelector.storeList = storeList;
    });
  } else {
    openDialogBox(message);
  }
}

function interactAction() {
  const name = this.id;
  switch(name) {
    case "door":
    case "iron-door":
      this.sourceX += 16;
      this.setCollision(false);
    break;
    case "jar":
      if(!this.broken) {
        this.sourceX += 16;
        this.broken = true;
        this.setCollision(false);
      }
    break;
    case "chest":
      if(this.open) {
        this.sourceX -= 16;
      } else {
        this.sourceX += 16;
      }
      this.open = !this.open;
    break;
  }
}

function main() {
  //Definindo camera
  this.camera = new Camera(0,0,16,16);
  defineCameraSettings(this.camera);
  window.addEventListener("resize",defineCameraSettings.bind(null,this.camera),false);
  
  //Definindo sprites
  const player = new Character("npc-6",64,80,16,16,2);
  gameSettings.currentControl = player;
  player.setAnimation(2,16,true);
  player.events.update = function() {
    this.move();
  }
  player.events.collide = function(collider) {
    this.target = collider;
  }
  
  const city = this.getScene("city-1");
  city.addSprite(3,player);

  //configuração final
  this.camera.target = player;
  this.firstScene = city;
  loadInputsEvents(player);
}

window.onload = start;