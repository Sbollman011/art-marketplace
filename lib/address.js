const STATE_ABBREVIATIONS = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'AK', 'PR', 'VI', 'GU', 'AS', 'MP',
]);

const STATE_NAMES = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO',
  montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH',
  oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
  'district of columbia': 'DC', 'puerto rico': 'PR',
};

const NON_US_HINTS = [
  'canada', 'mexico', 'united kingdom', 'england', 'scotland', 'wales', 'ireland',
  'australia', 'new zealand', 'germany', 'france', 'spain', 'italy', 'netherlands',
  'japan', 'china', 'korea', 'india', 'brazil', 'sweden', 'norway', 'denmark',
];

export function normalizePostalCode(rawPostalCode) {
  if (typeof rawPostalCode !== 'string' && typeof rawPostalCode !== 'number') {
    return null;
  }

  const match = String(rawPostalCode).trim().match(/\b(\d{5})(?:-\d{4})?\b/);
  return match ? match[1] : null;
}

export function normalizeStateCode(rawState) {
  if (typeof rawState !== 'string') {
    return null;
  }

  const normalized = rawState.trim();

  if (!normalized) {
    return null;
  }

  const upper = normalized.toUpperCase();
  if (STATE_ABBREVIATIONS.has(upper)) {
    return upper;
  }

  return STATE_NAMES[normalized.toLowerCase()] || null;
}

function titleCase(value) {
  return value.replace(/\b[a-z]/g, (character) => character.toUpperCase());
}

/** Sorted {code, label} list for the checkout state dropdown. */
export const US_STATE_OPTIONS = Object.entries(STATE_NAMES)
  .map(([name, code]) => ({ code, label: titleCase(name) }))
  .sort((left, right) => left.label.localeCompare(right.label));

/**
 * Joins the structured checkout fields into the single-line form the rest of the
 * app already stores, quotes, and verifies against.
 */
export function formatShippingAddress(fields = {}) {
  const street = (fields.street || '').trim();
  const line2 = (fields.line2 || '').trim();
  const city = (fields.city || '').trim();
  const state = (fields.state || '').trim();
  const postalCode = (fields.postalCode || '').trim();
  const region = [state, postalCode].filter(Boolean).join(' ');

  return [street, line2, city, region].filter(Boolean).join(', ');
}

/**
 * Reverses `formatShippingAddress` well enough to prefill the structured fields
 * from an address that was saved before those fields existed.
 */
export function splitShippingAddress(rawAddress) {
  const empty = { street: '', line2: '', city: '', state: '', postalCode: '' };
  const address = typeof rawAddress === 'string' ? rawAddress.trim() : '';

  if (!address) {
    return empty;
  }

  const segments = address.split(',').map((segment) => segment.trim()).filter(Boolean);

  if (segments.length === 0) {
    return empty;
  }

  let state = '';
  let postalCode = '';
  let city = '';

  const lastSegment = segments[segments.length - 1];
  const stateZipMatch = lastSegment.match(/^(.*?)[\s,]*(\d{5})(?:-\d{4})?$/);

  if (stateZipMatch) {
    postalCode = stateZipMatch[2];
    segments.pop();

    // Whatever preceded the ZIP may be the state on its own, or a run-on like
    // "123 Main Street Seattle WA". Peel the state off and keep the rest.
    let remainder = stateZipMatch[1].trim().replace(/,+$/, '').trim();
    const remainderAsState = normalizeStateCode(remainder);

    if (remainderAsState) {
      state = remainderAsState;
      remainder = '';
    } else {
      // Try the abbreviation first so "Seattle WA" peels off "WA" and not both.
      const candidates = [
        /^(.*?)[\s,]+([A-Za-z]{2})$/,
        /^(.*?)[\s,]+([A-Za-z]+)$/,
        /^(.*?)[\s,]+([A-Za-z]+\s+[A-Za-z]+)$/,
      ];

      for (const pattern of candidates) {
        const match = remainder.match(pattern);
        const matchedState = match ? normalizeStateCode(match[2]) : null;

        if (matchedState) {
          state = matchedState;
          remainder = match[1].trim().replace(/,+$/, '').trim();
          break;
        }
      }
    }

    if (remainder) {
      segments.push(remainder);
    }
  } else {
    const maybeState = normalizeStateCode(lastSegment);

    if (maybeState) {
      state = maybeState;
      segments.pop();
    }
  }

  // A single remaining segment is the street, not the city.
  if (segments.length > 1) {
    city = segments.pop();
  }

  const street = segments.shift() || '';
  const line2 = segments.join(', ');

  return { street, line2, city, state, postalCode };
}

/**
 * Pulls the shipping-relevant fields out of the freeform address textarea.
 * Returns `state`/`postalCode` as null when they cannot be identified, so callers
 * can decide whether to quote or ask for a more complete address.
 */
export function parseShippingAddress(rawAddress) {
  const address = typeof rawAddress === 'string' ? rawAddress.trim() : '';

  if (!address) {
    return { country: null, state: null, postalCode: null, isComplete: false };
  }

  const lowered = address.toLowerCase();
  const foreignMatch = NON_US_HINTS.find((hint) => lowered.includes(hint));

  if (foreignMatch) {
    return { country: 'INTL', state: null, postalCode: null, isComplete: false };
  }

  const postalCode = normalizePostalCode(address);

  let state = null;

  for (const [name, abbreviation] of Object.entries(STATE_NAMES)) {
    if (new RegExp(`\\b${name}\\b`, 'i').test(address)) {
      state = abbreviation;
      break;
    }
  }

  if (!state) {
    const tokens = address.toUpperCase().match(/\b[A-Z]{2}\b/g) || [];
    // Walk backwards because the state almost always trails the city.
    for (let index = tokens.length - 1; index >= 0; index -= 1) {
      if (STATE_ABBREVIATIONS.has(tokens[index])) {
        state = tokens[index];
        break;
      }
    }
  }

  // Washington ZIPs run 980xx-994xx and are the tax-relevant case, so infer the
  // state when the shopper gave a ZIP but skipped the abbreviation.
  if (!state && postalCode) {
    const prefix = Number.parseInt(postalCode.slice(0, 3), 10);

    if (prefix >= 980 && prefix <= 994) {
      state = 'WA';
    }
  }

  return {
    country: 'US',
    state,
    postalCode,
    isComplete: Boolean(state || postalCode),
  };
}
