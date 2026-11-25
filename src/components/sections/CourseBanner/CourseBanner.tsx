import Image from 'next/image';

import { urlFor } from '@/lib/sanity/image';
import type { SanityImage } from '@/types';

import styles from './CourseBanner.module.scss';

interface CourseBannerProps {
  image: SanityImage;
  alt: string;
  eyebrow?: string;
  title?: string;
}

/** Full-width photo with a caption over a dark fade. */
export default function CourseBanner({ image, alt, eyebrow, title }: CourseBannerProps) {
  return (
    <figure className={styles.banner}>
      <Image
        src={urlFor(image).width(2160).height(1040).url()}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 75vw, 100vw"
        className={styles.image}
      />
      {(eyebrow || title) && (
        <figcaption className={styles.caption}>
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          {title && <span className={styles.title}>{title}</span>}
        </figcaption>
      )}
    </figure>
  );
}
