// ─── Locale ───────────────────────────────────────────────────────────────────
export type Locale = 'en' | 'es';

export interface LocaleString {
  en: string;
  es: string;
}

export interface LocaleText {
  en: string;
  es: string;
}

// ─── Sanity ───────────────────────────────────────────────────────────────────
export interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
  alt?: LocaleString;
}

// ─── Portable Text ────────────────────────────────────────────────────────────
// Using a loose type to avoid coupling to @portabletext/types internals.
// The PortableText renderer accepts this shape at runtime.
export type PortableTextBlock = {
  _type: string;
  _key: string;
  [key: string]: unknown;
};

export interface LocaleBlockContent {
  en: PortableTextBlock[];
  es: PortableTextBlock[];
}

// ─── Page builder sections ────────────────────────────────────────────────────
export interface TextSection {
  _type: 'textSection';
  _key: string;
  heading?: LocaleString;
  body: LocaleBlockContent;
}

export interface ImageSection {
  _type: 'imageSection';
  _key: string;
  image: SanityImage;
  caption?: LocaleString;
}

export interface GalleryImage extends SanityImage {
  _key: string;
  caption?: LocaleString;
}

export interface ImageGallery {
  _type: 'imageGallery';
  _key: string;
  heading?: LocaleString;
  images: GalleryImage[];
}

export type CourseSection = TextSection | ImageSection | ImageGallery;

// ─── Menu ─────────────────────────────────────────────────────────────────────
export interface MenuItem {
  _key: string;
  name: LocaleString;
  description?: LocaleString;
  image?: SanityImage;
}

// ─── Content models ───────────────────────────────────────────────────────────
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface TimeSlot {
  _key: string;
  startTime: string; // "HH:MM"
  dates: string[];   // "YYYY-MM-DD"[]
}

export interface Course {
  _id: string;
  _type: 'course';
  title: LocaleString;
  slug: { current: string };
  description: LocaleText;
  image?: SanityImage;
  price: number;
  currency: string;
  duration: number;
  maxParticipants: number;
  difficulty: DifficultyLevel;
  timeSlots?: TimeSlot[];
  about?: CourseSection[];
  menu?: MenuItem[];
  instructor?: LocaleString;
  featured?: boolean;
}

/** A single expanded occurrence: one course on one specific date at one time */
export interface CourseOccurrence {
  course: Course;
  date: string;       // "YYYY-MM-DD"
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM" — derived from course.duration
}

/** Flat date entry used on the detail page dropdown */
export interface DateEntry {
  date: string;       // "YYYY-MM-DD"
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
}

// ─── Team & pages ─────────────────────────────────────────────────────────────
export interface TeamMember {
  _key: string;
  name: string;
  role?: LocaleString;
  bio?: LocaleText;
  image?: SanityImage;
}

export interface AboutPage {
  _id: string;
  _type: 'aboutPage';
  title: LocaleString;
  subtitle?: LocaleText;
  content?: CourseSection[];
  teamTitle?: LocaleString;
  team?: TeamMember[];
}

export interface LegalPage {
  _id: string;
  title: LocaleString;
  lastUpdated?: string; // "YYYY-MM-DD"
  content?: LocaleBlockContent;
}

export interface ContactPage {
  _id: string;
  _type: 'contactPage';
  title: LocaleString;
  subtitle?: LocaleText;
  email?: string;
  phone?: string;
  address?: LocaleText;
  formTitle?: LocaleString;
  successMessage?: LocaleText;
}

export interface Homepage {
  _id: string;
  _type: 'homepage';
  heroTitle: LocaleString;
  heroSubtitle: LocaleText;
  heroCtaLabel: LocaleString;
  featuredCoursesTitle: LocaleString;
}

// ─── Course sessions & bookings ───────────────────────────────────────────────
export type AttendeeStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Attendee {
  _key: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: AttendeeStatus;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  amount: number;
  currency: string;
  bookedAt: string;
}

export interface CourseSession {
  _id: string;
  _type: 'courseSession';
  course?: { _ref: string };
  courseTitle: string;
  courseSlug: string;
  date: string;       // "YYYY-MM-DD"
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
  attendees: Attendee[];
}

/** Map of "YYYY-MM-DD|HH:MM" → confirmed attendee count */
export type BookingCountMap = Record<string, number>;

// ─── Email ────────────────────────────────────────────────────────────────────
export interface ConfirmationEmailData {
  to: string;
  recipientName: string;
  courseName: string;
  courseDate: string;  // human-readable formatted date
  timeRange: string;   // "18:30 – 21:30"
  amount: number;
  currency: string;
}
