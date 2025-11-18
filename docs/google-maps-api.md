# Google Maps JavaScript API Reference

## Map Events (v3)

Understanding which events are triggered by different map operations is crucial for implementing synchronized map behavior.

### Event List

- `bounds_changed` - Triggered by `fitBounds()`
- `center_changed`
- `click`
- `contextmenu`
- `dblclick`
- `drag` - **NOT** triggered by `fitBounds()`
- `dragend`
- `dragstart`
- `heading_changed`
- `idle`
- `maptypeid_changed`
- `mousemove`
- `mouseout`
- `mouseover`
- `projection_changed`
- `resize`
- `rightclick`
- `tilesloaded`
- `tilt_changed`
- `zoom_changed` - Triggered by `fitBounds()`

### Key Insights for Map Synchronization

When using `fitBounds()` to synchronize two maps:
- **Triggers**: `bounds_changed` and `zoom_changed` events
- **Does NOT trigger**: `drag` event

This behavior is important for preventing infinite recursion when synchronizing maps bidirectionally. By listening to `drag` and `zoom_changed` events (rather than `bounds_changed`), we can update the opposite map using `fitBounds()` without creating an event loop.

### Recursion Prevention

To prevent infinite event loops when syncing two maps:
1. Listen for `drag` and `zoom_changed` events on each map
2. Update the other map using `fitBounds(viewport, 0)` where `0` padding prevents additional `bounds_changed` events
3. The `fitBounds()` call will trigger `bounds_changed` and `zoom_changed` on the target map, but NOT `drag`
4. Since we only listen to `drag` and `zoom_changed`, and `fitBounds()` doesn't trigger `drag`, we avoid infinite recursion
