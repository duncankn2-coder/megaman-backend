import '../loadEnv';
import { getPayload } from 'payload';
import config from '../src/payload.config';

async function main() {
  try {
    console.log("Initializing Payload...");
    const payload = await getPayload({ config });
    console.log("Fetching home-page global...");
    const doc = await payload.findGlobal({
      slug: 'home-page',
    });
    console.log("Success! Home page global:", JSON.stringify(doc, null, 2).slice(0, 500));
  } catch (err) {
    console.error("Error occurred:");
    console.error(err);
  }
  process.exit(0);
}

main();
