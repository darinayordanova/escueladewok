import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { CSSProperties } from 'react';

import CourseCard from '@/components/sections/CourseCard/CourseCard';
import CourseFAQ from '@/components/sections/CourseFAQ/CourseFAQ';
import VoucherBuilder from '@/components/sections/VoucherBuilder/VoucherBuilder';
import Button from '@/components/ui/Button/Button';
import { ArrowRight, Check } from '@/components/ui/icons';
import Lottie from '@/components/ui/Lottie/Lottie';
import Reveal from '@/components/ui/Reveal/Reveal';
import { formatPrice } from '@/lib/format';
import { urlFor } from '@/lib/sanity/image';
import { valentinesDates, PHYSICAL_FEE, VOUCHER_OPTIONS, type VoucherKey } from '@/lib/vouchers';
import type { VoucherTheme } from '@/lib/voucherThemes';
import type { Course, Locale } from '@/types';

import { EnvelopeFlap, EnvelopePocket, Heart } from './art';
import EnvelopeScene from './EnvelopeScene';
import ExampleVoucher from './ExampleVoucher';
import styles from './ValentinesLanding.module.scss';

const BUILDER_ID = 'make';
/** The classes suggested as a date, by slug, in order. */
const DATE_CLASSES = ['the-art-of-the-steamer-mastering-bao-and-dim-sum', 'japanese-classics-katsu-and-gyoza'];
const STEPS = ['choose', 'personalise', 'send', 'cook'] as const;
const INCLUDES = ['welcome', 'ingredients', 'cooking', 'dinner'] as const;
const QUESTIONS = ['redeem', 'valid', 'difference', 'preview', 'otherDay'] as const;

// Each card in the envelope wears one of the real voucher designs
const CARD_THEMES: Record<VoucherKey, VoucherTheme> = {
  giftCard25: 'classic',
  giftCard50: 'celebration',
  classVoucher: 'valentines',
  classVoucherForTwo: 'birthday',
};

// The steamer illustration (hero and close) and its steam animation, drawn on the same frame.
// The still steamer shows until the animation loads, and stays for reduced motion.
const ART = { src: '/images/vouchers/steamer.svg', width: 1200, height: 1312 } as const;
const ART_ANIMATION = '/animations/valentines-steamer.json';
/** Half speed, so the steam drifts rather than wiggles. */
const ART_SPEED = 0.5;

// Hearts around the illustration: left %, top %, size px
const HEARTS = [[6, 20, 18], [90, 28, 14], [2, 56, 12], [94, 62, 20], [20, 4, 12], [80, 6, 16], [10, 84, 14]];

interface ValentinesLandingProps {
  courses: Course[];
  locale: Locale;
  /** Choices carried in the URL: the amount picked from the envelope, a send date. */
  initial: { voucherKey?: VoucherKey; sendDate?: string };
}

