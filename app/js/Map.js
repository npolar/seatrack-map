import scale from './Scale';

export const Map = L.Map.extend({

    options: {
        id: 'seatrack-map',
        center: [56, 4],
        zoom: 4,
        minZoom: 2,
        maxZoom: 10,
        zoomControl: false,
        kernel: {
            sql: "SELECT cartodb_id, ST_Transform(the_geom, 53032) AS the_geom_webmercator FROM {species} WHERE colony = '{colony}' AND season = '{season}' AND period = '{period}' ORDER BY kernel_density DESC",
            cartocss: '#kernel{ polygon-fill: #FF6600; polygon-opacity: 0.4; line-color: #FFF; line-width: 0.5; line-opacity: 1; }'
        },
        colonies: {
            sql: "SELECT cartodb_id, ST_Transform(the_geom, 53032) AS the_geom_webmercator FROM colonies WHERE colony IN ({colonies})",
            cartocss: '#colony{ marker-fill: #333333; marker-allow-overlap: true; }',
            opacity: 1
        }
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

        L.tileLayer('http://geodata.npolar.no/arcgis/rest/services/Basisdata_Intern/NP_Verden_WMTS_53032/MapServer/tile/{z}/{y}/{x}').addTo(this);

        this.createLayer('https://seatrack.carto.com/api/v2/viz/c322bb3e-a128-11e6-8570-0e233c30368f/viz.json', layer => this._colonies = layer).addTo(this);

        // this.createLayer('https://seatrack.carto.com/api/v2/viz/95d69428-b5a7-11e6-9c97-0e233c30368f/viz.json', layer => layersControl.addOverlay(layer, 'Graticule'));
    },

    setColoniesOpacity(opacity) {
        if (this._colonies) {
            this._colonies.setOpacity(opacity);
        } else {
            setTimeout(() => this.setColoniesOpacity(opacity), 500);
        }
    },

    createLayer(url, callback) {
        return cartodb.createLayer(this, url)
            .on('done', layer => callback(layer))
            .on('error', err => console.error(err));
    }

});

export default function map(options) {
    return new Map(options);
}