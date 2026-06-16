import './loadEnv';
import fs from 'fs';
import { getPayload } from 'payload';
import config from './src/payload.config';
import AdmZip from 'adm-zip';

async function main() {
  const payload = await getPayload({ config });
  
  const zip = new AdmZip('./test_assets.zip');
  const entry = zip.getEntry('FPL71900v0-ex-ta+LD247038-C0900.jpg');
  if (!entry) {
    console.error('Entry not found in zip');
    process.exit(1);
  }
  
  const buffer = entry.getData();
  console.log(`Buffer size: ${buffer.length} bytes`);
  
  try {
    const doc = await payload.create({
      collection: 'media',
      data: {
        alt: 'Test upload FPL71900v0',
        type: 'image',
      },
      file: {
        data: buffer,
        name: 'FPL71900v0-ex-ta+LD247038-C0900.jpg',
        size: buffer.length,
        mimetype: 'image/jpeg',
      },
    });
    console.log('Successfully created media doc:', doc);
  } catch (err: any) {
    console.error('Failed to create media doc. Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Full Error:', err);
  }
  process.exit(0);
}

main();
