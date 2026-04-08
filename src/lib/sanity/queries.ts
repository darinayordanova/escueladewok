import { groq } from 'next-sanity';

export const homepageQuery = groq`
  *[_type == "homepage" && _id == "homepage"][0] {
    _id,
    heroTitle,
    heroSubtitle,
    heroCtaLabel,
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
  *[_type == "course" && featured == true && corporateEvent != true] | order(_createdAt desc) {
    _id,
    title,
    slug,
    description,
    image,
    price,
    currency,
    duration,
    cuisine,
    corporateEvent,
    instructor,
    featured,
    ${timeSlotsProjection}
  }
`;

export const corporateCoursesQuery = groq`
  *[_type == "course" && corporateEvent == true] | order(_createdAt desc) {
    _id,
    title,
    slug,
    description,
    image,
    price,
    currency,
    duration,
    cuisine,
    corporateEvent,
    instructor,
    ${timeSlotsProjection}
  }
`;

export const allCoursesQuery = groq`
  *[_type == "course" && corporateEvent != true] | order(_createdAt desc) {
    _id,
    title,
    slug,
    description,
    image,
    price,
    currency,
    duration,
    cuisine,
    corporateEvent,
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
    cuisine,
    corporateEvent,
    instructor,
    ${timeSlotsProjection},
    "about": about[] {
      ...,
      _type == "imageSection" => {
        ...,
        image { ..., asset-> }
      },
      _type == "imageGallery" => {
        ...,
        images[] { ..., asset-> }
      }
    },
    "menu": menu[] {
      _key,
      name,
      description,
      image { ..., asset-> }
    },
    allergens
  }
`;

/**
 * Returns confirmed attendee counts per date/time for a course.
 * Used to build the BookingCountMap on the detail page.
 */
export const confirmedBookingsForCourseQuery = groq`
  *[_type == "courseSession" && courseSlug == $courseSlug] {
    date,
    startTime,
    "confirmedCount": count(attendees[status == "confirmed"])
  }
`;

export const aboutPageQuery = groq`
  *[_type == "aboutPage"][0] {
    _id,
    title,
    subtitle,
    "content": content[] {
      ...,
      _type == "imageSection" => { ..., image { ..., asset-> } },
      _type == "imageGallery" => { ..., images[] { ..., asset-> } }
    },
    teamTitle,
    team[] {
      _key,
      name,
      role,
      bio,
      image { ..., asset-> }
    }
  }
`;

export const contactPageQuery = groq`
  *[_type == "contactPage"][0] {
    _id,
    title,
    subtitle,
    email,
    phone,
    address,
    formTitle,
    successMessage,
  }
`;

export const termsPageQuery = groq`
  *[_type == "termsPage"][0] {
    _id,
    title,
    lastUpdated,
    content
  }
`;

export const privacyPageQuery = groq`
  *[_type == "privacyPage"][0] {
    _id,
    title,
    lastUpdated,
    content
  }
`;

export const courseSlugParams = groq`
  *[_type == "course" && defined(slug.current)] {
    "slug": slug.current
  }
`;
