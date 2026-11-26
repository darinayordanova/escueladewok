// Resend Topics — the subscription categories people see on Resend's unsubscribe page.
// Created in the Resend dashboard with "Default subscription: Opt-out", so nobody is
// subscribed until they confirm by email (RGPD: consent must be an explicit action).

export const TOPICS = {
  promos: '677b0e0a-2d45-4d88-b928-3b177ddf4fa6', // Promociones de temporada
  newClasses: '4502037c-24c9-415f-91fe-4ab366105511', // Nuevas clases
  lastSpots: '1c9bed9e-e048-45df-8e01-40d850768b5b', // Últimas plazas
} as const;

export type TopicKey = keyof typeof TOPICS;

export const ALL_TOPICS = Object.keys(TOPICS) as TopicKey[];
