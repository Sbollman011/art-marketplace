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
      status: 'invalid',
      message: 'USPS could not find this address. Please check the street, city, state, and ZIP.',
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
      status: 'invalid',
      message: 'USPS could not find this address. Please check the street, city, state, and ZIP.',
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
      status: 'invalid',
      message: 'USPS does not recognize this as a deliverable address.',
      parsed,
      provider: 'usps',
    };
  }

  if (dpv === 'D' || dpv === 'S') {
    return {
      verified: false,
      status: 'invalid',
      message: 'This building is valid but the apartment or suite number is missing or incorrect.',
      parsed,
      provider: 'usps',
    };
  }

  const standardizedAddress = formatUspsAddress(address);
  const warnings = [];

  if (info.DPVVacant === 'Y' || info.vacant === 'Y') {
    warnings.push('USPS lists this address as vacant.');
  }

  if (info.DPVCMRA === 'Y') {
    warnings.push('This is a commercial mail receiving agency, not a residence.');
  }

  return {
    verified: true,
    status: 'verified',
    message: standardizedAddress ? `Verified address: ${standardizedAddress}` : 'Verified address.',
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

  if (!address) {
    return {
      verified: false,
      status: 'invalid',
      message: 'Shipping address is required.',
      parsed,
    };
  }

  if (parsed.country === 'INTL') {
    return {
      verified: false,
      status: 'invalid',
      message: 'We currently ship within the United States only.',
      parsed,
    };
  }

  if (!parsed.postalCode) {
    return {
      verified: false,
      status: 'invalid',
      message: 'Please include a ZIP code so we can verify the address.',
      parsed,
    };
  }

  // USPS is authoritative when credentials exist. A USPS outage should never
  // block a sale, so fall through to the map lookup instead of failing.
  if (uspsConfigured()) {
    const fields = splitShippingAddress(address);

    if (fields.street) {
      try {
        return await verifyWithUsps(fields, parsed);
      } catch (uspsError) {
        console.error('USPS address verification unavailable, falling back:', uspsError.message);
      }
    }
  }

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
      return {
        verified: false,
        status: 'error',
        message: 'Address verification is temporarily unavailable. Please try again.',
        parsed,
      };
    }

    const results = await response.json();
    const candidate = Array.isArray(results) ? results[0] : null;

    if (!candidate?.address) {
      return {
        verified: false,
        status: 'invalid',
        message: 'We could not verify this address. Please check the street, city, state, and ZIP.',
        parsed,
      };
    }

    const candidateAddress = candidate.address;
    const candidateCountry = String(candidateAddress.country_code || '').toUpperCase();
    const candidatePostalCode = normalizePostalCode(candidateAddress.postcode);
    const candidateState = normalizeStateCode(candidateAddress.state_code || candidateAddress.state);

    if (candidateCountry && candidateCountry !== 'US') {
      return {
        verified: false,
        status: 'invalid',
        message: 'We currently ship within the United States only.',
        parsed,
      };
    }

    if (parsed.postalCode && candidatePostalCode && parsed.postalCode !== candidatePostalCode) {
      return {
        verified: false,
        status: 'invalid',
        message: 'The ZIP code does not match the address we found. Please double-check it.',
        parsed,
      };
    }

    if (parsed.state && candidateState && parsed.state !== candidateState) {
      return {
        verified: false,
        status: 'invalid',
        message: 'The state does not match the address we found. Please double-check it.',
        parsed,
      };
    }

    if (!candidateAddress.house_number && !candidateAddress.road) {
      return {
        verified: false,
        status: 'invalid',
        message: 'Please include a street number and street name so we can verify the delivery address.',
        parsed,
      };
    }

    const standardizedAddress = buildStandardizedAddress(candidateAddress, parsed);

    return {
      verified: true,
      status: 'verified',
      message: standardizedAddress ? `Verified address: ${standardizedAddress}` : 'Verified address.',
      standardizedAddress,
      warnings: [],
      provider: 'osm',
      parsed: {
        ...parsed,
        state: candidateState || parsed.state,
        postalCode: candidatePostalCode || parsed.postalCode,
      },
      details: candidate,
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
      return {
        verified: false,
        status: 'error',
        message: 'Address verification timed out. Please try again.',
        parsed,
      };
    }

    return {
      verified: false,
      status: 'error',
      message: 'Address verification is temporarily unavailable. Please try again.',
      parsed,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}