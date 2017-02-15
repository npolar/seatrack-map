export const ScaleControl = L.Control.Scale.extend({
    options: {
        imperial: false,
        updateWhenIdle: true
    },

    _update() {
        const maxResolution = 15654303; // cm per pixel
        const maxMeters = maxResolution / Math.pow(2, this._map.getZoom());

        this._updateScales(this.options, maxMeters);
    }
});

export default function scaleControl(options) {
    return new ScaleControl(options);
}