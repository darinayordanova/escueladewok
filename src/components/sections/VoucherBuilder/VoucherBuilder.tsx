'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import Button from '@/components/ui/Button/Button';
import Checkbox from '@/components/ui/Checkbox/Checkbox';
import DatePicker from '@/components/ui/DatePicker/DatePicker';
import { ChevronRight } from '@/components/ui/icons';
import Input from '@/components/ui/Input/Input';
import Textarea from '@/components/ui/Textarea/Textarea';
import { formatPrice } from '@/lib/format';
import {
  PHYSICAL_FEE,
  VOUCHER_MESSAGE_MAX,
  VOUCHER_NAME_MAX,
  VOUCHER_OPTIONS,
  isEmail,
  voucherAmount,
  voucherSendMaxDate,
  voucherTotal,
  type VoucherFormat,
  type VoucherKey,
} from '@/lib/vouchers';
import { VOUCHER_THEMES, voucherThemeStyle, type VoucherTheme } from '@/lib/voucherThemes';

import styles from './VoucherBuilder.module.scss';
import VoucherPreview from './VoucherPreview';

const FORMATS: VoucherFormat[] = ['digital', 'physical'];

/** Gift voucher form beside a live preview of the voucher it makes. */
interface VoucherBuilderProps {
  locale: string;
  /** Choices carried in from a link, e.g. the Christmas page. */
  initial?: { voucherKey?: VoucherKey; theme?: VoucherTheme; sendDate?: string };
}

