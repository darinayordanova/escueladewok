import { groq } from 'next-sanity';

export const homepageQuery = groq`
  *[_type == "homepage"][0] {
    _id,
    heroTitle,
    heroSubtitle,
    heroCtaLabel,
    heroImage,
    featuredCoursesTitle,
  }
`;

export const featuredCoursesQuery = groq`
  *[_type == "course" && featured == true] | order(_createdAt desc) {
    _id,
    title,
    slug,
    description,
    image,
    price,
    currency,
    duration,
    difficulty,
    instructor,
    featured,
  }
`;

export const allCoursesQuery = groq`
  *[_type == "course"] | order(_createdAt desc) {
    _id,
    title,
    slug,
    description,
    image,
    price,
    currency,
    duration,
    difficulty,
    instructor,
  }
`;

export const courseBySlugQuery = groq`
  *[_type == "course" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    description,
    image,
    price,
    currency,
    duration,
    maxParticipants,
    difficulty,
    schedule,
    instructor,
  }
`;

export const courseSlugParams = groq`
  *[_type == "course" && defined(slug.current)] {
    "slug": slug.current
  }
`;
