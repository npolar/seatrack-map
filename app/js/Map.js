import scale from './Scale';

export const Map = L.Map.extend({

    options: {
        id: 'seatrack-map',
        center: [56, 4],
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
            position:'topright'
        }).addTo(this);

        scale().addTo(this);

        // const layersControl = L.control.layers(null, null, { position: 'topleft' }).addTo(this);

        // Basemap
        L.tileLayer('//geodata.npolar.no/arcgis/rest/services/Basisdata_Intern/NP_Verden_WMTS_53032/MapServer/tile/{z}/{y}/{x}').addTo(this);

        // Colonies
        this.createLayer('//seatrack.carto.com/api/v2/viz/c322bb3e-a128-11e6-8570-0e233c30368f/viz.json', layer => this._colonies = layer).addTo(this);

        // Land outline
        // this.createLayer('//seatrack.carto.com/api/v2/viz/51c69b26-8432-11e6-8a3a-0e3ff518bd15/viz.json', layer => layersControl.addOverlay(layer, 'Country outlines'));

        // Graticule
        // this.createLayer('//seatrack.carto.com/api/v2/viz/95d69428-b5a7-11e6-9c97-0e233c30368f/viz.json', layer => layersControl.addOverlay(layer, 'Graticule'));
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
    }

});

export default function map(options) {
    return new Map(options);
}