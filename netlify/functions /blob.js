const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const pass = process.env.EDIT_PASSWORD;
  console.log("EDIT_PASSWORD set:", !!pass);

  try {
    const store = getStore({ name: "tierlist" });

    if (event.httpMethod === "GET") {
      const data = await store.get("data", { type: "json" });
      if (!data) return { statusCode: 404, headers, body: JSON.stringify({ error: "Ще нічого не збережено" }) };
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (event.httpMethod === "PUT") {
      if (!pass) return { statusCode: 500, headers, body: JSON.stringify({ error: "EDIT_PASSWORD не задано на сервері" }) };
      let body;
      try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Bad JSON" }) }; }
      if (body.password !== pass) return { statusCode: 401, headers, body: JSON.stringify({ error: "Невірний пароль" }) };
      await store.setJSON("data", body.data);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