/** Valentine's gift-voucher page: the offer, both formats, and the voucher builder itself. */
export default async function ValentinesLanding({ courses, locale, initial }: ValentinesLandingProps) {
  const t = await getTranslations({ locale, namespace: 'valentines' });
  const dates = valentinesDates();
  const price = (value: number) => formatPrice(value, 'EUR', locale);
  const shortDate = (iso: string) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const lowest = Math.min(...VOUCHER_OPTIONS.map((option) => option.amount));
  const classPhoto = courses.find((course) => course.image && course.cuisine === 'chinese')?.image ?? courses.find((course) => course.image)?.image;
  const heroImage = <Image src={ART.src} alt={t('hero.artAlt')} width={ART.width} height={ART.height} priority className={styles.artImage} />;
  const dateClasses = DATE_CLASSES.map((slug) => courses.find((course) => course.slug.current === slug)).filter(
    (course): course is Course => Boolean(course),
  );
  const voucher = <ExampleVoucher locale={locale} />;

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p className={styles.heroEyebrow}>{t('hero.eyebrow')}</p>
            <h1 className={styles.heroTitle}>
              {t.rich('hero.title', { mark: (chunks) => <span className={styles.mark}>{chunks}</span> })}
            </h1>
            <p className={styles.heroSub}>{t('hero.sub', { price: price(lowest) })}</p>
            <div className={styles.heroActions}>
              <Button href={`#${BUILDER_ID}`} size="md">
                {t('choose')} <ArrowRight size={18} />
              </Button>
              <Button href="#how" variant="outline" size="md">{t('hero.how')}</Button>
            </div>
            <ul className={styles.pills}>
              <li>{t('hero.pillPrice', { price: price(lowest) })}</li>
              <li>{t('hero.pillFormats')}</li>
              <li>{t('hero.pillValid')}</li>
            </ul>
          </div>

          <div className={styles.art}>
            <Lottie src={ART_ANIMATION} fallback={heroImage} speed={ART_SPEED} priority className={styles.artAnimation} />
            {HEARTS.map(([left, top, size], i) => (
              <Heart
                key={i}
                className={styles.heart}
                style={{ left: `${left}%`, top: `${top}%`, width: size, '--t': `${2.4 + i * 0.4}s`, '--d': `${-i * 0.7}s` } as CSSProperties}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Envelope: the four vouchers ──────────────────────────────────── */}
      <EnvelopeScene
        scrollPrompt={t('scene.prompt')}
        eyebrow={t('scene.eyebrow')}
        title={t('scene.title')}
        sub={t('scene.sub')}
        hint={t('scene.hint')}
        cards={VOUCHER_OPTIONS.map((option) => ({
          voucherKey: option.key,
          amount: option.amount,
          theme: CARD_THEMES[option.key],
          copy: { name: t(`cards.${option.key}.name`), detail: t(`cards.${option.key}.detail`) },
          href: `/valentines?amount=${option.key}#${BUILDER_ID}`,
          label: t('scene.cardLabel', { name: t(`cards.${option.key}.name`), price: price(option.amount) }),
        }))}
      />

      {/* ─── What a class includes ────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={`container ${styles.includes}`}>
          {classPhoto && (
            <div className={styles.includesPhoto}>
              <Image src={urlFor(classPhoto).width(1000).height(1100).url()} alt={t('includes.photoAlt')} fill sizes="(min-width: 1024px) 40vw, 100vw" className={styles.cover} />
            </div>
          )}
          <div>
            <p className={styles.eyebrow}>{t('includes.eyebrow')}</p>
            <h2 className={styles.title}>{t('includes.title')}</h2>
            <ul className={styles.includesList}>
              {INCLUDES.map((item) => (
                <li key={item}>
                  <span className={styles.includesTick} aria-hidden="true"><Check size={14} /></span>
                  {t(`includes.${item}`)}
                </li>
              ))}
            </ul>
            <p className={styles.note}>{t('includes.note')}</p>
          </div>
        </div>
      </section>

      {/* ─── Two formats ──────────────────────────────────────────────────── */}
      <section className={`${styles.section} ${styles.alt}`}>
        <div className="container">
          <div className={styles.heading}>
            <p className={styles.eyebrow}>{t('formats.eyebrow')}</p>
            <h2 className={styles.title}>{t('formats.title')}</h2>
          </div>
          <div className={styles.formats}>
            <Reveal as="article" className={styles.panel}>
              <div className={`${styles.panelStage} ${styles.stageDigital}`} aria-hidden="true">
                <div className={styles.phone}>
                  <i className={styles.notch} />
                  <div className={styles.notification}>
                    <span className={styles.miniLogo} />
                    <span>
                      <b>{t('formats.digital.notification')}</b>
                      <small>{t('formats.digital.notificationFrom')}</small>
                    </span>
                  </div>
                  <div className={styles.mail}>
                    <span className={styles.mailFrom}><span className={styles.miniLogo} />Wok Lab</span>
                    <b className={styles.mailTitle}>{t('formats.digital.mailTitle')}</b>
                    {voucher}
                    <i className={styles.skeleton} />
                    <i className={`${styles.skeleton} ${styles.skeletonShort}`} />
                    <span className={styles.mailButton}>{t('formats.digital.mailButton')}</span>
                  </div>
                </div>
              </div>
              <div className={styles.panelCopy}>
                <span className={styles.tag}>{t('formats.digital.tag')}</span>
                <h3 className={styles.panelTitle}>{t('formats.digital.title')}</h3>
                <p className={styles.panelText}>
                  {t(`formats.digital.${dates.canScheduleValentines ? 'text' : dates.isValentinesDay ? 'textToday' : 'textLater'}`)}
                </p>
                <ul className={styles.ticks}>
                  {(['pdf', 'message', 'lastMinute'] as const).map((key) => (
                    <li key={key}><Check size={18} />{t(`formats.digital.${key}`)}</li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal as="article" className={styles.panel}>
              <div className={`${styles.panelStage} ${styles.stagePrinted}`} aria-hidden="true">
                {/* An opened envelope with the printed card in front of it */}
                <div className={styles.envelope}>
                  <EnvelopeFlap className={styles.envelopeFlap} />
                  <div className={styles.envelopeBack} />
                  <EnvelopePocket className={styles.envelopeFront} />
                  <div className={styles.envelopeCard}>{voucher}</div>
                </div>
              </div>
              <div className={styles.panelCopy}>
                <span className={styles.tag}>{t('formats.printed.tag')}</span>
                <h3 className={styles.panelTitle}>{t('formats.printed.title')}</h3>
                <p className={styles.panelText}>{t('formats.printed.text', { fee: price(PHYSICAL_FEE) })}</p>
                <ul className={styles.ticks}>
                  {(['keep', 'bow', 'design'] as const).map((key) => (
                    <li key={key}><Check size={18} />{t(`formats.printed.${key}`)}</li>
                  ))}
                </ul>
                <p className={`${styles.note} ${dates.postInTime ? '' : styles.noteLate}`}>
                  {dates.postInTime ? t('formats.printed.postBy', { date: shortDate(dates.postBy) }) : t('formats.printed.late')}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── The builder ──────────────────────────────────────────────────── */}
      <section id={BUILDER_ID} className={`${styles.section} ${styles.anchor}`}>
        <div className="container">
          <div className={styles.heading}>
            <p className={styles.eyebrow}>{t('builder.eyebrow')}</p>
            <h2 className={styles.title}>{t('builder.title')}</h2>
            <p className={styles.lede}>{t('builder.sub')}</p>
          </div>
          {/* Re-mounts when a card in the envelope picks a different amount */}
          <VoucherBuilder key={initial.voucherKey ?? 'default'} locale={locale} initial={{ ...initial, theme: 'valentines' }} />
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────────────── */}
      <section id="how" className={`${styles.section} ${styles.alt} ${styles.anchor}`}>
        <div className="container">
          <div className={styles.heading}>
            <p className={styles.eyebrow}>{t('how.eyebrow')}</p>
            <h2 className={styles.title}>{t('how.title')}</h2>
          </div>
          <Reveal as="ol" className={styles.steps} threshold={0.4}>
            {STEPS.map((step, i) => (
              <li key={step} className={styles.step} style={{ '--i': i } as CSSProperties}>
                <span className={styles.stepNumber} aria-hidden="true">{i + 1}</span>
                <h3 className={styles.stepTitle}>{t(`how.${step}.title`)}</h3>
                <p className={styles.stepText}>{t(`how.${step}.text`)}</p>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ─── A class as a date ────────────────────────────────────────────── */}
      {dateClasses.length > 0 && (
        <section className={styles.date}>
          <div className={`container ${styles.dateInner}`}>
            <div>
              <p className={styles.dateEyebrow}>{t('date.eyebrow')}</p>
              <h2 className={styles.dateTitle}>{t('date.title')}</h2>
              <p className={styles.dateText}>{t('date.text')}</p>
            </div>
            <div className={styles.dateCards}>
              {dateClasses.map((course) => (
                <CourseCard key={course._id} course={course} locale={locale} book />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Questions (the course page's FAQ, with voucher questions) ────── */}
      <div className={styles.faqFrame}>
        <CourseFAQ
          locale={locale}
          heading={{ eyebrow: t('faq.eyebrow'), title: t('faq.title'), accent: t('faq.accent') }}
          items={QUESTIONS.map((key) => ({ q: t(`faq.${key}.q`), a: t(`faq.${key}.a`) }))}
        />
      </div>

      {/* ─── Close ────────────────────────────────────────────────────────── */}
      <section className={styles.close}>
        <div className={`container ${styles.closeInner}`}>
          <div className={`${styles.art} ${styles.artSmall}`} aria-hidden="true">
            <span className={styles.disc} />
            <Lottie
              src={ART_ANIMATION}
              speed={ART_SPEED}
              fallback={<Image src={ART.src} alt="" width={ART.width} height={ART.height} className={styles.artImage} />}
              className={styles.artAnimation}
            />
          </div>
          <h2 className={styles.closeTitle}>{t('close.title')}</h2>
          <p className={styles.closeText}>{t('close.text')}</p>
          <div className={styles.closeActions}>
            <Button href={`#${BUILDER_ID}`} color="white" size="lg">{t('close.buy')}</Button>
            <Button href="/courses" variant="outline" size="lg" className={styles.lineButton}>{t('close.courses')}</Button>
          </div>
        </div>
      </section>
    </>
  );
}
