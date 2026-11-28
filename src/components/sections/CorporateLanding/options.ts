/** Choices on the corporate page. Their words live in the messages (corporatePage). */

/** Where the event happens; the form also offers "not sure yet" */
export const FORMATS = ['wokLab', 'office', 'online', 'unsure'] as const;
export type Format = (typeof FORMATS)[number];
export const isFormat = (value: unknown): value is Format => typeof value === 'string' && (FORMATS as readonly string[]).includes(value);

/** The two private-event menus and their dishes, in order */
export const MENUS = [
  { key: 'foldFryFeast', dishes: ['gyoza', 'springRolls', 'wontons', 'mango'] },
  { key: 'spicePullSlurp', dishes: ['cucumber', 'springRolls', 'noodles', 'mango'] },
] as const;
export type MenuKey = (typeof MENUS)[number]['key'];

// The enquiry form's other choices (corporatePage.enquiry.form.<list>.<key>)
export const TIMES = ['morning', 'lunch', 'afternoon', 'evening', 'flexible'] as const;
export const LANGUAGES = ['en', 'es', 'both'] as const;
export const EXTRAS = ['impact', 'drinks', 'gifts', 'speech', 'invoice'] as const;
export const SOURCES = ['google', 'instagram', 'referral', 'class', 'other'] as const;

export const MIN_GROUP = 8;
