import './loadEnv';
import fs from 'fs';
import path from 'path';
import { getPayload } from 'payload';
import config from './src/payload.config';

const AWARDS_DATA = [
  // Environmental Achievement
  {
    category: "environmental",
    year: "2025",
    title: "Outstanding ESG Sustainable Enterprise Award",
    institution: "H.K. Commercial Daily",
    logoKey: "/var/files/about_us/awards/2025/2025ESGValueRankings.jpg"
  },
  {
    category: "environmental",
    year: "2023",
    title: "Environmental Protection Enterprise Award",
    institution: "H.K. Commercial Daily",
    logoKey: "/var/files/about_us/awards/2024/green_asia_pacific_2023.png"
  },
  {
    category: "environmental",
    year: "2013-14",
    title: "Green Office Award",
    institution: "World Green Organisation, Hong Kong",
    logoKey: "/var/files/about_us/awards/wgo_goals_logo.jpg"
  },
  {
    category: "environmental",
    year: "2013",
    title: "United Nations Millennium Development Goals (UNMDG) - Better World Company",
    institution: "United Nations Better World Initiative",
    logoKey: "/var/files/about_us/awards/better_world_co_logo.png"
  },
  {
    category: "environmental",
    year: "2013",
    title: "Eco Award (also received in 2005, 2009)",
    institution: "BATIBOUW, Belgium",
    logoKey: "/var/files/about_us/awards/batibouw.jpg"
  },
  {
    category: "environmental",
    year: "2012",
    title: "Green New Product Award",
    institution: "ARCHIDEX, Malaysia",
    logoKey: "/var/files/about_us/awards/archidex_green_new_product_award_2012.png"
  },
  {
    category: "environmental",
    year: "2010",
    title: "Capital Outstanding Green Excellence Award",
    institution: "Capital Magazine, Hong Kong",
    logoKey: "/var/files/about_us/awards/capital_outstanding_green.jpg"
  },
  {
    category: "environmental",
    year: "2010",
    title: "Hong Kong Green Awards (Bronze)",
    institution: "Green Council, Hong Kong",
    logoKey: "/var/files/about_us/awards/hk_green.jpg"
  },
  {
    category: "environmental",
    year: "2009",
    title: "U Green Award - Electrical Appliances",
    institution: "U Magazine, Hong Kong",
    logoKey: "/var/files/about_us/awards/u_green.jpg"
  },
  {
    category: "environmental",
    year: "2009",
    title: "The Best for Home - The Green Brand Award",
    institution: "The Best for Home Association, Hong Kong",
    logoKey: "/var/files/about_us/awards/best_for_home_02.jpg"
  },
  {
    category: "environmental",
    year: "2008",
    title: "Sustainable Building Services Award - Green Product of the Year",
    institution: "Sustainable Building Services Society",
    logoKey: "/var/files/about_us/awards/sustainable-awards-2008.jpg"
  },
  {
    category: "environmental",
    year: "2007",
    title: "Eco-products Award",
    institution: "Eco-products Council, Hong Kong",
    logoKey: "/var/files/about_us/awards/ec-products-award07.gif"
  },
  {
    category: "environmental",
    year: "2005/07",
    title: "Eco-Products Gold Award and Silver Award",
    institution: "Eco-Products Committee, Hong Kong",
    logoKey: "/var/files/about_us/awards/goldaward-hk.gif"
  },
  {
    category: "environmental",
    year: "SGLS",
    title: "Singapore Green Labelling Scheme Certification",
    institution: "Singapore Environment Council (SEC)",
    logoKey: "/var/files/about_us/awards/greenlabel.gif"
  },
  {
    category: "environmental",
    year: "2007",
    title: "Prime Award for Eco-Business - Prime Eco-Corporate Award",
    institution: "Prime Magazine, Hong Kong",
    logoKey: "/var/files/about_us/awards/prime-awards-2007.gif"
  },
  {
    category: "environmental",
    year: "2005",
    title: "Hong Kong Awards for Industries - Environmental Performance Grand Award",
    institution: "Federation of Hong Kong Industries",
    logoKey: "/var/files/about_us/awards/hongkong-award-2005.gif"
  },

  // Quality Recognition
  {
    category: "quality",
    year: "2017-19",
    title: "Golden Palace Award Top 10",
    institution: "China Hospitality Awards Board",
    logoKey: "/var/files/about_us/awards/2019/golden_place_award_binlb_cn_2018-190.jpg"
  },
  {
    category: "quality",
    year: "2018",
    title: "Technical Lighting Award",
    institution: "China International Lighting Design Competition",
    logoKey: "/var/files/news/top_news/event_news/2018/10/26/CILD_logo.jpg"
  },
  {
    category: "quality",
    year: "2017",
    title: "Golden Design Award & Best Lighting Brand Award",
    institution: "China Lighting Design Committee",
    logoKey: "/var/files/about_us/awards/2017/golden_design_award_2017.jpg"
  },
  {
    category: "quality",
    year: "2016-17",
    title: "Alighting Award",
    institution: "Alighting Association, China",
    logoKey: "/var/files/about_us/awards/2017/alighting-award2017.jpg"
  },
  {
    category: "quality",
    year: "2013/16",
    title: "「Best Buy」 Product Endorsement",
    institution: "Which? Magazine, United Kingdom",
    logoKey: "/var/files/about_us/awards/2016/which_best_buy_201606.png"
  },
  {
    category: "quality",
    year: "2015",
    title: "LED Classic Bulb Rated “Five-Star”",
    institution: "Consumer Council, Hong Kong",
    logoKey: "/var/files/about_us/awards/2016/consumer_council_hk.png"
  },
  {
    category: "quality",
    year: "2012-13",
    title: "ARCHIDEX New Product Award",
    institution: "ARCHIDEX, Malaysia",
    logoKey: "/var/files/about_us/awards/archidex_new_product_award_2012.jpg"
  },
  {
    category: "quality",
    year: "2002-13",
    title: "Stiftung Warentest regular tested “Good” CFL & LED ratings",
    institution: "Stiftung Warentest, Germany",
    logoKey: "/var/files/about_us/awards/gut.gif"
  },
  {
    category: "quality",
    year: "2013",
    title: "Rated “The BEST Dimmable LED Classic”",
    institution: "Dutch Consumer Test Association, Netherlands",
    logoKey: "/var/files/about_us/awards/2016/dutch_consumer_test.png"
  },
  {
    category: "quality",
    year: "2013",
    title: "“Best Value for Money” Product",
    institution: "Lux Magazine, United Kingdom",
    logoKey: "/var/files/about_us/awards/lux_magazine_best_value_for_money.png"
  },
  {
    category: "quality",
    year: "2012",
    title: "Hong Kong International Lighting Products Award - Best of the Fair Award for “Light Source”",
    institution: "HKTDC, Hong Kong",
    logoKey: "/var/files/about_us/awards/hk_intl_lighting_products_award_2012_light_source.png"
  },
  {
    category: "quality",
    year: "2012",
    title: "HOMEDEC Quality Award",
    institution: "HOMEDEC Association, Malaysia",
    logoKey: "/var/files/about_us/awards/homedec_quality_award_2012.png"
  },
  {
    category: "quality",
    year: "2010",
    title: "Test Winner in Choice Magazine “CFL Testing”",
    institution: "Choice Magazine, Australia",
    logoKey: "/var/files/about_us/awards/choice.jpg"
  },
  {
    category: "quality",
    year: "2009",
    title: "Rated “Very Good” ÖKO Test for CFL Durability",
    institution: "ÖKO Test, Germany",
    logoKey: "/var/files/about_us/awards/oko_test.jpg"
  },
  {
    category: "quality",
    year: "2008",
    title: "Test Winner in Guter Rat Magazine 'Energy Saving Lamp Testing'",
    institution: "Guter Rat Magazine, Germany",
    logoKey: "/var/files/about_us/awards/guter_rate_2007-08.png"
  },
  {
    category: "quality",
    year: "2004",
    title: "VDE Test Report - Brightest Light & Best Price-Performance Ratio",
    institution: "VDE Institute, Germany",
    logoKey: "/var/files/about_us/awards/technik.jpg"
  },
  {
    category: "quality",
    year: "2003",
    title: "Hong Kong Awards for Industry - Quality Award",
    institution: "Trade and Industry Department, Hong Kong",
    logoKey: "/var/files/about_us/awards/hongkong-award-2005.gif"
  },

  // Technological Accomplishment
  {
    category: "technological",
    year: "2019",
    title: "LUX AWARDS Finalist - DBT Technology (Dual Beam)",
    institution: "Lux Awards, United Kingdom",
    logoKey: "/var/files/about_us/awards/2019/lux_uk_2019.jpg"
  },
  {
    category: "technological",
    year: "2015",
    title: "“Top Innovation of the Year” in diy Magazine",
    institution: "diy Magazine, Germany",
    logoKey: "/var/files/about_us/awards/diyonline_de.png"
  },
  {
    category: "technological",
    year: "2014",
    title: "HOMEDEC Good Design Award",
    institution: "HOMEDEC Association, Malaysia",
    logoKey: "/var/files/about_us/awards/homedec_good_design_award_2014_my.png"
  },
  {
    category: "technological",
    year: "2009-13",
    title: "ETOP Innovation Silver Award",
    institution: "ETOP Organisation, Netherlands",
    logoKey: "/var/files/about_us/awards/etop_innovation_awards_silver_2013.jpg"
  },
  {
    category: "technological",
    year: "2008",
    title: "designEX New Product Award",
    institution: "designEX, Australia",
    logoKey: "/var/files/about_us/awards/designex_2008_newprod.png"
  },
  {
    category: "technological",
    year: "2007",
    title: "LivinLuce and EnerMotive - Innovation & Design Award Finalist",
    institution: "LivinLuce Expo, Italy",
    logoKey: "/var/files/about_us/awards/premio-intel-2007.gif"
  },
  {
    category: "technological",
    year: "2005",
    title: "Intel Design Awards - Innovative Award",
    institution: "Intel Expo, Italy",
    logoKey: "/var/files/about_us/awards/premio-intel-2005.gif"
  },
  {
    category: "technological",
    year: "2005",
    title: "Lighting Design Awards - Winner in Innovations: Light Sources & Electronics Gear",
    institution: "Lighting Design Awards Committee, United Kingdom",
    logoKey: "/var/files/about_us/awards/lighting-design-2005.gif"
  },
  {
    category: "technological",
    year: "2005/09",
    title: "Batibouw Innovation Award",
    institution: "BATIBOUW, Belgium",
    logoKey: "/var/files/about_us/awards/batibouw.jpg"
  },
  {
    category: "technological",
    year: "2004",
    title: "Hong Kong Awards for Industry - Technological Achievement Award",
    institution: "Federation of Hong Kong Industries",
    logoKey: "/var/files/about_us/awards/hongkong-award-2005.gif"
  },

  // Other Awards
  {
    category: "other",
    year: "2018",
    title: "Advanced Member Association Award",
    institution: "SHGBC, China",
    logoKey: "/var/files/about_us/awards/2018/shgbc_association_image.png"
  },
  {
    category: "other",
    year: "2016",
    title: "Excellent Entrepreneur Award",
    institution: "Excellent Entrepreneur 2016, China",
    logoKey: "/var/files/about_us/awards/2017/excellent_entrepreneur.jpg"
  },
  {
    category: "other",
    year: "2015",
    title: "Top 100 LED Companies in China",
    institution: "CBDA Association, China",
    logoKey: "/var/files/news/top_news/corporate_news/2015/12/28/1/CBDA.png"
  },
  {
    category: "other",
    year: "2013",
    title: "Asia Excellence Award",
    institution: "Business Association, Singapore",
    logoKey: "/var/files/about_us/awards/asia_excellence_award_2013.jpg"
  },
  {
    category: "other",
    year: "2013-17",
    title: "Caring Company Logo Recognition",
    institution: "Hong Kong Council of Social Service",
    logoKey: "/var/files/about_us/awards/caring-company_2013-17.jpg"
  },
  {
    category: "other",
    year: "2008-16",
    title: "Caring Company Logo Recognition",
    institution: "Hong Kong Council of Social Service",
    logoKey: "/var/files/about_us/awards/caring-company.jpg"
  },
  {
    category: "other",
    year: "2005/09",
    title: "Batibouw Communication Award",
    institution: "BATIBOUW, Belgium",
    logoKey: "/var/files/about_us/awards/batibouw.jpg"
  },
  {
    category: "other",
    year: "2008",
    title: "Excellence in Action Awards - Innovation",
    institution: "Excellence in Action, Hong Kong",
    logoKey: "/var/files/about_us/awards/excellence-awards-2008.jpg"
  },
  {
    category: "other",
    year: "2008",
    title: "HKIM Brand-with-a-Conscience Certificate with Merit",
    institution: "Hong Kong Institute of Marketing",
    logoKey: "/var/files/about_us/awards/hkim-award.jpg"
  },
  {
    category: "other",
    year: "2005/06",
    title: "Superbrands Hong Kong Status",
    institution: "Superbrands Organization",
    logoKey: "/var/files/about_us/awards/superbrands.gif"
  },
  {
    category: "other",
    year: "2004",
    title: "Marketing Excellence Awards - Outstanding Energy-Saving Performance",
    institution: "Marketing Council, Philippines",
    logoKey: "/var/files/about_us/awards/philippines.gif"
  }
];

