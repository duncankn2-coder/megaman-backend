import '../loadEnv';
import { getPayload } from 'payload';
import config from '../src/payload.config';

async function backfillSlugs() {
  const payload = await getPayload({ config });
  console.log('Fetching families to backfill slugs...');

  const families = await payload.find({
    collection: 'families',
    limit: 1000,
  });

  console.log(`Found ${families.docs.length} families.`);

  let updatedCount = 0;
  for (const fam of families.docs) {
    if (!fam.slug) {
      const generatedSlug = fam.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      console.log(`Updating "${fam.name}" (ID: ${fam.id}) -> slug: "${generatedSlug}"`);
      await payload.update({
        collection: 'families',
        id: fam.id,
        data: {
          slug: generatedSlug,
        },
      });
      updatedCount++;
    } else {
      console.log(`Family "${fam.name}" already has slug: "${fam.slug}"`);
    }
  }

  console.log(`Backfill complete. Updated ${updatedCount} families.`);
  process.exit(0);
}

backfillSlugs().catch(err => {
  console.error('Backfill error:', err);
  process.exit(1);
});
