import auth0 from 'auth0-js';

const webAuth = new auth0.WebAuth({
    domain: 'seatrack.eu.auth0.com',
    clientID: 'hMSOqg7ShZ5EGGXOjf6v1NhB4um0TAXq',
    responseType: 'token id_token',
    audience: 'https://seatrack.eu.auth0.com/userinfo',
    scope: 'openid groups permissions roles',
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
    const notAuthenticated = document.getElementById('seatrack-not-authenticated');
    const notApprovedView = document.getElementById('seatrack-not-approved');
    const approvedView = document.getElementById('seatrack-approved');

    loginBtn.addEventListener('click', () => {
        webAuth.authorize();
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('id_token');
        localStorage.removeItem('expires_at');

        webAuth.logout({
          returnTo: window.location.href,
          clientID: 'hMSOqg7ShZ5EGGXOjf6v1NhB4um0TAXq',
        });

        /*
        showView();

        if (downloadDialog.open) {
            downloadDialog.close();
        }
        */
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

    const getApprovalStatus = (callback) => {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
            return false;
        }

        webAuth.client.userInfo(accessToken, (err, user) => {
            callback(user['http://seatrack.seapop.no/approved']);
        });
    };

    const showView = () => {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'none';
        notAuthenticated.style.display = 'none';
        approvedView.style.display = 'none';
        notApprovedView.style.display = 'none';

        if (isAuthenticated()) {
            logoutBtn.style.display = 'inline-block';

            getApprovalStatus((isApproved) => {
                if (isApproved) {
                    approvedView.style.display = 'block';
                } else {
                    notApprovedView.style.display = 'block';
                }
            });
        } else {
            loginBtn.style.display = 'inline-block';
            notAuthenticated.style.display = 'block';
        }
    };

    handleAuthentication();
};