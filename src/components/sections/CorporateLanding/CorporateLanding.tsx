import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { CSSProperties } from 'react';

import CourseFAQ from '@/components/sections/CourseFAQ/CourseFAQ';
import Button from '@/components/ui/Button/Button';
import { ArrowRight, Mail, MapPin, Phone } from '@/components/ui/icons';
import Reveal from '@/components/ui/Reveal/Reveal';
import { urlFor } from '@/lib/sanity/image';
import type { Locale } from '@/types';

import CorporateEventForm from './CorporateEventForm';
import styles from './CorporateLanding.module.scss';
import MenuStack from './MenuStack';
import { type Format, MENUS } from './options';
import { PrefillButton, PrefillLink } from './prefill';

const FORM_ID = 'enquire';
const CONTACT_EMAIL = 'info@woklab.es';
const CONTACT_PHONE = '+34 613 336 432';

// Photos from the course pages in Sanity (asset ids), so they come resized and cropped from its CDN
const photo = (ref: string, width: number, height: number) =>
  urlFor({ _type: 'image', asset: { _type: 'reference', _ref: ref } }).width(width).height(height).fit('crop').auto('format').quality(80).url();
const PHOTOS = {
  hero: 'image-4c635595da4f9838fac6993233bee413ae527900-5616x3744-jpg',
  wokLab: 'image-6a34000534c7759ff85e21382a86bb72a9c0a438-1360x1020-webp',
  office: 'image-1647118c1834bf62185747817a5a306e3487bf4c-1200x1600-jpg',
  online: 'image-3b54e88cc26b04fb460806ac9ffaea205d0ee466-5176x2936-jpg',
  menus: 'image-211a23141923c0e1fe64f16adbe6b9c153e5ff72-1020x1020-webp',
  impact: 'image-9085bef2c00adf61bf3120eb7f4bb09b59be72bc-1200x1600-jpg',
};

const FORMAT_CARDS = ['wokLab', 'office', 'online'] as const;
const STEPS = ['welcome', 'prep', 'wok', 'eat'] as const;
const IMPACT_STEPS = ['cook', 'pack', 'give'] as const;
const QUESTIONS = ['experience', 'diets', 'language', 'size', 'price', 'where'] as const;

interface CorporateLandingProps {
  locale: Locale;
  /** Set by a format card's link (?format=office), so the form opens on that format */
  initialFormat?: Format;
  /** Set by "Add it to your request" (?extra=impact): extras ticked from the start */
  initialExtras?: string[];
}

