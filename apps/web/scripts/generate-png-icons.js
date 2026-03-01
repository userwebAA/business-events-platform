/**
 * Génère des icônes PNG pour la PWA à partir d'un template SVG
 * Usage: node scripts/generate-png-icons.js
 * Nécessite: npm install sharp (ou utilise le SVG inline)
 */

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Créer le dossier si nécessaire
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

function generateSVG(size) {
    const radius = size * 0.15;
    const fontSize = size * 0.4;
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563eb" rx="${radius}"/>
  <text 
    x="50%" 
    y="50%" 
    font-family="Arial, Helvetica, sans-serif" 
    font-size="${fontSize}" 
    font-weight="bold" 
    fill="white" 
    text-anchor="middle" 
    dominant-baseline="central"
  >BE</text>
</svg>`;
}

// On essaie d'utiliser sharp si disponible, sinon on garde les SVG
async function main() {
    let useSharp = false;
    let sharp;
    
    try {
        sharp = require('sharp');
        useSharp = true;
        console.log('✅ sharp trouvé, génération en PNG');
    } catch {
        console.log('⚠️  sharp non trouvé, on va l\'installer...');
        const { execSync } = require('child_process');
        try {
            execSync('npm install sharp --save-dev', { 
                cwd: path.join(__dirname, '..'),
                stdio: 'inherit' 
            });
            sharp = require('sharp');
            useSharp = true;
            console.log('✅ sharp installé, génération en PNG');
        } catch (e) {
            console.error('❌ Impossible d\'installer sharp, génération SVG uniquement');
        }
    }

    for (const size of sizes) {
        const svg = generateSVG(size);
        const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
        
        // Toujours écrire le SVG mis à jour
        fs.writeFileSync(svgPath, svg);
        
        if (useSharp) {
            const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);
            await sharp(Buffer.from(svg))
                .resize(size, size)
                .png()
                .toFile(pngPath);
            console.log(`  ✅ ${size}x${size}.png`);
        }
    }

    console.log('\n🎉 Icônes générées avec succès !');
}

main().catch(console.error);
