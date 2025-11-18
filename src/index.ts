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

    // Create a map centered at the specified coordinates
    const map1El = document.getElementById('map1');
    const map2El = document.getElementById('map2');
    const input = document.getElementById('pac-input');

    if (!map1El || !map2El) {
        throw new Error('Map elements not found.');
    }

    if (!input || !(input instanceof HTMLInputElement)) {
        throw new Error('Input element not found.');
    }

    const map1 = new google.maps.Map(map1El, {
        zoom: DEFAULT_ZOOM,
        center: coordinates1,
        mapId: 'map1'
    });
    // Create initial marker at starting location
    let marker1 = new google.maps.marker.AdvancedMarkerElement({
        map: map1,
        position: coordinates1
    });
    const map2 = new google.maps.Map(map2El, {
        zoom: DEFAULT_ZOOM,
        center: coordinates2,
        mapId: 'map2'
    });
    // Create initial marker at antipode location
    let marker2 = new google.maps.marker.AdvancedMarkerElement({
        map: map2,
        position: coordinates2
    });

    const searchBox = new google.maps.places.SearchBox(input);

    map1.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    // --------------------------------------------------
    // Event listeners
    // --------------------------------------------------
    map1.addListener('drag', () => updateOtherMap(map1, map2));
    map2.addListener('drag', () => updateOtherMap(map2, map1));
    map1.addListener('zoom_changed', () => updateOtherMap(map1, map2));
    map2.addListener('zoom_changed', () => updateOtherMap(map2, map1));

    // Listen for the event fired when the user selects a prediction and retrieve more details for that place
    searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
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

        // Create markers at the location and its antipode
        const position = place.geometry.location;
        validateLatLng(position);
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
            // Only geocodes have viewport
            map1.fitBounds(place.geometry.viewport);
            map2.fitBounds(computeViewportAntipode(place.geometry.viewport));
        } else if (place.geometry.location) {
            // For places without viewport, center on the location
            map1.setCenter(place.geometry.location);
            map2.setCenter(computeAntipode(place.geometry.location));
        }
    });
}
