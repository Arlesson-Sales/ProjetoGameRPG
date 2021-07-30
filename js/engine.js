class GameJS {
  constructor(canvas) {
    this.context = canvas.getContext("2d")
    this.firstScene = null;
    this.currentScene = null;
    this.transition = false;
    this.running = false;
    this.paused = false;
    this.frame = null;
    this.then = Date.now();
    this.fps = 60;
    this.camera = null;
    this.images = [];
    this.scenes = [];
    this.globalSprites = [];
    this.globalSourceCoords = null;
    this.preload = null;
    this.update = null;
    this.draw = null;
  }
  
  defineGlobalSourceCoords(cols,rows,tileSourceSize) {
    this.globalSourceCoords = [];
    for(let row = 0; row < rows; row++) {
      for(let col = 0; col < cols; col++) {
        let x = col * tileSourceSize;
        let y = row * tileSourceSize;
        this.globalSourceCoords.push({ x, y });
      }
    }
  }
  
  addImage(name,path) {
    const images = this.images;
    if(!images.some(image => image.id === name)) {
      const image = new Image();
      image.src = path; image.id = name;
      this.images.push(image);
    } else {
      throw Error("Indentificador de imagem já foi usado");
    }
  }
  
  getScene(sceneName) {
    const allScenes = this.scenes;
    const scene = allScenes.find(currentScene => currentScene.name === sceneName);
    if(scene) return scene;
    throw new Error("O identificador de cena passado não foi encontrado");
  }
  
  changeSceneTo(sceneName) {
    window.cancelAnimationFrame(this.frame);
    const scene = this.getScene(sceneName);
    this.running = false;
    this.transition = true;
    this.currentScene = scene;
  }
  
  createScene(name,cols,rows,tileSize) {
    const scenes = this.scenes;
    if(!scenes.some(scene => scene.name === name)) {
      const newScene = new Scene(name,cols,rows,tileSize,this);
      this.scenes.push(newScene);
      if(this.globalSourceCoords) {
        newScene.sourceCoords = this.globalSourceCoords;
      }
      return newScene;
    } else {
      throw Error("Indentificador de cena já foi usado");
    }
  }
  
  createSprite(imageName,x,y,width,height,srcX,srcY,srcW,srcH) {
    const image = this.images.find(currentImage => currentImage.id === imageName);
    if(image) {
      const newSprite = new Sprite(image,x,y,width,height,srcX,srcY,srcW,srcH);
      this.globalSprites.push(newSprite);
      return newSprite;
    } else {
      throw Error("O identificador de imagem passado não existe");
    }
  }
  
  collision(sprite,collider) {
    let catX = (sprite.x + sprite.collisionWidth / 2) - (collider.x + collider.collisionWidth / 2);
    let catY = (sprite.y + sprite.collisionHeight / 2) - (collider.y + collider.collisionHeight / 2);
    let sumWidth = (sprite.collisionWidth / 2) + (collider.collisionWidth / 2);
    let sumHeight = (sprite.collisionHeight / 2) + (collider.collisionHeight / 2);
    
    if(Math.abs(catX) < sumWidth && Math.abs(catY) < sumHeight) {
      let overlapX = sumWidth - Math.abs(catX);
      let overlapY = sumHeight - Math.abs(catY);
      if(overlapX >= overlapY) {
        sprite.y = catY > 0 ? sprite.y + overlapY : sprite.y - overlapY;
      } else {
        sprite.x = catX > 0 ? sprite.x + overlapX : sprite.x - overlapX;
      }
      return true;
    }
    return false;
  }
  
  start() {
    this.preload?.();
    const scene = this.firstScene;
    if(scene) {
      this.preload = null;
      this.running = true;
      this.currentScene = scene;
      this.currentScene.preload?.();
      window.gameHeart = this.loop.bind(this);
      window.gameHeart();
    }
  }
  
  settings() {
    if(this.running && !this.paused) {
      const camera = this.camera;
      const cameraInvaders = [];
      const currentScene = this.currentScene;
      const colliders = currentScene.colliders;
      const sprites = currentScene.sprites;
      
      for(let currentCollider of colliders) {
        let insideCamera = camera.inside(currentCollider);
        if(currentCollider?.collider && insideCamera) {
          cameraInvaders.push(currentCollider);
        }
      }
      
      for(let sprite of sprites) {
        const events = sprite.events;
        events.update?.call(sprite);
        
        if(sprite.collider) {
          for(let currentCollider of cameraInvaders) {
            let insideZone = sprite.inside(currentCollider);
            
            if(insideZone && (currentCollider !== sprite)) {
              if(this.collision(sprite,currentCollider)) {
                events.collide?.call(sprite,currentCollider);
                currentCollider.events.collide?.call(currentCollider,sprite);
              }
            }
          }
        }
      }
      camera.move(currentScene.width,currentScene.height);
    }
  }
  
  rendering() {
    if(this.running) {
      const camera = this.camera;
      const context = this.context;
      const currentScene = this.currentScene;
      const layers = currentScene.spriteLayers;
      const tiles = currentScene.tiles;
      
      context.save();
      context.translate(-camera.x,-camera.y);
      context.clearRect(0,0,currentScene.width,currentScene.height);
      //Renderizando tiles do cenário
      for(let tile of tiles) {
        let insideCamera = camera.inside(tile);
        if(tile && insideCamera && tile.visible) {
          tile.animation();
          tile.draw(context);
        }
      }
      //Renderizando sprites do cenário
      for(let index in layers) {
        const sprites = layers[index];
        for(let sprite of sprites) {
          if(sprite && camera.inside(sprite) && sprite.visible) {
            sprite.animation();
            sprite.draw(context);
          }
        }
      }
      context.restore();
      this.draw?.(context);
    }
  }
  
  loop() {
    if(this.running) {
      this.frame = window.requestAnimationFrame(window.gameHeart);
      let now = Date.now();
      let delta = now - this.then;
      if(delta > 1000 / this.fps) {
        this.currentScene.update?.();
        this.update?.();
        this.settings();
        this.rendering();
        this.then = now;
      }
    }
    if(this.transition) {
      this.transition = false;
      this.firstScene = this.currentScene;
      this.start();
    }
  }
}

