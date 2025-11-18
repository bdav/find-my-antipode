/**
 * Computes the antipodal point (diametrically opposite point on Earth's surface)
 * for a given latitude/longitude coordinate.
 *
 * The antipode is calculated by:
 * - Inverting the latitude (north becomes south, vice versa)
 * - Adding/subtracting 180° from the longitude to get the opposite side of Earth
 *
 * @param latLng - The point to find the antipode for
 * @returns The antipodal point
 */
export function computeAntipode(latLng: google.maps.LatLng): google.maps.LatLng {
    const latitude = latLng.lat();
    const longitude = latLng.lng();

    // Defensive validation (Google Maps API should already enforce valid ranges)
    if (latitude < -90 || latitude > 90) {
        throw new Error(`Invalid latitude ${latitude}.`);
    }
    if (longitude < -180 || longitude > 180) {
        throw new Error(`Invalid longitude ${longitude}.`);
    }

    // Compute antipode
    // - Latitude: invert the sign
    // - Longitude: add 180° if negative, subtract 180° if positive
    const antipodeLongitude = longitude + (longitude < 0 ? 180 : -180);

    return new google.maps.LatLng(-latitude, antipodeLongitude);
}

/**
 * Computes the antipodal viewport (bounding box) for a given map viewport.
 *
 * When computing the antipode of a rectangular viewport, the corners swap:
 * - The NE corner of the input becomes the SW corner of the antipode
 * - The SW corner of the input becomes the NE corner of the antipode
 *
 * This ensures that the antipode viewport maintains the correct bounds
 * when displayed on the opposite side of Earth.
 *
 * @param viewport - The viewport bounds to find the antipode for
 * @returns The antipodal viewport bounds
 *
 * @example
 * // Input viewport:
 * //   NW (15, -10) + - - - - + NE (15, 10)
 * //                |         |
 * //   SW (5, -10)  + - - - - + SE (5, 10)
 * //
 * // Antipode viewport:
 * //   NW (-5, 170) + - - - - + NE (-5, -170)
 * //                |         |
 * //   SW (-15, 170)+ - - - - + SE (-15, -170)
 */
export function computeViewportAntipode(
    viewport: google.maps.LatLngBounds,
): google.maps.LatLngBounds {
    // Validate input
    if (!viewport) {
        throw new Error('Invalid viewport.');
    }

    const { south, east, west, north } = viewport.toJSON();
    const northWest = new google.maps.LatLng(north, west);
    const southEast = new google.maps.LatLng(south, east);

    // Construct antipode viewport (corners are swapped)
    const antipodeNorthEast = computeAntipode(southEast);
    const antipodeSouthWest = computeAntipode(northWest);

    return new google.maps.LatLngBounds(antipodeSouthWest, antipodeNorthEast);
}
