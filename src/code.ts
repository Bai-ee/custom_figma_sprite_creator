figma.showUI(__html__, { width: 320, height: 480 });

interface ElementDimensions {
  name: string;
  width: number;
  height: number;
  type: 'GROUP' | 'FRAME';
}

interface DimensionAnalysis {
  elements: ElementDimensions[];
  allSameSize: boolean;
  differentSizes: ElementDimensions[];
  standardSize?: { width: number; height: number };
  needsFormatting: boolean;
  maxDimension: number;
}

// Function to analyze dimensions of groups and frames in a parent frame
function analyzeElementDimensions(frame: FrameNode): DimensionAnalysis {
  // Get all top-level groups and frames
  const elements = frame.children
    .filter(child => (child.type === 'GROUP' || (child.type === 'FRAME' && child.name !== 'original_content')))
    .map(element => ({
      name: element.name,
      width: Math.round(element.width),
      height: Math.round(element.height),
      type: element.type as 'GROUP' | 'FRAME'
    }));

  if (elements.length === 0) {
    return {
      elements: [],
      allSameSize: false,
      differentSizes: [],
      needsFormatting: false,
      maxDimension: 0
    };
  }

  // Find the maximum dimension (width or height) among all elements
  const maxDimension = Math.max(
    ...elements.map(element => Math.max(element.width, element.height))
  );

  // Check if all elements have the same dimensions
  const firstElement = elements[0];
  const allSameSize = elements.every(
    element => element.width === firstElement.width && element.height === firstElement.height
  );

  // Find elements with different dimensions
  const differentSizes = elements.filter(
    element => element.width !== firstElement.width || element.height !== firstElement.height
  );

  // Determine if formatting is needed (different sizes exist)
  const needsFormatting = differentSizes.length > 0;

  return {
    elements,
    allSameSize,
    differentSizes,
    standardSize: allSameSize ? { width: firstElement.width, height: firstElement.height } : undefined,
    needsFormatting,
    maxDimension
  };
}

// Function to create a sprite sheet frame with custom dimensions
async function createSpriteSheetFrames(parentFrame: FrameNode, width: number, height: number): Promise<void> {
  console.log('Starting sprite sheet creation process...');
  
  // First, create a backup of original content
  const backupFrame = figma.createFrame();
  backupFrame.name = "original_content";
  backupFrame.visible = false;
  
  // Clone all children and add to backup frame
  parentFrame.children.forEach(child => {
    if ('clone' in child) {
      const clone = child.clone();
      backupFrame.appendChild(clone);
    }
  });
  
  // Add backup frame to parent
  parentFrame.appendChild(backupFrame);
  console.log('Created hidden backup of original content');
  
  // Ensure square frames by using the larger dimension
  const frameSize = Math.max(width, height);
  console.log(`Using square frame size of ${frameSize}x${frameSize}`);
  
  // Update UI for parent frame configuration
  figma.ui.postMessage({ type: 'progress-update', step: 'parent' });
  console.log('Configuring parent frame...');
  
  // Set up auto-layout on the parent frame
  try {
    parentFrame.layoutMode = "HORIZONTAL";
    parentFrame.primaryAxisAlignItems = "MIN";
    parentFrame.counterAxisAlignItems = "CENTER";
    parentFrame.itemSpacing = 0;
    parentFrame.paddingLeft = 0;
    parentFrame.paddingRight = 0;
    parentFrame.paddingTop = 0;
    parentFrame.paddingBottom = 0;
    console.log('Removed all spacing and padding');
    
    // Update UI for auto-layout completion
    figma.ui.postMessage({ type: 'progress-update', step: 'autolayout' });
  } catch (error: any) {
    console.error('Error setting up auto-layout:', error);
    figma.notify('Error setting up auto-layout: ' + (error.message || 'Unknown error'));
  }
  
  // Find all groups and frames (excluding the backup frame)
  const elements = parentFrame.children
    .filter(child => (child.type === 'GROUP' || (child.type === 'FRAME' && child.name !== 'original_content')))
    .reverse(); // Reverse the order for naming
  console.log(`Found ${elements.length} elements to process`);
  
  // Update UI for frame creation
  figma.ui.postMessage({ type: 'progress-update', step: 'frame' });
  
  // Process each element
  elements.forEach((element, index) => {
    const reverseIndex = elements.length - index; // For reverse naming order
    console.log(`Processing element ${reverseIndex} of ${elements.length}: ${element.name}`);
    
    // Create a new frame
    const spriteFrame = figma.createFrame();
    
    // Set the frame name with reverse sequential numbering
    spriteFrame.name = `${reverseIndex}_sprite_frame_${parentFrame.name}`;
    console.log('Created frame:', spriteFrame.name);
    
    // Set dimensions to maintain 1:1 ratio
    spriteFrame.resize(frameSize, frameSize);
    
    // Ensure transparent background
    spriteFrame.fills = [];
    
    // Add the frame to the parent frame
    parentFrame.insertChild(0, spriteFrame);
    
    // Move the element into the sprite frame
    spriteFrame.appendChild(element);
    
    // Center the element in the frame without auto-layout
    const centerX = (frameSize - element.width) / 2;
    const centerY = (frameSize - element.height) / 2;
    element.x = centerX;
    element.y = centerY;
    
    console.log(`Centered element in frame ${spriteFrame.name} at (${centerX}, ${centerY})`);
  });
  
  // Create the black background frame at the end
  const blackFrame = figma.createFrame();
  const frameName = `${elements.length + 1}_sprite_frame_${parentFrame.name}_bg`;
  blackFrame.name = frameName;
  blackFrame.resize(frameSize, frameSize);
  blackFrame.fills = [{
    type: 'SOLID',
    color: { r: 0, g: 0, b: 0 }
  }];

  // Load fonts
  await Promise.all([
    figma.loadFontAsync({ family: "Inter", style: "Bold" }),
    figma.loadFontAsync({ family: "Inter", style: "Regular" })
  ]);

  // Create headline text (numbers)
  const headlineText = figma.createText();
  const frameCount = elements.length;
  headlineText.characters = `1-${frameCount}`;
  headlineText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  headlineText.fontName = { family: "Inter", style: "Bold" };
  headlineText.textAutoResize = "WIDTH_AND_HEIGHT";
  headlineText.textAlignHorizontal = "CENTER";
  headlineText.fontSize = frameSize * 0.4;

  // Create subhead text (name)
  const subheadText = figma.createText();
  subheadText.characters = parentFrame.name;
  subheadText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  subheadText.fontName = { family: "Inter", style: "Regular" };
  subheadText.textAutoResize = "WIDTH_AND_HEIGHT";
  subheadText.textAlignHorizontal = "CENTER";
  subheadText.fontSize = frameSize * 0.15;

  // Add texts to frame
  blackFrame.appendChild(headlineText);
  blackFrame.appendChild(subheadText);

  // Position headline text
  const headlineMaxScale = Math.min(
    (frameSize * 0.9) / headlineText.width,
    (frameSize * 0.5) / headlineText.height
  );
  headlineText.resize(headlineText.width * headlineMaxScale, headlineText.height * headlineMaxScale);
  headlineText.x = (frameSize - headlineText.width) / 2;
  headlineText.y = (frameSize * 0.3) - (headlineText.height / 2);

  // Position subhead text
  const subheadMaxScale = Math.min(
    (frameSize * 0.8) / subheadText.width,
    (frameSize * 0.2) / subheadText.height
  );
  subheadText.resize(subheadText.width * subheadMaxScale, subheadText.height * subheadMaxScale);
  subheadText.x = (frameSize - subheadText.width) / 2;
  subheadText.y = (frameSize * 0.7) - (subheadText.height / 2);

  // Insert black frame at the end
  parentFrame.insertChild(parentFrame.children.length, blackFrame);
  console.log('Added black background frame with centered text at the end');
  
  // Set parent frame sizing to hug content
  parentFrame.layoutSizingHorizontal = "HUG";
  parentFrame.layoutSizingVertical = "HUG";
  console.log('Adjusted parent frame layout to hug contents');
  
  // Update UI for completion
  figma.ui.postMessage({ type: 'progress-update', step: 'complete' });
  console.log('All sprite frames created!');
}