class Scene {
  constructor(name,cols,rows,tileSize,game) {
    this.name = name;
    this.game = game;
    this.cols = cols;
    this.rows = rows;
    this.tileSize = tileSize;
    this.width = cols * tileSize;
    this.height = rows * tileSize;
    this.sourceCoords = [];
    this.colliders = [];
    this.tiles = [];
    this.spriteLayers = { "3": [], "2": [], "1": [] };
    this.preload = null;
    this.update = null;
  }
  
  get sprites() {
    const sprites = [];
    const layers = this.spriteLayers;
    for(let index in layers) {
      const currentLayer = layers[index];
      sprites.push(...currentLayer);
    }
    return sprites;
  }
  
  addSprite(layerIndex,spriteReference,collide = false) {
    if(!this.validateSprite(spriteReference)) {
      spriteReference.currentLayer = layerIndex;
      this.spriteLayers[layerIndex].push(spriteReference);
      if(collide) {
        this.colliders.push(spriteReference);
      }
    } else {
      throw Error("A sprite passada já está presente nessa cena");
    }
  }
  
  validateSprite(spriteReference) {
    let exist = false;
    for(let index in this.spriteLayers) {
      exist = this.spriteLayers[index].includes(spriteReference);
      if(exist) break;
    }
    return exist;
  }
  
  createTile(image,x,y,sources) {
    let tileSize = this.tileSize;
    const tile = new Sprite(image,x,y,tileSize,tileSize,sources.x,sources.y);
    this.tiles.push(tile);
    return tile;
  }
  
  createCollider(x,y,width,height,collisionWidth,collisionHeight) {
    const collider = new Sprite(null,x,y,width,height);
    collider.setCollisionCoords(collisionWidth,collisionHeight);
    this.colliders.unshift(collider);
    return collider;
  }
  
