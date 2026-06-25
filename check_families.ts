import './loadEnv';
import { getPayload } from 'payload';
import config from './src/payload.config';

async function main() {
  const payload = await getPayload({ config });
  
  console.log('Querying families in CMS...');
  
  const families = await payload.find({
    collection: 'families',
    limit: 1000,
  });
  
  console.log(`Found ${families.docs.length} families.`);
  
  // Find or create default placeholder image
  let placeholderImageId: string | null = null;
  try {
    const existingPlaceholder = await payload.find({
      collection: 'media',
      where: {
        alt: { equals: 'Placeholder Image' },
      },
      limit: 1,
    });

    if (existingPlaceholder.docs.length > 0) {
      placeholderImageId = existingPlaceholder.docs[0].id as string;
    } else {
      const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      const buffer = Buffer.from(base64Png, 'base64');
      
      const newMedia = await payload.create({
        collection: 'media',
        data: {
          alt: 'Placeholder Image',
          type: 'image',
        },
        file: {
          data: buffer,
          name: 'placeholder.png',
          size: buffer.length,
          mimetype: 'image/png',
        },
      });
      placeholderImageId = newMedia.id as string;
    }
    console.log(`Placeholder image ID: ${placeholderImageId}`);
  } catch (e: any) {
    console.error('Error getting placeholder image:', e.message);
  }
  
  let fixedCount = 0;
  for (const fam of families.docs) {
    const media = fam.media;
    const mediaArray = Array.isArray(media) ? media : [];
    
    // Check if media is missing, null, or empty
    if (!media || mediaArray.length === 0 || (mediaArray as any[]).includes(null) || (mediaArray as any[]).includes(undefined)) {
      console.log(`Family "${fam.name}" (ID: ${fam.id}) has invalid media:`, media);
      if (placeholderImageId) {
        console.log(`Fixing family "${fam.name}" by assigning placeholder image...`);
        try {
          await payload.update({
            collection: 'families',
            id: fam.id,
            data: {
              media: [placeholderImageId],
            },
          });
          fixedCount++;
          console.log(`Successfully fixed family "${fam.name}".`);
        } catch (err: any) {
          console.error(`Failed to fix family "${fam.name}":`, err.message);
        }
      } else {
        console.log('Skipping fix because placeholder image ID is not available.');
      }
    }
  }
  
  console.log(`Database inspection complete. Fixed ${fixedCount} families.`);
  process.exit(0);
}

main();
