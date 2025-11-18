import { Loader } from '@googlemaps/js-api-loader';

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

if (!apiKey) {
    throw new Error('VITE_GOOGLE_MAPS_API_KEY is not defined. Please check your .env file.');
}

export const loader = new Loader({
    apiKey,
    version: "weekly",
    libraries: ["places", "marker"] as const
});

export async function loadGoogleMaps() {
    return loader.load();
}
