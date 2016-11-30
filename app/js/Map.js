import scale from './Scale';
// import proj4 from 'proj4';
// import 'proj4leaflet';

L.Icon.Default.imagePath = '//unpkg.com/leaflet@1.0.2/dist/images'; // TODO

const crs = new L.Proj.CRS('ESRI:53032', '+proj=aeqd +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +a=6371000 +b=6371000 +units=m no_defs', {
    origin: [-20037508.34, 20037508.34],
    resolutions: [
        156543.03390625,
         78271.5169531,
         39135.7584766,
         19567.8792383,
          9783.93961914,
          4891.96980957,
          2445.98490479,
          1222.99245239,
           611.496226196,
           305.748113098,
           152.874056549
    ]
});

export const Map = L.Map.extend({

    options: {
        crs: crs,
        id: 'seatrack-map',
        // center: [56, 4],
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

        this.addMarker(); // Only for testing
        // L.geoJson(countries).addTo(this);
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

    // Add test marker
    addMarker() {
        // L.marker([64.147194, -21.940167]).addTo(this);
        L.marker([59.911111, 10.733333]).addTo(this);
    }

});

export default function map(options) {
    return new Map(options);
}
