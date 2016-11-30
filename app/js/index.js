import '../scss/styles.scss';
// import proj4 from 'proj4';
// import 'proj4leaflet';
import map from './Map';
import selection from './Selection';

window.onload = function() {
    selection(map());
}


