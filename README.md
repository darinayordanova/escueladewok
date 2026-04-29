# Wok Lab — Cooking School Website

Full-stack marketing and booking platform for **Wok Lab**, an Asian cooking school in Madrid. Built as a freelance project — production-ready, CMS-driven, and fully bilingual.

**Live site:** [woklab.es](https://woklab.es) &nbsp;·&nbsp; **Repo:** [github.com/darinayordanova/escueladewok](https://github.com/darinayordanova/escueladewok)

---

## What it does

- Customers browse cooking courses, pick a date and time, and pay online via Stripe
- Gift vouchers (cooking class or flexible gift card) are purchased through a separate checkout flow and delivered as a styled PDF by email
- A calendar view shows all upcoming classes across months
- Corporate event enquiries are submitted via a contact form and emailed to the owner
- A waitlist captures demand for sold-out sessions
- The owner manages all content — courses, schedules, pages, team — through an embedded Sanity Studio

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| CMS | Sanity v5 (embedded Studio at `/studio`) |
| Internationalisation | next-intl v4 — English & Spanish |
| Styling | SCSS Modules + custom utility class system |
| Payments | Stripe Checkout + webhook handler |
| Email | Resend — booking confirmations, voucher delivery, waitlist, contact forms |
| PDF generation | `@react-pdf/renderer` v4 + `sharp` for raster assets |
| Maps | Leaflet (contact page) |
| Language | TypeScript throughout |

---

## Key features

### Booking flow
Customers select a course → pick a date from available time slots → enter their details → pay via Stripe Checkout. On successful payment the Stripe webhook creates a `courseSession` record in Sanity and triggers a confirmation email to both the customer and the owner.

### Gift vouchers
Three voucher types (cooking class, €25 gift card, €50 gift card). Buyers can schedule delivery for a future date. On purchase a branded PDF voucher is generated server-side and emailed via Resend.

### CMS-driven content
Every public-facing page is editable from Sanity Studio without a deployment. This includes course schedules (time slot arrays with multiple dates), hero text, "How it works" steps, team members, contact info, legal pages, and more.

### Internationalisation
All routes are served under `/en/…` and `/es/…`. UI strings live in JSON translation files. CMS content uses locale-keyed fields (`{ en: string; es: string }`) so editors write copy in both languages directly in Studio.

### Real-time availability
Spot counts are derived at request time by comparing `maxParticipants` against confirmed bookings stored in Sanity. Sold-out sessions surface a waitlist form instead of the booking CTA.

### Utility CSS system
Rather than adopting a third-party library, the project ships a bespoke SCSS utility layer: a 12-column grid (`grid`, `col-{n}`, `col-{bp}-{n}`), a `grid--row` variant for `auto / 1fr / auto` layouts, flex helpers, spacing scale, typography classes, and colour tokens — all generated from a single `_variables.scss` file.

---

## Project structure

```
src/
├── app/
│   ├── [locale]/               # All user-facing routes (en / es)
│   │   ├── page.tsx            # Homepage
│   │   ├── courses/            # Course listing + detail
│   │   ├── calendar/           # Full calendar view
│   │   ├── corporate/          # Corporate events
│   │   ├── vouchers/           # Gift voucher shop
│   │   ├── about/
│   │   ├── contact/
│   │   └── booking/success/
│   ├── api/
│   │   ├── checkout/           # Stripe session creation (courses + vouchers)
│   │   ├── webhooks/stripe/    # Payment confirmation → Sanity + email
│   │   ├── contact/            # Contact form handler
│   │   ├── corporate-enquiry/
│   │   ├── waitlist/
│   │   └── send-confirmation/
│   └── studio/                 # Embedded Sanity Studio
├── components/
│   ├── layout/                 # Header, Footer, MobileMenu, ScrollToTop
│   ├── sections/               # Page-level sections (Hero, CourseCard, CalendarView, …)
│   └── ui/                     # Reusable primitives (Carousel, DatePicker, InlineCalendar, …)
├── i18n/messages/              # en.json, es.json
├── lib/
│   ├── courses/timeslots.ts    # Occurrence expansion, spot calculation
│   ├── email/                  # Resend templates
│   ├── pdf/                    # react-pdf voucher template
│   └── sanity/                 # Client, queries, image helper
├── sanity/schemaTypes/         # All Sanity document + object schemas
├── styles/                     # SCSS design tokens and utility system
└── types/                      # Shared TypeScript interfaces
```

---

## Running locally

**Prerequisites:** Node 20+, a Sanity project, a Stripe account, a Resend account.

```bash
# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env.local

# Start the development server
npm run dev
```

### Required environment variables

```env
# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
SANITY_API_TOKEN=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# App
NEXT_PUBLIC_SITE_URL=
```

### Other commands

```bash
npm run build        # Production build
npm run type-check   # TypeScript check (no emit)
npm run lint         # ESLint
npm run format       # Prettier
```

---

## Sanity content model

| Schema | Purpose |
|---|---|
| `course` | Title, description, cuisine, duration, price, menu, allergens, time slots, instructor, brochure |
| `courseSession` | Created by webhook on purchase — stores attendees, date, payment reference |
| `homepage` | Hero text, "How it works" steps, featured courses label |
| `giftVoucher` | Purchased vouchers with recipient, amount, scheduled send date, redemption status |
| `aboutPage` / `contactPage` | Editable page content with Portable Text |
| `termsPage` / `privacyPage` | Legal content |

---

## Author

**Darina Yordanova** — [github.com/darinayordanova](https://github.com/darinayordanova)
