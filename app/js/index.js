import dialogPolyfill from 'dialog-polyfill';
import 'dialog-polyfill/dialog-polyfill.css';
import '../scss/styles.scss';
import map from './Map';
import selection from './Selection';
import authenticate from './authenticate';

window.onload = function() {
    selection(map());

    const loadingMask = document.getElementById('loading-mask');
    loadingMask.parentNode.removeChild(loadingMask);

    // Help button/dialog
    const dialog = this._dialog = document.getElementById('seatrack-help');
    const helpBtn = document.getElementById('seatrack-info-button').addEventListener('click', () => {
        dialog.showModal();
        dialog.scrollTop = 0;
    });

    dialog.querySelector('.seatrack-close').addEventListener('click', () => dialog.close());
    dialog.querySelector('.close').addEventListener('click', () => dialog.close());

    // Add polyfill if needed
    if (!dialog.showModal) {
        dialogPolyfill.registerDialog(dialog);
    }

    authenticate();
};


