const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

const svgTemplate = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563eb" rx="${size * 0.15}"/>
  <text 
    x="50%" 
    y="50%" 
    font-family="Arial, sans-serif" 
    font-size="${size * 0.4}" 
    font-weight="bold" 
    fill="white" 
    text-anchor="middle" 
    dominant-baseline="central"
  >BE</text>
</svg>
`;

console.log('🎨 Génération des icônes PWA...\n');

sizes.forEach(size => {
    const filename = `icon-${size}x${size}.png`;
    const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
    
    fs.writeFileSync(svgPath, svgTemplate(size).trim());
    console.log(`✅ Créé: ${filename} (SVG temporaire)`);
});

console.log('\n📝 Note: Les fichiers SVG ont été créés.');
console.log('Pour convertir en PNG, vous pouvez utiliser:');
console.log('  - Un outil en ligne comme https://cloudconvert.com/svg-to-png');
console.log('  - Ou installer sharp: npm install sharp');
console.log('  - Ou utiliser ImageMagick/Inkscape en ligne de commande\n');
console.log('💡 Pour l\'instant, les navigateurs modernes supportent aussi les SVG comme icônes PWA!');
