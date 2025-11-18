import { loadGoogleMaps } from './services/mapsLoader';
import { computeAntipode, computeViewportAntipode } from './utils/antipode';
import { validateLatLng } from './utils/validation';
import { updateOtherMap } from './utils/mapSync';

// Initial view coordinates (Santiago, Chile)
const INITIAL_COORDINATES = { lat: -33.42651995258547, lng: -70.66558906755355 };
const DEFAULT_ZOOM = 12;

loadGoogleMaps().then(() => {
    initMap();
}).catch(e => {
    console.error('Error loading Google Maps API:', e);
});

/**
 * Initializes the dual synchronized map interface.
 *
 * Creates two Google Maps instances that display a location and its antipode.
 * The maps are synchronized so that panning or zooming one map automatically
 * updates the other to show the corresponding antipodal view.
 */
function initMap(): void {
    const coordinates1 = new google.maps.LatLng(INITIAL_COORDINATES);
    const coordinates2 = computeAntipode(coordinates1);

    // Flags to prevent infinite recursion during sync
    let isUpdatingMap1 = false;
    let isUpdatingMap2 = false;

    // Create a map centered at the specified coordinates
    const map1El = document.getElementById('map1');
    const map2El = document.getElementById('map2');
    const input1 = document.getElementById('pac-input-1');
    const input2 = document.getElementById('pac-input-2');

    if (!map1El || !map2El) {
        throw new Error('Map elements not found.');
    }

    if (!input1 || !(input1 instanceof HTMLInputElement)) {
        throw new Error('Input element 1 not found.');
    }

    if (!input2 || !(input2 instanceof HTMLInputElement)) {
        throw new Error('Input element 2 not found.');
    }

    const map1 = new google.maps.Map(map1El, {
        zoom: DEFAULT_ZOOM,
        center: coordinates1,
        mapId: 'map1',
        // Top map: zoom hidden by default, shows in fullscreen
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: true,
        fullscreenControl: true
    });
    // Create initial marker at starting location
    let marker1 = new google.maps.marker.AdvancedMarkerElement({
        map: map1,
        position: coordinates1
    });
    const map2 = new google.maps.Map(map2El, {
        zoom: DEFAULT_ZOOM,
        center: coordinates2,
        mapId: 'map2',
        // Bottom map: map type hidden by default, shows in fullscreen
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        fullscreenControl: true
    });
    // Create initial marker at antipode location
    let marker2 = new google.maps.marker.AdvancedMarkerElement({
        map: map2,
        position: coordinates2
    });

    const searchBox1 = new google.maps.places.SearchBox(input1);
    const searchBox2 = new google.maps.places.SearchBox(input2);

    // Add search box 1 to map1 (always visible)
    map1.controls[google.maps.ControlPosition.TOP_LEFT].push(input1);
    // Search box 2 is added to map2 only when fullscreen (handled in event listener)

    // --------------------------------------------------
    // Event listeners
    // --------------------------------------------------
    // Sync map1 → map2 when user interacts with map1
    const syncMap1ToMap2 = () => {
        if (isUpdatingMap1) return;
        isUpdatingMap2 = true;
        updateOtherMap(map1, map2);
        isUpdatingMap2 = false;
    };

    // Sync map2 → map1 when user interacts with map2
    const syncMap2ToMap1 = () => {
        if (isUpdatingMap2) return;
        isUpdatingMap1 = true;
        updateOtherMap(map2, map1);
        isUpdatingMap1 = false;
    };

    // Listen to drag, center, and zoom changes on both maps
    map1.addListener('drag', syncMap1ToMap2);
    map1.addListener('center_changed', syncMap1ToMap2);
    map1.addListener('zoom_changed', syncMap1ToMap2);

    map2.addListener('drag', syncMap2ToMap1);
    map2.addListener('center_changed', syncMap2ToMap1);
    map2.addListener('zoom_changed', syncMap2ToMap1);

    // Helper function to handle autocomplete dropdown movement
    const moveDropdownToFullscreen = (mapDiv: HTMLElement) => {
        setTimeout(() => {
            const pacContainers = document.querySelectorAll('.pac-container');
            pacContainers.forEach(container => {
                if (container instanceof HTMLElement) {
                    // Append to the map's inner div that has overflow: auto
                    mapDiv.appendChild(container);
                    // Ensure dropdown is visible and positioned correctly
                    container.style.position = 'absolute';
                    container.style.zIndex = '2147483647';
                    container.style.display = 'block';
                }
            });
        }, 100);
    };

    const moveDropdownToBody = (mapDiv: HTMLElement) => {
        setTimeout(() => {
            const pacContainers = document.querySelectorAll('.pac-container');
            pacContainers.forEach(container => {
                if (container instanceof HTMLElement && container.parentElement === mapDiv) {
                    document.body.appendChild(container);
                }
            });
        }, 100);
    };

    // Helper function to handle fullscreen changes and bounds updates
    const createBoundsChangedListener = (
        map: google.maps.Map,
        searchBox: google.maps.places.SearchBox,
        controlToToggle: 'zoomControl' | 'mapTypeControl',
        searchInput?: HTMLInputElement
    ) => {
        return () => {
            const mapDiv = map.getDiv().firstChild as HTMLElement;
            if (mapDiv) {
                const isFullscreen = mapDiv.clientHeight === window.innerHeight &&
                    mapDiv.clientWidth === window.innerWidth;

                // Toggle the specified control based on fullscreen state
                map.setOptions({ [controlToToggle]: isFullscreen });

                // Show/hide search input if provided (for map2)
                if (searchInput) {
                    const currentControls = map.controls[google.maps.ControlPosition.TOP_LEFT];
                    if (isFullscreen) {
                        if (currentControls.getArray().indexOf(searchInput) === -1) {
                            currentControls.push(searchInput);
                        }
                    } else {
                        const index = currentControls.getArray().indexOf(searchInput);
                        if (index !== -1) {
                            currentControls.removeAt(index);
                        }
                    }
                }

                // Move autocomplete dropdown into/out of fullscreen container
                if (isFullscreen) {
                    moveDropdownToFullscreen(mapDiv);
                } else {
                    moveDropdownToBody(mapDiv);
                }
            }

            // Update SearchBox bounds
            const bounds = map.getBounds();
            if (bounds) {
                searchBox.setBounds(bounds);
            }
        };
    };

    // Detect fullscreen changes and update SearchBox bounds for both maps
    map1.addListener('bounds_changed', createBoundsChangedListener(map1, searchBox1, 'zoomControl'));
    map2.addListener('bounds_changed', createBoundsChangedListener(map2, searchBox2, 'mapTypeControl', input2));

    // Sync map type (satellite/map/terrain) bidirectionally
    // Both maps have the control (visible when fullscreen or based on position)
    map1.addListener('maptypeid_changed', () => {
        if (isUpdatingMap1) return;
        const mapTypeId = map1.getMapTypeId();
        if (mapTypeId) {
            isUpdatingMap2 = true;
            map2.setMapTypeId(mapTypeId);
            isUpdatingMap2 = false;
        }
    });

    map2.addListener('maptypeid_changed', () => {
        if (isUpdatingMap2) return;
        const mapTypeId = map2.getMapTypeId();
        if (mapTypeId) {
            isUpdatingMap1 = true;
            map1.setMapTypeId(mapTypeId);
            isUpdatingMap1 = false;
        }
    });

    // Shared handler for place selection from either search box
    const handlePlaceSelection = (places: google.maps.places.PlaceResult[] | null | undefined, isFromMap2: boolean) => {
        if (!places || places.length === 0) {
            return;
        }

        // Clear existing markers
        marker1.map = null;
        marker2.map = null;

        // Use the first place from search results
        const place = places[0];
        if (!place.geometry) {
            console.log('Returned place contains no geometry');
            return;
        }

        const position = place.geometry.location;
        validateLatLng(position);

        if (isFromMap2) {
            // Search from map2 (fullscreen mode), so update map2 first, then map1 shows antipode
            marker2 = new google.maps.marker.AdvancedMarkerElement({
                map: map2,
                title: place.name,
                position
            });
            marker1 = new google.maps.marker.AdvancedMarkerElement({
                map: map1,
                position: computeAntipode(position)
            });

            // Update map bounds to show the selected location
            if (place.geometry.viewport) {
                map2.fitBounds(place.geometry.viewport);
                map1.fitBounds(computeViewportAntipode(place.geometry.viewport));
            } else if (place.geometry.location) {
                map2.setCenter(place.geometry.location);
                map1.setCenter(computeAntipode(place.geometry.location));
            }
        } else {
            // Search from map1 (normal mode), so update map1 first, then map2 shows antipode
            marker1 = new google.maps.marker.AdvancedMarkerElement({
                map: map1,
                title: place.name,
                position
            });
            marker2 = new google.maps.marker.AdvancedMarkerElement({
                map: map2,
                position: computeAntipode(position)
            });

            // Update map bounds to show the selected location
            if (place.geometry.viewport) {
                map1.fitBounds(place.geometry.viewport);
                map2.fitBounds(computeViewportAntipode(place.geometry.viewport));
            } else if (place.geometry.location) {
                map1.setCenter(place.geometry.location);
                map2.setCenter(computeAntipode(place.geometry.location));
            }
        }
    };

    // Listen for place selection from search box 1 (map1)
    searchBox1.addListener('places_changed', () => {
        handlePlaceSelection(searchBox1.getPlaces(), false);
    });

    // Listen for place selection from search box 2 (map2)
    searchBox2.addListener('places_changed', () => {
        handlePlaceSelection(searchBox2.getPlaces(), true);
    });
}
