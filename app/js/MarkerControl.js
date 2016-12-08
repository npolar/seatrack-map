import {select} from 'd3-selection';
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

        dialog.querySelector('#seatrack-switch').addEventListener('change', this.toggleFormat.bind(this));

        dialog.querySelector('.close').addEventListener('click', () => dialog.close());
        dialog.querySelector('.ok').addEventListener('click', this.addMarker.bind(this));
    },

    // Toggle between degrees and decimals
    toggleFormat(evt) {
        const dialog = select(this._dialog);

        if (this._format !== 'decimals') { // Switch to decimals
            const latlng = this.getDegrees();
            const lat = latlng[0];
            const lng = latlng[1];

            if (this.isValid(lng)) {
                this.update('.seatrack-lng', this.deg2dec(lng));
            } else {
                this.update('.seatrack-lng', '');
            }

            if (this.isValid(lat)) {
                this.update('.seatrack-lat', this.deg2dec(lat));
            } else {
                this.update('.seatrack-lat', '');
            }

            dialog.select('.seatrack-decimals').style('display', 'block');
            dialog.selectAll('.seatrack-degrees').style('display', 'none');
            this._format = 'decimals'

        } else { // Switch to degrees/minutes/seconds
            const latlng = this.getDecimals();
            const lat = latlng[0];
            const lng = latlng[1];

            if (!isNaN(lat)) {
                const latDeg = this.dec2deg(lat)
                this.update('.seatrack-lat-deg', latDeg.deg);
                this.update('.seatrack-lat-min', latDeg.min);
                this.update('.seatrack-lat-sec', latDeg.sec);
            } else {
                this.update('.seatrack-lat-deg', '');
                this.update('.seatrack-lat-min', '');
                this.update('.seatrack-lat-sec', '');
            }

            if (!isNaN(lng)) {
                const lngDeg = this.dec2deg(lng)
                this.update('.seatrack-lng-deg', lngDeg.deg);
                this.update('.seatrack-lng-min', lngDeg.min);
                this.update('.seatrack-lng-sec', lngDeg.sec);
            } else {
                this.update('.seatrack-lng-deg', '');
                this.update('.seatrack-lng-min', '');
                this.update('.seatrack-lng-sec', '');
            }

            dialog.select('.seatrack-decimals').style('display', 'none');
            dialog.selectAll('.seatrack-degrees').style('display', 'block');
            this._format = 'degrees';
        }
    },

    addMarker() {
        const dialog = this._dialog;
        let latlng;

        if (this._format !== 'decimals') {
            latlng = this.getDegrees();
            if (this.isValid(latlng[0]) && this.isValid(latlng[1])) {
                latlng[0] = this.deg2dec(latlng[0]);
                latlng[1] = this.deg2dec(latlng[1]);
            } else {
                return;
            }
        } else {
            latlng = this.getDecimals();
            if (isNaN(latlng[0]) && isNaN(latlng[1])) {
                return;
            }
        }

        dialog.close();

        // Only allow one marker
        if (this._marker) {
            this._map.removeLayer(this._marker);
        }

        this._marker = L.marker(latlng).addTo(this._map);

        // window.history.pushState({}, null, `?longitude=${longitude}&latitude=${latitude}`);
    },

    getDegrees() {
        const dialog = this._dialog;
        return [{
            deg: parseInt(dialog.querySelector('#lat-deg').value),
            min: parseInt(dialog.querySelector('#lat-min').value),
            sec: parseFloat(dialog.querySelector('#lat-sec').value)
        }, {
            deg: parseInt(dialog.querySelector('#lng-deg').value),
            min: parseInt(dialog.querySelector('#lng-min').value),
            sec: parseFloat(dialog.querySelector('#lng-sec').value)
        }];
    },

    getDecimals() {
        const dialog = this._dialog;
        return [
            parseFloat(dialog.querySelector('#latitude').value),
            parseFloat(dialog.querySelector('#longitude').value)
        ];
    },

    deg2dec(dms) {
        return parseFloat((dms.deg + (dms.min / 60.0) + (dms.sec / 3600)).toFixed(5));
    },

    dec2deg(dd) {
        const deg = dd | 0; // truncate dd to get degrees
        const frac = Math.abs(dd - deg); // get fractional part
        const min = (frac * 60) | 0; // multiply fraction by 60 and truncate
        const sec = (frac * 3600 - min * 60).toFixed(1);

        return {
            deg: deg,
            min: min,
            sec: parseFloat(sec)
        }
    },

    isValid(dms) {
        return (!isNaN(dms.deg) && !isNaN(dms.min) && !isNaN(dms.sec))
    },

    update(selector, value) {
        select(this._dialog).select(selector).node().MaterialTextfield.change(value);
    }

});

export default function markerControl(options) {
    return new MarkerControl(options);
}