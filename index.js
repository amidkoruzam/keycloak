const jwt = require("jsonwebtoken");
const request = require("request-promise");

const keycloakUrl = "https://your-keycloak-url/auth";
const realm = "your-realm";
const clientId = "your-client-id";
const clientSecret = "your-client-secret";

const generateToken = async (email, password) => {
  const options = {
    method: "POST",
    uri: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`,
    form: {
      grant_type: "password",
      client_id: clientId,
      client_secret: clientSecret,
      username: email,
      password: password,
    },
    json: true,
  };

  const token = await request(options);
  return token.access_token;
};

const authenticate = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).send("Unauthorized");
  }

  jwt.verify(token, clientSecret, (err, decoded) => {
    if (err) {
      return res.status(401).send("Unauthorized");
    }

    req.user = decoded;
    next();
  });
};

app.get("/protected", authenticate, (req, res) => {
  if (!req.user || !req.user.realm_access || !req.user.realm_access.roles) {
    return res.status(403).send("Forbidden");
  }

  const roles = req.user.realm_access.roles;
  if (!roles.includes("user")) {
    return res.status(403).send("Forbidden");
  }

  res.send("Protected route");
});

const refreshToken = async (refreshToken) => {
  const options = {
    method: "POST",
    uri: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`,
    form: {
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    },
    json: true,
  };

  const token = await request(options);
  return token.access_token;
};

app.get("/refresh-token", (req, res) => {
  const rToken = req.headers.authorization;

  if (!rToken) {
    return res.status(401).send("Unauthorized");
  }

  refreshToken(rToken)
    .then((token) => {
      res.send({ access_token: token });
    })
    .catch((err) => {
      res.status(401).send("Unauthorized");
    });
});
