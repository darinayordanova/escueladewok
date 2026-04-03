import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';

import { schemaTypes } from './src/sanity/schemaTypes';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  title: 'Escuela de Wok',
  plugins: [
    structureTool(),
    visionTool({ defaultApiVersion: '2025-01-01' }),
  ],
  schema: {
    types: schemaTypes,
  },
});
