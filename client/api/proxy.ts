// api/proxy.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const BACKEND_URL = process.env.VITE_API_URL; // <-- tu variable de entorno

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const path = req.url?.replace(/^\/api\/proxy/, "") || "";
    const url = `${BACKEND_URL}${path}`;

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        ...(req.headers.authorization && { Authorization: req.headers.authorization }),
      },
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, fetchOptions);

    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "transfer-encoding") res.setHeader(key, value);
    });

    const text = await response.text();
    res.send(text);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error conectando al backend" });
  }
}
