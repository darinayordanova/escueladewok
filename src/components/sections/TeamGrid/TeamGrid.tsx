import Image from 'next/image';

import { urlFor } from '@/lib/sanity/image';
import type { Locale, TeamMember } from '@/types';

import styles from './TeamGrid.module.scss';

interface TeamGridProps {
  members: TeamMember[];
  locale: Locale;
}

export default function TeamGrid({ members, locale }: TeamGridProps) {
  if (members.length === 0) return null;

  // Single person — horizontal featured card
  if (members.length === 1) {
    return <FeaturedMember member={members[0]} locale={locale} />;
  }

  // Multiple people — responsive grid
  return (
    <ul role="list">
      {members.map((member) => (
        <li key={member._key}>
          <MemberCard member={member} locale={locale} />
        </li>
      ))}
    </ul>
  );
}

// ─── Featured (single person) ─────────────────────────────────────────────────

function FeaturedMember({ member, locale }: { member: TeamMember; locale: Locale }) {
  return (
    <div className={"grid"}>
      <div className={`col-12 col-md-4 mb-4 mb-md-no ${styles.featuredImageWrapper}`}>
        {member.image ? (
          <Image
            src={urlFor(member.image).width(600).height(700).url()}
            alt={member.image.alt?.[locale] ?? member.name}
            fill
            className={styles.featuredImage}
            sizes="(max-width: 768px) 100vw, 380px"
          />
        ) : (
          <div className={styles.imagePlaceholder} aria-hidden="true" />
        )}
      </div>

      <div className={`col-12 col-md-8 pl-md-10 ${styles.featuredBody}`}>
        <h5 className='mb-no'>{member.name}</h5>
        {member.role?.[locale] && (
          <p className="color-primary font-semibold text-md text-uppercase ">{member.role[locale]}</p>
        )}
        {member.bio?.[locale] && (
          <p className={styles.featuredBio}>{member.bio[locale]}</p>
        )}
      </div>
    </div>
  );
}

// ─── Grid card (multiple people) ──────────────────────────────────────────────

function MemberCard({ member, locale }: { member: TeamMember; locale: Locale }) {
  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        {member.image ? (
          <Image
            src={urlFor(member.image).width(400).height(400).url()}
            alt={member.image.alt?.[locale] ?? member.name}
            fill
            className={styles.image}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className={styles.imagePlaceholder} aria-hidden="true" />
        )}
      </div>
      <div className={styles.body}>
        <p className={styles.name}>{member.name}</p>
        {member.role?.[locale] && (
          <p className={styles.role}>{member.role[locale]}</p>
        )}
        {member.bio?.[locale] && (
          <p className={styles.bio}>{member.bio[locale]}</p>
        )}
      </div>
    </div>
  );
}
