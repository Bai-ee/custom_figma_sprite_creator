# Figma Sprite Sheet Creator

A Figma plugin that helps create sprite sheets from groups of elements. The plugin allows you to:

- Create equally sized frames for each group in your selection
- Center each group within its frame
- Maintain original content while creating sprite sheets
- Organize frames with auto-layout for easy management

## Features

- Custom frame dimensions with 1:1 ratio enforcement
- Automatic group centering within frames
- Transparent backgrounds
- Original content backup
- Sequential frame naming
- Auto-layout organization

## Project Structure
```
.
├── src/
│   ├── code.ts         # Figma plugin main logic
│   └── ui.html         # Source UI template
├── dist/
│   ├── code.js         # Compiled plugin code
│   └── ui.html         # Built UI file
└── manifest.json       # Plugin manifest
```

## Tech Stack
- TypeScript for plugin logic
- HTML/CSS/JavaScript for UI
- Figma Plugin API
- Webpack for bundling (if applicable)

## ⚠️ Important Development Notes

### UI Updates
When making changes to the plugin:
1. **Always update both locations:**
   - Edit source files in `src/`
   - Update corresponding files in `dist/`
   - Particularly important for `ui.html` which needs manual syncing

2. **UI File Synchronization:**
   ```
   src/ui.html → dist/ui.html
   ```
   The dist version must be manually updated after any changes to the source UI file.

### Build Process
1. TypeScript files are compiled to JavaScript
2. UI files need manual copying to dist
3. Always test after updating dist files

### Development Checklist
Before committing changes:
- [ ] Updated source files in `src/`
- [ ] Synchronized UI files to `dist/`
- [ ] Tested in Figma
- [ ] Checked console for errors
- [ ] Verified UI updates are visible

### Common Issues
1. UI changes not appearing:
   - Check if `dist/ui.html` was updated
   - Clear Figma plugin cache
   - Reload plugin

2. Plugin not working:
   - Verify `dist/code.js` is updated
   - Check console for errors
   - Ensure all files are in sync

## Development Workflow
1. Make changes to source files in `src/`
2. Update corresponding files in `dist/`
3. Test in Figma
4. Commit changes

## Debugging
- Use `console.log()` in both UI and plugin code
- Check browser console for UI issues
- Check plugin console for backend issues

## Build Commands
```bash
# If using npm/webpack
npm run build  # Builds TypeScript files

# Manual steps required
cp src/ui.html dist/ui.html  # Copy UI files
```

Remember: Always update the dist folder when making changes to ensure the plugin works correctly in Figma!

## Development

1. Clone the repository
```bash
git clone https://github.com/Bai-ee/custom_figma_sprite_creator.git
```

2. Install dependencies
```bash
npm install
```

3. Build the plugin
```bash
npm run build
```

4. Watch for changes (development)
```bash
npm run watch
```

## Usage

1. Select a frame containing groups
2. Run the plugin
3. Enter desired frame dimensions
4. Click "Create Sprite Sheet"

The plugin will:
- Create a backup of your original content
- Generate frames for each group
- Center groups within their frames
- Organize frames with auto-layout

## License

MIT 