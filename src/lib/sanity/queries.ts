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

// ─── Shared timeSlots projection ──────────────────────────────────────────────
// Dates are sorted ascending within each slot so the first date is always
// the soonest. Expansion + future-filtering is done client-side.
const timeSlotsProjection = groq`
  "timeSlots": timeSlots[] {
    _key,
    startTime,
    "dates": dates[] | order(@)
  }
`;

// ─── Queries ──────────────────────────────────────────────────────────────────

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
    ${timeSlotsProjection}
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
    ${timeSlotsProjection}
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
    instructor,
    ${timeSlotsProjection}
  }
`;

export const courseSlugParams = groq`
  *[_type == "course" && defined(slug.current)] {
    "slug": slug.current
  }
`;
