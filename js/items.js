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
    attackBonus, defenseBonus, healthBonus, manaBonus, speedBonus,
  } = itemData;
    
  const item = new Item(name,category,price);
  item.setBonus(attackBonus,defenseBonus,healthBonus,manaBonus,speedBonus);
  item.setDescription(description);
  return item;
}

//funcoes de compra e venda de items
function getItemName(itemCatalogue) {
  let indexFinal = itemCatalogue.indexOf("$");
  let name = itemCatalogue.substr(0,--indexFinal);
  return name;
}

function buyItem() {
  const player = gameSettings.currentControl;
  const itemName = getItemName(this.optionValue);
  const item = itemsManager.find(itemName);

  if(player.gold >= item.price) {
    player.gold -= item.price;
    player.inventory.push(item);
    openDialogBox(`obrigado voce comprou ${item.name}`);
  } else {
    openDialogBox("Desculpe mas voce nao possui ouro suficiente");
  }
}