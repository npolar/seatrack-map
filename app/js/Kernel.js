import {select} from 'd3-selection';
import {nest} from 'd3-collection';
import getmdlSelect from './getmdlSelect';
const componentHandler = require('../../node_modules/material-design-lite/material');

export const Kernel = L.Class.extend({

    includes: L.Mixin.Events,

    options: {
        color: '#FF6600',
        species: [
            { id: 'fratercula_arctica',        name: 'Atlantic puffin' },
            { id: 'rissa_tridactyla',          name: 'Black-legged kittiwake' },
            { id: 'uria_lomvia',               name: "Brünnich's guillemot" },
            { id: 'somateria_mollissima',      name: 'Common eider' },
            { id: 'uria_aalge',                name: 'Common guillemot' },
            { id: 'phalacrocorax_aristotelis', name: 'European shag' },
            { id: 'larus_hyperboreus',         name: 'Glaucous gull' },
            { id: 'larus_argentatus',          name: 'Herring gull' },
            { id: 'larus_fuscus',              name: 'Lesser black-backed gull' },
            { id: 'alle_alle',                 name: 'Little auk' },
            { id: 'fulmarus_glacialis',        name: 'Northern fulmar' }
        ],
        state: {
            species: null,
            colony: null,
            season: null,
            period: null
        },
        kernel: {
            sql: "SELECT cartodb_id, ST_Transform(the_geom, 53032) AS the_geom_webmercator FROM {species} WHERE kernel_density IN (25, 50, 75) AND lower(colony) = '{colony}' AND lower(season) = '{season}' AND lower(period) = '{period}' ORDER BY kernel_density DESC",
            cartocss: '#kernel{ polygon-fill: {color}; polygon-opacity: 0.4; line-color: #FFF; line-width: 0.5; line-opacity: 1; }'
        },
        colonies: {
            sql: "SELECT cartodb_id, ST_Transform(the_geom, 53032) AS the_geom_webmercator FROM colonies WHERE colony IN ({colonies})",
            cartocss: '#colony{ marker-fill: #333333; marker-allow-overlap: true; }'
        },
        sort: {
            colony(a, b) {
                return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
            },
            season(a, b) {
                return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
            },
            period(a, b) {
                return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
            }
        },
        names: {
            'fall': 'Autumn (August to October)', // TODO: Remove when kernel files are updated
            'autumn': 'Autumn (August to October)',
            'winter': 'Winter (November to January)',
            'spring': 'Spring (February to April)'
        }
    },

    initialize(container, options) {
        L.setOptions(this, options);

        this._id = Math.random().toString(36).substring(7);

        this._cartoSQL = new cartodb.SQL({ user: 'seatrack' });

        this._expanded = true;
        this._initLayout(container);
    },

    addTo(map) {
        this._map = map;
        return this;
    },

    // Remove layer
    remove() {
        if (this._layer) {
            this._map.removeLayer(this._layer);
        }

        this._header.remove();
        this._container.remove();

        this.fire('remove');
    },

    _initLayout(parent) {
        const options = this.options;

        this._header = parent.append('h3');

        this._header.append('span')
            .attr('class', 'accordion-color')
            .style('background', this.options.color)

        this._header.append('span')
            .attr('class', 'accordion-name')
            .text('Select your map');

        this._header.append('button')
            .attr('class', 'accordion-delete-btn mdl-button mdl-button--icon mdl-js-button mdl-js-ripple-effect')
            .on('click', () => this.remove())
            .append('i')
                .attr('class', 'material-icons')
                .text('delete_forever')

        this._container = parent.append('div');

        this._state = L.extend({}, options.state);

        this._speciesSelect = this.createSelectControl(this._container, 'species', options.species, this.onSpeciesSelect.bind(this));

        if (this._state.species) {
            this.select('species', this._state.species);
        }
    },

    createSelectControl(container, type, items, onChange) {
        const id = type + '-' + this._id;
        const self = this;

        const div = container.append('div')
            .attr('id', type + '-textfield')
            .attr('class', 'mdl-textfield mdl-js-textfield mdl-textfield--floating-label getmdl-select getmdl-select__fix-height');

        div.append('input')
            .attr('id', id)
            .attr('class', 'mdl-textfield__input')
            .attr('type', 'text')
            .attr('value', '')
            .attr('readonly', true)
            .on('change', function(d) {
                if (onChange) {
                    onChange(id, this.dataset.val, this.value);
                }
            });

        div.append('label')
            .attr('for', id)
            .append('i')
            .attr('class', 'mdl-icon-toggle__label material-icons')
            .text('keyboard_arrow_down');

        div.append('label')
            .attr('for', id)
            .attr('class', 'mdl-textfield__label')
            .text(type);

        const ul = div.append('ul')
            .attr('for', id)
            .attr('class', 'mdl-menu mdl-menu--bottom-left mdl-js-menu');

        if (items) {
            ul.selectAll('li')
                .data(items)
                .enter()
                .append('li')
                .attr('class', 'mdl-menu__item')
                .attr('data-val', d => d.id)
                .text(d => d.name);
        }

        getmdlSelect.addEventListeners(div.node(), true);

        componentHandler.upgradeDom(); // TODO: Don't do more than needed!

        return div;
    },

    // Select species, colony, season, period
    select(id, value) {
        const selectEl = this['_' + id + 'Select'];
        const itemEl = selectEl.select('[data-val="' + value + '"]');

        if (!itemEl.empty()) { // Item found
            const name = itemEl.text();

            this._state[id] = value.toLowerCase();

            selectEl.node().MaterialTextfield.change(name);
            if (id === 'species') {
                this.onSpeciesSelect(id, value, name);
            } else {
                this.onSelect(id, value);
            }
        }
    },

    onSpeciesSelect(id, species, name) {
        this._state.species = species;

        this._header.select('.accordion-name').style('font-style', 'normal').text(name);
        this._header.select('.accordion-delete-btn').style('display', 'block');

        if (!this._seasonSelect) {
            this._seasonSelect = this.createSelectControl(this._container, 'season');
            this._periodSelect = this.createSelectControl(this._container, 'period');
            this._colonySelect = this.createSelectControl(this._container, 'colony');
            this.fire('add');

            this.options.map.setColoniesOpacity(0.1); // Make colonies transparent
        }

        this.getSpeciesData(species);
    },

    // Season, period select handler
    onSelect(id, value) {
        const state = this._state;

        state[id] = value.toLowerCase();

        this.disableSelectItems();

        if (state.species && state.colony && state.season && state.period) {
            this.updateLayer(state);
            this.showMetadata(state);
        }
    },

    // TODO: Add cache
    getSpeciesData(species) {
        this._cartoSQL.execute("SELECT DISTINCT colony, season, period, locations, colonies, individuals, days, months FROM {{species}}", { species: species })
            .done(data => this.onSpeciesDataLoad(data))
            .error(errors => console.error(errors));
    },

    onSpeciesDataLoad(data) {
        const state = this._state;

        if (data.total_rows) {
            this._rows = data.rows;

            this.addSelectItems('season');
            this.addSelectItems('period');
            this.addSelectItems('colony');

            this.select('season', state.season || 'all_seasons');
            this.select('period', state.period || this._periodSelect.select('li:first-child').attr('data-val'));
            this.select('colony', state.colony || 'all_colonies');
        }
    },

    addSelectItems(id) {
        const textfield = this['_' + id + 'Select'];

        const items = nest()
            .key(d => d[id]).sortKeys(this.options.sort[id])
            .entries(this._rows);

        textfield.node().MaterialTextfield.change(''); // Reset
        textfield.selectAll('li').remove(); // TODO: Do proper D3 way - remove eventlisteners?

        const self = this;

        textfield.select('ul')
            .selectAll('li')
            .data(items)
            .enter()
            .append('li')
            .attr('class', 'mdl-menu__item')
            .attr('data-val', d => d.key.toLowerCase())
            .text(d => this.options.names[d.key] || d.key.replace(/_/g, ' '))
            .on('click', function(d) {
                if (!this.getAttribute('disabled')) {
                    self.onSelect(id, d.key)
                }
            });

        getmdlSelect.addEventListeners(textfield.node(), true);
    },

    // Disable select combinations where there is no data
    disableSelectItems() {
        const state = this._state;

        if (state.species && state.colony && state.season && state.period) {

            // Disable season if no data for selected colony and period
            this._seasonSelect.selectAll('li')
                .attr('disabled', d => d.values.filter(d => d.period.toLowerCase() === state.period && d.colony.toLowerCase() === state.colony).length ? null : 'disabled');

            // Disable period if no data for selected season and colony
            this._periodSelect.selectAll('li')
                .attr('disabled', d => d.values.filter(d => d.season.toLowerCase() === state.season && d.colony.toLowerCase() === state.colony).length ? null : 'disabled');

            // Disable colony if no data for selected season and period
            this._colonySelect.selectAll('li')
                .attr('disabled', d => d.values.filter(d => d.season.toLowerCase() === state.season && d.period.toLowerCase() === state.period).length ? null : 'disabled');

        }
    },

    updateLayer(state) {
        if (!this._prevState) {
            this._prevState = L.extend({}, state);
        } else {
            if (state.species === this._prevState.species && state.season === this._prevState.season && state.period === this._prevState.period && state.colony === this._prevState.colony) {
                return; // No change
            }
            this._prevState = L.extend({}, state);
        }

        const map = this._map;
        const options = this.options;
        let colonies = [];

        if (state.colony === 'all_colonies') {
            colonies = this._rows.filter(d => d.season.toLowerCase() === state.season && d.period.toLowerCase() === state.period && d.colony.toLowerCase() !== 'all_colonies').map(d => d.colony);
        } else {
            const item = this._colonySelect.select('[data-val="' + state.colony + '"]');

            if (!item.empty()) {
                colonies = [item.text()];
            }
        }

        const kernel = this.options.kernel;

        if (this._layer) {
            map.removeLayer(this._layer);
        }

        cartodb.createLayer(map, {
            user_name: 'seatrack',
            type: 'cartodb',
            sublayers: [{
                sql: L.Util.template(options.kernel.sql, state),
                cartocss: L.Util.template(options.kernel.cartocss, options)
            },{
                sql: L.Util.template(options.colonies.sql, {
                    colonies: "'" + colonies.join("','") + "'"
                }),
                cartocss: options.colonies.cartocss
            }]
        }, { https: true }).addTo(map)
            .on('done', this.onLayerLoad.bind(this))
            .on('error', err => console.error(err));
    },

    onLayerLoad(layer) {
        this._layer = layer;
    },

    showMetadata(state) {
        this._container.select('.seatrack-metadata').remove();

        this._rows.forEach(row => {
            if (row.season.toLowerCase() === state.season && row.period.toLowerCase() === state.period && row.colony.toLowerCase() === state.colony) {
                const div = this._container.append('div')
                    .attr('class', 'seatrack-metadata');

                const table = div.append('table');

                table.append('caption')
                    .text('Data used to produce map');

                const tbody = table.append('tbody');

                ['Locations', 'Colonies', 'Individuals', 'Days', 'Months'].forEach(d => {
                    const tr = tbody.append('tr');
                    tr.append('th').text(d + ':');
                    tr.append('td').text(row[d.toLowerCase()]);
                });

                if (row.individuals < 5 || row.days < 10) {
                    const warning = div.append('div')
                        .attr('class', 'seatrack-limited');

                    warning.append('i')
                        .attr('class', 'material-icons')
                        .text('report_problem');

                    warning.append('span')
                        .text('Low amount of data');
                }
            }
        });
    }

});


export default function kernel(container, options) {
    return new Kernel(container, options);
}