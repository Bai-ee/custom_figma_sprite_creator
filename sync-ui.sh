#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Define paths
SRC_UI="src/ui/ui.html"
DIST_UI="dist/ui.html"

echo -e "${YELLOW}====== Figma UI Sync Tool ======${NC}"
echo -e "${BLUE}This script ensures changes to UI files are properly deployed${NC}"

# Function to show file info
show_file_info() {
    local file=$1
    if [ -f "$file" ]; then
        local mod_time=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$file")
        local file_size=$(stat -f "%z" "$file")
        echo -e "${BLUE}$file${NC}"
        echo "Last modified: $mod_time"
        echo "File size: $file_size bytes"
        echo "MD5: $(md5 -q "$file" | cut -c1-10)..."
    else
        echo -e "${RED}$file does not exist${NC}"
    fi
}

# Check if source UI file exists
if [ ! -f "$SRC_UI" ]; then
    echo -e "${RED}Error: $SRC_UI not found!${NC}"
    echo -e "Make sure you're running this script from the project root directory."
    exit 1
fi

# Create dist directory if it doesn't exist
mkdir -p dist

echo -e "\n${YELLOW}Current file status:${NC}"
show_file_info "$SRC_UI"
show_file_info "$DIST_UI"

# Backup dist/ui.html if it exists
if [ -f "$DIST_UI" ]; then
    cp -f "$DIST_UI" "${DIST_UI}.backup"
    echo -e "${YELLOW}✓ Created backup of existing $DIST_UI${NC}"
fi

# Copy UI file with force flag
echo -e "\n${YELLOW}Syncing files...${NC}"
cp -f "$SRC_UI" "$DIST_UI"

# Check if copy was successful
if [ $? -eq 0 ]; then
    # Update timestamp on destination file
    touch "$DIST_UI"
    
    echo -e "${GREEN}✓ Successfully synchronized UI files${NC}"
    
    # Verify file contents match
    if [ "$(md5 -q "$SRC_UI")" == "$(md5 -q "$DIST_UI")" ]; then
        echo -e "${GREEN}✓ File content verification successful${NC}"
    else
        echo -e "${RED}⚠️ Warning: File content verification failed${NC}"
        echo -e "The copy operation completed, but the files have different content."
        echo -e "This could indicate a file system error or permissions issue."
    fi
    
    # Show new status
    echo -e "\n${YELLOW}New file status:${NC}"
    show_file_info "$SRC_UI"
    show_file_info "$DIST_UI"
    
    echo -e "\n${PURPLE}🔍 Troubleshooting tips:${NC}"
    echo "1. Clear Figma plugin cache (⌥⌘R in Figma desktop app)"
    echo "2. Reload the plugin in Figma"
    echo "3. Check browser console for errors (right-click > Inspect > Console)"
    echo "4. If using Figma desktop app, try the web version or vice versa"
    echo -e "\n${PURPLE}📋 Common issues:${NC}"
    echo "- Figma may cache plugin UI files aggressively"
    echo "- Some browsers may block local resources"
    echo "- UI changes sometimes require a full plugin reload"
    
    # Create or update last_sync file
    date > .last_ui_sync
    echo -e "\n${GREEN}✓ Sync timestamp recorded${NC}"
else
    echo -e "${RED}Error: Failed to copy UI files${NC}"
    # Restore backup if it exists
    if [ -f "${DIST_UI}.backup" ]; then
        mv "${DIST_UI}.backup" "$DIST_UI"
        echo -e "${YELLOW}Restored previous $DIST_UI from backup${NC}"
    fi
    exit 1
fi

# Cleanup backup
rm -f "${DIST_UI}.backup"

echo -e "\n${GREEN}==== UI sync complete ====${NC}" 