// Function to update UI with current selection info
function updateSelectionInfo() {
  const selection = figma.currentPage.selection;
  
  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'selection-update',
      message: 'Select a frame to analyze',
      hasFrame: false,
      elementCount: 0,
      dimensionAnalysis: null
    });
    return;
  }
  
  if (selection.length > 1) {
    figma.ui.postMessage({
      type: 'selection-update',
      message: 'Please select only one frame',
      hasFrame: false,
      elementCount: 0,
      dimensionAnalysis: null
    });
    return;
  }
  
  const selectedNode = selection[0];
  
  if (selectedNode.type !== 'FRAME') {
    figma.ui.postMessage({
      type: 'selection-update',
      message: 'Please select a frame',
      hasFrame: false,
      elementCount: 0,
      dimensionAnalysis: null
    });
    return;
  }
  
  const elementCount = selectedNode.children.filter(
    child => child.type === 'GROUP' || (child.type === 'FRAME' && child.name !== 'original_content')
  ).length;
  
  const dimensionAnalysis = analyzeElementDimensions(selectedNode);

  figma.ui.postMessage({
    type: 'selection-update',
    message: `Frame "${selectedNode.name}" selected`,
    hasFrame: true,
    elementCount,
    dimensionAnalysis
  });
}

// Listen for selection changes
figma.on('selectionchange', () => {
  updateSelectionInfo();
});

// Initial selection check
updateSelectionInfo();

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'count-groups') {
    updateSelectionInfo();
  }
  
  if (msg.type === 'create-sprite-sheet') {
    const selection = figma.currentPage.selection;
    if (selection.length === 1 && selection[0].type === 'FRAME') {
      const parentFrame = selection[0];
      const analysis = analyzeElementDimensions(parentFrame);
      
      if (analysis.elements.length > 0) {
        // Create frames for all elements
        await createSpriteSheetFrames(parentFrame, msg.width, msg.height);
        figma.notify(`Created ${analysis.elements.length} sprite frames!`);
      } else {
        figma.notify('No groups or frames found in the selected frame');
      }
    }
  }
}; 