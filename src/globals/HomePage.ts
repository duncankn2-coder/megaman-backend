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
};
