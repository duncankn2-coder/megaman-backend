import { GlobalConfig } from 'payload';
import {
  HeroBlock,
  CategoriesGridBlock,
  EditorialBlock,
  HighlightProductsBlock,
  InspirationBlock,
  NewsBlock,
} from '../blocks/layoutBlocks';

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'Home Page Configuration',
  access: {
    read: () => true, // Anyone can read
    update: ({ req }) => !!req.user, // Only authenticated users can edit
  },
  fields: [
    {
      name: 'international',
      type: 'group',
      label: 'International Site (megaman.cc)',
      fields: [
        {
          name: 'layout',
          type: 'blocks',
          label: 'Page Layout Sections',
          blocks: [
            HeroBlock,
            CategoriesGridBlock,
            EditorialBlock,
            HighlightProductsBlock,
            InspirationBlock,
            NewsBlock,
          ],
        },
      ],
    },
    {
      name: 'hk',
      type: 'group',
      label: 'Hong Kong Site (hk.megaman.cc)',
      fields: [
        {
          name: 'layout',
          type: 'blocks',
          label: 'Page Layout Sections',
          blocks: [
            HeroBlock,
            CategoriesGridBlock,
            EditorialBlock,
            HighlightProductsBlock,
            InspirationBlock,
            NewsBlock,
          ],
        },
      ],
    },
  ],
};
