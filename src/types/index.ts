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

export interface Homepage {
  _id: string;
  _type: 'homepage';
  heroTitle: LocaleString;
  heroSubtitle: LocaleText;
  heroCtaLabel: LocaleString;
  heroImage?: SanityImage;
  featuredCoursesTitle: LocaleString;
}

// ─── Email ────────────────────────────────────────────────────────────────────
export interface ConfirmationEmailData {
  to: string;
  recipientName: string;
  courseName: string;
  courseDate: string;
  amount: number;
  currency: string;
}
