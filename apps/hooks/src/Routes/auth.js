import { SignJWT, jwtVerify } from "jose";
import { Frontend as Client } from "@happy-path/graphql-client";

const LoginMutation = `
  mutation Login($email: String!, $password: String!) {
    auth_login(email: $email, password: $password) {
      access_token
      refresh_token
    }
  }
`;

export const auth = async (req, res) => {
  if (req.body.email == undefined || req.body.password == undefined)
    return res.sendStatus(422);
  const response = await Client({
    url: (process.env.DIRECTUS_API_URL || "") + "/system",
  }).mutation(LoginMutation, {
    email: req.body.email,
    password: req.body.password,
  });
  if (response.data?.auth_login != null) {
    const directusJWTSecret = new TextEncoder().encode(
      process.env.DIRECTUS_JWT_SECRET,
    );
    const {
      payload: { app_access: hasAppAccess },
    } = await jwtVerify(
      response.data.auth_login.access_token,
      directusJWTSecret,
    );
    if (hasAppAccess === true) {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const token = await new SignJWT({ email: req.body.email })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(process.env.JWT_EXPIRES || "1h")
        .sign(secret);
      return res.json({ token });
    }
  }
  return res.sendStatus(403);
}