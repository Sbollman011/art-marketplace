import { normalizePostalCode, normalizeStateCode, parseShippingAddress } from './address';

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

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