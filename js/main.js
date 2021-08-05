const canvas = document.querySelector("canvas");
const game = new GameJS(canvas);
const gameSettings = {
  currentControl: null,
  cameraMeasure: {
    width: 32,
    height: 32
  },
  scenes: {
    names: ["city-1"],
    datas: {}
  }
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
    await loadMapsData();
    await loadScreensData();
    await loadItemsData();
    createGameImages();
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

async function loadMapsData() {
  const sceneSettings = gameSettings.scenes;
  const scenesNames = sceneSettings.names;
  for(let name of scenesNames) {
    const data = await fetchMapData(name);
    sceneSettings.datas[name] = data;
  }
  game.defineGlobalSourceCoords(16,9,16);
}

async function fetchMapData(sceneName) {
  const request = await fetch(`./data/maps/${sceneName}.json`);
  const jsonData = await request.json();
  const layers = jsonData.layers;
  const data = [];
  for(let layer of layers) {
    let tilesIds = layer.data;
    data.push(...tilesIds);
  }
  data.layers = layers.length;
  return data;
}

function defineCameraSettings() {
  const cameraMeasure = gameSettings.cameraMeasure;
  if(window.innerWidth >= 700) {
    cameraMeasure.width = 400;
    cameraMeasure.height = 400;
  } else {
    cameraMeasure.width = 256;
    cameraMeasure.height = 256;
  }
}

function loadInputsEvents(character) {
  const names = ["start","select","top","left","right","bottom","upper","middle","lower"];
  const inputsList = inputs.all;
  for(let index = 0; index < 9; index++) {
    let inputName = names.shift();
    let touchAction = null;
    inputsList[index].addEventListener("click",readInputs);
    
    if(index > 1 && index < 6) {
      touchAction = character.defineDirection.bind(character,inputName);
      inputsList[index].addEventListener("touchstart",touchAction);
      inputsList[index].addEventListener("touchend",touchAction);
    }
  }

  //adiconando eventos ao teclado
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
    case "upper":
      realizeInteraction();
    break;
  }
}

function convertKey(keyCode) {
  switch(keyCode) {
    case 32: return "start";
    case 37: return "left";
    case 38: return "top";
    case 39: return "right";
    case 40: return "bottom";
    case 65: return "upper";
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
function createAllSceneTiles() {
  const imageName = "Tileset";
  const allScenes = game.scenes;
  allScenes.forEach(scene => {
    const data = gameSettings.scenes.datas[scene.name];
    scene.createSceneTiles(data.layers,imageName,data,null,manageTileCreation);
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
    case 41: tile.id = "jar"; break;
    case 46: tile.id = "pit"; break;
    case 48: tile.id = "book"; break;
    case 57:
      tile.id = "door";
      tile.events.action = interactAction;
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

function interactAction() {
  const name = this.id;
  switch(name) {
    case "door":
    case "iron-door":
      this.sourceX += 16;
      this.setCollision(false);
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
  defineCameraSettings();
  const cameraMeasure = gameSettings.cameraMeasure;
  this.camera = new Camera(0,0,cameraMeasure.width,cameraMeasure.height);
  
  //Definindo sprites
  const player = new Character("npc-6",190,116,16,16,2);
  gameSettings.currentControl = player;
  player.setAnimation(2,16,true);
  player.events.update = function() {
    this.move();
  }
  player.events.collide = function(collider) {
    this.target = collider;
  }
  
  const npc = new Character("npc-4",139,116,16,16,1);
  npc.setAnimation(2,16,true);
  npc.setCollision(true);
  npc.text = "SEJA MUITO BEM VINDO A NOSSA HUMILDE VILA, QUE APOLLO ABENÇOE A SUA TEMPORADA AQUI FORASTEIRO";
  npc.events.action = function() {
    openDialogBox(this);
  }
  
  const seller = new Character("npc-1",192,288,16,16,1);
  seller.setAnimation(2,16,true);
  seller.setCollision(true);
  seller.sourceY = 48;
  seller.events.action = function() {
    floatScreens.open("store-menu");
  }
  
  //Definindo cenários
  const city = game.createScene("city-1",50,50,16);
  city.addSprite(3,player);
  city.addSprite(3,npc,true);
  city.addSprite(3,seller,true);
  city.preload = function() {
    player.setCoords(4,166);
  }
  
  //configuração final
  this.camera.target = player;
  this.firstScene = city;
  loadInputsEvents(player);
  createAllSceneTiles();
}

window.onload = start;