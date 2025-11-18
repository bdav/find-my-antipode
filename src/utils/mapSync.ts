import { computeViewportAntipode } from './antipode';
import { validateBounds } from './validation';

/**
 * Updates one map to display the antipodal viewport of another map.
 *
 * This function synchronizes two maps by:
 * 1. Getting the current viewport bounds from the source map
 * 2. Computing the antipodal viewport
 * 3. Applying those bounds to the target map
 *
 * The padding parameter (0) prevents infinite recursion by ensuring
 * fitBounds doesn't trigger additional drag/zoom events.
 *
 * @param currentMap - The map to read the viewport from
 * @param otherMap - The map to update with the antipodal viewport
 */
export function updateOtherMap(
    currentMap: google.maps.Map,
    otherMap: google.maps.Map,
): void {
    const bounds = currentMap.getBounds();
    validateBounds(bounds);
    const viewportAntipode = computeViewportAntipode(bounds);

    // Use 0 padding to prevent triggering additional bounds_changed events
    // which would cause infinite recursion between the two maps
    otherMap.fitBounds(viewportAntipode, 0);
}
