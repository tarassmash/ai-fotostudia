// Диагностика: откройте /api/health в браузере.
// Проверяет, задан ли ключ и принимает ли его fal.ai. Генерацию не запускает и денег не тратит.
import { MODEL, RESOLUTION, ACCESS_CODE, json } from "../shared/studio.mjs";

export default async () => {
  const key = (process.env.FAL_KEY || process.env.FAL_API_KEY || "").trim();
  const report = {
    model: MODEL,
    resolution: RESOLUTION,
    accessCodeEnabled: Boolean(ACCESS_CODE),
    falKeySet: Boolean(key),
    falKeyLooksValid: /^[\w-]+:[\w-]+$/.test(key),
    falAuth: "не проверено",
    verdict: "",
  };
  if (!key) {
    report.verdict = "FAL_KEY не задан. Railway: сервис → Variables → New Variable. Netlify: Site configuration → Environment variables, затем Trigger deploy.";
    return json(report);
  }
  try {
    // Запрашиваем статус несуществующей задачи: fal проверит ключ, но ничего не запустит.
    const app = MODEL.split("/").slice(0, 2).join("/");
    const r = await fetch(`https://queue.fal.run/${app}/requests/00000000-0000-0000-0000-000000000000/status`, {
      headers: { authorization: "Key " + key },
    });
    const text = await r.text();
    report.falStatus = r.status;
    report.falAnswer = text.slice(0, 300);
    if (/balance|locked|billing/i.test(text)) { report.falAuth = "нет баланса"; report.verdict = "Ключ верный, но на fal.ai закончился баланс. Пополните: fal.ai/dashboard/billing."; }
    else if (r.status === 401 || r.status === 403) { report.falAuth = "ключ отклонён"; report.verdict = "fal.ai не принял ключ. Создайте новый на fal.ai/dashboard/keys, обновите FAL_KEY и перезапустите сайт."; }
    else if (r.status === 404 || r.status === 400 || r.status === 422 || r.ok) { report.falAuth = "ok"; report.verdict = "Ключ принят. Если генерация всё равно не идёт, пришлите текст ошибки под кнопкой «Создать портреты»."; }
    else { report.falAuth = "ошибка"; report.verdict = "Неожиданный ответ fal.ai, см. falAnswer."; }
  } catch (e) {
    report.falAuth = "нет связи";
    report.verdict = "Сервер не смог связаться с fal.ai: " + e.message;
  }
  return json(report);
};

export const config = { path: "/api/health" };
