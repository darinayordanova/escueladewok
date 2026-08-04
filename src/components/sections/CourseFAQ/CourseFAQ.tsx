'use client';

import { Children, isValidElement, useState, type ReactNode } from 'react';

import { ChevronDown } from '@/components/ui/icons';
import type { Locale } from '@/types';

import styles from './CourseFAQ.module.scss';

/** Flatten a FAQ answer's JSX into plain text for the FAQPage JSON-LD. */
function extractText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(' ');
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return Children.toArray(props.children).map(extractText).join(' ');
  }
  return '';
}

interface FAQItem {
  q: string;
  a: React.ReactNode;
}

const EMAIL = 'info@woklab.es';

const FAQ: Record<Locale, FAQItem[]> = {
  en: [
    {
      q: 'What allergies or dietary requirements can you cater for?',
      a: (
        <>
          <p>Our menus may contain allergens such as nuts, shellfish, gluten, and eggs. We can cater to most allergies by providing alternative ingredients or recipes, provided we have advance notice.</p>
          <p>Please contact us at the time of booking or email <a href={`mailto:${EMAIL}`}>{EMAIL}</a> to let us know your requirements so we can prepare your station accordingly.</p>
        </>
      ),
    },
    {
      q: 'How is the class structured?',
      a: (
        <>
          <p>Get ready for an immersive 3-hour culinary experience:</p>
          <ul>
            <li><strong>2.5 Hours</strong> — Hands-on cooking where you'll learn professional techniques and prepare your dishes.</li>
            <li><strong>30 Minutes</strong> — The "Grand Finale." You'll sit down to relax and enjoy the multi-course feast you've just created.</li>
          </ul>
        </>
      ),
    },
    {
      q: 'How many people are in the class?',
      a: (
        <p>We keep our classes intimate to ensure a personalised experience. Each session has a maximum of 12 students and is led by 1 Head Chef and 1 Assistant Chef, giving you plenty of one-on-one guidance at your wok.</p>
      ),
    },
    {
      q: 'What is included in the price?',
      a: (
        <>
          <p>Everything is provided for your session — you just need to show up!</p>
          <ul>
            <li><strong>All Ingredients &amp; Equipment</strong> — Professional-grade tools and fresh ingredients.</li>
            <li><strong>Welcome Drink</strong> — A refreshing drink to greet you upon arrival.</li>
            <li><strong>Unlimited Refreshments</strong> — Bottomless soft drinks, tea, and coffee throughout the class.</li>
            <li><strong>The Meal</strong> — A full sit-down dinner (the food you've prepared!) served with a glass of wine or beer.</li>
            <li><strong>Leftovers</strong> — If you can't finish it all, you're welcome to take your creations home.</li>
          </ul>
        </>
      ),
    },
    {
      q: 'Are there age restrictions?',
      a: (
        <p>Participants must be 16 years or older to join the class independently. Younger aspiring chefs are welcome but must be accompanied by a participating adult.</p>
      ),
    },
    {
      q: 'Do I need to bring anything?',
      a: (
        <p>Just your appetite and some comfortable, closed-toe shoes. We provide aprons for use during the class and containers for any leftovers you'd like to take home.</p>
      ),
    },
  ],
  es: [
    {
      q: '¿Qué tipo de alergias o requisitos dietéticos pueden atender?',
      a: (
        <>
          <p>Nuestros menús pueden contener alérgenos como frutos secos, mariscos, gluten y huevo. Podemos adaptar la mayoría de los platos a sus necesidades alérgicas siempre que nos avisen con antelación.</p>
          <p>Por favor, infórmenos al realizar su reserva o envíenos un correo a <a href={`mailto:${EMAIL}`}>{EMAIL}</a> para que podamos preparar su estación de cocina adecuadamente.</p>
        </>
      ),
    },
    {
      q: '¿Cómo se estructura la clase?',
      a: (
        <>
          <p>Prepárese para una experiencia culinaria inmersiva de 3 horas:</p>
          <ul>
            <li><strong>2,5 horas</strong> — Cocina práctica y directa, donde aprenderá técnicas profesionales y preparará sus platos.</li>
            <li><strong>30 minutos</strong> — El "Gran Final". Un momento para relajarse y disfrutar del festín que usted mismo ha creado.</li>
          </ul>
        </>
      ),
    },
    {
      q: '¿Cuántas personas hay en cada clase?',
      a: (
        <p>Mantenemos grupos reducidos para garantizar una experiencia personalizada. Cada sesión tiene un máximo de 12 alumnos y cuenta con 1 Chef Principal y 1 Chef Asistente, asegurando que reciba guía constante en su wok.</p>
      ),
    },
    {
      q: '¿Qué incluye el precio?',
      a: (
        <>
          <p>Todo lo necesario para la sesión está incluido; usted solo tiene que presentarse:</p>
          <ul>
            <li><strong>Ingredientes y equipamiento</strong> — Productos frescos y utensilios de cocina profesionales.</li>
            <li><strong>Bebida de bienvenida</strong> — Una bebida de cortesía para recibirle a su llegada.</li>
            <li><strong>Refrescos ilimitados</strong> — Servicio libre de refrescos, té y café durante toda la clase.</li>
            <li><strong>La comida</strong> — Una cena completa (los platos que usted ha preparado) acompañada de una copa de vino o cerveza.</li>
            <li><strong>Para llevar</strong> — Si no logra terminarlo todo, puede llevarse sus creaciones a casa.</li>
          </ul>
        </>
      ),
    },
    {
      q: '¿Hay restricciones de edad?',
      a: (
        <p>Los participantes deben tener 16 años o más para asistir de forma independiente. Los chefs más jóvenes son bienvenidos, siempre que vengan acompañados por un adulto que también participe en la clase.</p>
      ),
    },
    {
      q: '¿Debo traer algo?',
      a: (
        <p>Solo buen apetito y calzado cómodo y cerrado. Nosotros le proporcionamos el delantal para la clase y los recipientes por si desea llevarse lo que sobre a casa.</p>
      ),
    },
  ],
};

const TITLE: Record<Locale, string> = {
  en: 'Frequently Asked Questions',
  es: 'Preguntas Frecuentes',
};

interface CourseFAQProps {
  locale: Locale;
}

export default function CourseFAQ({ locale }: CourseFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const items = FAQ[locale];

  function toggle(i: number) {
    setOpenIndex((prev) => (prev === i ? null : i));
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: extractText(item.a).replace(/\s+/g, ' ').trim(),
      },
    })),
  };

  return (
    <section className="mt-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <h2 className={`h5 pb-3 mb-no ${styles.title}`}>{TITLE[locale]}</h2>
      <dl className={styles.list}>
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} className={`${styles.item} ${isOpen ? styles.itemOpen : ''}`}>
              <dt>
                <button
                  type="button"
                  className={styles.question}
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                  id={`faq-question-${i}`}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={18} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
                </button>
              </dt>
              <dd
                id={`faq-answer-${i}`}
                role="region"
                aria-labelledby={`faq-question-${i}`}
                className={styles.answer}
                hidden={!isOpen}
              >
                <div className={styles.answerInner}>{item.a}</div>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
