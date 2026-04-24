import Image from 'next/image';
import { getLocale, getTranslations } from 'next-intl/server';

import { Mail, MapPin, Phone } from '@/components/ui/icons';
import { Link } from '@/i18n/navigation';
import { sanityClient } from '@/lib/sanity/client';
import { contactPageQuery } from '@/lib/sanity/queries';
import type { ContactPage, Locale } from '@/types';

import styles from './Footer.module.scss';

export default async function Footer() {
  const locale = (await getLocale()) as Locale;

  const [t, tNav, tLegal, contact] = await Promise.all([
    getTranslations('footer'),
    getTranslations('navigation'),
    getTranslations('legal'),
    sanityClient.fetch<ContactPage>(contactPageQuery),
  ]);

  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>

        {/* ── Brand ─────────────────────────────────────────────────────── */}
        <div className={styles.brand}>
          <Link href="/" className={styles.logoLink} aria-label="Wok Lab — home">
            <Image
              src="/logo-footer.svg"
              alt="Wok Lab"
              width={110}
              height={66}
              className={styles.logo}
            />
          </Link>
          <p className={styles.tagline}>{t('tagline')}</p>

          {/* Contact details — pulled from Sanity */}
          <address className={styles.contactBlock}>
            {contact?.email && (
              <a href={`mailto:${contact.email}`} className={styles.contactLine}>
                <Mail className={styles.contactIcon} size={16} />
                {contact.email}
              </a>
            )}
            {contact?.phone && (
              <a href={`tel:${contact.phone}`} className={styles.contactLine}>
                <Phone className={styles.contactIcon} size={16} />
                {contact.phone}
              </a>
            )}
            {contact?.address?.[locale] && (
              <span className={styles.contactLine}>
                <MapPin className={styles.contactIcon} size={16} />
                {contact.address[locale]}
              </span>
            )}
          </address>
        </div>

        {/* ── Pages nav ─────────────────────────────────────────────────── */}
        <nav aria-label="Footer — pages">
          <p className={styles.colHeading}>{t('pages')}</p>
          <ul className={styles.linkList}>
            {([
              ['/', tNav('home')],
              ['/courses', tNav('courses')],
              ['/calendar', tNav('calendar')],
              ['/corporate', tNav('corporate')],
              ['/about', tNav('about')],
              ['/contact', tNav('contact')],
            ] as [string, string][]).map(([href, label]) => (
              <li key={href}>
                <Link href={href} className={styles.link}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Legal nav ─────────────────────────────────────────────────── */}
        <nav aria-label="Footer — legal">
          <p className={styles.colHeading}>{t('legal')}</p>
          <ul className={styles.linkList}>
            <li>
              <Link href="/terms" className={styles.link}>{tLegal('terms')}</Link>
            </li>
            <li>
              <Link href="/privacy" className={styles.link}>{tLegal('privacy')}</Link>
            </li>
          </ul>
        </nav>

      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <div className={styles.bottom}>
        <div className="container">
          <p className={styles.copy}>
            &copy; {year} Wok Lab.&nbsp;{t('rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
