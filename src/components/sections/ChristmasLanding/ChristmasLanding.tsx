import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { CSSProperties } from 'react';

import CourseFAQ from '@/components/sections/CourseFAQ/CourseFAQ';
import VoucherBuilder from '@/components/sections/VoucherBuilder/VoucherBuilder';
import Button from '@/components/ui/Button/Button';
import { ArrowRight, Check } from '@/components/ui/icons';
import Lottie from '@/components/ui/Lottie/Lottie';
import Reveal from '@/components/ui/Reveal/Reveal';
import { formatPrice } from '@/lib/format';
import { urlFor } from '@/lib/sanity/image';
import { christmasDates, PHYSICAL_FEE, VOUCHER_OPTIONS, type VoucherKey } from '@/lib/vouchers';
import type { VoucherTheme } from '@/lib/voucherThemes';
import type { Course, Locale } from '@/types';

import { EnvelopeFlap, EnvelopePocket, Star } from './art';
import styles from './ChristmasLanding.module.scss';
import EnvelopeScene from './EnvelopeScene';
import ExampleVoucher from './ExampleVoucher';

const BUILDER_ID = 'make';
/** "Talk to us" in the team band: the corporate page's enquiry form. */
const TEAM_CLASS_HREF = '/corporate#enquire';
const STEPS = ['choose', 'personalise', 'send', 'cook'] as const;
const INCLUDES = ['welcome', 'ingredients', 'cooking', 'dinner'] as const;
const QUESTIONS = ['redeem', 'valid', 'difference', 'preview', 'otherDay'] as const;

// Each card in the envelope wears one of the real voucher designs
const CARD_THEMES: Record<VoucherKey, VoucherTheme> = {
  giftCard25: 'classic',
  giftCard50: 'celebration',
  classVoucher: 'christmas',
  classVoucherForTwo: 'birthday',
};

// The hero tree's Lottie animation (.lottie or .json in /public/animations). Until it's set,
// the hero shows the still tree, which also stays as the fallback once it is.
const TREE_ANIMATION: string | null = '/animations/Stars_Slowly_Twinkle_v2.json';

// Stars around the tree: left %, top %, size px
const STARS = [[6, 20, 18], [90, 28, 14], [2, 56, 12], [94, 62, 20], [20, 4, 12], [80, 6, 16], [10, 84, 14]];

interface ChristmasLandingProps {
  courses: Course[];
  locale: Locale;
  /** Choices carried in the URL: the amount picked from the envelope, a send date. */
  initial: { voucherKey?: VoucherKey; sendDate?: string };
}

/** Christmas gift-voucher page: the offer, both formats, and the voucher builder itself. */
export default async function ChristmasLanding({ courses, locale, initial }: ChristmasLandingProps) {
  const t = await getTranslations({ locale, namespace: 'christmas' });
  const dates = christmasDates();
  const price = (value: number) => formatPrice(value, 'EUR', locale);
  const shortDate = (iso: string) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const lowest = Math.min(...VOUCHER_OPTIONS.map((option) => option.amount));
  const classPhoto = courses.find((course) => course.image && course.cuisine === 'chinese')?.image ?? courses.find((course) => course.image)?.image;
  const treeImage = <Image src="/images/vouchers/christmas-tree.png" alt={t('hero.treeAlt')} width={600} height={773} priority className={styles.treeImage} />;
  const voucher = <ExampleVoucher locale={locale} />;
  // After 25 December the gift is for Reyes (6 January): the email copy follows the dates
  const reyes = dates.afterChristmas ? 'Reyes' : '';
  const digitalText = dates.canScheduleChristmas
    ? 'text'
    : !dates.afterChristmas
      ? 'textLater'
      : dates.canScheduleReyes
        ? 'textReyes'
        : 'textReyesToday';

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
            <p className={styles.heroSub}>{t.rich('hero.sub', { price: price(lowest), br: () => <br /> })}</p>
            <div className={styles.heroActions}>
              <Button href={`#${BUILDER_ID}`} color="white" size="md">
                {t('choose')} <ArrowRight size={18} />
              </Button>
              <Button href="#how" variant="outline" size="md" className={styles.lineButton}>{t('hero.how')}</Button>
            </div>
            <ul className={styles.pills}>
              <li>{t('hero.pillPrice', { price: price(lowest) })}</li>
              <li>{t('hero.pillFormats')}</li>
              <li>{t('hero.pillValid')}</li>
            </ul>
          </div>

          <div className={styles.tree}>
            <span className={styles.disc} aria-hidden="true" />
            {TREE_ANIMATION ? (
              <Lottie src={TREE_ANIMATION} fallback={treeImage} priority className={styles.treeAnimation} />
            ) : (
              treeImage
            )}
            {STARS.map(([left, top, size], i) => (
              <Star
                key={i}
                className={styles.star}
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
          href: `/christmas?amount=${option.key}#${BUILDER_ID}`,
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
                <h3 className={styles.panelTitle}>{t(`formats.digital.title${reyes}`)}</h3>
                <p className={styles.panelText}>
                  {t(`formats.digital.${digitalText}`)}
                </p>
                
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
                
                <p className={`${styles.note} ${dates.postInTime ? '' : styles.noteLate}`}>
                  {dates.postInTime ? t('formats.printed.postBy', { date: shortDate(dates.postBy) }) : t(`formats.printed.late${reyes}`)}
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
          <VoucherBuilder key={initial.voucherKey ?? 'default'} locale={locale} initial={{ ...initial, theme: 'christmas' }} />
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

      {/* ─── Teams ────────────────────────────────────────────────────────── */}
      <section className={styles.team}>
        <div className={`container ${styles.teamInner}`}>
          <div>
            <h2 className={styles.teamTitle}>{t('team.title')}</h2>
            <p className={styles.teamText}>{t('team.text')}</p>
          </div>
          <Button href={TEAM_CLASS_HREF} color="white">{t('team.cta')}</Button>
        </div>
      </section>

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
          <div className={`${styles.tree} ${styles.treeSmall}`} aria-hidden="true">
            <span className={styles.disc} />
            <Image src="/images/vouchers/christmas-tree.png" alt="" width={600} height={773} className={styles.treeImage} />
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