export default function VoucherBuilder({ locale, initial }: VoucherBuilderProps) {
  const t = useTranslations('vouchers');
  const [voucherKey, setVoucherKey] = useState<VoucherKey>(initial?.voucherKey ?? 'classVoucher');
  const [format, setFormat] = useState<VoucherFormat>('digital');
  const [theme, setTheme] = useState<VoucherTheme>(initial?.theme ?? 'classic');
  const [to, setTo] = useState('');
  const [from, setFrom] = useState('');
  const [message, setMessage] = useState('');
  // Digital only: where and when the voucher is emailed ('' = straight away)
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendDate, setSendDate] = useState(initial?.sendDate ?? '');
  const [sendMyself, setSendMyself] = useState(false);
  const [maxSendDate] = useState(() => voucherSendMaxDate());
  const [errors, setErrors] = useState<{ to?: string; from?: string; recipientEmail?: string; submit?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const toRef = useRef<HTMLInputElement>(null);
  const fromRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const isDigital = format === 'digital';
  // We email the voucher unless the buyer will pass it on themselves
  const weSend = isDigital && !sendMyself;

  const amount = voucherAmount(voucherKey) ?? 0;
  const total = voucherTotal(voucherKey, format);
  const price = (value: number) => formatPrice(value, 'EUR', locale);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const email = recipientEmail.trim();
    const nextErrors = {
      recipientEmail: !weSend ? undefined : !email ? t('form.recipientEmailRequired') : !isEmail(email) ? t('form.recipientEmailInvalid') : undefined,
      to: to.trim() ? undefined : t('form.toRequired'),
      from: from.trim() ? undefined : t('form.fromRequired'),
    };
    setErrors(nextErrors);
    if (nextErrors.recipientEmail) return emailRef.current?.focus();
    if (nextErrors.to) return toRef.current?.focus();
    if (nextErrors.from) return fromRef.current?.focus();

    setSubmitting(true);
    try {
      const res = await fetch('/api/checkout/voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherKey,
          format,
          theme,
          to,
          from,
          message,
          ...(weSend ? { recipientEmail: recipientEmail.trim(), sendDate } : { sendMyself: isDigital }),
          locale,
          cancelPath: `/${locale}/vouchers`,
        }),
      });
      const data = await res.json();
      if (!data.url) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      console.error('[VoucherBuilder]', err);
      setErrors({ submit: t('form.error') });
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.layout}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <fieldset className={styles.group}>
          <legend className={styles.legend}>{t('form.amount')}</legend>
          <div className={styles.amounts}>
            {VOUCHER_OPTIONS.map((option) => (
              <label key={option.key} className={styles.tile}>
                <input
                  type="radio"
                  name="amount"
                  value={option.key}
                  checked={voucherKey === option.key}
                  onChange={() => setVoucherKey(option.key)}
                  className={styles.radio}
                />
                <span className={styles.tileAmount}>{price(option.amount)}</span>
                <span className={styles.tileHint}>{t(`options.${option.key}`)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.legend}>{t('form.format')}</legend>
          <div className={styles.formats}>
            {FORMATS.map((value) => (
              <label key={value} className={`${styles.tile} ${styles.formatTile}`}>
                <input
                  type="radio"
                  name="format"
                  value={value}
                  checked={format === value}
                  onChange={() => setFormat(value)}
                  className={styles.radio}
                />
                <span className={styles.formatTitle}>
                  {t(`form.${value}`)}
                  {value === 'physical' && <span className={styles.fee}>+ {price(PHYSICAL_FEE)}</span>}
                </span>
                <span className={styles.tileHint}>{t(`form.${value}Hint`)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {isDigital && (
          <div className={styles.delivery}>
          <div className={styles.names}>
            <Input
              ref={emailRef}
              type="email"
              label={t('form.recipientEmail')}
              placeholder={t('form.recipientEmailPlaceholder')}
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              autoComplete="off"
              inputMode="email"
              required={!sendMyself}
              error={errors.recipientEmail}
              disabled={sendMyself}
            />
            <DatePicker
              label={t('form.sendDate')}
              value={sendDate}
              onChange={setSendDate}
              maxDate={maxSendDate}
              placeholder={t('form.sendDatePlaceholder')}
              clearLabel={t('form.sendDateClear')}
              info={t('form.sendDateHint')}
              locale={locale}
              disabled={sendMyself}
            />
          </div>
          <Checkbox
            label={t('form.sendMyself')}
            checked={sendMyself}
            onChange={(e) => {
              setSendMyself(e.target.checked);
              setErrors((prev) => ({ ...prev, recipientEmail: undefined }));
            }}
          />
          </div>
        )}

        <div className={styles.names}>
          <Input
            ref={toRef}
            label={t('form.to')}
            placeholder={t('form.toPlaceholder')}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            maxLength={VOUCHER_NAME_MAX}
            autoComplete="off"
            required
            error={errors.to}
          />
          <Input
            ref={fromRef}
            label={t('form.from')}
            placeholder={t('form.fromPlaceholder')}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            maxLength={VOUCHER_NAME_MAX}
            autoComplete="name"
            required
            error={errors.from}
          />
        </div>

        <Textarea
          label={t('form.message')}
          placeholder={t('form.messagePlaceholder')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={VOUCHER_MESSAGE_MAX}
          rows={3}
          hint={t('form.messageCount', { count: message.length, max: VOUCHER_MESSAGE_MAX })}
        />

        <div className={styles.total}>
          <div>
            <p className={styles.totalLabel}>{t('form.total')}</p>
            {format === 'physical' && (
              <p className={styles.breakdown}>
                {t('form.breakdown', { voucher: price(amount), fee: price(PHYSICAL_FEE) })}
              </p>
            )}
          </div>
          <p className={styles.totalPrice} aria-live="polite">
            <span key={total} className={styles.totalValue}>{price(total)}</span>
          </p>
        </div>

        <Button type="submit" fullWidth isLoading={submitting}>
          {submitting ? t('form.processing') : t('form.checkout')}
          {!submitting && <ChevronRight size={20} />}
        </Button>
        {errors.submit && <p className={styles.submitError} role="alert">{errors.submit}</p>}
        <p className={styles.small}>{t('form.terms')}</p>
      </form>

      <div className={styles.previewColumn}>
        <VoucherPreview
          voucherKey={voucherKey}
          amount={amount}
          format={format}
          theme={theme}
          to={to.trim()}
          from={from.trim()}
          message={message.trim()}
          locale={locale}
        />
        <fieldset className={`${styles.group} ${styles.designPicker}`}>
          <legend className={styles.legend}>
            {t('form.design')} <span className={styles.legendValue}>· {t(`themes.${theme}.name`)}</span>
          </legend>
          <div className={styles.themes}>
            {VOUCHER_THEMES.map((value) => {
              const { tone, ...swatchVars } = voucherThemeStyle(value);
              return (
                <label key={value} className={styles.swatch} title={t(`themes.${value}.name`)} data-tone={tone}>
                  <input
                    type="radio"
                    name="theme"
                    value={value}
                    checked={theme === value}
                    onChange={() => setTheme(value)}
                    aria-label={t(`themes.${value}.name`)}
                    className={styles.radio}
                  />
                  <span className={styles.swatchArt} style={swatchVars} />
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
    </div>
  );
}