/** Corporate events and team building: the three formats, the session, the two menus, the enquiry form. */
export default async function CorporateLanding({ locale, initialFormat, initialExtras }: CorporateLandingProps) {
  const t = await getTranslations({ locale, namespace: 'corporatePage' });
  const mark = (chunks: React.ReactNode) => <span className={styles.mark}>{chunks}</span>;

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{t('hero.eyebrow')}</p>
            <h1 className={styles.heroTitle}>{t.rich('hero.title', { mark })}</h1>
            <p className={styles.heroSub}>{t('hero.sub')}</p>
            <div className={styles.actions}>
              <Button href={`#${FORM_ID}`} size="md">
                {t('hero.request')} <ArrowRight size={18} />
              </Button>
              <Button href="#menus" variant="outline" size="md">{t('hero.menus')}</Button>
            </div>
            <ul className={styles.pills}>
              <li>{t('hero.facts.group')}</li>
              <li>{t('hero.facts.duration')}</li>
              <li>{t('hero.facts.language')}</li>
            </ul>
          </div>
          <div className={styles.heroPhoto}>
            <Image
              src={photo(PHOTOS.hero, 1400, 1120)}
              alt={t('hero.photoAlt')}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className={styles.cover}
            />
          </div>
        </div>
      </section>

      {/* ─── Three formats: polaroids on the dark table ───────────────────── */}
      <section className={styles.formatsSection} aria-labelledby="formats-title">
        <div className={`container ${styles.formatsInner}`}>
          <div className={styles.formatsHead}>
            <div>
              <p className={`${styles.eyebrow} ${styles.eyebrowOnDark}`}>{t('formats.eyebrow')}</p>
              <h2 id="formats-title" className={styles.formatsTitle}>{t('formats.title')}</h2>
            </div>
            <p className={styles.formatsLede}>{t('formats.lead')}</p>
          </div>
          <ul className={styles.polaroids}>
            {FORMAT_CARDS.map((key, i) => (
              <li key={key} className={styles.polaroidItem} style={{ '--tilt': `${[-4, 2.5, -2][i]}deg` } as CSSProperties}>
                <PrefillLink href={`?format=${key}#${FORM_ID}`} prefill={{ format: key }} className={styles.polaroid}>
                  <span className={styles.polaroidPhoto}>
                    <Image src={photo(PHOTOS[key], 800, 900)} alt={t(`formats.${key}.photoAlt`)} fill sizes="(min-width: 1024px) 30vw, 90vw" className={styles.cover} />
                    <span className={styles.polaroidNumber} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  </span>
                  <span className={styles.polaroidBody}>
                    <span className={styles.tag}>{t(`formats.${key}.tag`)}</span>
                    <span className={styles.polaroidTitle}>{t(`formats.${key}.title`)}</span>
                    <span className={styles.polaroidText}>{t(`formats.${key}.text`)}</span>
                    <span className={styles.polaroidCta}>
                      {t('formats.pick')} <ArrowRight size={16} />
                    </span>
                  </span>
                </PrefillLink>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── The session: the Christmas page's "how it works" steps ───────── */}
      <section className={`${styles.section} ${styles.sessionSection}`} aria-labelledby="session-title">
        <div className="container">
          <div className={styles.head}>
            <p className={styles.eyebrow}>{t('session.eyebrow')}</p>
            <h2 id="session-title" className={styles.title}>{t('session.title')}</h2>
            <p className={styles.lede}>{t('session.lead')}</p>
          </div>
          <Reveal as="ol" className={styles.steps} threshold={0.4}>
            {STEPS.map((step, i) => (
              <li key={step} className={styles.step} style={{ '--i': i } as CSSProperties}>
                <span className={styles.stepNumber} aria-hidden="true">{i + 1}</span>
                <h3 className={styles.stepTitle}>{t(`session.steps.${step}.title`)}</h3>
                <p className={styles.stepText}>{t(`session.steps.${step}.text`)}</p>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ─── Two menus, stacked ───────────────────────────────────────────── */}
      <section id="menus" className={`${styles.section} ${styles.alt} ${styles.anchor}`} aria-labelledby="menus-title">
        <div className={`container ${styles.menusGrid}`}>
          <div className={styles.menusCopy}>
            <p className={styles.eyebrow}>{t('menus.eyebrow')}</p>
            <h2 id="menus-title" className={styles.title}>{t('menus.title')}</h2>
            <p className={styles.lede}>{t('menus.lead')}</p>
            <div className={styles.menusPhoto}>
              <Image src={photo(PHOTOS.menus, 900, 700)} alt={t('menus.photoAlt')} fill sizes="(min-width: 1024px) 40vw, 100vw" className={styles.cover} />
            </div>
          </div>
          <MenuStack
            hint={t('menus.hint')}
            menus={MENUS.map((menu, i) => ({
              key: menu.key,
              label: t('menus.label', { number: i + 1 }),
              name: t(`menus.${menu.key}.name`),
              showLabel: t('menus.show', { number: i + 1, name: t(`menus.${menu.key}.name`) }),
              dishes: menu.dishes.map((dish) => ({
                key: dish,
                name: t(`menus.${menu.key}.dishes.${dish}.name`),
                text: t(`menus.${menu.key}.dishes.${dish}.text`),
              })),
            }))}
          />
        </div>
      </section>

      {/* ─── Cook for Others ──────────────────────────────────────────────── */}
      <section className={styles.impact} aria-labelledby="impact-title">
        <div className={`container ${styles.impactGrid}`}>
          <div>
            <p className={`${styles.eyebrow} ${styles.eyebrowOnDark}`}>{t('impact.eyebrow')}</p>
            <h2 id="impact-title" className={styles.impactTitle}>{t.rich('impact.title', { mark })}</h2>
            <p className={styles.impactText}>{t('impact.text')}</p>
            <ol className={styles.impactSteps}>
              {IMPACT_STEPS.map((step, i) => (
                <li key={step}>
                  <span className={styles.impactStepNumber} aria-hidden="true">{i + 1}</span>
                  {t(`impact.steps.${step}`)}
                </li>
              ))}
            </ol>
            <PrefillButton href={`/corporate?extra=impact#${FORM_ID}`} prefill={{ extra: 'impact' }} color="white" size="md">
              {t('impact.cta')} <ArrowRight size={18} />
            </PrefillButton>
          </div>
          <div className={styles.impactVisual}>
            <div className={styles.impactPhoto}>
              <Image src={photo(PHOTOS.impact, 900, 1000)} alt={t('impact.photoAlt')} fill sizes="(min-width: 1024px) 40vw, 90vw" className={styles.cover} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Enquiry: the dark card, the copy beside the form stays in view ── */}
      <section id={FORM_ID} className={`${styles.enquirySection} ${styles.anchor}`} aria-labelledby="enquire-title">
        <div className="container">
          <div className={styles.enquiryCard}>
            <div className={styles.enquiryCopy}>
              <p className={styles.enquiryEyebrow}>{t('enquiry.eyebrow')}</p>
              <h2 id="enquire-title" className={styles.enquiryTitle}>{t.rich('enquiry.title', { mark })}</h2>
              <p className={styles.enquiryLede}>{t('enquiry.lead')}</p>
              <p className={styles.enquiryNote}>{t('enquiry.price')}</p>
              <ul className={styles.contacts}>
                <li>
                  <Mail size={18} />
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </li>
                <li>
                  <Phone size={18} />
                  <a href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}>{CONTACT_PHONE}</a>
                </li>
                <li>
                  <MapPin size={18} />
                  <span>{t('enquiry.address')}</span>
                </li>
              </ul>
            </div>
              {/* The links above fill it in place; their ?format= and ?extra= set it on a full page load */}
            <CorporateEventForm initialFormat={initialFormat} initialExtras={initialExtras} />
          </div>
        </div>
      </section>

      {/* ─── Questions (the course page's FAQ, with team-event questions) ─── */}
      <div className={styles.faqFrame}>
        <CourseFAQ
          locale={locale}
          heading={{ eyebrow: t('faq.eyebrow'), title: t('faq.title'), accent: t('faq.accent') }}
          items={QUESTIONS.map((key) => ({ q: t(`faq.items.${key}.q`), a: t(`faq.items.${key}.a`) }))}
        />
      </div>
    </>
  );
}