const LOGO_MAP: Record<string, string> = {
  "/var/files/about_us/awards/2025/2025ESGValueRankings.jpg": "/images/awards/2025_2025ESGValueRankings.jpg",
  "/var/files/about_us/awards/2024/green_asia_pacific_2023.png": "/images/awards/2024_green_asia_pacific_2023.png",
  "/var/files/about_us/awards/wgo_goals_logo.jpg": "/images/awards/wgo_goals_logo.jpg",
  "/var/files/about_us/awards/better_world_co_logo.png": "/images/awards/better_world_co_logo.png",
  "/var/files/about_us/awards/batibouw.jpg": "/images/awards/batibouw.jpg",
  "/var/files/about_us/awards/archidex_green_new_product_award_2012.png": "/images/awards/archidex_green_new_product_award_2012.png",
  "/var/files/about_us/awards/capital_outstanding_green.jpg": "/images/awards/capital_outstanding_green.jpg",
  "/var/files/about_us/awards/hk_green.jpg": "/images/awards/hk_green.jpg",
  "/var/files/about_us/awards/u_green.jpg": "/images/awards/u_green.jpg",
  "/var/files/about_us/awards/best_for_home_02.jpg": "/images/awards/best_for_home_02.jpg",
  "/var/files/about_us/awards/sustainable-awards-2008.jpg": "/images/awards/sustainable-awards-2008.jpg",
  "/var/files/about_us/awards/ec-products-award07.gif": "/images/awards/ec-products-award07.gif",
  "/var/files/about_us/awards/goldaward-hk.gif": "/images/awards/goldaward-hk.gif",
  "/var/files/about_us/awards/greenlabel.gif": "/images/awards/greenlabel.gif",
  "/var/files/about_us/awards/prime-awards-2007.gif": "/images/awards/prime-awards-2007.gif",
  "/var/files/about_us/awards/hongkong-award-2005.gif": "/images/awards/hongkong-award-2005.gif",
  "/var/files/about_us/awards/2019/golden_place_award_binlb_cn_2018-190.jpg": "/images/awards/2019_golden_place_award_binlb_cn_2018-190.jpg",
  "/var/files/news/top_news/event_news/2018/10/26/CILD_logo.jpg": "/images/awards/event_2018_10_26_CILD_logo.jpg",
  "/var/files/about_us/awards/2017/golden_design_award_2017.jpg": "/images/awards/2017_golden_design_award_2017.jpg",
  "/var/files/about_us/awards/2017/alighting-award2017.jpg": "/images/awards/2017_alighting-award2017.jpg",
  "/var/files/about_us/awards/2016/which_best_buy_201606.png": "/images/awards/2016_which_best_buy_201606.png",
  "/var/files/about_us/awards/2016/consumer_council_hk.png": "/images/awards/2016_consumer_council_hk.png",
  "/var/files/about_us/awards/archidex_new_product_award_2012.jpg": "/images/awards/archidex_new_product_award_2012.jpg",
  "/var/files/about_us/awards/gut.gif": "/images/awards/gut.gif",
  "/var/files/about_us/awards/2016/dutch_consumer_test.png": "/images/awards/2016_dutch_consumer_test.png",
  "/var/files/about_us/awards/lux_magazine_best_value_for_money.png": "/images/awards/lux_magazine_best_value_for_money.png",
  "/var/files/about_us/awards/hk_intl_lighting_products_award_2012_light_source.png": "/images/awards/hk_intl_lighting_products_award_2012_light_source.png",
  "/var/files/about_us/awards/homedec_quality_award_2012.png": "/images/awards/homedec_quality_award_2012.png",
  "/var/files/about_us/awards/choice.jpg": "/images/awards/choice.jpg",
  "/var/files/about_us/awards/oko_test.jpg": "/images/awards/oko_test.jpg",
  "/var/files/about_us/awards/guter_rate_2007-08.png": "/images/awards/guter_rate_2007-08.png",
  "/var/files/about_us/awards/technik.jpg": "/images/awards/technik.jpg",
  "/var/files/about_us/awards/2019/lux_uk_2019.jpg": "/images/awards/2019_lux_uk_2019.jpg",
  "/var/files/about_us/awards/diyonline_de.png": "/images/awards/diyonline_de.png",
  "/var/files/about_us/awards/homedec_good_design_award_2014_my.png": "/images/awards/homedec_good_design_award_2014_my.png",
  "/var/files/about_us/awards/etop_innovation_awards_silver_2013.jpg": "/images/awards/etop_innovation_awards_silver_2013.jpg",
  "/var/files/about_us/awards/designex_2008_newprod.png": "/images/awards/designex_2008_newprod.png",
  "/var/files/about_us/awards/premio-intel-2007.gif": "/images/awards/premio-intel-2007.gif",
  "/var/files/about_us/awards/premio-intel-2005.gif": "/images/awards/premio-intel-2005.gif",
  "/var/files/about_us/awards/lighting-design-2005.gif": "/images/awards/lighting-design-2005.gif",
  "/var/files/about_us/awards/2018/shgbc_association_image.png": "/images/awards/2018_shgbc_association_image.png",
  "/var/files/about_us/awards/2017/excellent_entrepreneur.jpg": "/images/awards/2017_excellent_entrepreneur.jpg",
  "/var/files/news/top_news/corporate_news/2015/12/28/1/CBDA.png": "/images/awards/corp_2015_12_28_1_CBDA.png",
  "/var/files/about_us/awards/asia_excellence_award_2013.jpg": "/images/awards/asia_excellence_award_2013.jpg",
  "/var/files/about_us/awards/caring-company_2013-17.jpg": "/images/awards/caring-company_2013-17.jpg",
  "/var/files/about_us/awards/caring-company.jpg": "/images/awards/caring-company.jpg",
  "/var/files/about_us/awards/excellence-awards-2008.jpg": "/images/awards/excellence-awards-2008.jpg",
  "/var/files/about_us/awards/hkim-award.jpg": "/images/awards/hkim-award.jpg",
  "/var/files/about_us/awards/superbrands.gif": "/images/awards/superbrands.gif",
  "/var/files/about_us/awards/philippines.gif": "/images/awards/philippines.gif"
};

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

