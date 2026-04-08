import Image from 'next/image';
import { PortableText } from '@portabletext/react';

import { urlFor } from '@/lib/sanity/image';
import type {
  CourseSection,
  GalleryImage,
  ImageGallery,
  ImageSection,
  Locale,
  TextSection,
} from '@/types';

import styles from './CourseAbout.module.scss';

interface CourseAboutProps {
  sections: CourseSection[];
  locale: Locale;
}

export default function CourseAbout({ sections, locale }: CourseAboutProps) {
  if (sections.length === 0) return null;

  return (
    <div className="flex flex-column gap-6">
      {sections.map((section) => {
        switch (section._type) {
          case 'textSection':
            return <TextBlock key={section._key} section={section} locale={locale} />;
          case 'imageSection':
            return <ImageBlock key={section._key} section={section} locale={locale} />;
          case 'imageGallery':
            return <GalleryBlock key={section._key} section={section} locale={locale} />;
        }
      })}
    </div>
  );
}

// ─── Section renderers ────────────────────────────────────────────────────────

function TextBlock({ section, locale }: { section: TextSection; locale: Locale }) {
  const body = section.body?.[locale];
  if (!body?.length) return null;

  return (
    <div>
      {section.heading?.[locale] && (
        <h6 className='mt-2'>{section.heading[locale]}</h6>
      )}
      <div className={styles.prose}>
        <PortableText value={body} />
      </div>
    </div>
  );
}

function ImageBlock({ section, locale }: { section: ImageSection; locale: Locale }) {
  const { image, caption } = section;
  const alt = image.alt?.[locale] ?? '';

  return (
    <figure className={styles.imageBlock}>
      <div className={styles.imageWrapper}>
        <Image
          src={urlFor(image).width(900).height(500).url()}
          alt={alt}
          fill
          className={styles.image}
          sizes="(max-width: 768px) 100vw, 860px"
        />
      </div>
      {caption?.[locale] && (
        <figcaption className={styles.caption}>{caption[locale]}</figcaption>
      )}
    </figure>
  );
}

function GalleryBlock({ section, locale }: { section: ImageGallery; locale: Locale }) {
  const { images, heading } = section;
  if (!images?.length) return null;

  return (
    <div className={styles.galleryBlock}>
      {heading?.[locale] && (
        <h3 className={styles.blockHeading}>{heading[locale]}</h3>
      )}
      <ul className={styles.gallery} role="list">
        {images.map((img: GalleryImage) => (
          <li key={img._key} className={styles.galleryItem}>
            <div className={styles.galleryImageWrapper}>
              <Image
                src={urlFor(img).width(600).height(400).url()}
                alt={img.alt?.[locale] ?? ''}
                fill
                className={styles.image}
                sizes="(max-width: 768px) 50vw, 280px"
              />
            </div>
            {img.caption?.[locale] && (
              <p className={styles.galleryCaption}>{img.caption[locale]}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
