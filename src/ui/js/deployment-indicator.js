// Array of distinct colors for the indicator
const indicatorColors = [
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#FF9800', // Orange
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#00BCD4', // Cyan
  '#FFEB3B', // Yellow
  '#FF5722'  // Deep Orange
];

let lastColorIndex = -1;
let deploymentTimestamp = Date.now();

function getNextColor() {
  let nextIndex;
  do {
    nextIndex = Math.floor(Math.random() * indicatorColors.length);
  } while (nextIndex === lastColorIndex);
  
  lastColorIndex = nextIndex;
  return indicatorColors[nextIndex];
}

export function updateDeploymentIndicator() {
  console.log('Updating deployment indicator');
  const indicator = document.getElementById('deployment-indicator');
  if (!indicator) {
    console.error('Deployment indicator element not found');
    return;
  }
  
  const nextColor = getNextColor();
  console.log('Using color:', nextColor);
  
  indicator.classList.remove('active');
  // Update the active color in CSS
  document.documentElement.style.setProperty('--indicator-active-color', nextColor);
  // Force reflow
  void indicator.offsetWidth;
  indicator.classList.add('active');
  deploymentTimestamp = Date.now();
  
  // Reset after animation
  setTimeout(() => {
    indicator.classList.remove('active');
  }, 2000);
}

export function initDeploymentIndicator() {
  // Call immediately on load
  window.addEventListener('load', () => {
    console.log('Page loaded, updating indicator');
    updateDeploymentIndicator();
  });

  // Handle deployment messages
  window.addEventListener('message', (event) => {
    const msg = event.data.pluginMessage;
    if (msg && msg.type === 'code-deployed') {
      console.log('Received deployment message');
      updateDeploymentIndicator();
    }
  });
} 