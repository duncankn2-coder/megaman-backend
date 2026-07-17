const { MongoClient } = require('mongodb');

// Retrieve URI from environment or use fallback
const uri = process.env.DATABASE_URI || 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const VIDEOS = [
  {
    title: 'MEGAMAN® Corporate Overview',
    description: 'Discover the story of MEGAMAN® — a global leader in energy-efficient LED lighting since 1994, with innovation at its core.',
    youtubeLink: 'https://www.youtube.com/watch?v=E8vXpMvPILk',
    youtubeId: 'E8vXpMvPILk',
    category: 'Corporate',
    duration: '3:42',
  },
  {
    title: 'INGENIUM® Matter Smart Lighting System',
    description: 'Learn how the INGENIUM® IoT platform integrates with Apple Home, Google Home, and Amazon Alexa via the Matter protocol.',
    youtubeLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeId: 'dQw4w9WgXcQ',
    category: 'Smart Lighting',
    duration: '4:15',
  },
  {
    title: 'Siena LED Downlight Series – Installation Guide',
    description: 'Step-by-step installation guide for the Siena recessed downlight family, covering ceiling cut-out, driver wiring, and commissioning.',
    youtubeLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeId: 'dQw4w9WgXcQ',
    category: 'Installation',
    duration: '6:28',
  },
  {
    title: 'Toledo Architectural Track Lighting – Case Study',
    description: 'A walkthrough of the Toledo Pro-Track system installed across a luxury boutique retail space in Munich.',
    youtubeLink: 'https://www.youtube.com/watch?v=E8vXpMvPILk',
    youtubeId: 'E8vXpMvPILk',
    category: 'Case Study',
    duration: '5:10',
  },
  {
    title: 'MEGAMAN® Circular Economy & Sustainability',
    description: 'How MEGAMAN® approaches product lifecycle from design to responsible disposal under its Green Procurement standards.',
    youtubeLink: 'https://www.youtube.com/watch?v=E8vXpMvPILk',
    youtubeId: 'E8vXpMvPILk',
    category: 'Sustainability',
    duration: '2:55',
  },
  {
    title: 'Triona LED Panel – LM80 Tested Performance',
    description: 'An in-depth review of the Triona LED panel photometric performance, LM80 lumen depreciation results, and warranty conditions.',
    youtubeLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeId: 'dQw4w9WgXcQ',
    category: 'Technical',
    duration: '7:02',
  },
];

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    // Default Payload collection database name in MongoDB is usually 'test' or in the connection string
    // Let's connect to 'test' which is consistent with seedHomePage.cjs
    const db = client.db('test');
    
    console.log('Clearing existing videos...');
    await db.collection('videos').deleteMany({});

    console.log('Inserting seed videos...');
    const videoData = VIDEOS.map((video) => ({
      ...video,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await db.collection('videos').insertMany(videoData);
    console.log(`Successfully seeded ${result.insertedCount} videos.`);
  } catch (error) {
    console.error('Error seeding videos:', error);
  } finally {
    await client.close();
  }
}

run();
