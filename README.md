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