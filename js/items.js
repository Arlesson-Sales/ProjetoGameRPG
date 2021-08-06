const itemsManager = {
  all: [],
  find(name) {
    const allItems = this.all;
    return allItems.find(item => item.name === name);
  }
};

async function loadItemsData() {
  const data = await fetchData("items");
  createGameItems(data);
}

function createGameItems(data) {
  const items = data.items;
  items.forEach(itemData => {
    const {
      name, category, price, description,
      attackBonus, defenseBonus, healthBonus, manaBonus, speedBonus,
    } = itemData;
    
    const item = new Item(name,category,price);
    item.setBonus(attackBonus,defenseBonus,healthBonus,manaBonus,speedBonus);
    item.setDescription(description);
    itemsManager.all.push(item);
  });
}