import { getStore } from "@netlify/blobs";

const SITE_ID = "relaxed-banoffee-e1f911";
const BLOB_KEY = "tierlist-data";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const token = (event.headers["authorization"] || "").replace("Bearer ", "").trim();
  if (!token) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "No token" }) };
  }

  try {
    const store = getStore({
      name: "tierlist",
      siteID: SITE_ID,
      token,
    });

    if (event.httpMethod === "GET") {
      const data = await store.get(BLOB_KEY, { type: "json" });
      if (data === null) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found" }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (event.httpMethod === "PUT") {
      const body = JSON.parse(event.body);
      await store.setJSON(BLOB_KEY, body);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
