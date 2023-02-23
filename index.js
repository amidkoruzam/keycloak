import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import express from "express";

const keycloakUrl = "http://keycloak:8080";
const realm = "app";
const clientId = "app";
const clientSecret = "hwS5JZujmfucO4R6VVTvxSQjjugD5CHe";

const app = express();

app.use(express.json());

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

  console.log(url, options);

  const res = await fetch(url, options);
  return res.json();
};

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const tokens = await getTokens(email, password);

  return res.send(res.json(tokens));
});

app.listen(3000);
