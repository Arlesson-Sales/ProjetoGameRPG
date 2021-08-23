const itemsManager = {
  allData: null,
  find(name) {
    const itemData = this.allData.find(itemData => itemData.name === name);
    return createItem(itemData);
  }
};

async function loadItemsData() {
  const data = await fetchData("items");
  itemsManager.allData = data.items;
}

function createItem(itemData) {
  const {
    name, category, price, description,
    attackBonus, magicBonus, defenseBonus, healthBonus, manaBonus, agilityBonus,
  } = itemData;
    
  const item = new Item(name,category,price);
  item.setBonus(attackBonus,defenseBonus,healthBonus,manaBonus,magicBonus,agilityBonus);
  item.setDescription(description);
  return item;
}

function getAttributeName(name) {
  switch(name) {
    case "attackBonus": return "ATK";
    case "defenseBonus": return "DFS";
    case "healthBonus": return "PV";
    case "manaBonus": return "MP";
    case "magicBonus": return "MGC";
    case "agilityBonus": return "AGL";
  }
}

function showItemDescription(itemName) {
  const item = itemsManager.find(itemName);
  if(item) {
    let message = item.name;
    let { attackBonus, magicBonus, defenseBonus, healthBonus, manaBonus, agilityBonus } = item;
    let itemBonus = { attackBonus, magicBonus, defenseBonus, healthBonus, manaBonus, agilityBonus };
    
    for(let value in itemBonus) {
      if(itemBonus[value] > 0) {
        message = `${message} ${getAttributeName(value)}: +${itemBonus[value]}/`;
      }
    }
    message = `${message} ${item.description}`;
    openDialogBox(message);
  }
}

//funcoes de compra e venda de items
function getItemName(actionType,itemCatalogue) {
  let indexFinal = 0;
  if(actionType === "buy") {
    indexFinal = itemCatalogue.indexOf("$");
  } else {
    indexFinal = itemCatalogue.indexOf("x");
  }
  let name = itemCatalogue.substr(0,--indexFinal);
  return name;
}

function buyItem() {
  const player = gameSettings.currentControl;
  const itemName = getItemName("buy",this.optionValue);
  const item = itemsManager.find(itemName);

  if(player.gold >= item.price) {
    player.gold -= item.price;
    player.inventory.push(item);
    openDialogBox(`obrigado voce comprou ${item.name}`);
  } else {
    openDialogBox("Desculpe mas voce nao possui ouro suficiente");
  }
  updateGoldScreen();
}

function sellItem() {
  if(this.optionValue) {
    const player = gameSettings.currentControl;
    const itemName = getItemName("sell",this.optionValue);
    
    let itemIndex = 0;
    const item = player.inventory.find((item,index) => {
      if(item.name === itemName) {
        itemIndex = index;
        return item;
      }
    });

    player.gold += item.price;
    player.inventory.splice(itemIndex,1);
    openDialogBox(`voce vendeu ${item.name} por ${item.price} moedas de ouro`,() => floatScreens.backToPrevius());
    updateGoldScreen();
  }
}