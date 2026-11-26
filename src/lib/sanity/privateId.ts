import { randomUUID } from 'crypto';

/**
 * IDs for documents holding customers' personal data (bookings, vouchers, subscribers).
 * Sanity treats any ID containing a dot as private: it can only be read with a token,
 * even though the dataset itself is public (private datasets need a paid plan).
 */
export const privateId = (type: string, key: string = randomUUID()) => `private.${type}.${key}`;
