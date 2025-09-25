// Coin locked period constant (currently set to 3 months in milliseconds, assuming 30 days per month)
const COIN_LOCKED_PERIOD_MS = 3 * 30 * 24 * 60 * 60 * 1000;

// Coin locked percentage (e.g., 50% locked)
const COIN_LOCKED_PERCENTAGE = 50;

// Items per page count for pagination
const ITEMS_PER_PAGE = 10;

// Common referral commission rate (e.g., 5%)
const REFERRAL_COMMISSION_PERCENTAGE = 5;

module.exports = {
  COIN_LOCKED_PERIOD_MS,
  COIN_LOCKED_PERCENTAGE,
  ITEMS_PER_PAGE,
  REFERRAL_COMMISSION_PERCENTAGE,
};
