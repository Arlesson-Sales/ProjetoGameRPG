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
    const valueName = this.current.optionValue;
    switch(valueName) {
      case "items":
        openCharacterInventory();
      break;
      case "comprar":
        const storeList = this.current.storeList;
        openStore(storeList);
      break;
      case "vender":
        openCharacterInventory(sellItem);
      break;
      default: this.open(valueName);
    }
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
      case "middle":
        if(currentScreen.name === "dialogo") {
          currentScreen.spliceOptions();
        } else {
          currentScreen.optionCallback?.call(currentScreen);
          floatScreens.goToNext();
        }
      break;
      case "lower":
        if(currentScreen.name !== "dialogo") {
          floatScreens.backToPrevius();
        }
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

function openCharacterInventory(optionCallback) {
  const player = gameSettings.currentControl;
  const inventory = player.inventory;
  const items = inventory.reduce((acc,item) => {
    let name = item.name;
    if(acc[name]) {
      acc[name]++;
    } else {
      acc[name] = 1;
    }
    return acc;
  },{});

  const itemNames = [];
  for(let name in items) {
    itemNames.push(`${name} x${items[name]}`);
  }

  const itemsScreen = floatScreens.open("items");
  itemsScreen.optionCallback = optionCallback;
  itemsScreen.setOptions(true,itemNames); 
}

//Funções responsáveis pela controle da caixa de diálogo
function getDialogLines(text,letterLimit) {
  const letters = text.split("");
  const lines = [];
  while(letters.length > 0) {
    let line = letters.splice(0,letterLimit);
    lines.push(line.join("").trim());
  }
  return lines;
}

function calculateDialogBoxPositions(dialogBox,text) {
  let letterLimit = 36;
  if(window.innerWidth >= 700) {
    dialogBox.y = 250;
    dialogBox.width = 345;
    letterLimit = 53;
  } else {
    dialogBox.y = 160;
    dialogBox.width = 247;
  }

  const lines = getDialogLines(text,letterLimit);
  dialogBox.setOptions(false,lines,5);
}

function openDialogBox(message,callback) {
  game.paused = true;
  const dialogBox = floatScreens.open("dialogo");
  dialogBox.dialogCallback = callback;
  calculateDialogBoxPositions(dialogBox,message);
}

//Funções relacionadas as lojas de items
function openStore(storeList) {
  const catalogueList = storeList.map(itemName => {
    const item = itemsManager.find(itemName);
    let catalogue = `${item.name} $${item.price}`;
    return catalogue;
  });
  
  const storeMenu = floatScreens.open("store");
  storeMenu.setOptions(true,catalogueList);
  storeMenu.optionCallback = buyItem;
}