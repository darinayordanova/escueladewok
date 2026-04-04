import { defineField, defineType } from 'sanity';

export const teamMember = defineType({
  name: 'teamMember',
  title: 'Team Member',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role / Title',
      type: 'localeString',
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'localeText',
    }),
    defineField({
      name: 'image',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'localeString',
        }),
      ],
    }),
  ],
  preview: {
    select: { name: 'name', role: 'role.en', media: 'image' },
    prepare({ name, role, media }) {
      return { title: name ?? 'Team member', subtitle: role ?? '—', media };
    },
  },
});
