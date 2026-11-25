/**
 * The 14 allergens EU food law (Regulation 1169/2011) requires to be declared.
 * Courses store the keys; display names come from the `allergens` i18n namespace.
 */
export const ALLERGENS = [
  { value: 'celery', title: 'Celery' },
  { value: 'gluten', title: 'Gluten' },
  { value: 'crustaceans', title: 'Crustaceans' },
  { value: 'eggs', title: 'Eggs' },
  { value: 'fish', title: 'Fish' },
  { value: 'lupin', title: 'Lupin' },
  { value: 'milk', title: 'Milk' },
  { value: 'molluscs', title: 'Molluscs' },
  { value: 'mustard', title: 'Mustard' },
  { value: 'nuts', title: 'Tree nuts' },
  { value: 'peanuts', title: 'Peanuts' },
  { value: 'sesame', title: 'Sesame' },
  { value: 'soy', title: 'Soy' },
  { value: 'sulphites', title: 'Sulphites' },
] as const;

export type AllergenKey = (typeof ALLERGENS)[number]['value'];
