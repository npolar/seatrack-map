import auth0 from 'auth0-js';

export default () => {

    const webAuth = new auth0.WebAuth({
        domain: 'mastermaps.eu.auth0.com',
        clientID: 'J02s4xqpkzVswvE04xeDc0D83y4lwOiC',
        responseType: 'token id_token',
        audience: 'https://mastermaps.eu.auth0.com/userinfo',
        scope: 'openid',
        redirectUri: window.location.href
    });

    // Download button/dialog
    const download = document.getElementById('seatrack-download');
    const downloadBtn = document.getElementById('seatrack-download-button').addEventListener('click', () => {
      download.showModal();
      download.scrollTop = 0;
    });

    download.querySelector('.seatrack-close').addEventListener('click', () => download.close());
    download.querySelector('.close').addEventListener('click', () => download.close());

    const loginBtn = document.getElementById('seatrack-login-btn');

    loginBtn.addEventListener('click', () => {
        webAuth.authorize();
    });

    const loginStatus = document.querySelector('#seatrack-download h4');
    const loginView = document.getElementById('login-view');
    const homeView = document.getElementById('home-view');

    // buttons and event listeners
    const homeViewBtn = document.getElementById('btn-home-view');
    const logoutBtn = document.getElementById('btn-logout');

    homeViewBtn.addEventListener('click', function() {
        homeView.style.display = 'inline-block';
        loginView.style.display = 'none';
    });

    logoutBtn.addEventListener('click', logout);

    function handleAuthentication() {
        webAuth.parseHash(function(err, authResult) {
            if (authResult && authResult.accessToken && authResult.idToken) {
                window.location.hash = '';
                setSession(authResult);
                loginBtn.style.display = 'none';
                homeView.style.display = 'inline-block';
            } else if (err) {
                homeView.style.display = 'inline-block';
                console.log(err);
            }
            displayButtons();
        });
    }

    function setSession(authResult) {
        // Set the time that the access token will expire at
        const expiresAt = JSON.stringify(
            authResult.expiresIn * 1000 + new Date().getTime()
        );
        localStorage.setItem('access_token', authResult.accessToken);
        localStorage.setItem('id_token', authResult.idToken);
        localStorage.setItem('expires_at', expiresAt);
    }

    function logout() {
        // Remove tokens and expiry time from localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('id_token');
        localStorage.removeItem('expires_at');
        displayButtons();
    }

    function isAuthenticated() {
        // Check whether the current time is past the
        // access token's expiry time
        const expiresAt = JSON.parse(localStorage.getItem('expires_at'));
        return new Date().getTime() < expiresAt;
    }

    function displayButtons() {
        if (isAuthenticated()) {
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            loginStatus.innerHTML = 'You are logged in!';
        } else {
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
            loginStatus.innerHTML = 'You are not logged in! Please log in to continue.';
        }
    }

    handleAuthentication();
};