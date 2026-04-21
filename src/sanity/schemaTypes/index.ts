import { aboutPage } from './aboutPage';
import { giftVoucher } from './giftVoucher';
import { contactPage } from './contactPage';
import { course } from './course';
import { courseSession } from './courseSession';
import { homepage } from './homepage';
import { privacyPage } from './privacyPage';
import { termsPage } from './termsPage';
import { localeBlockContent } from './objects/localeBlockContent';
import { localeString } from './objects/localeString';
import { localeText } from './objects/localeText';
import { menuItem } from './objects/menuItem';
import { imageGallery } from './objects/sections/imageGallery';
import { imageSection } from './objects/sections/imageSection';
import { textSection } from './objects/sections/textSection';
import { teamMember } from './objects/teamMember';
import { timeSlot } from './objects/timeSlot';

export const schemaTypes = [
  // Primitives / shared objects
  localeString,
  localeText,
  localeBlockContent,
  timeSlot,
  menuItem,
  teamMember,
  // Page builder section types
  textSection,
  imageSection,
  imageGallery,
  // Documents
  course,
  homepage,
  aboutPage,
  contactPage,
  termsPage,
  privacyPage,
  courseSession,
  giftVoucher,
];
