class Character extends Sprite {
  constructor(imageName,x,y,width,height,speed) {
    let image = game.images.find(currentImage => currentImage.id === imageName);
    super(image,x,y,width,height);
    this.direction = "bottom";
    this.target = null;
    this.speed = speed;
    this.move_top = false;
    this.move_left = false;
    this.move_right = false;
    this.move_bottom = false;
    this.text = "";
  }
  
  move() {
    if(this.move_top) {
      this.y -= this.speed;
    } else if(this.move_left) {
      this.x -= this.speed;
    } else if(this.move_right) {
      this.x += this.speed;
    } else if(this.move_bottom) {
      this.y += this.speed;
    }
  }
  
  defineDirection(direction) {
    let sourceReference = { top: 48, left: 32, right: 16, bottom: 0 };
    this[`move_${direction}`] = !this[`move_${direction}`];
    this.sourceY = sourceReference[direction];
    this.direction = direction;
    inputs[direction] = !inputs[direction];
  }
  
  inside(invader,zone = 20) {
    if((invader.x >= (this.x - zone) && (invader.x + invader.width) < (this.x + this.width + zone)) &&
      (invader.y >= (this.y - zone) && (invader.y + invader.height) < (this.y + this.height + zone))) {
      return true;
    }
    return false;
  }
}

class GameScreen {
  constructor(name,x,y,width,height) {
    this.name = name;
    this.limit = null;
    this.open = false;
    this.options = [];
    this.optionValue = "";
    this.selectable = true;
    
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.lineWidth = 3;
    this.borderColor = "#aac5da";
    this.backgroundColor = "#1261a1";
    this.selectedColor = "#000000";
    this.letterColor = "#ffffff";
  }
  
  setOptions(selectable,data,limit) {
    this.limit = limit;
    this.options = data;
    this.optionValue = data[0];
    this.selectable = selectable;
  }
  
  spliceOptions() {
    const limit = this.limit;
    const options = this.options;
    if(options.length > 4) {
      options.splice(0,limit);
    }
  }
  
  render(context) {
    context.lineWidth = this.lineWidth;
    context.strokeStyle = this.borderColor;
    context.fillStyle = this.backgroundColor;
    context.fillRect(this.x,this.y,this.width,this.height);
    context.strokeRect(this.x,this.y,this.width,this.height);
  }
  
  writeOptions(context) {
    const options = this.options;
    const value = this.optionValue;
    const selectable = this.selectable;
    const limit = this.limit ?? options.length;
    let padding = 15;
    
    context.font = "8px default-font";
    for(let index = 0; index < limit; index++) {
      const text = options[index] ?? "";
      context.fillStyle = (selectable && text === value) ? this.selectedColor : this.letterColor;
      context.fillText(text,this.x + 10,this.y + padding);
      padding += 15;
    }
  }
  
  chooceOption(direction) {
    const options = this.options;
    const referenceValues = { top: -1, bottom: 1 };
    
    if(options.length > 0) {
      let index = options.indexOf(this.optionValue) + referenceValues[direction];
      if(index === -1) index = (options.length - 1);
      if(index === options.length) index = 0;
      this.optionValue = options[index];
    }
  }
}

class Camera {
  constructor(x,y,width,height) {
    this.x = x; 
    this.y = y;
    this.width = width;
    this.height = height;
    this.target = null;
  }
  
  inside(sprite) {
    if(((sprite.x + sprite.width) >= this.x && sprite.x <= (this.x + this.width)) && 
      ((sprite.y + sprite.height) >= this.y && sprite.y <= (this.y + this.height))) {
      return true;
    }
    return false;
  }
  
  edge(direction) {
    switch(direction) {
      case "top":
        return this.y + (this.height * 0.25);
      case "left":
        return this.x + (this.width * 0.25);
      case "right":
        return this.x + (this.width * 0.75);
      case "bottom":
        return this.y + (this.height * 0.75);
      default: return 0;
    }
  }
  
  move(sceneWidth,sceneHeight) {
    const target = this.target;
    if(target.x < this.edge("left")) {
      this.x = target.x - (this.width * 0.25);
    }
    if((target.x + target.width) > this.edge("right")) {
      this.x = (target.x + target.width) - (this.width * 0.75);
    }
    if(target.y < this.edge("top")) {
      this.y = target.y - (this.height * 0.25);
    }
    if((target.y + target.height) > this.edge("bottom")) {
      this.y = (target.y + target.height) - (this.height * 0.75);
    }
    
    this.x = Math.max(0,Math.min(sceneWidth - this.width,this.x));
    this.y = Math.max(0,Math.min(sceneHeight - this.height,this.y));
  }
}