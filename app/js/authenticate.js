import auth0 from "auth0-js";
import { select } from "d3-selection";
import dialogPolyfill from "dialog-polyfill";

const webAuth = new auth0.WebAuth({
  domain: "seatrack.eu.auth0.com",
  clientID: "hMSOqg7ShZ5EGGXOjf6v1NhB4um0TAXq",
  responseType: "token id_token",
  audience: "https://seatrack.eu.auth0.com/userinfo",
  scope: "openid groups permissions roles",
  redirectUri: window.location.href,
});

export default () => {
  // Download button/dialog
  const downloadDialog = document.getElementById("seatrack-download");

  // Add polyfill if needed
  if (!downloadDialog.showModal) {
    dialogPolyfill.registerDialog(downloadDialog);
  }

  /*
    const downloadBtn = document.getElementById('seatrack-download-button').addEventListener('click', () => {
        downloadDialog.showModal();
        downloadDialog.scrollTop = 0;
    });
    */

  downloadDialog
    .querySelector(".seatrack-close")
    .addEventListener("click", () => closeDialog());

  const loginBtn = document.getElementById("seatrack-login-btn");
  const signupBtn = document.getElementById("seatrack-signup-btn");
  const logoutBtn = document.getElementById("seatrack-logout-btn");
  const notAuthenticated = document.getElementById(
    "seatrack-not-authenticated"
  );
  const notApprovedView = document.getElementById("seatrack-not-approved");
  const approvedView = document.getElementById("seatrack-approved");
  const dialogTitle = document.getElementById("seatrack-download-title");

  loginBtn.addEventListener("click", () =>
    webAuth.authorize({ mode: "login" })
  );
  signupBtn.addEventListener("click", () =>
    webAuth.authorize({ mode: "signUp" })
  );
  logoutBtn.addEventListener("click", () => closeDialog());

  const closeDialog = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("id_token");
    localStorage.removeItem("expires_at");

    webAuth.logout({
      returnTo: window.location.href,
      clientID: "hMSOqg7ShZ5EGGXOjf6v1NhB4um0TAXq",
    });
    downloadDialog.close();
  };

  const showFiles = (files, folder) => {
    const tbody = select(approvedView).select("tbody");
    let tr;

    console.log(folder);

    files.forEach((file) => {
      tr = tbody.append("tr");
      tr.append("td")
        .attr("class", "nowrap")
        .html('<a href="' + folder + file.name + '">' + file.name + "</a>"); // .html('<a href="">.SHP</a><br /><a href="">.GeoJSON</a>');
      tr.append("td").text(file.format);
      tr.append("td").text(file.category);
      tr.append("td").text(file.type);
      tr.append("td").text(file.description);
      tr.append("td").attr("class", "nowrap").text(file.size);
    });

    select("#seatrack-download").style("width", "85%");
    approvedView.style.display = "block";
  };

  const handleAuthentication = () => {
    webAuth.parseHash((err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        const expiresAt = JSON.stringify(
          authResult.expiresIn * 1000 + new Date().getTime()
        );
        localStorage.setItem("access_token", authResult.accessToken);
        localStorage.setItem("id_token", authResult.idToken);
        localStorage.setItem("expires_at", expiresAt);
        window.location.hash = "";

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
    const expiresAt = JSON.parse(localStorage.getItem("expires_at"));
    return new Date().getTime() < expiresAt;
  };

  const getApprovalStatus = (callback) => {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      return false;
    }

    webAuth.client.userInfo(accessToken, (err, user) => {
      callback(
        user["http://seatrack.seapop.no/approved"],
        user["http://seatrack.seapop.no/table"],
        user["http://seatrack.seapop.no/folder"]
      );
    });
  };

  const showView = () => {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "none";
    signupBtn.style.display = "none";
    notAuthenticated.style.display = "none";
    approvedView.style.display = "none";
    notApprovedView.style.display = "none";

    if (isAuthenticated()) {
      // logoutBtn.style.display = 'inline-block';

      getApprovalStatus((isApproved, table, folder) => {
        if (isApproved) {
          const cartoSQL = new cartodb.SQL({ user: "seatrack" });
          cartoSQL
            .execute(
              "SELECT name, description, type, category, size, _format AS format FROM {{table}} ORDER BY name",
              { table: table }
            )
            .done((data) => showFiles(data.rows, folder))
            .error((errors) => console.error(errors));
        } else {
          notApprovedView.style.display = "block";
          dialogTitle.textContent = "Please wait for approval";
        }
        logoutBtn.style.display = "inline-block";
      });
    } else {
      loginBtn.style.display = "inline-block";
      signupBtn.style.display = "inline-block";
      notAuthenticated.style.display = "block";
    }
  };

  handleAuthentication();
};
