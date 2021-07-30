const canvas = document.querySelector("canvas");
const game = new GameJS(canvas);
const gameSceneSettings = {
  names: ["city-1"],
  datas: {},
};

const inputs = {
  all: document.querySelectorAll(".game-input,.important-input"),
  start: false,
  select: false,
  upper: false,
  middle: false,
  lower: false,
  top: false,
  left: false,
  right: false,
  bottom: false,
  press(name) {
    this[name] = !this[name]
  },
};

//Carregamentos
async function start() {
  try {
    await loadMapsData();
    await loadScreensData();
    createGameImages();
    game.draw = drawGameScreens;
    game.preload = main;
    game.start();
  } catch(error) {
    window.alert(error.message);
  }
}

async function loadMapsData() {
  const scenesNames = gameSceneSettings.names;
  for(let name of scenesNames) {
    const data = await fetchMapData(name);
    gameSceneSettings.datas[name] = data;
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

function loadInputsEvents(character) {
  const names = ["start","select","top","left","right","bottom","upper","middle","lower"];
  const inputsList = inputs.all;
  for(let index = 0; index < 9; index++) {
    let inputName = names.shift();
    let action = null;
    inputsList[index].addEventListener("click",controlGameScreens);
    
    if(index > 1 && index < 6) {
      action = character.defineDirection.bind(character,inputName);
      inputsList[index].addEventListener("touchstart",action);
      inputsList[index].addEventListener("touchend",action);
    } else {
      action = inputs.press.bind(inputs,inputName);
      inputsList[index].addEventListener("touchstart",action);
      inputsList[index].addEventListener("touchend",action);
    }
  }
}

//Comportamento e criação do tiles
function createAllSceneTiles() {
  const imageName = "Tileset";
  const allScenes = game.scenes;
  allScenes.forEach(scene => {
    const data = gameSceneSettings.datas[scene.name];
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
    case 25: tile.id = "chest-closed";
      tile.open = false;
    break;
    case 26: tile.id = "chest-open";
      tile.open = true;
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
    case 57: tile.id = "door"; break;
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

function main() {
  this.camera = new Camera(0,0,256,256);
  
  //Definindo sprites
  const player = new Character("npc-4",190,116,16,16,3);
  player.setAnimation(2,16,true);
  player.events.update = function() {
    this.move();
  }
  
  const npc = new Character("npc-2",139,116,16,16,1);
  npc.setAnimation(2,16,true);
  npc.setCollision(true);
  npc.text = "Bem vindo estamos precisando de algo para ser o alvo do ataque e com vc meu amor falando de manhã eu quero ver a minha puta safada doida pra ser comida por cima da calcinha dela até agr jogando com vc e te achei mt linda eu ver a calcinha q vc ta usando agr vai princesa linda e  estamos precisando de algo para destruit todo o exercito lutanfo uma terrivel guerra contra a bravis que onsoste em destrutor tudo a nossa querido mundo vijiado e guardado pelos nossas queridos e aforados deuses";
  npc.events.collide = function() {
    if(inputs.upper) {
      openDialogBox(this);
    }
  }
  
  //Definindo cenários
  const city = game.createScene("city-1",50,50,16);
  city.addSprite(3,player);
  city.addSprite(3,npc,true);
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