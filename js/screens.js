const floatScreens = {
  all: [],
  stack: [],

  get current() {
    let lastIndex = this.stack.length - 1;
    return this.stack[lastIndex];
  },

  get thereScreenOpen() {
    if(this.current) {
      return true;
    }
    return false;
  },
  
  find(name) {
    const allScreens = this.all;
    return allScreens.find(screen => screen.name === name);
  },
  
  goToNext() {
    const currentScreen = this.current;
    const valueName = currentScreen.optionValue;
    this.open(valueName);
  },
  
  open(name) {
    const nextScreen = this.find(name);
    if(nextScreen && !this.stack.includes(nextScreen)) {
      this.stack.push(nextScreen);
      nextScreen.open = true;
      game.paused = true;
      return nextScreen;
    }
  },
  
  backToPrevius() {
    const currentScreen = this.current;
    if(currentScreen.name !== "menu") {
      currentScreen.open = false;
      this.stack.pop();
    }
    
    if(this.stack.length === 0) {
      game.paused = false;
    }
  },
  
  closeAll() {
    const stack = this.stack;
    while(stack.length > 0) {
      const screen = stack.pop();
      screen.open = false;
    }
  }
};

async function loadScreensData() {
  const data = await fetchData("screens");
  createGameScreens(data);
}

function createGameScreens(data) {
  const screens = data.screens;
  screens.forEach(screen => {
    const { name, options, selectable, x, y, width, height } = screen;
    const currentScreen = new GameScreen(name,x,y,width,height);
    
    if(options.length > 0) {
      currentScreen.setOptions(selectable,options);
    }
    floatScreens.all.push(currentScreen);
  });
}

function drawGameScreens(context) {
  const GameScreens = floatScreens.stack;
  for(let currentScreen of GameScreens) {
    if(currentScreen.open) {
      currentScreen.render(context);
      currentScreen.writeOptions(context);
    }
  }
}

function controlGameScreens(keyValue) {
  const currentScreen = floatScreens.current;
  
  if(currentScreen?.open) {
    switch(keyValue) {
      case "start":
        openCharacterMenu();
      break;
      case "top":
      case "bottom":
        if(currentScreen?.selectable) {
          currentScreen.chooceOption(keyValue);
        }
      break;
      case "upper":
        floatScreens.goToNext();
      break;
      case "middle":
        if(currentScreen.name === "dialogo") {
          currentScreen.spliceOptions();
        }
      break;
      case "lower":
        floatScreens.backToPrevius();
      break;
    }
  }
}

function openCharacterMenu() {
  const currentScreen = floatScreens.current;
  const menu = floatScreens.find("menu");
  
  if(!currentScreen || currentScreen === menu) {
    if(!menu.open) {
      floatScreens.open("menu");
      game.paused = true;
    } else {
      floatScreens.closeAll();
      game.paused = false;
    }
  }
}

function getDialogLines(text) {
  //limite 35 letras e 5 linhas
  const letters = text.split("");
  const lines = [];
  while(letters.length > 0) {
    let line = letters.splice(0,36);
    lines.push(line.join("").trim());
  }
  return lines;
}

function openDialogBox(sprite) {
  const lines = getDialogLines(sprite.text);
  const dialogBox = floatScreens.open("dialogo");
  dialogBox?.setOptions(false,lines,5);
  game.paused = true;
}

//Funções relacionadas as lojas de items
function openStore(characterStoreList) {
  const catalogueList = [];
  while(characterStoreList.length) {
    let name = characterStoreList.pop();
    let item = itemsManager.find(name);
    
    let catalogueItem = `${item.name} $${item.price}`;
    catalogueList.push(catalogueItem);
  }
  
  const storeMenu = floatScreens.open("store-menu");
  storeMenu.setOptions(true,catalogueList);
}