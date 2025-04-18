#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${YELLOW}====== Figma Plugin Reload Helper ======${NC}"
echo -e "${BLUE}This script helps force Figma to reload your plugin${NC}"

# Check if we're in the right directory
if [ ! -d "dist" ] || [ ! -d "src" ]; then
    echo -e "${RED}Error: This doesn't appear to be a Figma plugin directory.${NC}"
    echo -e "Make sure you're running this script from the project root directory."
    exit 1
fi

# First, make sure we have a fresh build
echo -e "\n${YELLOW}Step 1: Rebuilding the plugin...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Build failed. Fix build errors before continuing.${NC}"
    exit 1
fi

# Touch the files to update their modification times
echo -e "\n${YELLOW}Step 2: Updating file timestamps...${NC}"
touch dist/code.js dist/ui.html
echo -e "${GREEN}✓ Updated file timestamps${NC}"

# Check current timestamps
echo -e "\n${YELLOW}Current file timestamps:${NC}"
stat -f "%N: %Sm" -t "%Y-%m-%d %H:%M:%S" dist/code.js
stat -f "%N: %Sm" -t "%Y-%m-%d %H:%M:%S" dist/ui.html

echo -e "\n${PURPLE}🔍 Next steps:${NC}"
echo "1. In Figma, use keyboard shortcut ⌥⌘R (Option+Command+R) to reload plugins"
echo "2. Relaunch your plugin from the Figma menu"
echo "3. Check the console for any errors (right-click > Inspect > Console)"

echo -e "\n${YELLOW}Pro Tips:${NC}"
echo "- If changes aren't appearing, try restarting Figma completely"
echo "- For UI changes, you may need to close and reopen the plugin"
echo "- Check both the plugin console AND the main Figma console for errors"

echo -e "\n${GREEN}====== Plugin Reload Helper Complete ======${NC}" 