  createSprite(layerIndex,imageName,x,y,width,height,srcX,srcY,srcW,srcH) {
    let image = this.game.images.find(currentImage => currentImage.id === imageName);
    if(image) {
      const newSprite = new Sprite(image,x,y,width,height,srcX,srcY,srcW,srcH);
      this.spriteLayers[layerIndex].push(newSprite);
      return newSprite;
    } else {
      throw Error("O identificador de imagem passado não existe");
    }
  }
  
  mapTilesetSources(cols,rows,tileSourceSize) {
    const sourceCoords = this.sourceCoords;
    for(let row = 0; row < rows; row++) {
      for(let col = 0; col < cols; col++) {
        let x = col * tileSourceSize;
        let y = row * tileSourceSize;
        sourceCoords.push({ x, y });
      }
    }
  }
  
  createSceneTiles(layers,imageName,data,collidersIds,action) {
    const image = this.game.images.find(currentImage => currentImage.id === imageName);
    if(image) {
      let rows = this.rows, cols = this.cols;
      while(layers > 0) {
        for(let row = 0; row < rows; row++) {
          for(let col = 0; col < cols; col++) {
            let currentTileId = data.shift();
            if(currentTileId > 0) {
              let x = (col * this.tileSize), y = (row * this.tileSize);
              const sources = this.sourceCoords[--currentTileId];
              const tile = this.createTile(image,x,y,sources);
              if(collidersIds?.includes(currentTileId)) {
                this.colliders.unshift(tile)
              }
              action?.(tile,currentTileId,this);
            }
          }
        }
        layers--;
      }
    } else {
      throw Error("O identificador de imagem passado não existe");
    }
  }
  
  createSceneColliders(data,action) {
    let rows = this.cols, cols = this.cols;
    let tileSize = this.tileSize;
    for(let row = 0; row < rows; row++) {
      for(let col = 0; col < cols; col++) {
        let currentColliderId = data.shift();
        if(currentColliderId > 0) {
          let x = (col * tileSize), y = (row * tileSize);
          const collider = this.createCollider(x,y,tileSize,tileSize,x,y,tileSize,tileSize);
          action?.(collider);
        }
      }
    }
  }
}

class Sprite {
  constructor(image,x,y,width,height,srcX,srcY,srcW,srcH) {
    this.image = image;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.sourceX = srcX ?? 0;
    this.sourceY = srcY ?? 0;
    this.sourceWidth = srcW ?? width;
    this.sourceHeight = srcH ?? height;
    this.collisionWidth = width;
    this.collisionHeight = height;
    this.events = {
      action: null,
      update: null,
      collide: null,
    };
    this.visible = true;
    this.collider = true;
    this.currentLayer = 0;
    this.animated = false;
    this.animationCounter = 0;
    this.animationSource = 0;
    this.animationFrames = 1;
    this.animationSpeed = 5;
  }
  
  setCoords(x,y) {
    this.x = x;
    this.y = y;
  }
  
  setSourceCoords(srcX,srcY,srcW,srcH) {
    this.sourceX = srcX;
    this.sourceY = srcY;
    this.sourceWidth = srcW ?? this.width;
    this.sourceHeight = srcH ?? this.height;
  }
  
  setCollisionCoords(collisionWidth,collisionHeight) {
    this.collisionWidth = collisionWidth ?? this.width;
    this.collisionHeight = collisionHeight ?? this.height;
  }
  
  setCollision(state) {
    this.collider = state ?? !this.collider;
  }
  
  setVisibility(state) {
    this.visible = state ?? !this.visible;
  }
  
  setAnimation(frames,speed,animated) {
    this.animationSource = this.sourceX;
    this.animationFrames = frames;
    this.animationSpeed = speed;
    this.animated = animated ?? false;
  }
  
  draw(context) {
    const image = this.image;
    context.drawImage(
      image,this.sourceX,this.sourceY,
      this.sourceWidth,this.sourceWidth,
      this.x,this.y,this.width,this.height
    );
  }
  
  animation() {
    if(this.animated) {
      this.animationCounter++;
      let currentFrame = Math.floor(this.animationCounter / this.animationSpeed);
      if(currentFrame === this.animationFrames) {
        this.animationCounter = 0;
      }
      this.sourceX = this.animationSource + Math.floor(this.animationCounter / this.animationSpeed) * this.width;
    }
  }
}
