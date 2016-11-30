import kernel from './Kernel';
import {select} from 'd3-selection';

require('script!../lib/jquery-ui.min');

export const Selection = L.Class.extend({

    options: {
        kernelColors: ['#ff7f00', '#1f78b4', '#33a02c', '#b15928', '#e31a1c', '#6a3d9a']
    },

    initialize(map) {
        this._map = map;
        this._kernelLayers = [];

        this.createAccordion();

        $(window).resize(function() {
            $('#seatrack-accordion').accordion('refresh');
        });

        select('#seatrack-add-button')
            .on('click', () => {
                this._kernelLayers.push(this.addKernelLayer());
            });

        this._kernelLayers.push(this.addKernelLayer({
            state: {
                species: this.getURLParameter('species'),
                season: this.getURLParameter('season'),
                period: this.getURLParameter('period'),
                colony: this.getURLParameter('colony')
            }
        }));

        map.addMarker(this.getURLParameter('latitude'), this.getURLParameter('longitude'));
    },

    createAccordion() {
        const self = this;

        $('#seatrack-accordion').accordion({
            heightStyle: 'fill',
            collapsible: false,
            activate() {
                const active = $('#seatrack-accordion').accordion('option', 'active');
                const count = self._kernelLayers.length - 1;

                select('#seatrack-add-button').style('bottom', 10 + ((count - active) * 41) + 'px')
            }
        });
    },

    addKernelLayer(options) {
        const layers = this._kernelLayers;
        const colors = this.options.kernelColors.filter(color => !this.colorInUse(color));

        options = options || {};
        options.color = colors[0];
        options.map = this._map;

        const kernelLayer = kernel(select('#seatrack-accordion'), options).addTo(this._map);

        $('#seatrack-accordion')
            .accordion('refresh')
            .accordion('option', 'active', -1);

        select('#seatrack-add-button').style('display', 'none');

        kernelLayer.on('add', () => {
            select('#seatrack-add-button').style('display', 'block');

            if (layers.length === 1) {
                this._map.setColoniesOpacity(0.1); // Make colonies transparent
            }

            if (layers.length >= 6) {
                select('#seatrack-add-button').style('display', 'none');
            }
        });

        kernelLayer.on('remove', () => {
            $('#seatrack-accordion').accordion('destroy');
            this.createAccordion();

            // Remove from layers array
            layers.forEach((layer, index) => {
                if (layer === kernelLayer) {
                    this._kernelLayers.splice(index, 1);
                }
            });

            if (layers.length < 3) { // Enable add button
                select('#seatrack-add-button').style('display', 'block');
            }

            if (layers.length === 0) {
                layers.push(this.addKernelLayer());
                this._map.setColoniesOpacity(1);
                select('#seatrack-add-button').style('display', 'none');
            } else {
                $('#seatrack-accordion').accordion('option', 'active', -1);
            }

        });

        return kernelLayer;
    },

    // Check if color is in use
    colorInUse(color) {
        let inUse = false;

        this._kernelLayers.forEach(layer => {
            if (color === layer.options.color) {
                inUse = true;
            }
        });

        return inUse;
    },

    getURLParameter(name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
    }

});


export default function selection(map) {
    return new Selection(map);
}

