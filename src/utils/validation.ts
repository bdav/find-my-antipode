/**
 * Type guard that asserts a value is a valid Google Maps LatLngBounds object.
 *
 * This is a TypeScript assertion function that narrows the type from
 * `LatLngBounds | undefined` to `LatLngBounds`, throwing an error if invalid.
 *
 * @param bounds - The bounds value to validate
 * @throws {Error} If bounds is undefined or null
 */
export function validateBounds(
    bounds: google.maps.LatLngBounds | undefined,
): asserts bounds is google.maps.LatLngBounds {
    if (!bounds) {
        throw new Error('Map bounds are undefined. Ensure the map is fully initialized before accessing bounds.');
    }
}

/**
 * Type guard that asserts a value is a valid Google Maps LatLng object.
 *
 * This is a TypeScript assertion function that narrows the type from
 * `LatLng | undefined` to `LatLng`, throwing an error if invalid.
 *
 * @param latLng - The LatLng position to validate
 * @throws {Error} If latLng is undefined or null
 */
export function validateLatLng(
    latLng: google.maps.LatLng | undefined,
): asserts latLng is google.maps.LatLng {
    if (!latLng) {
        throw new Error('LatLng position is undefined. Invalid location data provided.');
    }
}
