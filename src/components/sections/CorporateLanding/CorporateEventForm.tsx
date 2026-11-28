'use client';

import { useLocale, useTranslations } from 'next-intl';
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';

import Button from '@/components/ui/Button/Button';
import Checkbox from '@/components/ui/Checkbox/Checkbox';
import ChipGroup from '@/components/ui/ChipGroup/ChipGroup';
import Dropdown from '@/components/ui/Dropdown/Dropdown';
import fieldStyles from '@/components/ui/Field/Field.module.scss';
import { ArrowRight, Check, ChevronDown } from '@/components/ui/icons';
import Input from '@/components/ui/Input/Input';
import QuantityStepper from '@/components/ui/QuantityStepper/QuantityStepper';
import Textarea from '@/components/ui/Textarea/Textarea';
import { Link } from '@/i18n/navigation';

import styles from './CorporateLanding.module.scss';
import {
  EXTRAS,
  type Format,
  FORMATS,
  LANGUAGES,
  MENUS,
  type MenuKey,
  MIN_GROUP,
  SOURCES,
  TIMES,
} from './options';
import { PREFILL_EVENT, type Prefill } from './prefill';

type MenuChoice = MenuKey | 'help';
type Required = 'date' | 'name' | 'email' | 'privacy';

const CONTACT_EMAIL = 'info@woklab.es';
/** Extras shown before "Show more" */
const EXTRAS_SHOWN = 2;

/** One numbered part of the form: "1 · The event" */
function Group({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.groupLegend}>
        <span className={styles.groupNumber} aria-hidden="true">{number}</span>
        {title}
      </legend>
      <div className={styles.groupBody}>{children}</div>
    </fieldset>
  );
}

