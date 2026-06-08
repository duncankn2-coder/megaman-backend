const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    
    console.log('Fetching products and media to reference...');
    const products = await db.collection('products').find().limit(3).toArray();
    const media = await db.collection('media').find().limit(5).toArray();
    
    if (products.length === 0) {
      console.warn('No products found in the database. Please run imports first.');
    }
    if (media.length === 0) {
      console.warn('No media found in the database. Seeder might use mock ObjectIds.');
    }

    const defaultMediaId = media.length > 0 ? media[0]._id : new ObjectId();
    const slide1MediaId = media.length > 1 ? media[1]._id : defaultMediaId;
    const slide2MediaId = media.length > 2 ? media[2]._id : defaultMediaId;
    const project1MediaId = media.length > 3 ? media[3]._id : defaultMediaId;
    const project2MediaId = media.length > 4 ? media[4]._id : defaultMediaId;

    console.log('Clearing existing news and projects...');
    await db.collection('news').deleteMany({});
    await db.collection('projects').deleteMany({});

    console.log('Inserting news articles...');
    const newsData = [
      {
        title: 'INGENIUM® Matter Smart Lighting Mesh Rolled Out Globally',
        category: 'MATTER SMART HOME',
        publishDate: new Date('2026-05-24T00:00:00Z'),
        summary: 'Megaman announces the international deployment of our new Matter-compliant smart LED nodes and control relays, bringing seamless mesh reliability and dynamic CCT circadian tuning.',
        image: defaultMediaId,
        linkText: 'Read Press Release',
        linkUrl: '#',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Carbon Neutral Target: 100% Recyclable Casings by 2027',
        category: 'ECO SYSTEM',
        publishDate: new Date('2026-05-12T00:00:00Z'),
        summary: 'Aligning with international eco-efficiency goals, Megaman commits to transitioning all indoor structural downlights to pure recyclable copper-alloy heat sinks, cutting plastic waste.',
        image: slide1MediaId,
        linkText: 'Read Environmental Report',
        linkUrl: '#',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'SIENA Ultra-Slim Series Achieves Complete IP65 Ingress Rating',
        category: 'NEW ARRIVALS',
        publishDate: new Date('2026-05-05T00:00:00Z'),
        summary: 'Our popular, super-slim profile recessed spots (ideal for tight ceiling spaces) have successfully passed testing to receive a complete IP65 dust and moisture certification.',
        image: slide2MediaId,
        linkText: 'View Product Specifications',
        linkUrl: '#',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const newsResult = await db.collection('news').insertMany(newsData);
    const newsIds = Object.values(newsResult.insertedIds);
    console.log(`Inserted ${newsIds.length} news articles.`);

    console.log('Inserting reference projects...');
    const projectData = [
      {
        title: 'The Grand Plaza Lounge',
        description: 'Utilizing low-glare deep recessed LED downlights to establish a welcoming, cozy environment with dynamic twilight dimming support. Reduces operational lighting energy by 68%.',
        location: 'Athens, Greece',
        images: project1MediaId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Quadrilatero Fashion Hub',
        description: 'Implementing high-CRI 97 track spot luminaires. Meticulously engineered optics deliver striking high-contrast visual display while accurately rendering fine fabrics and textures.',
        location: 'Milan, Italy',
        images: project2MediaId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const projectsResult = await db.collection('projects').insertMany(projectData);
    const projectIds = Object.values(projectsResult.insertedIds);
    console.log(`Inserted ${projectIds.length} projects.`);

    console.log('Seeding HomePage global configuration...');
    // Clear old HomePage global
    await db.collection('globals').deleteMany({ slug: 'home-page' });

    const homePageLayout = [
      {
        blockType: 'hero',
        slides: [
          {
            title: 'CATALOGUES & DOWNLOADS',
            subtitle: 'TECHNICAL ARCHITECTURE',
            description: 'Access our comprehensive library of professional lighting planners, complete with photometric LDT files, Dialux calculations, BIM databases, and PDF product catalogs.',
            image: defaultMediaId,
            ctaText: 'DOWNLOAD CATALOGUES',
            ctaLink: '#categories-section'
          },
          {
            title: 'TRIONA SYSTEM CIRCULAR ELEGANCE',
            subtitle: 'ARCHITECTURAL COMPLIANCE',
            description: 'Replicating circular rimless perfection with lateral SIDELITE® light injection. Meticulously designed for low glare output, biological human-centric (HCL) rhythm tuning, and tool-free mounting connection.',
            image: slide1MediaId,
            ctaText: 'EXPLORE ARCHITECTURAL RANGE',
            ctaLink: '#categories-section'
          },
          {
            title: 'INGENIUM® MATTER SMART HOME IOT',
            subtitle: 'INTELLIGENT SMART NETWORKS',
            description: 'Connect your architectural downlights into a single, unified smart mesh network. Matter mesh compatibility allows robust multi-admin local router integrations, auto-routing meshes, and dynamic dim-to-warm circadian parameters.',
            image: slide2MediaId,
            ctaText: 'EXPLORE INGENIUM RANGE',
            ctaLink: '#categories-section'
          }
        ]
      },
      {
        blockType: 'categoriesGrid',
        title: 'PRODUCT CATEGORIES',
        subtitle: 'PORTFOLIO OVERVIEW',
        categories: [
          {
            number: '01',
            title: 'LED LAMPS',
            description: 'Classic lightbulbs, custom linear tubes, warm decorative filaments, and energy-efficient reflector lamps replacing legacy halogens.',
            parameterLabel: 'SYSTEM PARAMETERS',
            parameterValue: '150+ Lamps',
            linkUrl: '/products?category=Lamps',
            linkText: 'Explore Lamps'
          },
          {
            number: '02',
            title: 'INDOOR SYSTEMS',
            description: 'Deep recessed low-glare downlights (UGR < 19), customizable track spotlights, panels, and continuous seamless linear profiles.',
            parameterLabel: 'SYSTEM PARAMETERS',
            parameterValue: '80+ Downlights',
            linkUrl: '/products?category=Indoor%20Lighting',
            linkText: 'Explore Indoor'
          },
          {
            number: '03',
            title: 'OUTDOOR LIGHTING',
            description: 'Heavy-duty floodlights, damp-proof utility battens, bulkheads, and architectural garden bollards designed for high weatherability.',
            parameterLabel: 'SYSTEM PARAMETERS',
            parameterValue: 'IP65 / IP66',
            linkUrl: '/products?category=Outdoor%20Lighting',
            linkText: 'Explore Outdoor'
          },
          {
            number: '04',
            title: 'SMART CONTROLS',
            description: 'INGENIUM® Matter mesh controllers, sensors, and professional TECOH® LED modules for in-fixture specifications.',
            parameterLabel: 'SYSTEM PARAMETERS',
            parameterValue: '24 Active Items',
            linkUrl: '/products?category=Light%20Management',
            linkText: 'Explore Smart'
          }
        ]
      },
      {
        blockType: 'highlightProducts',
        title: 'HIGHLIGHTED PRODUCTS',
        subtitle: 'PREMIUM SELECTIONS',
        products: products.map(p => p._id)
      },
      {
        blockType: 'editorial',
        title: 'MEGAMAN® Precision Lighting Technology',
        subtitle: 'ENGINEERED BRILLIANCE',
        content: 'Our light sources are engineered to provide maximum luminous efficacy while preserving color fidelity. With advanced thermal management systems and custom-engineered lenses, Megaman products are built to last in commercial, hospitality, and architectural applications.',
        image: defaultMediaId,
        linkText: 'View Technologies',
        linkUrl: '/company/about-megaman',
        layout: 'split-right'
      },
      {
        blockType: 'inspiration',
        title: 'CREATIVE INSPIRATION',
        subtitle: 'PROJECTS & REFERENCES',
        projects: projectIds
      },
      {
        blockType: 'news',
        title: 'LATEST NEWS',
        subtitle: 'PRESS & MEDIA',
        source: 'latest',
        featuredNews: []
      }
    ];

    await db.collection('globals').insertOne({
      slug: 'home-page',
      layout: homePageLayout,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('HomePage global configuration seeded successfully.');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await client.close();
  }
}

run();
