export const LayerControl = L.Control.Layers.extend({

    options: {
        position: 'topright'
    },

    _initLayout() {
        L.Control.Layers.prototype._initLayout.call(this);
        L.DomUtil.create('span', 'material-icons', this._layersLink).innerText = 'layers';
    }

});

export default function layerControl(options) {
    return new LayerControl(options);
}