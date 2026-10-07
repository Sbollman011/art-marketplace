import { parseShippingAddress } from './address';

// Everything ships from Seattle, WA (98xxx). The zones below are rough ground
// bands measured out from that origin, which is what actually drives cost for
// lightweight-but-bulky items like stretched canvases.
const ZONE_BY_STATE = {
  WA: 'zone1',
  OR: 'zone2', ID: 'zone2',
  CA: 'zone3', NV: 'zone3', UT: 'zone3', MT: 'zone3', AZ: 'zone3', WY: 'zone3',
  CO: 'zone4', NM: 'zone4', ND: 'zone4', SD: 'zone4', NE: 'zone4', KS: 'zone4',
  MN: 'zone4', IA: 'zone4', MO: 'zone4', TX: 'zone4', OK: 'zone4', AR: 'zone4',
  LA: 'zone4', WI: 'zone4', IL: 'zone4',
  AK: 'remote', HI: 'remote', PR: 'remote', VI: 'remote', GU: 'remote', AS: 'remote', MP: 'remote',
};

// Paintings and drawings are light but awkward to box, so the longest side of
// the finished piece predicts carrier cost far better than weight does.
// A packed 8x12 canvas lands in "small" with room for corner protection.
const DEFAULT_LONGEST_SIDE_INCHES = 12;

const TIERS = [
  { id: 'small', maxLongestSide: 14 },
  { id: 'medium', maxLongestSide: 20 },
  { id: 'large', maxLongestSide: 30 },
  { id: 'xl', maxLongestSide: 42 },
  { id: 'oversize', maxLongestSide: Infinity },
];

// Rates include packing materials for that size of piece.
// BOXED covers stretched canvas and cradled panels, which need a real box plus
// corner protection. FLAT covers works on paper, which travel in a rigid mailer
// for noticeably less.
const BOXED_RATE_TABLE = {
  small: { zone1: 850, zone2: 1050, zone3: 1250, zone4: 1450, zone5: 1600, remote: 2400 },
  medium: { zone1: 1200, zone2: 1450, zone3: 1700, zone4: 1950, zone5: 2200, remote: 3400 },
  large: { zone1: 1700, zone2: 2050, zone3: 2400, zone4: 2750, zone5: 3050, remote: 4800 },
  xl: { zone1: 2400, zone2: 2900, zone3: 3400, zone4: 3900, zone5: 4300, remote: 6800 },
  oversize: { zone1: 3400, zone2: 4100, zone3: 4800, zone4: 5600, zone5: 6200, remote: 9800 },
};

const FLAT_RATE_TABLE = {
  small: { zone1: 650, zone2: 750, zone3: 850, zone4: 950, zone5: 1050, remote: 1600 },
  medium: { zone1: 900, zone2: 1050, zone3: 1200, zone4: 1350, zone5: 1500, remote: 2200 },
  large: { zone1: 1300, zone2: 1500, zone3: 1700, zone4: 1900, zone5: 2100, remote: 3200 },
  xl: { zone1: 1800, zone2: 2100, zone3: 2400, zone4: 2700, zone5: 3000, remote: 4500 },
  oversize: { zone1: 2600, zone2: 3000, zone3: 3400, zone4: 3800, zone5: 4200, remote: 6200 },
};

// Anything this thin travels in a flat rigid mailer rather than a box.
const FLAT_MAX_DEPTH_INCHES = 0.5;

// Extra pieces ride along with the first box, so they cost materials and weight
// rather than a second full shipment.
const ADDITIONAL_ITEM_RATE = 0.4;

const DEFAULT_ZONE = 'zone4';

function getItemQuantity(item) {
  const quantity = Number.parseInt(item?.quantity, 10);

  if (Number.isInteger(quantity) && quantity > 0) {
    return quantity;
  }

  return 1;
}

function getLongestSide(item) {
  const width = Number.parseFloat(item?.width_in ?? item?.widthIn);
  const height = Number.parseFloat(item?.height_in ?? item?.heightIn);
  const sides = [width, height].filter((side) => Number.isFinite(side) && side > 0);

  if (sides.length === 0) {
    return DEFAULT_LONGEST_SIDE_INCHES;
  }

  // Add an inch of padding for packing material around the piece.
  return Math.max(...sides) + 1;
}

function getTierId(item) {
  const longestSide = getLongestSide(item);
  return TIERS.find((tier) => longestSide <= tier.maxLongestSide).id;
}

// Unknown depth falls back to boxed. That is the more expensive assumption, so a
// missing measurement never quietly undercharges the studio.
function getRateTable(item) {
  const depth = Number.parseFloat(item?.depth_in ?? item?.depthIn);

  if (Number.isFinite(depth) && depth > 0 && depth <= FLAT_MAX_DEPTH_INCHES) {
    return FLAT_RATE_TABLE;
  }

  return BOXED_RATE_TABLE;
}

export function getShippingZone(destination) {
  if (!destination || destination.country === 'INTL') {
    return null;
  }

  if (destination.state && ZONE_BY_STATE[destination.state]) {
    return ZONE_BY_STATE[destination.state];
  }

  if (destination.state) {
    return 'zone5';
  }

  if (destination.postalCode) {
    const prefix = Number.parseInt(destination.postalCode.slice(0, 3), 10);

    if (Number.isFinite(prefix)) {
      if (prefix >= 980 && prefix <= 994) return 'zone1';
      if (prefix >= 970 && prefix <= 979) return 'zone2';
      if (prefix >= 900 && prefix <= 961) return 'zone3';
      if (prefix >= 995 && prefix <= 999) return 'remote';
      if (prefix >= 967 && prefix <= 968) return 'remote';
    }
  }

  return null;
}

/**
 * Estimates ground shipping from Seattle for a set of artworks.
 * Falls back to a mid-country zone when the destination cannot be read yet, so
 * the shopper always sees a realistic number instead of $0.
 */
export function calculateShippingCost(items = [], destination = null) {
  const zone = getShippingZone(destination) || DEFAULT_ZONE;

  const unitRates = [];

  for (const item of items) {
    const rate = getRateTable(item)[getTierId(item)][zone];
    const quantity = getItemQuantity(item);

    for (let index = 0; index < quantity; index += 1) {
      unitRates.push(rate);
    }
  }

  if (unitRates.length === 0) {
    return 0;
  }

  // The largest piece sets the shipment; everything else is an add-on.
  unitRates.sort((left, right) => right - left);

  return unitRates.reduce(
    (sum, rate, index) => sum + (index === 0 ? rate : Math.round(rate * ADDITIONAL_ITEM_RATE)),
    0
  );
}