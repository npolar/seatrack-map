import {select} from 'd3-selection';
import dialogPolyfill from 'dialog-polyfill';
import proj4 from 'proj4';

proj4.defs([
    ['ESRI:53032', '+proj=aeqd +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +a=6371000 +b=6371000 +units=m no_defs'], // Sphere Azimuthal Equidistant
    ['EPSG:4035', '+proj=longlat +a=6371000 +b=6371000 +no_defs']  // Spherical CRS https://osgeo-org.atlassian.net/browse/GEOS-7778#comment-60141
]);

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
        const dialog = this._dialog = document.getElementById('seatrack-marker');

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

        dialog.querySelector('.mdl-tabs__tab-bar').addEventListener('click', this.toggleFormat.bind(this));

        dialog.querySelector('.close').addEventListener('click', () => dialog.close());
        dialog.querySelector('.ok').addEventListener('click', this.addMarker.bind(this));
    },

    // Toggle between degrees and decimals
    toggleFormat(evt) {
        const dialog = select(this._dialog);

        if (evt.target.href.indexOf('decimals') !== -1) { // Switch to decimals
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
        if (this._marker && this._map.hasLayer(this._marker)) {
            this._map.removeLayer(this._marker);
        }

        // Reproject coordinates as we're using Sphere Azimuthal Equidistant projection in Web Mercator space
        // 1. Reproject from spherical (EPSG:4025) to Sphere Azimuthal Equidistant (ESRI:53032) using WGS84 longitude, latitude
        // 2. Reproject from Web Mercator (EPSG:3857) to Spherical (EPSG:4025) using coordinates from above
        // The marker should then show up at the correct location on the map.
        // Why we're using spherical CRS and not EPSG:4326: https://osgeo-org.atlassian.net/browse/GEOS-7778#comment-60141
        latlng = proj4(proj4('EPSG:3857'), proj4('EPSG:4035'), proj4(proj4('EPSG:4035'), proj4('ESRI:53032'), latlng.reverse())).reverse();

        this._marker = L.marker(latlng).addTo(this._map);

        this._marker.bindPopup('<button class="seatrack-marker-remove mdl-button mdl-js-button">Remove marker</button>');

        this._marker.on('popupopen', () => {
            select(this._marker._popup._contentNode).select('.seatrack-marker-remove').on('click', () => this._map.removeLayer(this._marker));
        });
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