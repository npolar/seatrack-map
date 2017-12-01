import auth0 from 'auth0-js';

const webAuth = new auth0.WebAuth({
    domain: 'seatrack.eu.auth0.com',
    clientID: 'hMSOqg7ShZ5EGGXOjf6v1NhB4um0TAXq',
    responseType: 'token id_token',
    audience: 'https://seatrack.eu.auth0.com/userinfo',
    scope: 'openid',
    redirectUri: window.location.href
});

export default () => {

    // Download button/dialog
    const downloadDialog = document.getElementById('seatrack-download');
    const downloadBtn = document.getElementById('seatrack-download-button').addEventListener('click', () => {
        downloadDialog.showModal();
        downloadDialog.scrollTop = 0;
    });

    downloadDialog.querySelector('.seatrack-close').addEventListener('click', () => downloadDialog.close());

    const loginBtn = document.getElementById('seatrack-login-btn');
    const logoutBtn = document.getElementById('seatrack-logout-btn');
    const infoView = document.getElementById('seatrack-info-view');
    const downloadView = document.getElementById('seatrack-download-view');

    loginBtn.addEventListener('click', () => {
        webAuth.authorize();
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('id_token');
        localStorage.removeItem('expires_at');
        showView();

        if (downloadDialog.open) {
            downloadDialog.close();
        }
    });

    const handleAuthentication = () => {
        webAuth.parseHash((err, authResult) => {
            if (authResult && authResult.accessToken && authResult.idToken) {
                const expiresAt = JSON.stringify(authResult.expiresIn * 1000 + new Date().getTime());
                localStorage.setItem('access_token', authResult.accessToken);
                localStorage.setItem('id_token', authResult.idToken);
                localStorage.setItem('expires_at', expiresAt);
                window.location.hash = '';

                if (!downloadDialog.open) {
                    downloadDialog.showModal();
                }
            } else if (err) {
                console.log(err);
            }
            showView();
        });
    };

    const isAuthenticated = () => {
        // Check whether the current time is past the access token's expiry time
        const expiresAt = JSON.parse(localStorage.getItem('expires_at'));
        return new Date().getTime() < expiresAt;
    };

    function showView() {
        if (isAuthenticated()) {
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            infoView.style.display = 'none';
            downloadView.style.display = 'block';
        } else {
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
            infoView.style.display = 'block';
            downloadView.style.display = 'none';
        }
    }

    handleAuthentication();
};