import { CollectionConfig } from 'payload';
import { fetchSpecifications } from '../utils/fetchSpecifications';

// Products Collection
export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true, // Allow anyone to read products
    create: ({ req }) => !!req.user, // Only authenticated users can create
    update: ({ req }) => !!req.user, // Only authenticated users can update
    delete: ({ req }) => !!req.user, // Only authenticated users can delete
  },
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {

        //if (operation !== 'create') {
        //  return doc;
        //}
        const { payload } = req;
        const modelNumber = doc.name;

        try {
          // Fetch specifications from general_data.luminaire
          const specs = await fetchSpecifications(modelNumber);

          if (specs) {
            // Update the product with the fetched specifications
            doc.specifications = specs;
            console.log(`Set specifications for new product with model ${modelNumber}:`, specs);
            console.log( `specifications: `, doc.specifications );
          } else {
            console.warn(`No specifications found for model number: ${modelNumber}`);
          }
        } catch (error) {
          console.error(`Error in afterChange hook for product ${doc.id}:`, error);
        }

        return doc;
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Model Number',
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
        name: 'categories', // Replaces the old 'category' select field
        type: 'relationship',
        relationTo: 'categories',
        hasMany: true, // Allows multiple categories (e.g., a product can be in "Ceiling Luminaires" and a sub-category)
        required: true,
    },
    {
        name: 'families', // New field for product families
        type: 'relationship',
        relationTo: 'families',
        hasMany: false, // Typically one family per product, but adjust if needed
        required: false, // Optional, depending on your needs
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'colour',
      type: 'text',
    },
    {
      name: 'power',
      type: 'text',
    },
    {
      name: 'colourTemperature',
      type: 'text',
      label: 'Colour Temperature',
    },
    {
      name: 'specifications',
      type: 'json',
      label: 'Specifications',
      admin: {
        description: 'Specifications will be fetched from the general_data.luminaire collection.',
      },
    },
  ],
};

