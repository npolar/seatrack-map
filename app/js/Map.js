import scale from './Scale';
import 'script!proj4';
import 'script!proj4leaflet';

// https://epsg.io/53032
// Same origin and resolutions as Web Mercator
const crs = new L.Proj.CRS('ESRI:53032', '+proj=aeqd +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +a=6371000 +b=6371000 +units=m no_defs', {
    origin: [-20037508.34, 20037508.34],
    resolutions: [156543.03, 78271.52, 39135.76, 19567.88, 9783.94, 4891.97, 2445.98, 1222.99, 611.50, 305.75, 152.87, 76.44, 38.22]
});

// Need to specify from projection as a sphere to get the calculations right
// https://osgeo-org.atlassian.net/browse/GEOS-7778#comment-60141
proj4.defs('EPSG:4035', '+proj=longlat +a=6371000 +b=6371000 +no_defs');
crs.projection._proj = proj4('EPSG:4035', 'ESRI:53032');

export const Map = L.Map.extend({

    options: {
        crs: crs,
        id: 'seatrack-map',
        center: [67, 4],
        zoom: 4,
        minZoom: 2,
        maxZoom: 10,
        zoomControl: false
    },

    initialize(options) {
        options = L.setOptions(this, options);
        L.Map.prototype.initialize.call(this, options.id, options);

        this.attributionControl.setPrefix('SEATRACK');

        L.control.zoom({
            position: 'topright'
        }).addTo(this);

        scale().addTo(this);

        this._layersControl = L.control.layers(null, null, { position: 'topright' }).addTo(this);

        // Basemap
        L.tileLayer('//geodata.npolar.no/arcgis/rest/services/Basisdata_Intern/NP_Verden_WMTS_53032/MapServer/tile/{z}/{y}/{x}').addTo(this);

        // Colonies
        this.createLayer('//seatrack.carto.com/api/v2/viz/c322bb3e-a128-11e6-8570-0e233c30368f/viz.json', layer => this._colonies = layer).addTo(this);

        this.addCountryOutline();
        this.addGraticule();
    },

    setColoniesOpacity(opacity) {
        if (this._colonies) {
            this._colonies.setOpacity(opacity);
        } else {
            setTimeout(() => this.setColoniesOpacity(opacity), 500);
        }
    },

    createLayer(url, callback) {
        return cartodb.createLayer(this, url, { https: true })
            .on('done', layer => callback(layer))
            .on('error', err => console.error(err));
    },

    // Country outlines
    addCountryOutline() {
        this.createLayer('//seatrack.carto.com/api/v2/viz/51c69b26-8432-11e6-8a3a-0e3ff518bd15/viz.json', layer => {
            this._countryOutline = layer;
            layer.setZIndex(900);
            layer.addTo(this);
            this._layersControl.addOverlay(layer, 'Country outline');
        });
    },

    // Gratiules
    addGraticule() {
        this.createLayer('//seatrack.carto.com/api/v2/viz/95d69428-b5a7-11e6-9c97-0e233c30368f/viz.json', layer => {
            this._graticule = layer;
            layer.setZIndex(910);
            this._layersControl.addOverlay(layer, 'Graticule');
        });
    },

    // Add marker
    addMarker(latitude, longitude) {
        if (latitude && longitude) {
            L.marker([latitude, longitude]).addTo(this);
        }
    }

});

export default function map(options) {
    return new Map(options);
}
