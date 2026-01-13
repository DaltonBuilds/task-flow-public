import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const inputFile = join(rootDir, 'src/styles/tailwind.css');
const outputFile = join(rootDir, 'dist/static/tailwind.css');

// Ensure output directory exists
mkdirSync(join(rootDir, 'dist/static'), { recursive: true });

const css = readFileSync(inputFile, 'utf8');

// Configure Tailwind with base path for content scanning
const tailwindPlugin = tailwindcss({
  base: rootDir,
});

postcss([tailwindPlugin, autoprefixer])
  .process(css, { from: inputFile, to: outputFile })
  .then((result) => {
    writeFileSync(outputFile, result.css);
    if (result.map) {
      writeFileSync(outputFile + '.map', result.map.toString());
    }
    const sizeKB = (result.css.length / 1024).toFixed(2);
    console.log(`✓ Built Tailwind CSS: ${outputFile}`);
    console.log(`  Size: ${sizeKB} KB`);
    
    // Warn if CSS seems too small (likely missing classes)
    if (parseFloat(sizeKB) < 50) {
      console.warn('  ⚠️  Warning: CSS file seems small. Make sure content paths are correct.');
    }
  })
  .catch((error) => {
    console.error('Error building CSS:', error);
    process.exit(1);
  });
