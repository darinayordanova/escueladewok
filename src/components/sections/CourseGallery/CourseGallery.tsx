import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import SectionHeading from '@/components/ui/SectionHeading/SectionHeading';
import { urlFor } from '@/lib/sanity/image';
import type { Locale, SanityImage } from '@/types';

import styles from './CourseGallery.module.scss';

interface CourseGalleryProps {
  images: (SanityImage & { _key: string })[];
  locale: Locale;
}

/** Up to three photos: the first large, the others stacked beside it. */
export default async function CourseGallery({ images, locale }: CourseGalleryProps) {
  if (images.length === 0) return null;

  const t = await getTranslations({ locale, namespace: 'courseDetail.gallery' });
  const photos = images.slice(0, 3);

  return (
    <section className={styles.section}>
      <SectionHeading eyebrow={t('eyebrow')} title={t('title')} accent={t('accent')} />

      <div className={`${styles.grid} ${styles[`count${photos.length}`]}`}>
        {photos.map((image, i) => (
          <figure key={image._key} className={styles.figure}>
            <Image
              src={urlFor(image).width(i === 0 ? 1200 : 700).url()}
              alt={image.alt?.[locale] ?? ''}
              fill
              sizes={i === 0 ? '(min-width: 1024px) 45vw, 100vw' : '(min-width: 1024px) 25vw, 50vw'}
              className={styles.image}
            />
          </figure>
        ))}
      </div>
    </section>
  );
}
