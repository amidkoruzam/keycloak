import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import express from "express";
import jwksClient from "jwks-rsa";

const keycloakUrl = process.env.KEYCLOAK_URL;
const realm = process.env.CLIENT_REALM;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

const app = express();

const client = jwksClient({
  jwksUri: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`,
});

app.use(express.json());

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

const getTokens = async (email, password) => {
  const data = new URLSearchParams({
    grant_type: "password",
    client_id: clientId,
    client_secret: clientSecret,
    username: email,
    password: password,
  });

  const url = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;

  const options = {
    method: "POST",
    body: data,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };

  const res = await fetch(url, options);
  return res.json();
};

const protect = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(403).send("token_missing");
  }

  const [, token] = header.split(" ");

  jwt.verify(
    token,
    getKey,
    {
      issuer: `${keycloakUrl}/realms/${realm}`,
      algorithms: ["RS256"],
    },
    (error, decoded) => {
      if (error) {
        return res.status(403).send("invalid_token");
      }

      req.token = token;

      next();
    }
  );
};

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const tokens = await getTokens(email, password);

  return res.send(tokens);
});

app.get("/protected", protect, async (req, res) => {
  return res.send("accessed!");
});

app.listen(3000);
