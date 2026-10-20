// No external dependencies — uses Netlify Blobs REST API directly
exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const siteId = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || "relaxed-banoffee-e1f911";
  const token = process.env.NETLIFY_BLOBS_CONTEXT
    ? JSON.parse(Buffer.from(process.env.NETLIFY_BLOBS_CONTEXT, "base64").toString()).token
    : null;

  // Fallback: use personal token from env
  const apiToken = token || process.env.NETLIFY_API_TOKEN;

  if (!apiToken) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "No API token available. Set NETLIFY_API_TOKEN in env vars." }) };
  }

  const blobUrl = `https://api.netlify.com/api/v1/blobs/${siteId}/main/tierlist-data`;

  if (event.httpMethod === "GET") {
    try {
      const res = await fetch(blobUrl, {
        headers: { "Authorization": `Bearer ${apiToken}` }
      });
      if (res.status === 404) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: "Ще нічого не збережено" }) };
      }
      if (!res.ok) {
        return { statusCode: res.status, headers, body: JSON.stringify({ error: `Netlify API: ${res.status}` }) };
      }
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  if (event.httpMethod === "PUT") {
    const editPass = process.env.EDIT_PASSWORD;
    if (!editPass) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "EDIT_PASSWORD не задано" }) };
    }
    let body;
    try { body = JSON.parse(event.body); } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Bad JSON" }) };
    }
    if (body.password !== editPass) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "Невірний пароль" }) };
    }
    try {
      const res = await fetch(blobUrl, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body.data)
      });
      if (!res.ok) {
        const txt = await res.text();
        return { statusCode: res.status, headers, body: JSON.stringify({ error: `Netlify API: ${res.status} — ${txt}` }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
};
