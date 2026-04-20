'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Close } from '@/components/ui/icons';
import Button from '@/components/ui/Button/Button';
import Stepper from '@/components/ui/Stepper/Stepper';
import { cartKey, useCart } from '@/context/CartContext';
import { Link } from '@/i18n/navigation';
import type { CartItem } from '@/types';

import styles from './CartDrawer.module.scss';

export default function CartDrawer() {
  const t = useTranslations('cart');
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'loading'>('idle');
  const panelRef = useRef<HTMLDivElement>(null);

  // Trap focus + close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeCart]);

  async function handleCheckout() {
    if (items.length === 0) return;
    setCheckoutStatus('loading');
    try {
      const locale = document.documentElement.lang || 'en';
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            courseId: item.courseId,
            courseSlug: item.courseSlug,
            courseTitle: item.courseTitle,
            date: item.date,
            startTime: item.startTime,
            endTime: item.endTime,
            duration: item.duration,
            price: item.price,
            currency: item.currency,
            maxParticipants: item.maxParticipants,
            quantity: item.quantity,
          })),
          locale,
          cancelPath: '/courses',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Unknown error');
      clearCart();
      window.location.href = data.url;
    } catch {
      setCheckoutStatus('idle');
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ''}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{t('title')}</h2>
          <button type="button" className={styles.close} onClick={closeCart} aria-label="Close cart">
            <Close size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>{t('empty')}</p>
            <Link href="/courses" onClick={closeCart} className="color-primary font-semibold">
              {t('browseCourses')}
            </Link>
          </div>
        ) : (
          <>
            <ul className={styles.list}>
              {items.map((item) => (
                <CartItemRow
                  key={cartKey(item)}
                  item={item}
                  onQuantityChange={(q) => updateQuantity(cartKey(item), q)}
                  onRemove={() => removeItem(cartKey(item))}
                />
              ))}
            </ul>

            <div className={styles.footer}>
              <div className={styles.total}>
                <span className={styles.totalLabel}>{t('total')}</span>
                <span className={styles.totalPrice}>{totalPrice.toFixed(2)} EUR</span>
              </div>
              <Button
                onClick={handleCheckout}
                disabled={checkoutStatus === 'loading'}
                style={{ width: '100%' }}
              >
                {checkoutStatus === 'loading' ? t('processing') : t('checkout')}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function CartItemRow({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  onQuantityChange: (q: number) => void;
  onRemove: () => void;
}) {
  const t = useTranslations('cart');

  return (
    <li className={styles.item}>
      <div className={styles.itemInfo}>
        <p className={styles.itemTitle}>{item.courseTitle}</p>
        <p className={styles.itemMeta}>
          {item.date} · {item.startTime}–{item.endTime}
        </p>
        <p className={styles.itemPrice}>
          {item.price} EUR × {item.quantity} = <strong>{(item.price * item.quantity).toFixed(2)} EUR</strong>
        </p>
      </div>
      <div className={styles.itemActions}>
        <Stepper
          value={item.quantity}
          onChange={onQuantityChange}
          min={1}
          max={item.maxParticipants}
          label={t('quantity')}
        />
        <button type="button" className={styles.removeBtn} onClick={onRemove} aria-label={t('remove')}>
          <Close size={14} />
        </button>
      </div>
    </li>
  );
}
