import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';

import { schemaTypes } from './src/sanity/schemaTypes';
import { DownloadParticipantsAction } from './src/sanity/actions/downloadParticipants';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';

// Document types that should only ever have one instance
const singletons = new Set(['homepage', 'aboutPage', 'contactPage', 'termsPage', 'privacyPage']);

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  title: 'Escuela de Wok',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            // ─── Singleton pages ────────────────────────────────────────────
            S.listItem()
              .title('Homepage')
              .child(S.document().schemaType('homepage').documentId('homepage')),
            S.listItem()
              .title('About Page')
              .child(S.document().schemaType('aboutPage').documentId('aboutPage')),
            S.listItem()
              .title('Contact Page')
              .child(S.document().schemaType('contactPage').documentId('contactPage')),
            S.listItem()
              .title('Terms of Service')
              .child(S.document().schemaType('termsPage').documentId('termsPage')),
            S.listItem()
              .title('Privacy Policy')
              .child(S.document().schemaType('privacyPage').documentId('privacyPage')),

            S.divider(),

            // ─── Collections ────────────────────────────────────────────────
            S.documentTypeListItem('course').title('Courses'),
            S.documentTypeListItem('courseSession').title('Bookings'),
          ]),
    }),
    visionTool({ defaultApiVersion: '2025-01-01' }),
  ],
  document: {
    actions: (prev, { schemaType }) => {
      if (schemaType === 'courseSession') {
        return [...prev, DownloadParticipantsAction];
      }
      return prev;
    },
  },
  schema: {
    types: schemaTypes,
    // Hide singleton types from the "create new document" menu
    templates: (prev) =>
      prev.filter((template) => !singletons.has(template.schemaType)),
  },
});