/** The enquiry form: it sends to /api/corporate-enquiry and shows the confirmation only once that answers. */
export default function CorporateEventForm({ initialFormat, initialExtras = [] }: { initialFormat?: Format; initialExtras?: string[] }) {
  const t = useTranslations('corporatePage.enquiry.form');
  const tMenus = useTranslations('corporatePage.menus');
  const locale = useLocale();
  const formRef = useRef<HTMLFormElement>(null);

  const [format, setFormat] = useState<Format>(initialFormat ?? 'wokLab');
  const [timeOfDay, setTimeOfDay] = useState<string>('evening');
  const [language, setLanguage] = useState<string>(locale === 'es' ? 'es' : 'en');
  const [source, setSource] = useState<string>('');
  const [groupSize, setGroupSize] = useState(12);
  const [menu, setMenu] = useState<MenuChoice>('help');
  const [extras, setExtras] = useState<string[]>(initialExtras);
  const [flexibleDates, setFlexibleDates] = useState(false);
  const [allExtras, setAllExtras] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Required, string>>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'failed' | 'invalid'>('idle');
  const [sentTo, setSentTo] = useState<string | null>(null);

  const toggleExtra = (key: string, on: boolean) => setExtras((list) => (on ? [...list, key] : list.filter((k) => k !== key)));

  // A format card or "Add it to your request" elsewhere on the page: take the choice, then
  // scroll to where it shows (the top of the form, or the ticked extra) and flash it
  useEffect(() => {
    const take = (event: Event) => {
      const { format: picked, extra } = (event as CustomEvent<Prefill>).detail;
      if (picked) setFormat(picked);
      if (extra) setExtras((list) => (list.includes(extra) ? list : [...list, extra]));

      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      // After React has drawn the new choice
      requestAnimationFrame(() => {
        const form = formRef.current;
        const target = extra && form
          ? form.querySelector<HTMLInputElement>(`input[name="extras"][value="${extra}"]`)
          : picked && form
            ? form.querySelector<HTMLButtonElement>('#ce-format')
            : null;
        if (extra && target) {
          target.closest('label')?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' });
        } else {
          document.getElementById('enquire')?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
        }
        target?.focus({ preventScroll: true });
        // The ticked extra's row, or the format dropdown itself
        const shown = target instanceof HTMLButtonElement ? target : target?.closest('label');
        if (shown && !calm) {
          shown.animate(
            [{ boxShadow: '0 0 0 0 rgba(134, 10, 21, 0.35)' }, { boxShadow: '0 0 0 10px rgba(134, 10, 21, 0)' }],
            { duration: 900, delay: 450, iterations: 2, easing: 'ease-out' },
          );
        }
      });
    };
    window.addEventListener(PREFILL_EVENT, take);
    return () => window.removeEventListener(PREFILL_EVENT, take);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (key: string) => String(data.get(key) ?? '').trim();

    const found: Partial<Record<Required, string>> = {};
    if (!text('date')) found.date = t('errors.date');
    if (!text('name')) found.name = t('errors.name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text('email'))) found.email = t('errors.email');
    if (!privacy) found.privacy = t('errors.privacy');
    setErrors(found);

    const failed = Object.keys(found);
    if (failed.length) {
      setStatus('invalid');
      formRef.current?.querySelector<HTMLElement>(`[name="${failed[0]}"]`)?.focus();
      return;
    }

    setStatus('sending');
    const email = text('email');
    try {
      const res = await fetch('/api/corporate-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          groupSize,
          date: text('date'),
          altDate: text('altDate'),
          timeOfDay: text('timeOfDay'),
          flexibleDates,
          menu,
          dietary: text('dietary'),
          language: text('language'),
          budget: text('budget'),
          extras,
          name: text('name'),
          email,
          phone: text('phone'),
          source: text('source'),
          message: text('message'),
          marketing,
          website: text('website'),
          locale,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      // The newsletter has its own double opt-in email; a failure there doesn't undo the request
      if (marketing) {
        fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, consent: true, locale, source: 'corporate' }),
        }).catch(() => {});
      }
      setSentTo(email);
      setStatus('idle');
    } catch {
      // Everything typed stays in the form
      setStatus('failed');
    }
  }

  if (sentTo) {
    return (
      <div className={`${styles.formCard} ${styles.sentCard}`} role="status">
        <span className={styles.sentTick} aria-hidden="true"><Check size={28} /></span>
        <p className={styles.sentTitle}>{t('sentTitle')}</p>
        <p className={styles.sentText}>{t('sentText', { email: sentTo })}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => setSentTo(null)}>{t('again')}</Button>
      </div>
    );
  }

  const invalidCount = Object.keys(errors).length;
  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <form ref={formRef} className={styles.formCard} onSubmit={submit} noValidate>
      <Group number={1} title={t('groups.event')}>
        <div className={styles.formRow}>
          <Dropdown
            id="ce-format"
            name="format"
            label={t('format')}
            value={format}
            onChange={setFormat}
            options={FORMATS.map((value) => ({ value, label: t(`formats.${value}`) }))}
          />
          <div className={styles.field}>
            <span className={fieldStyles.label} aria-hidden="true">{t('groupSize')}</span>
            <div className={styles.stepperRow}>
              <QuantityStepper
                value={groupSize}
                onChange={setGroupSize}
                min={MIN_GROUP}
                label={t('groupSize')}
                decreaseLabel={t('fewer')}
                increaseLabel={t('more')}
                editable
                name="groupSize"
              />
              <span className={styles.stepperText}>{t('people', { count: groupSize })}</span>
            </div>
          </div>
        </div>
      </Group>

      <Group number={2} title={t('groups.when')}>
        <div className={styles.formRow3}>
          <Input id="ce-date" name="date" type="date" min={minDate} label={t('date')} required error={errors.date} />
          <Input id="ce-alt-date" name="altDate" type="date" min={minDate} label={t('altDate')} />
          <Dropdown
            id="ce-time"
            name="timeOfDay"
            label={t('timeOfDay')}
            value={timeOfDay}
            onChange={setTimeOfDay}
            options={TIMES.map((key) => ({ value: key, label: t(`times.${key}`) }))}
          />
        </div>
        <Checkbox name="flexibleDates" label={t('flexibleDates')} checked={flexibleDates} onChange={(e) => setFlexibleDates(e.target.checked)} />
      </Group>

      <Group number={3} title={t('groups.food')}>
        <ChipGroup
          legend={t('menu')}
          options={[
            ...MENUS.map((m) => ({ value: m.key as MenuChoice, label: tMenus(`${m.key}.name`) })),
            { value: 'help' as MenuChoice, label: t('menuHelp') },
          ]}
          value={menu}
          onChange={setMenu}
          name="menu"
          className={styles.wrapGroup}
        />
        <Input id="ce-dietary" name="dietary" label={t('dietary')} placeholder={t('dietaryHint')} maxLength={500} />
      </Group>

      <Group number={4} title={t('groups.extras')}>
        <div className={styles.formRow}>
          <Dropdown
            id="ce-language"
            name="language"
            label={t('language')}
            value={language}
            onChange={setLanguage}
            options={LANGUAGES.map((key) => ({ value: key, label: t(`languages.${key}`) }))}
          />
          <Input id="ce-budget" name="budget" label={t('budget')} hint={t('budgetHint')} maxLength={60} />
        </div>
        <fieldset className={styles.checkList}>
          <legend className={fieldStyles.label}>{t('extras')}</legend>
          {/* The first two show; the rest open on request, and stay open once one of them is ticked */}
          {EXTRAS.filter((key, i) => i < EXTRAS_SHOWN || allExtras || extras.includes(key)).map((key) => (
            <Checkbox
              key={key}
              name="extras"
              value={key}
              label={t(`extraOptions.${key}`)}
              checked={extras.includes(key)}
              onChange={(e) => toggleExtra(key, e.target.checked)}
            />
          ))}
          {EXTRAS.length > EXTRAS_SHOWN && !EXTRAS.slice(EXTRAS_SHOWN).some((key) => extras.includes(key)) && (
            <button type="button" className={styles.moreButton} aria-expanded={allExtras} onClick={() => setAllExtras((open) => !open)}>
              {allExtras ? t('extrasFewer') : t('extrasMore', { count: EXTRAS.length - EXTRAS_SHOWN })}
              <ChevronDown size={16} className={allExtras ? styles.moreOpen : undefined} />
            </button>
          )}
        </fieldset>
      </Group>

      <Group number={5} title={t('groups.you')}>
        <div className={styles.formRow}>
          <Input id="ce-name" name="name" label={t('name')} autoComplete="name" required error={errors.name} />
          <Input id="ce-email" name="email" type="email" label={t('email')} autoComplete="email" required error={errors.email} />
          <Input id="ce-phone" name="phone" type="tel" label={t('phone')} autoComplete="tel" placeholder="+34" />
          <Dropdown
            id="ce-source"
            name="source"
            label={t('source')}
            value={source}
            onChange={setSource}
            placeholder={t('sourcePick')}
            options={SOURCES.map((key) => ({ value: key, label: t(`sources.${key}`) }))}
          />
        </div>
        <Textarea id="ce-message" name="message" label={t('message')} placeholder={t('messageHint')} rows={4} maxLength={3000} />
      </Group>

      {/* Honeypot: hidden from people, filled in by bots */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className={styles.honeypot} />

      <div className={styles.consents}>
        <div className={styles.field}>
          <Checkbox
            name="privacy"
            label={t.rich('privacy', {
            link: (chunks) => (
              <Link href="/privacy" target="_blank" className={styles.privacyLink}>
                {chunks}
              </Link>
            ),
          })}
            checked={privacy}
            onChange={(e) => setPrivacy(e.target.checked)}
            aria-invalid={errors.privacy ? true : undefined}
            aria-describedby={errors.privacy ? 'ce-privacy-error' : undefined}
          />
            {errors.privacy && <p id="ce-privacy-error" className={styles.fieldError}>{errors.privacy}</p>}
        </div>
        <Checkbox name="marketing" label={t('marketing')} checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
      </div>

      <div className={styles.submitRow}>
        <p className={styles.requiredNote}>{t('required')}</p>
        <Button type="submit" isLoading={status === 'sending'}>
          {t('submit')} <ArrowRight size={18} />
        </Button>
      </div>
      <p className={styles.formStatus} role="status">
        {status === 'sending' && t('sending')}
        {status === 'invalid' && invalidCount > 0 && t('invalid', { count: invalidCount })}
        {status === 'failed' && t('failed', { email: CONTACT_EMAIL })}
      </p>
    </form>
  );
}
