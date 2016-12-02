import dialogPolyfill from 'dialog-polyfill';
import 'dialog-polyfill/dialog-polyfill.css';

export const MarkerControl = L.Control.extend({

    options: {
        position: 'topleft'
    },

    onAdd(map) {
        this._map = map;
        this._initLayout();

        return this._container;
    },

    _initLayout() {
        const container = this._container = L.DomUtil.create('div', 'leaflet-control-marker');

        L.DomEvent.disableClickPropagation(container);
        if (!L.Browser.touch) {
            L.DomEvent.disableScrollPropagation(container);
        }

        container.title = 'Add marker to map';
        L.DomUtil.create('span', 'material-icons', container).innerText = 'add_location';

        L.DomEvent.on(container, 'click', this._onClick, this);

        this._dialog = document.querySelector('dialog');

        // Add polyfill if needed
        if (!this._dialog.showModal) {
            dialogPolyfill.registerDialog(this._dialog);
        }

        this._dialog.querySelector('.close').addEventListener('click', () => this._dialog.close());
    },

    _onClick() {
        this._dialog.showModal();
    }
});

export default function markerControl(options) {
    return new MarkerControl(options);
}