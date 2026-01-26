import { readdir, readFile, writeFile, mkdir, stat } from 'fs/promises';
import { join, dirname, extname } from 'path';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
import { fileURLToPath } from 'url';

const extensionsDir = './public/extensions';
const outputDir = './public/downloads';


interface ExtensionInfo {
    name: string;
    version: string;
    description: string;
}

export interface ExtensionData {
    id: string;
    name: string;
    version: string;
    description: string;
    downloadUrl: string;
    size?: string; // Tamaño del ZIP
}

async function getExtensionInfo(extPath: string): Promise<ExtensionInfo | null> {
    try {
        const manifestPath = join(extPath, 'manifest.json');
        const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
        return {
            name: manifest.name,
            version: manifest.version,
            description: manifest.description || ''
        };
    } catch (error) {
        return null;
    }
}

async function zipExtension(
    folderName: string, 
    sourcePath: string, 
    outputPath: string
): Promise<number> {
    return new Promise((resolve, reject) => {
        const output = createWriteStream(outputPath);
        const archive = archiver('zip', {
            zlib: { 
                level: 9,           // Nivel base máximo
                memLevel: 9,        // Uso máximo de memoria (más rápido)
                strategy: 0         // Strategy default (mejor para texto)
            }
        });

        let totalBytes = 0;

        output.on('close', () => {
            totalBytes = archive.pointer();
            resolve(totalBytes);
        });
        
        archive.on('error', (err: Error) => reject(err));
        archive.on('warning', (err: Error & { code?: string }) => {
            if (err.code === 'ENOENT') {
                console.warn('Warning:', err);
            } else {
                reject(err);
            }
        });

        archive.pipe(output);

        // Agregar directorio completo (archiver maneja la compresión automáticamente)
        archive.directory(sourcePath, false);

        archive.finalize();
    });
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`;
}

async function getExtensionsData(): Promise<ExtensionData[]> {
    try {
        const extensions = await readdir(extensionsDir, { withFileTypes: true });
        const extensionsData: ExtensionData[] = [];

        for (const ext of extensions) {
            if (ext.isDirectory()) {
                const extPath = join(extensionsDir, ext.name);
                const info = await getExtensionInfo(extPath);
                
                if (info) {
                    // Obtener tamaño del ZIP si existe
                    const zipPath = join(outputDir, `${ext.name}.zip`);
                    let size = undefined;
                    try {
                        const stats = await stat(zipPath);
                        size = formatBytes(stats.size);
                    } catch {
                        // ZIP no existe aún
                    }

                    extensionsData.push({
                        id: ext.name,
                        ...info,
                        downloadUrl: `/downloads/${ext.name}.zip`,
                        size
                    });
                }
            }
        }

        return extensionsData;
    } catch (error) {
        console.error('Error reading extensions:', error);
        return [];
    }
}

async function buildExtensions(): Promise<void> {
    console.log('🔧 Iniciando empaquetado de extensiones...\n');

    // Crear directorios si no existen
    await mkdir(outputDir, { recursive: true });

    const extensions = await readdir(extensionsDir, { withFileTypes: true });
    const extensionsData: ExtensionData[] = [];

    for (const ext of extensions) {
        if (ext.isDirectory()) {
            const extPath = join(extensionsDir, ext.name);
            const info = await getExtensionInfo(extPath);
            
            if (info) {
                const zipPath = join(outputDir, `${ext.name}.zip`);
                
                console.log(`📦 Empaquetando ${ext.name}...`);
                const zipSize = await zipExtension(ext.name, extPath, zipPath);
                
                extensionsData.push({
                    id: ext.name,
                    ...info,
                    downloadUrl: `/downloads/${ext.name}.zip`,
                    size: formatBytes(zipSize)
                });
                
                console.log(`   ✅ ${ext.name} → ${formatBytes(zipSize)}\n`);
            }
        }
    }

    // Guardar metadata
    const dataFilePath = './src/data/extensions.json';
    await mkdir(dirname(dataFilePath), { recursive: true });
    await writeFile(
        dataFilePath,
        JSON.stringify(extensionsData, null, 2)
    );
    
    const totalSize = extensionsData.reduce((acc, ext) => {
        const match = ext.size?.match(/[\d.]+/);
        return acc + (match ? parseFloat(match[0]) : 0);
    }, 0);

    console.log(`\n📊 Resumen:`);
    console.log(`   • ${extensionsData.length} extensiones procesadas`);
    console.log(`   • Tamaño total: ~${totalSize.toFixed(2)} KB`);
}

// Función para detectar si se está ejecutando como script
function isMainModule(): boolean {
    if (typeof process === 'undefined') return false;
    const mainModule = process.argv[1];
    if (!mainModule) return false;
    const currentFile = fileURLToPath(import.meta.url);
    return mainModule === currentFile || mainModule.includes('build-extensions');
}

// Si se ejecuta directamente como script, ejecutar buildExtensions
if (isMainModule()) {
    buildExtensions().catch(console.error);
}

// Exportar los datos para Astro (solo lectura, sin crear ZIPs)
export default await getExtensionsData();