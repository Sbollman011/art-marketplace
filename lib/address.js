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

  const zipMatch = address.match(/\b(\d{5})(?:-\d{4})?\b/);
  const postalCode = zipMatch ? zipMatch[1] : null;

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
