figma.showUI(__html__, { width: 320, height: 480 });

interface GroupDimensions {
  name: string;
  width: number;
  height: number;
}

interface DimensionAnalysis {
  groups: GroupDimensions[];
  allSameSize: boolean;
  differentSizes: GroupDimensions[];
  standardSize?: { width: number; height: number };
  needsFormatting: boolean;
  maxDimension: number;
}

// Function to analyze group dimensions in a frame
function analyzeGroupDimensions(frame: FrameNode): DimensionAnalysis {
  // Get all top-level groups
  const groups = frame.children
    .filter(child => child.type === 'GROUP')
    .map(group => ({
      name: group.name,
      width: Math.round(group.width),
      height: Math.round(group.height)
    }));

  if (groups.length === 0) {
    return {
      groups: [],
      allSameSize: false,
      differentSizes: [],
      needsFormatting: false,
      maxDimension: 0
    };
  }

  // Find the maximum dimension (width or height) among all groups
  const maxDimension = Math.max(
    ...groups.map(group => Math.max(group.width, group.height))
  );

  // Check if all groups have the same dimensions
  const firstGroup = groups[0];
  const allSameSize = groups.every(
    group => group.width === firstGroup.width && group.height === firstGroup.height
  );

  // Find groups with different dimensions
  const differentSizes = groups.filter(
    group => group.width !== firstGroup.width || group.height !== firstGroup.height
  );

  // Determine if formatting is needed (different sizes exist)
  const needsFormatting = differentSizes.length > 0;

  return {
    groups,
    allSameSize,
    differentSizes,
    standardSize: allSameSize ? { width: firstGroup.width, height: firstGroup.height } : undefined,
    needsFormatting,
    maxDimension
  };
}

// Function to create a sprite sheet frame with custom dimensions
function createSpriteSheetFrames(parentFrame: FrameNode, width: number, height: number): void {
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
    console.log('Layout mode set to HORIZONTAL');
    
    parentFrame.primaryAxisAlignItems = "MIN"; // Left align
    console.log('Primary axis alignment set to MIN (left)');
    
    parentFrame.counterAxisAlignItems = "MIN"; // Top align
    console.log('Counter axis alignment set to MIN (top)');
    
    parentFrame.itemSpacing = 0; // Remove spacing between items
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
  
  // Find all groups (excluding the backup frame)
  const groups = parentFrame.children
    .filter(child => child.type === 'GROUP')
    .reverse(); // Reverse the order for naming
  console.log(`Found ${groups.length} groups to process`);
  
  // Update UI for frame creation
  figma.ui.postMessage({ type: 'progress-update', step: 'frame' });
  
  // Process each group
  groups.forEach((group, index) => {
    const reverseIndex = groups.length - index; // For reverse naming order
    console.log(`Processing group ${reverseIndex} of ${groups.length}: ${group.name}`);
    
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
    
    // Move the group into the sprite frame
    spriteFrame.appendChild(group);
    
    // Center the group in the frame without auto-layout
    const centerX = (frameSize - group.width) / 2;
    const centerY = (frameSize - group.height) / 2;
    group.x = centerX;
    group.y = centerY;
    
    console.log(`Centered group in frame ${spriteFrame.name} at (${centerX}, ${centerY})`);
  });
  
  // Resize parent frame to fit content
  parentFrame.layoutSizingHorizontal = "HUG";
  parentFrame.layoutSizingVertical = "HUG";
  console.log('Resized parent frame to hug content');
  
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
      groupCount: 0,
      dimensionAnalysis: null
    });
    return;
  }
  
  if (selection.length > 1) {
    figma.ui.postMessage({
      type: 'selection-update',
      message: 'Please select only one frame',
      hasFrame: false,
      groupCount: 0,
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
      groupCount: 0,
      dimensionAnalysis: null
    });
    return;
  }
  
  const groupCount = selectedNode.children.filter(child => child.type === 'GROUP').length;
  const dimensionAnalysis = analyzeGroupDimensions(selectedNode);

  figma.ui.postMessage({
    type: 'selection-update',
    message: `Frame "${selectedNode.name}" selected`,
    hasFrame: true,
    groupCount,
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
      const analysis = analyzeGroupDimensions(parentFrame);
      
      if (analysis.groups.length > 0) {
        // Create frames for all groups
        createSpriteSheetFrames(parentFrame, msg.width, msg.height);
        figma.notify(`Created ${analysis.groups.length} sprite frames!`);
      } else {
        figma.notify('No groups found in the selected frame');
      }
    }
  }
}; 