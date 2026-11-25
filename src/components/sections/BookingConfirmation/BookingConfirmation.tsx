import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import Confirmation, { type ConfirmationStep } from '@/components/sections/Confirmation/Confirmation';
import { Calendar, Clock, Users } from '@/components/ui/icons';
import { formatDate } from '@/lib/courses/timeslots';
import { formatPrice } from '@/lib/format';
import { urlFor } from '@/lib/sanity/image';
import { STUDIO_ADDRESS } from '@/lib/seo';
import type { LocaleString, SanityImage } from '@/types';

import styles from './BookingConfirmation.module.scss';

export interface BookedClass {
  title?: LocaleString;
  image?: SanityImage & { alt?: LocaleString };
  date: string;
  startTime: string;
  endTime: string;
  quantity: number;
}

interface BookingConfirmationProps {
  classes: BookedClass[];
  customerName: string;
  customerEmail: string;
  amountPaid: number;
  currency: string;
  locale: string;
}

const STUDIO_LINE = `${STUDIO_ADDRESS.streetAddress}, ${STUDIO_ADDRESS.addressLocality}`;
const DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Wok Lab, ${STUDIO_LINE}`)}`;

/** After a class booking: the classes booked, where to come, and confetti. */
export default async function BookingConfirmation({ classes, customerName, customerEmail, amountPaid, currency, locale }: BookingConfirmationProps) {
  const t = await getTranslations({ locale, namespace: 'bookingSuccess' });
  const lang = locale === 'es' ? 'es' : 'en';
  const firstName = customerName.split(' ')[0];
  const longDate = (date: string) => formatDate(date, locale, { weekday: 'long', day: 'numeric', month: 'long' });
  // On its own line: "lunes, 7 de diciembre" → "Lunes, 7 de diciembre"
  const dateLine = (date: string) => longDate(date).replace(/^./, (c) => c.toUpperCase());

  const steps: ConfirmationStep[] = [
    { title: t('stepPaid'), detail: formatPrice(amountPaid, currency, locale), done: true },
    { title: t('stepEmail'), detail: customerEmail, done: true },
    {
      title: classes.length === 1 ? t('stepSeeYou', { date: longDate(classes[0].date), time: classes[0].startTime }) : t('stepSeeYouMany'),
      detail: (
        <>
          {STUDIO_LINE} ·{' '}
          <a href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" className={styles.directions}>
            {t('directions')}
          </a>
        </>
      ),
      done: false,
    },
  ];

  return (
    <Confirmation
      title={t('title')}
      subtitle={firstName ? t('subtitleNamed', { name: firstName }) : t('subtitle')}
      aside={
        <ul className={`${styles.classes} ${classes.length > 1 ? styles.many : ''}`}>
          {classes.map((item, i) => {
            const title = item.title?.[lang] ?? t('classFallback');
            return (
              <li key={i} className={styles.ticket}>
                <div className={styles.photo}>
                  {item.image ? (
                    <Image
                      src={urlFor(item.image).width(1200).height(750).url()}
                      alt={item.image.alt?.[lang] ?? title}
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className={styles.image}
                      priority={i === 0}
                    />
                  ) : (
                    <Image src="/images/pattern2.svg" alt="" width={120} height={120} className={styles.pattern} />
                  )}
                </div>
                <div className={styles.body}>
                  <p className={styles.classTitle}>{title}</p>
                  <ul className={styles.facts}>
                    <li><Calendar size={16} />{dateLine(item.date)}</li>
                    <li><Clock size={16} />{item.startTime}{item.endTime ? ` – ${item.endTime}` : ''}</li>
                    <li><Users size={16} />{t('guests', { count: item.quantity })}</li>
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      }
      stepsLabel={t('stepsLabel')}
      steps={steps}
      actions={{
        primary: { label: t('browseClasses'), href: '/courses' },
        secondary: { label: t('giftVoucher'), href: '/vouchers' },
      }}
    />
  );
}
