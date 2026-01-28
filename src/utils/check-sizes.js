
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_ASSETS_DIR = path.join(__dirname, '../assets/blog');

async function checkSizes() {
    console.log(`Checking sizes in: ${BLOG_ASSETS_DIR}`);
    try {
        const files = await fs.readdir(BLOG_ASSETS_DIR);
        for (const file of files) {
            if (file.match(/\.(jpg|jpeg|png|webp|tiff)$/i)) {
                const filePath = path.join(BLOG_ASSETS_DIR, file);
                const metadata = await sharp(await fs.readFile(filePath)).metadata();
                console.log(`- ${file}: ${metadata.width}x${metadata.height} px`);
            }
        }
    } catch (err) {
        console.error(err);
    }
}

checkSizes();
