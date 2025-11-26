// small API helper + base URL
export const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export async function postToken(username, password) {
  // OAuth2PasswordRequestForm expects form-urlencoded body
  const body = new URLSearchParams();
  body.append("username", username);
  body.append("password", password);

  const res = await fetch(`${BASE_URL}/auth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json(); // { access_token, token_type }
}
