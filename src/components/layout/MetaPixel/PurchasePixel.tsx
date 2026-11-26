'use client';

import { useEffect } from 'react';

import { trackPixel } from '@/lib/analytics/metaPixel';

interface PurchasePixelProps {
  /** Stripe Checkout session id: Meta's event id, so the same purchase counts once */
  sessionId: string;
  value: number;
  currency: string;
  contentIds: string[];
  numItems: number;
}

/** Reports a completed purchase to the Meta Pixel from the success page, once per order. */
export default function PurchasePixel({ sessionId, value, currency, contentIds, numItems }: PurchasePixelProps) {
  useEffect(() => {
    // Reloading or revisiting the success page mustn't count the sale again
    const key = `woklab:purchase-tracked:${sessionId}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
    } catch {
      // Storage blocked: the event id still lets Meta drop a duplicate
    }
    trackPixel(
      'Purchase',
      { value, currency, content_ids: contentIds, content_type: 'product', num_items: numItems },
      sessionId,
    );
  }, [sessionId, value, currency, contentIds, numItems]);

  return null;
}
