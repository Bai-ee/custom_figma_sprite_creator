let game = null;
let sprite = null;

export function initPhaser(imageUrl, config) {
  console.log('Initializing Phaser with config:', config);
  
  if (game) {
    game.destroy(true);
  }

  const gameConfig = {
    type: Phaser.AUTO,
    parent: 'phaser-preview',
    width: document.querySelector('.preview-container').offsetWidth,
    height: document.querySelector('.preview-container').offsetHeight,
    backgroundColor: '#2A2A2A',
    scene: {
      preload: function() {
        // Remove the 'data:image/png;base64,' prefix if it exists
        const base64Data = imageUrl.split(',')[1] || imageUrl;
        
        console.log('Loading spritesheet as base64');
        console.log('Frame dimensions:', config.frameWidth, 'x', config.frameHeight);
        
        // Load the spritesheet directly from base64
        this.textures.addBase64('sheet', 'data:image/png;base64,' + base64Data);
      },
      create: function() {
        console.log('Creating sprite and animation');
        
        // Create sprite frames manually
        const texture = this.textures.get('sheet');
        const frameWidth = parseInt(config.frameWidth);
        const frameHeight = parseInt(config.frameHeight);
        const frameCount = parseInt(config.frameCount);
        
        // Generate frames
        const frameNames = [];
        for (let i = 0; i < frameCount; i++) {
          const x = (i * frameWidth) % texture.source[0].width;
          const y = Math.floor((i * frameWidth) / texture.source[0].width) * frameHeight;
          
          this.anims.generateFrameNames('sheet', {
            frame: i,
            x: x,
            y: y,
            w: frameWidth,
            h: frameHeight
          });
          frameNames.push({ key: 'sheet', frame: i });
        }
        
        // Create sprite
        sprite = this.add.sprite(this.cameras.main.centerX, this.cameras.main.centerY, 'sheet');
        
        // Scale sprite to fit preview
        const scale = Math.min(
          (this.game.config.width * 0.8) / frameWidth,
          (this.game.config.height * 0.8) / frameHeight
        );
        sprite.setScale(scale);
        console.log('Sprite scale:', scale);
        
        // Create animation
        this.anims.create({
          key: 'play',
          frames: frameNames,
          frameRate: parseInt(config.fps),
          repeat: -1
        });
        
        sprite.play('play');
        console.log('Animation started');
      }
    }
  };
  
  game = new Phaser.Game(gameConfig);
  setTimeout(updateExportButton, 500);
}

export function getSprite() {
  return sprite;
}

export function getGame() {
  return game;
}

function updateExportButton() {
  const exportButton = document.getElementById('export-gif');
  exportButton.disabled = !sprite || !sprite.texture;
} 