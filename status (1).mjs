import { json, checkAccess, falFetch, falError, safe } from "../shared/studio.mjs";

// Принимаем только адреса очереди fal.ai, чтобы ключ не уходил на чужие сайты
const QUEUE_URL = /^https:\/\/queue\.fal\.run\/[\w\-./]+\/requests\/[\w-]+(\/status)?$/;

export default safe(async (req) => {
  if (req.method !== "POST") return json({ error: "Метод не поддерживается" }, 405);
  if (!checkAccess(req)) return json({ error: "Неверный код доступа." }, 401);

  let body;
  try { body = await req.json(); } catch { return json({ error: "Некорректный запрос." }, 400); }
  const { statusUrl, responseUrl } = body || {};
  if (!QUEUE_URL.test(statusUrl || "") || !QUEUE_URL.test(responseUrl || "")) {
    return json({ error: "Некорректный идентификатор задачи." }, 400);
  }

  const st = await falFetch(statusUrl);
  if (!st.ok) return json({ error: falError(st.status, st.data) }, 502);

  if (st.data.status === "IN_QUEUE") return json({ state: "queue", position: st.data.queue_position ?? null });
  if (st.data.status === "IN_PROGRESS") return json({ state: "working" });
  if (st.data.status !== "COMPLETED") return json({ state: "working" });

  const res = await falFetch(responseUrl);
  if (!res.ok) return json({ error: falError(res.status, res.data) }, 502);
  const images = (res.data.images || []).map(i => (typeof i === "string" ? i : i.url)).filter(Boolean);
  if (!images.length) return json({ error: "Модель не вернула снимков. Попробуйте другое фото или стиль." }, 502);
  return json({ state: "done", images });
});

export const config = { path: "/api/status" };
