figma.showUI(__html__, { width: 400, height: 600 });

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'save-api-key') {
    await figma.clientStorage.setAsync('openai_api_key', msg.key);
  } else if (msg.type === 'load-api-key') {
    const savedKey = await figma.clientStorage.getAsync('openai_api_key');
    figma.ui.postMessage({ type: 'api-key-loaded', key: savedKey });
  }
};

interface ElementDimensions {
  name: string;
  width: number;
  height: number;
  type: 'GROUP' | 'FRAME';
}

interface DimensionAnalysis {
  elements: { width: number; height: number; name: string }[];
  maxWidth: number;
  maxHeight: number;
  commonRatio?: {
    ratio: number;
    count: number;
    maxWidth: number;
    maxHeight: number;
  };
}

// Function to analyze dimensions of groups and frames in a parent frame
function analyzeElementDimensions(nodes: readonly SceneNode[]): DimensionAnalysis {
  // Get all top-level groups and frames
  const elements = nodes
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
      maxWidth: 0,
      maxHeight: 0
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
    maxWidth: Math.max(...elements.map(element => element.width)),
    maxHeight: Math.max(...elements.map(element => element.height))
  };
}

// Function to create a sprite sheet frame with custom dimensions
async function createSpriteSheetFrames(
  parentFrame: FrameNode, 
  width: number, 
  height: number, 
  exportSize?: number
): Promise<void> {
  console.log('Starting sprite sheet creation process...');
  
  // First, create a backup of original content
  const backupFrame = figma.createFrame();
  backupFrame.name = "original_content";
  backupFrame.visible = false;
  
  // Store original dimensions and clone all children
  const originalElements = parentFrame.children
    .filter(child => (child.type === 'GROUP' || (child.type === 'FRAME' && child.name !== 'original_content')))
    .map(element => {
      if ('clone' in element) {
        const clone = element.clone();
      backupFrame.appendChild(clone);
        return {
          name: element.name,
          width: element.width,
          height: element.height,
          clone: clone
        };
      }
      return {
        name: element.name,
        width: element.width,
        height: element.height
      };
  });
  
  // Add backup frame to parent
  parentFrame.appendChild(backupFrame);
  console.log('Created hidden backup of original content');
  
  // Calculate scaling factors
  const frameSize = Math.max(width, height);
  const finalFrameSize = exportSize || frameSize;
  
  console.log(`Using container frame size of ${frameSize}x${frameSize}`);
  console.log(`Using export frame size of ${finalFrameSize}x${finalFrameSize}`);
  
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
    .reverse();
  console.log(`Found ${elements.length} elements to process`);
  
  // Update UI for frame creation
  figma.ui.postMessage({ type: 'progress-update', step: 'frame' });
  
  // Process each element
  elements.forEach((element, index) => {
    const reverseIndex = elements.length - index;
    const originalElement = originalElements[index];
    console.log(`Processing element ${reverseIndex} of ${elements.length}: ${element.name} (${element.type})`);
    
    // Store original dimensions
    const originalWidth = Math.round(originalElement.width);
    const originalHeight = Math.round(originalElement.height);
    console.log(`Original dimensions: ${originalWidth}x${originalHeight}`);
    
    // Create a new frame
    const spriteFrame = figma.createFrame();
    spriteFrame.name = `${reverseIndex}_sprite_frame_${parentFrame.name}`;
    spriteFrame.resize(finalFrameSize, finalFrameSize);
    spriteFrame.fills = [];
    spriteFrame.clipsContent = true; // Ensure content that exceeds boundaries is clipped
    
    // Add the frame to the parent frame
    parentFrame.insertChild(0, spriteFrame);
    
    // Different handling based on element type
    if (element.type === 'GROUP') {
      // For groups, we need to reconstruct to preserve structure
      console.log(`Special handling for GROUP: ${element.name}`);
      
      try {
        // Clone the group directly - this preserves internal structure
        const clonedGroup = element.clone();
        
        // Groups can't have auto-layout in Figma, but we can still ensure dimensions
        // Just apply resize directly to preserve dimensions
        clonedGroup.resize(originalWidth, originalHeight);
        
        // Put the clone into the sprite frame
        spriteFrame.appendChild(clonedGroup);
        
        // Center the group in the frame
        clonedGroup.x = (finalFrameSize - originalWidth) / 2;
        clonedGroup.y = (finalFrameSize - originalHeight) / 2;
        
        // Remove the original since we're using the clone
        element.remove();
        
        // Log the final dimensions to verify
        console.log(`Final group dimensions: ${Math.round(clonedGroup.width)}x${Math.round(clonedGroup.height)}`);
      } catch (error) {
        console.error(`Error handling group ${element.name}:`, error);
        
        // Fallback: try standard handling if cloning fails
        try {
          if ('resize' in element) {
            element.resize(originalWidth, originalHeight);
          }
          
          spriteFrame.appendChild(element);
          
          if ('x' in element && 'y' in element) {
            element.x = (finalFrameSize - originalWidth) / 2;
            element.y = (finalFrameSize - originalHeight) / 2;
          }
        } catch (fallbackError) {
          console.error('Fallback handling also failed:', fallbackError);
        }
      }
    } else if (element.type === 'FRAME') {
      // Special handling for frames - we can apply auto-layout
      console.log(`Applying auto-layout to frame: ${element.name}`);
      
      // Apply auto-layout to the frame to help maintain dimensions
      element.layoutMode = "HORIZONTAL";
      element.primaryAxisAlignItems = "CENTER";
      element.counterAxisAlignItems = "CENTER";
      element.layoutSizingHorizontal = "FIXED";
      element.layoutSizingVertical = "FIXED";
      console.log(`Applied auto-layout to frame ${element.name}`);
      
      // Ensure original dimensions are preserved before moving
      element.resize(originalWidth, originalHeight);
      
      // Move the element into the sprite frame
      spriteFrame.appendChild(element);
      
      // Center the element in the frame
      element.x = (finalFrameSize - originalWidth) / 2;
      element.y = (finalFrameSize - originalHeight) / 2;
      
      // Verify the final dimensions
      console.log(`Final frame dimensions: ${Math.round(element.width)}x${Math.round(element.height)}`);
    } else {
      // Standard handling for other element types
      console.log(`Standard handling for element: ${element.name}`);
      
      // Ensure original dimensions are preserved before moving
      if ('resize' in element) {
        element.resize(originalWidth, originalHeight);
      }
    
    // Move the element into the sprite frame
    spriteFrame.appendChild(element);
    
      // Center the element in the frame
      if ('x' in element && 'y' in element) {
        element.x = (finalFrameSize - originalWidth) / 2;
        element.y = (finalFrameSize - originalHeight) / 2;
      }
      
      // Verify the final dimensions
      console.log(`Final dimensions: ${Math.round(element.width)}x${Math.round(element.height)}`);
    }
    
    console.log(`Processed frame ${spriteFrame.name}`);
  });
  
  // Create the black background frame
  const blackFrame = figma.createFrame();
  const frameName = `${elements.length + 1}_sprite_frame_${parentFrame.name}_bg`;
  blackFrame.name = frameName;
  blackFrame.resize(finalFrameSize, finalFrameSize);
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
  headlineText.fontSize = finalFrameSize * 0.4;

  // Create subhead text (name)
  const subheadText = figma.createText();
  subheadText.characters = parentFrame.name;
  subheadText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  subheadText.fontName = { family: "Inter", style: "Regular" };
  subheadText.textAutoResize = "WIDTH_AND_HEIGHT";
  subheadText.textAlignHorizontal = "CENTER";
  subheadText.fontSize = finalFrameSize * 0.15;

  // Add texts to frame
  blackFrame.appendChild(headlineText);
  blackFrame.appendChild(subheadText);

  // Position headline text
  const headlineMaxScale = Math.min(
    (finalFrameSize * 0.9) / headlineText.width,
    (finalFrameSize * 0.5) / headlineText.height
  );
  headlineText.resize(
    headlineText.width * headlineMaxScale,
    headlineText.height * headlineMaxScale
  );
  headlineText.x = (finalFrameSize - headlineText.width) / 2;
  headlineText.y = (finalFrameSize * 0.3) - (headlineText.height / 2);

  // Position subhead text
  const subheadMaxScale = Math.min(
    (finalFrameSize * 0.8) / subheadText.width,
    (finalFrameSize * 0.2) / subheadText.height
  );
  subheadText.resize(
    subheadText.width * subheadMaxScale,
    subheadText.height * subheadMaxScale
  );
  subheadText.x = (finalFrameSize - subheadText.width) / 2;
  subheadText.y = (finalFrameSize * 0.7) - (subheadText.height / 2);

  // Insert black frame at the end
  parentFrame.insertChild(parentFrame.children.length, blackFrame);
  console.log('Added black background frame with centered text at the end');
  
  // Set parent frame sizing to hug content
  parentFrame.layoutSizingHorizontal = "HUG";
  parentFrame.layoutSizingVertical = "HUG";
  console.log('Adjusted parent frame layout to hug contents');
  
  // Send completion message
  figma.ui.postMessage({
    type: 'progress-update',
    step: 'complete'
  });
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
      dimensionAnalysis: null,
      isSpriteSheet: false
    });
    return;
  }
  
  if (selection.length > 1) {
    figma.ui.postMessage({
      type: 'selection-update',
      message: 'Please select only one frame',
      hasFrame: false,
      elementCount: 0,
      dimensionAnalysis: null,
      isSpriteSheet: false
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
      dimensionAnalysis: null,
      isSpriteSheet: false
    });
    return;
  }
  
  // Get direct children excluding the "original_content" backup frame
  const childFrames = selectedNode.children.filter(
    child => (child.type === 'GROUP' || child.type === 'FRAME') && child.name !== 'original_content'
  );
  
  const elementCount = childFrames.length;
  const dimensionAnalysis = analyzeElementDimensions(selectedNode.children);
  
  // Calculate sprite frame dimensions if this appears to be a sprite sheet
  let frameWidth = Math.round(selectedNode.width);
  let frameHeight = Math.round(selectedNode.height);
  let individualFrameWidth = frameWidth;
  let individualFrameHeight = frameHeight;
  let isSpriteSheet = false;
  let spriteFrameCount = 0;
  let recommendedContainerSize = 0;
  
  // Check if this is likely a sprite sheet by looking for similarly sized children
  if (childFrames.length > 1) {
    // Calculate the most common frame size among children
    const frameSizes: Record<string, number> = {};
    const frameWidths: number[] = [];
    const frameHeights: number[] = [];
    
    // Track the largest width and height for each size group
    const maxSizeByRatio: Record<string, {width: number, height: number}> = {};
    
    childFrames.forEach(frame => {
      if ('width' in frame && 'height' in frame) {
        const w = Math.round(frame.width);
        const h = Math.round(frame.height);
        const sizeKey = `${w}x${h}`;
        
        frameSizes[sizeKey] = (frameSizes[sizeKey] || 0) + 1;
        frameWidths.push(w);
        frameHeights.push(h);
        
        // Update max size for this ratio
        if (!maxSizeByRatio[sizeKey] || w > maxSizeByRatio[sizeKey].width || h > maxSizeByRatio[sizeKey].height) {
          maxSizeByRatio[sizeKey] = { width: w, height: h };
        }
      }
    });
    
    // Find most common size
    let mostCommonSize = '';
    let maxCount = 0;
    
    for (const sizeKey in frameSizes) {
      if (frameSizes[sizeKey] > maxCount) {
        maxCount = frameSizes[sizeKey];
        mostCommonSize = sizeKey;
      }
    }
    
    // If most frames have the same size, this is likely a sprite sheet
    if (maxCount > childFrames.length * 0.5) { // More than 50% have same size
      isSpriteSheet = true;
      spriteFrameCount = maxCount;
      
      // Extract dimensions from the most common size
      const [width, height] = mostCommonSize.split('x').map(Number);
      individualFrameWidth = width;
      individualFrameHeight = height;
      
      // Get the largest dimension from the most common size group
      const maxSize = maxSizeByRatio[mostCommonSize];
      if (maxSize) {
        recommendedContainerSize = Math.max(maxSize.width, maxSize.height);
      } else {
        recommendedContainerSize = Math.max(individualFrameWidth, individualFrameHeight);
      }
    } else {
      // If no common size, use average
      individualFrameWidth = Math.round(
        frameWidths.reduce((sum, width) => sum + width, 0) / frameWidths.length
      );
      individualFrameHeight = Math.round(
        frameHeights.reduce((sum, height) => sum + height, 0) / frameHeights.length
      );
      
      // For mixed sizes, use the largest dimension overall
      recommendedContainerSize = Math.max(
        ...frameWidths,
        ...frameHeights
      );
    }
  } else if (childFrames.length === 1 && 'width' in childFrames[0] && 'height' in childFrames[0]) {
    // If there's just one child, use its dimensions
    individualFrameWidth = Math.round(childFrames[0].width);
    individualFrameHeight = Math.round(childFrames[0].height);
    recommendedContainerSize = Math.max(individualFrameWidth, individualFrameHeight);
  } else {
    // If no children, use the current frame size
    recommendedContainerSize = Math.max(frameWidth, frameHeight);
  }

  // Send updated info to UI
  figma.ui.postMessage({
    type: 'selection-update',
    message: `Frame "${selectedNode.name}" selected`,
    hasFrame: true,
    elementCount,
    dimensionAnalysis,
    isSpriteSheet: true, // Always show export option
    frameWidth: individualFrameWidth,
    frameHeight: individualFrameHeight,
    sheetWidth: frameWidth,
    sheetHeight: frameHeight,
    spriteFrameCount,
    isActualSpriteSheet: isSpriteSheet,
    recommendedContainerSize
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
      const analysis = analyzeElementDimensions(parentFrame.children);
      
      if (analysis.elements.length > 0) {
        // Create frames for all elements
        await createSpriteSheetFrames(parentFrame, msg.width, msg.height, msg.exportSize);
        figma.notify(`Created ${analysis.elements.length} sprite frames!`);

        // Count actual sprite frames after creation
        const spriteFrames = parentFrame.children.filter(
          child => child.type === 'FRAME' && child.name.includes('sprite_frame') && child.name !== 'original_content'
        );

        // Send sprite sheet created message with dimensions
        figma.ui.postMessage({
          type: 'sprite-sheet-created',
          frameWidth: msg.width,
          frameHeight: msg.height,
          sheetWidth: parentFrame.width,
          sheetHeight: parentFrame.height,
          spriteFrameCount: spriteFrames.length
        });
      } else {
        figma.notify('No groups or frames found in the selected frame');
      }
    }
  }
  
  if (msg.type === 'export-sprite-sheet') {
    const selection = figma.currentPage.selection;
    if (selection.length === 1 && selection[0].type === 'FRAME') {
      const originalFrame = selection[0];
      
      // Get the target export dimensions
      const targetFrameWidth = msg.frameWidth || Math.round(originalFrame.width);
      const targetFrameHeight = msg.frameHeight || Math.round(originalFrame.height);
      
      try {
        figma.notify('Creating flattened copy for export...');
        
        // Create an export copy frame
        const exportFrame = figma.createFrame();
        exportFrame.name = `${originalFrame.name}_export`;
        exportFrame.x = originalFrame.x + originalFrame.width + 100; // Position to the right of original
        exportFrame.y = originalFrame.y;
        
        // Calculate the new sheet dimensions using the originalFrame's layout
        const frameRatio = originalFrame.width / originalFrame.height;
        
        // Determine the best fit for the new sheet dimensions while maintaining aspect ratio
        let newSheetWidth, newSheetHeight;
        
        // If we're asking for a specific frame size, calculate sheet size based on frame count
        if (msg.frameWidth && msg.frameHeight) {
          // Count the number of frames in the sprite sheet (excluding the backup frame)
          const frameCount = originalFrame.children.filter(
            child => child.type === 'FRAME' && child.name !== 'original_content'
          ).length;
          
          // Assume horizontal layout (common for sprite sheets)
          // This is a simplified calculation - adjust if your sprite sheet has a more complex layout
          const framesPerRow = Math.ceil(Math.sqrt(frameCount));
          newSheetWidth = targetFrameWidth * framesPerRow;
          newSheetHeight = targetFrameHeight * Math.ceil(frameCount / framesPerRow);
        } else {
          // If no specific frame size, maintain original aspect ratio
          newSheetWidth = Math.round(originalFrame.width);
          newSheetHeight = Math.round(originalFrame.height);
        }
        
        // Resize the export frame to the new dimensions
        exportFrame.resize(newSheetWidth, newSheetHeight);
        exportFrame.clipsContent = true;
        
        // Create a clone of the original frame and all its children
        const clone = originalFrame.clone();
        
        // Resize the clone to match the target dimensions, preserving aspect ratio
        clone.resize(newSheetWidth, newSheetHeight);
        
        // Set the clone's constraints to preserve aspect ratio
        if (clone.children) {
          clone.children.forEach(child => {
            if ('constraints' in child) {
              // Preserve position relative to parent
              child.constraints = {
                horizontal: 'SCALE',
                vertical: 'SCALE'
              };
            }
          });
        }
        
        // Add the clone to the export frame
        exportFrame.appendChild(clone);
        
        // Flatten the export frame by exporting it as bytes and reimporting it as an image
        try {
          // Set a temporary export setting
          exportFrame.exportSettings = [{
            format: 'PNG',
            constraint: { type: 'SCALE', value: 1 }
          }];
          
          // Export the frame as PNG bytes
          const bytes = await exportFrame.exportAsync({
            format: 'PNG',
            constraint: { type: 'SCALE', value: 1 }
          });
          
          // Create a new flattened frame
          const flattenedFrame = figma.createFrame();
          flattenedFrame.name = `${originalFrame.name}_flattened`;
          flattenedFrame.resize(newSheetWidth, newSheetHeight);
          flattenedFrame.x = exportFrame.x + exportFrame.width + 50;
          flattenedFrame.y = exportFrame.y;
          
          // Create an image fill from the bytes
          const image = figma.createImage(bytes);
          flattenedFrame.fills = [{
            type: 'IMAGE',
            scaleMode: 'FILL',
            imageHash: image.hash
          }];
          
          // Remove the intermediate export frame
          exportFrame.remove();
          
          // Select the flattened frame
          figma.currentPage.selection = [flattenedFrame];
          figma.viewport.scrollAndZoomIntoView([flattenedFrame]);
          
          // Configure export settings for the flattened frame
          flattenedFrame.exportSettings = [{
            format: 'PNG',
            suffix: '',
            constraint: { type: 'SCALE', value: 1 }
          }];
          
          figma.notify(`Ready to export flattened sprite sheet at ${newSheetWidth}×${newSheetHeight}px! Use the Export panel in Figma.`);
          
          // Let the UI know we're ready for export
          figma.ui.postMessage({
            type: 'export-started',
            exportWidth: newSheetWidth,
            exportHeight: newSheetHeight,
            scale: 1.0,
            flattened: true
          });
        } catch (flattenError: unknown) {
          // If flattening fails, continue with the non-flattened clone
          figma.notify('Could not flatten the sprite sheet, but you can still export the copy.');
          
          // Configure export settings for the non-flattened frame
          exportFrame.exportSettings = [{
            format: 'PNG',
            suffix: '',
            constraint: { type: 'SCALE', value: 1 }
          }];
          
          figma.currentPage.selection = [exportFrame];
          figma.viewport.scrollAndZoomIntoView([exportFrame]);
          
          // Let the UI know we're ready for export with the non-flattened version
          figma.ui.postMessage({
            type: 'export-started',
            exportWidth: newSheetWidth,
            exportHeight: newSheetHeight,
            scale: 1.0,
            flattened: false
          });
        }
        
        // Wait a moment, then signal completion
        setTimeout(() => {
          figma.ui.postMessage({ type: 'export-complete' });
        }, 1000);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        figma.notify('Error creating export copy: ' + errorMessage);
        figma.ui.postMessage({ 
          type: 'export-error',
          message: errorMessage
        });
      }
    } else {
      figma.notify('Please select a frame to export');
    }
  }
};

function resizeSelectedFrames() {
  const selectedNode = figma.currentPage.selection[0];
  if (!selectedNode || !('children' in selectedNode)) {
    figma.notify('Please select a frame or group containing the sprites');
    return;
  }

  const validChildren = selectedNode.children.filter(child => 
    ('width' in child && 'height' in child && child.name !== 'original_content')
  );

  const analysis = analyzeElementDimensions(validChildren);
  
  // Send dimension info to UI
  figma.ui.postMessage({
    type: 'dimension-info',
    analysis: {
      ...analysis,
      commonRatio: analysis.commonRatio || null
    }
  });
}