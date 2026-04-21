import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';

import Footer from '@/components/layout/Footer/Footer';
import Header from '@/components/layout/Header/Header';
import Button from '@/components/ui/Button/Button';
import { CartProvider } from '@/context/CartContext';

import styles from './not-found.module.scss';

export default async function RootNotFound() {
  const locale = await getLocale();
  const [messages, t] = await Promise.all([
    getMessages({ locale }),
    getTranslations({ locale, namespace: 'notFound' }),
  ]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <CartProvider>
        <Header />
        <main>
          <section className={`flex flex-align-center ${styles.page}`}>
            <div className={`container text-center flex flex-column `}>
              <p className={styles.code} aria-hidden="true">
                404
              </p>
              <h1 className={`h2`}>{t('title')}</h1>
              <p className={`text-lg mb-10 ${styles.subtitle}`}>
                {t('subtitle')}
              </p>
              <div className={`flex gap-3 ${styles.actions}`}>
                <Button href="/" size="lg">
                  {t('backToHome')}
                </Button>
                <Button href="/courses" variant="outline" size="lg">
                  {t('browseCourses')}
                </Button>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </CartProvider>
    </NextIntlClientProvider>
  );
}
