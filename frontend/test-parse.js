const babel = require('@babel/core');
const fs = require('fs');
const content = fs.readFileSync('src/App.js', 'utf8');

// Comment out the themeIcons and themeLabels lines
const modifiedContent = content
  .replace(
    /const themeIcons = \{ light: <Sun size=\{20\} \/\}, dark: <Moon size=\{20\} \/\}, system: <Monitor size=\{20\} \/\} \};/,
    '// const themeIcons = { light: <Sun size={20} />, dark: <Moon size={20} />, system: <Monitor size={20} /> };'
  )
  .replace(
    /const themeLabels = \{ light: 'Light', dark: 'Dark', system: 'System' \};/,
    "// const themeLabels = { light: 'Light', dark: 'Dark', system: 'System' };"
  );

try {
  const result = require('@babel/core').parseSync(modifiedContent, {
    sourceType: 'module',
    filename: 'src/App.js',
    presets: [
      [require.resolve('babel-preset-react-app'), { runtime: 'automatic' }]
    ]
  });
  console.log('Parsed successfully without themeIcons/themeLabels');
} catch (e) {
  console.log('Babel Error:', e.message);
  console.log('Line:', e.loc?.line, 'Column:', e.loc?.column);
  if (e.codeFrame) console.log(e.codeFrame);
}