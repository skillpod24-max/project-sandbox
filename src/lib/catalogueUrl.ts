/**
 * Generate a catalogue slug from dealer name.
 * e.g. "Boom Cars" → "boomcars"
 */
export function getCatalogueSlug(dealerName: string | null | undefined): string {
  if (!dealerName) return '';
  return dealerName.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 30);
}

/**
 * Generate the dealer catalogue URL path.
 */
export function getCatalogueUrl(dealerName: string | null | undefined): string {
  const slug = getCatalogueSlug(dealerName);
  return slug ? `/catalogue/${slug}` : '';
}

/**
 * Generate a vehicle catalogue URL path using 6-digit vehicle code.
 */
export function getVehicleCatalogueUrl(
  dealerName: string | null | undefined,
  vehicleCode: string | null | undefined,
  vehicleId: string
): string {
  const slug = getCatalogueSlug(dealerName);
  if (!slug) return '';
  const vCode = vehicleCode?.slice(-6) || vehicleId.slice(0, 6);
  return `/catalogue/${slug}/${vCode}`;
}
