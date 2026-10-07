import {
  normalizePostalCode,
  normalizeStateCode,
  parseShippingAddress,
  splitShippingAddress,
} from './address';

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

// USPS retired the old Web Tools API in January 2026. This targets the current
// OAuth platform. Addresses is part of the free default product on a USPS
// Business Account, so this only costs the signup.
const USPS_BASE_URL = process.env.USPS_API_BASE || 'https://apis.usps.com';

function uspsConfigured() {
  return Boolean(process.env.USPS_CONSUMER_KEY && process.env.USPS_CONSUMER_SECRET);
}

// USPS tokens are good for a while, so holding one avoids a token round trip on
// every keystroke-driven verification.
let cachedToken = null;

async function getUspsToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const response = await fetch(`${USPS_BASE_URL}/oauth2/v3/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.USPS_CONSUMER_KEY,
      client_secret: process.env.USPS_CONSUMER_SECRET,
    }),
  });

  if (!response.ok) {
    throw new Error(`USPS token request failed with ${response.status}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error('USPS token response did not include an access token');
  }

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000,
  };

  return cachedToken.value;
}

function formatUspsAddress(address) {
  const street = [address.streetAddress, address.secondaryAddress].filter(Boolean).join(' ');
  const zip = [address.ZIPCode, address.ZIPPlus4].filter(Boolean).join('-');

  return [street, address.city, [address.state, zip].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
}

/**
 * USPS is the authoritative check: DPV confirms the address is a real delivery
 * point, not merely a place that exists on a map.
 */
async function verifyWithUsps(fields, parsed) {
  const token = await getUspsToken();
  const params = new URLSearchParams({ streetAddress: fields.street });

  if (fields.line2) params.set('secondaryAddress', fields.line2);
  if (fields.city) params.set('city', fields.city);
  if (fields.state) params.set('state', fields.state);
  if (fields.postalCode) params.set('ZIPCode', fields.postalCode);

  const response = await fetch(`${USPS_BASE_URL}/addresses/v3/address?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    return {
      verified: false,
      confirmed: false,
      status: 'invalid',
      message: 'USPS does not recognize this address. Please check the street, city, state, and ZIP.',
      parsed,
      provider: 'usps',
    };
  }

  if (!response.ok) {
    throw new Error(`USPS address lookup failed with ${response.status}`);
  }

  const data = await response.json();
  const address = data.address;

  if (!address?.streetAddress) {
    return {
      verified: false,
      confirmed: false,
      status: 'invalid',
      message: 'USPS does not recognize this address. Please check the street, city, state, and ZIP.',
      parsed,
      provider: 'usps',
    };
  }

  const info = data.additionalInfo || {};
  const dpv = info.DPVConfirmation;

  // N means USPS does not deliver there. D/S mean the building is real but the
  // apartment or suite is missing or wrong, which is the usual delivery failure.
  if (dpv === 'N') {
    return {
      verified: false,
      confirmed: false,
      status: 'invalid',
      message: 'USPS does not deliver to this address. Please check it or choose local pickup.',
      parsed,
      provider: 'usps',
    };
  }

  if (dpv === 'D' || dpv === 'S') {
    return {
      verified: false,
      confirmed: false,
      status: 'invalid',
      message: 'This building is valid, but USPS needs the apartment or suite number to deliver.',
      parsed,
      provider: 'usps',
    };
  }

  const standardizedAddress = formatUspsAddress(address);
  const warnings = [];

  if (info.DPVVacant === 'Y' || info.vacant === 'Y') {
    warnings.push('USPS lists this address as vacant. Please confirm someone can receive the package.');
  }

  if (info.DPVCMRA === 'Y') {
    warnings.push('This is a mailbox service address rather than a home or business.');
  }

  return {
    verified: true,
    confirmed: true,
    status: 'verified',
    message: 'USPS confirmed this address is deliverable.',
    standardizedAddress,
    warnings,
    provider: 'usps',
    parsed: {
      ...parsed,
      state: normalizeStateCode(address.state) || parsed.state,
      postalCode: normalizePostalCode(address.ZIPCode) || parsed.postalCode,
    },
  };
}

function buildStandardizedAddress(address, parsed) {
  const street = [address.house_number, address.road].filter(Boolean).join(' ');
  const city = address.city || address.town || address.village || address.hamlet || address.municipality || address.county || '';
  const state = normalizeStateCode(address.state_code || address.state) || parsed.state || '';
  const postalCode = normalizePostalCode(address.postcode) || parsed.postalCode || '';

  return [street, city, [state, postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
}

export async function verifyShippingAddress(rawAddress) {
  const address = typeof rawAddress === 'string' ? rawAddress.trim() : '';
  const parsed = parseShippingAddress(address);
  const fields = splitShippingAddress(address);

  if (!address) {
    return {
      verified: false,
      confirmed: false,
      status: 'invalid',
      message: 'Please enter a shipping address.',
      parsed,
    };
  }

  if (parsed.country === 'INTL') {
    return {
      verified: false,
      confirmed: false,
      status: 'invalid',
      message: 'We currently ship within the United States only. Contact the studio for international orders.',
      parsed,
    };
  }

  // These are structural problems with what the shopper typed, so they are worth
  // blocking on no matter which verification service answers.
  if (!fields.street) {
    return {
      verified: false,
      confirmed: false,
      status: 'invalid',
      message: 'Add a street number and street name so your order can be delivered.',
      parsed,
    };
  }

  if (!parsed.postalCode) {
    return {
      verified: false,
      confirmed: false,
      status: 'invalid',
      message: 'Add a 5-digit ZIP code so we can check delivery and calculate shipping.',
      parsed,
    };
  }

  // USPS is authoritative when credentials exist. A USPS outage should never
  // block a sale, so fall through to the map lookup instead of failing.
  if (uspsConfigured()) {
    try {
      return await verifyWithUsps(fields, parsed);
    } catch (uspsError) {
      console.error('USPS address verification unavailable, falling back:', uspsError.message);
    }
  }

  // Everything below is the fallback map lookup. It is good at confirming a
  // place exists but is not postal data, so it is treated as advisory: it can
  // reassure the shopper, never reject them over a disagreement.
  const unconfirmed = (note) => ({
    verified: true,
    confirmed: false,
    status: 'unconfirmed',
    message: 'We could not fully confirm this address automatically.',
    standardizedAddress: '',
    warnings: [note || 'Please double-check the street, city, state, and ZIP before you pay.'],
    provider: 'osm',
    parsed,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  try {
    const url = `${NOMINATIM_SEARCH_URL}?format=jsonv2&addressdetails=1&limit=1&countrycodes=us&q=${encodeURIComponent(address)}`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'GGG-Art-Marketplace/1.0',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return unconfirmed('Our address checker is temporarily unavailable, so please review your address carefully.');
    }

    const results = await response.json();
    const candidate = Array.isArray(results) ? results[0] : null;
    const candidateAddress = candidate?.address;

    if (!candidateAddress) {
      return unconfirmed('We could not find this address on the map. Please make sure it is correct.');
    }

    const candidateCountry = String(candidateAddress.country_code || '').toUpperCase();

    if (candidateCountry && candidateCountry !== 'US') {
      return {
        verified: false,
        confirmed: false,
        status: 'invalid',
        message: 'We currently ship within the United States only. Contact the studio for international orders.',
        parsed,
      };
    }

    const candidatePostalCode = normalizePostalCode(candidateAddress.postcode);
    const candidateState = normalizeStateCode(candidateAddress.state_code || candidateAddress.state);
    const warnings = [];

    // A state that disagrees usually means the dropdown is wrong, but this
    // source is not authoritative enough to refuse the order over it.
    if (parsed.state && candidateState && parsed.state !== candidateState) {
      warnings.push(`This ZIP code usually belongs to ${candidateState}, not ${parsed.state}. Please confirm the state is right.`);
    }

    if (!candidateAddress.house_number) {
      warnings.push('We matched the street but not the exact building number. Please confirm it is correct.');
    }

    const standardizedAddress = buildStandardizedAddress(candidateAddress, parsed);

    // The ZIP the shopper typed is kept on purpose. The map service is not
    // postal data, and overriding a correct ZIP causes real delivery problems.
    return {
      verified: true,
      confirmed: warnings.length === 0,
      status: warnings.length === 0 ? 'verified' : 'unconfirmed',
      message: warnings.length === 0
        ? 'This address looks good.'
        : 'We could not fully confirm this address automatically.',
      standardizedAddress,
      warnings,
      provider: 'osm',
      parsed: {
        ...parsed,
        state: parsed.state || candidateState,
        postalCode: parsed.postalCode || candidatePostalCode,
      },
      details: candidate,
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
      return unconfirmed('The address check timed out, so please review your address carefully.');
    }

    return unconfirmed('Our address checker is temporarily unavailable, so please review your address carefully.');
  } finally {
    clearTimeout(timeoutId);
  }
}