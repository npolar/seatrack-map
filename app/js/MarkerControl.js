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
        const dialog = this._dialog = document.querySelector('dialog');

        L.DomEvent.disableClickPropagation(container);
        if (!L.Browser.touch) {
            L.DomEvent.disableScrollPropagation(container);
        }

        container.title = 'Add marker to map';
        L.DomUtil.create('span', 'material-icons', container).innerText = 'add_location';

        L.DomEvent.on(container, 'click', () => dialog.showModal());

        // Add polyfill if needed
        if (!dialog.showModal) {
            dialogPolyfill.registerDialog(dialog);
        }

        dialog.querySelector('.close').addEventListener('click', () => dialog.close());
        dialog.querySelector('.ok').addEventListener('click', this.addMarker.bind(this));
    },

    addMarker() {
        const dialog = this._dialog;
        const longitude = dialog.querySelector('#longitude').value;
        const latitude = dialog.querySelector('#latitude').value;

        dialog.close();

        // Only allow one marker
        if (this._marker) {
            this._map.removeLayer(this._marker);
        }

        this._marker = L.marker([latitude, longitude]).addTo(this._map);



        // window.history.pushState({}, null, `?longitude=${longitude}&latitude=${latitude}`);

    }
});

export default function markerControl(options) {
    return new MarkerControl(options);
}