async function main() {
  console.log('Initializing Payload...');
  const payload = await getPayload({ config });
  
  console.log('Clearing existing awards...');
  try {
    const existingAwards = await payload.find({
      collection: 'awards',
      limit: 1000,
    });
    console.log(`Found ${existingAwards.totalDocs} existing awards to remove.`);
    for (const doc of existingAwards.docs) {
      await payload.delete({
        collection: 'awards',
        id: doc.id,
      });
    }
    console.log('Cleared awards collection.');
  } catch (err) {
    console.warn('Could not clear awards collection (probably empty or not initialized yet):', err);
  }

  const mediaCache: Record<string, string> = {};

  console.log('Seeding awards...');
  let seededCount = 0;

  for (const item of AWARDS_DATA) {
    let mediaId: string | undefined = undefined;

    if (item.logoKey && LOGO_MAP[item.logoKey]) {
      const relativeLogoPath = LOGO_MAP[item.logoKey]; // e.g. /images/awards/2025_2025ESGValueRankings.jpg
      const filename = relativeLogoPath.replace('/images/awards/', ''); // e.g. 2025_2025ESGValueRankings.jpg
      const localFilePath = path.join('../megaman-frontend/public/images/awards', filename);

      if (mediaCache[filename]) {
        mediaId = mediaCache[filename];
      } else {
        // Check if file exists on disk
        if (fs.existsSync(localFilePath)) {
          const buffer = fs.readFileSync(localFilePath);
          const mimeType = getMimeType(filename);

          console.log(`Uploading logo ${filename} (${buffer.length} bytes)...`);
          try {
            // Find if media already exists in DB
            const existingMedia = await payload.find({
              collection: 'media',
              where: {
                alt: {
                  equals: `Logo for ${item.title}`,
                },
              },
            });

            if (existingMedia.totalDocs > 0) {
              mediaId = existingMedia.docs[0].id;
              mediaCache[filename] = mediaId;
              console.log(`Found existing media in DB: ${mediaId}`);
            } else {
              const mediaDoc = await payload.create({
                collection: 'media',
                data: {
                  alt: `Logo for ${item.title}`,
                  type: 'image',
                },
                file: {
                  data: buffer,
                  name: filename,
                  size: buffer.length,
                  mimetype: mimeType,
                },
              });
              mediaId = mediaDoc.id;
              mediaCache[filename] = mediaId;
              console.log(`Created media doc: ${mediaId}`);
            }
          } catch (uploadErr) {
            console.error(`Failed to upload media for ${filename}:`, uploadErr);
          }
        } else {
          console.warn(`File not found on disk: ${localFilePath}`);
        }
      }
    }

    try {
      const awardDoc = await payload.create({
        collection: 'awards',
        data: {
          title: item.title,
          year: item.year,
          institution: item.institution,
          category: item.category as 'environmental' | 'quality' | 'technological' | 'other',
          logo: mediaId,
        },
      });
      console.log(`Seeded award: ${awardDoc.title} (${awardDoc.id})`);
      seededCount++;
    } catch (createErr) {
      console.error(`Failed to create award ${item.title}:`, createErr);
    }
  }

  console.log(`\nSeeding completed successfully. Seeded ${seededCount} awards.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error seeding awards:', err);
  process.exit(1);
});
