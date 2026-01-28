
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Manejo de require para sharp (commonjs en modulo ES)
const require = createRequire(import.meta.url);
let sharp;
try {
    sharp = require('sharp');
} catch (e) {
    console.error("❌ Error: 'sharp' no encontrado. Ejecuta 'npm install sharp' primero.");
    process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Ruta relativa desde src/utils/ a src/assets/blog
const BLOG_ASSETS_DIR = path.join(__dirname, '../assets/blog');

const TARGET_WIDTH = 800;
const TARGET_HEIGHT = 450;
const MAX_SIZE_KB = 200; // Umbral de peso optimizado (si pesa menos de esto y tiene dimensiones correctas, saltar)

async function processImages() {
    console.log(`📂 Buscando imágenes en: ${BLOG_ASSETS_DIR}`);

    try {
        const files = await fs.readdir(BLOG_ASSETS_DIR);
        let processedCount = 0;

        for (const file of files) {
            if (file.match(/\.(jpg|jpeg|png|webp|tiff)$/i)) {
                const filePath = path.join(BLOG_ASSETS_DIR, file);

                try {
                    // Leer estadísticas del archivo para el peso
                    const stats = await fs.stat(filePath);
                    const fileSizeKB = stats.size / 1024;

                    // Leer archivo a buffer primero para evitar bloqueos en Windows
                    const inputBuffer = await fs.readFile(filePath);
                    const metadata = await sharp(inputBuffer).metadata();

                    // CONDICIÓN DE CORTE:
                    // Si tiene las dimensiones exactas Y pesa menos del límite, asumimos que ya está optimizada.
                    if (metadata.width === TARGET_WIDTH && metadata.height === TARGET_HEIGHT && fileSizeKB <= MAX_SIZE_KB) {
                        console.log(`⏹️  Saltando ${file} (Correcto: ${metadata.width}x${metadata.height}, Peso: ${fileSizeKB.toFixed(2)}KB)`);
                        continue;
                    }

                    // Si es más pequeña que el objetivo, NO agrandar (evitar pixelado), pero si está cerca del tamaño podríamos permitirlo
                    if (metadata.width < TARGET_WIDTH && metadata.height < TARGET_HEIGHT) {
                        console.log(`⚠️  Saltando ${file} (Muy pequeña: ${metadata.width}x${metadata.height}. Evitamos estirarla).`);
                        continue;
                    }

                    console.log(`🔄 Procesando: ${file} (${metadata.width}x${metadata.height}, ${fileSizeKB.toFixed(2)}KB) -> ${TARGET_WIDTH}x${TARGET_HEIGHT} (Optimizado)`);

                    // Procesar: Redimensionar + Comprimir
                    let pipeline = sharp(inputBuffer)
                        .resize(TARGET_WIDTH, TARGET_HEIGHT, {
                            fit: 'cover',    // Recorta lo que sobre
                            position: 'center',
                            withoutEnlargement: false // Permitimos reducción
                        });

                    // Comprimir según formato
                    if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
                        pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
                    } else if (metadata.format === 'png') {
                        pipeline = pipeline.png({ quality: 80, compressionLevel: 9 });
                    } else if (metadata.format === 'webp') {
                        pipeline = pipeline.webp({ quality: 80 });
                    }

                    const outputBuffer = await pipeline.toBuffer();

                    await fs.writeFile(filePath, outputBuffer);
                    console.log(`✅ Guardado: ${file} (Nuevo tamaño: ${(outputBuffer.length / 1024).toFixed(2)}KB)`);
                    processedCount++;
                } catch (err) {
                    console.error(`❌ Error procesando ${file}:`, err.message);
                }
            }
        }

        if (processedCount === 0) {
            console.log("⚠️  No se encontraron imágenes nuevas para procesar.");
        } else {
            console.log(`\n✨ ¡Listo! Se procesaron ${processedCount} imágenes.`);
        }

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

processImages();
