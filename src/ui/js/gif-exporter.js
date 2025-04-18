import { getSprite } from './sprite-preview.js';

export function exportAsGif(workerUrl) {
  const exportButton = document.getElementById('export-gif');
  const progressBar = document.querySelector('.export-progress-bar');
  const progressContainer = document.querySelector('.export-progress');
  
  // Get current frame dimensions and count
  const frameWidth = parseInt(document.getElementById('frame-width').value);
  const frameHeight = parseInt(document.getElementById('frame-height').value);
  const frameCount = parseInt(document.getElementById('frame-count').value);
  const fps = parseInt(document.getElementById('fps').value);
  
  // Disable button during export
  exportButton.disabled = true;
  progressContainer.style.display = 'block';
  
  // Create GIF encoder with inline worker
  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: frameWidth,
    height: frameHeight,
    workerScript: workerUrl
  });
  
  // Create temporary canvas for frame extraction
  const canvas = document.createElement('canvas');
  canvas.width = frameWidth;
  canvas.height = frameHeight;
  const ctx = canvas.getContext('2d');
  
  // Load the sprite sheet image
  const img = new Image();
  img.onload = () => {
    // Add each frame to the GIF
    for (let i = 0; i < frameCount; i++) {
      ctx.clearRect(0, 0, frameWidth, frameHeight);
      const x = (i * frameWidth) % img.width;
      const y = Math.floor((i * frameWidth) / img.width) * frameHeight;
      ctx.drawImage(img, x, y, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
      gif.addFrame(ctx, { delay: 1000 / fps, copy: true });
    }
    
    // GIF generation progress
    gif.on('progress', (p) => {
      progressBar.style.width = `${Math.round(p * 100)}%`;
    });
    
    // GIF generation complete
    gif.on('finished', (blob) => {
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sprite-animation.gif';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      URL.revokeObjectURL(workerUrl);  // Clean up worker URL
      
      // Reset UI
      exportButton.disabled = false;
      progressContainer.style.display = 'none';
      progressBar.style.width = '0%';
    });
    
    // Start GIF generation
    gif.render();
  };
  
  // Get the current sprite sheet image data
  const sprite = getSprite();
  if (sprite && sprite.texture) {
    const textureCanvas = document.createElement('canvas');
    const textureCtx = textureCanvas.getContext('2d');
    textureCanvas.width = sprite.texture.source[0].width;
    textureCanvas.height = sprite.texture.source[0].height;
    textureCtx.drawImage(sprite.texture.source[0].image, 0, 0);
    img.src = textureCanvas.toDataURL();
  }
} 