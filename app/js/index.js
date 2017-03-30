import '../scss/styles.scss';
import map from './Map';
import selection from './Selection';

window.onload = function() {
    selection(map());

    const loadingMask = document.getElementById('loading-mask');
    loadingMask.parentNode.removeChild(loadingMask);
};


