import { getStore } from "@netlify/blobs";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async (req) => {
  const store = getStore("tierlist");

  if (req.method === "GET") {
    const data = await store.get("data", { type: "json" });
    if (!data) return json({ error: "Ще нічого не збережено" }, 404);
    return json(data);
  }

  if (req.method === "PUT") {
    let body;
    try { body = await req.json(); } catch { return json({ error: "Bad JSON" }, 400); }
    const pass = process.env.EDIT_PASSWORD;
    if (!pass) return json({ error: "На Netlify не задано EDIT_PASSWORD" }, 500);
    if (body.password !== pass) return json({ error: "Невірний пароль" }, 401);
    await store.setJSON("data", body.data);
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};
