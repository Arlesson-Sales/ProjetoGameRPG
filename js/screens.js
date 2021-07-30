const floatScreens = {
  all: [],
  stack: [],
  get current() {
    let lastIndex = this.stack.length - 1;
    return this.stack[lastIndex];
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
  const request = await fetch("./data/screens-data.json");
  const data = await request.json();
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

function controlGameScreens() {
  const value = event.target.dataset.value;
  const currentScreen = floatScreens.current;
  if(value === "start" && currentScreen?.name !== "dialogo") {
    openCharacterMenu();
  }
  //Ações de tela
  if(currentScreen?.open) {
    switch(value) {
      case "top":
      case "bottom":
        if(currentScreen?.selectable) {
          currentScreen.chooceOption(value);
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
  } else {
    //Ações caso não tenha nenhuma tela aberta
    switch(value) {
      case "upper":
        const player = gameSettings.currentControl;
        const target = player.target;
        if(target && player.inside(target)) {
          player.target = null;
          target?.events.action?.call(target);
        }
      break;
    }
  }
}

function openCharacterMenu() {
  const menu = floatScreens.find("menu");
  if(!menu.open) {
    floatScreens.open("menu");
    game.paused = true;
  } else {
    floatScreens.closeAll();
    game.paused = false;
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