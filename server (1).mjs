// Собранный сервер студии: всё в одном файле. Исходники в netlify/functions и netlify/shared.
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server-src.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// netlify/functions/config.mjs
var config_exports = {};
__export(config_exports, {
  config: () => config,
  default: () => config_default
});

// netlify/shared/studio.mjs
var MODEL = process.env.FAL_MODEL || "fal-ai/nano-banana-pro/edit";
var RESOLUTION = process.env.FAL_RESOLUTION || "2K";
var MAX_IMAGES = Math.min(4, Math.max(1, parseInt(process.env.MAX_VARIANTS || "4", 10)));
var ACCESS_CODE = (process.env.STUDIO_ACCESS_CODE || "").trim();
var IDENTITY = [
  "Use the person from the reference photo(s) as the only subject.",
  "Preserve their exact facial identity with maximum fidelity: identical face shape, jawline, eyes (shape, color, spacing), eyebrows, nose, lips, ears, skin tone, freckles, moles, scars, age, hairline, hair color and texture, facial hair.",
  "The result must be instantly recognizable as the same real person by friends and family.",
  "Do not change ethnicity, age, body type or facial proportions. Do not beautify into a different face, do not slim the face, do not enlarge the eyes.",
  "If the reference shows glasses, keep the same glasses."
].join(" ");
var QUALITY = [
  "Photorealistic high-end commercial portrait photography, shot on a Phase One medium format camera with an 85mm lens.",
  "Tack-sharp focus on the eyes, natural catchlights, realistic skin texture with visible pores, subtle professional retouching (dodge and burn), no plastic or waxy skin, no oversmoothing.",
  "Accurate anatomy, natural hands if visible, correct teeth, no extra fingers, no distortion, no text, no watermark, no logo.",
  "Magazine-grade color grading, rich tonal range, clean highlights, deep but detailed shadows."
].join(" ");
var STYLES = [
  {
    id: "business",
    name: "\u0414\u0435\u043B\u043E\u0432\u043E\u0439 \u043F\u043E\u0440\u0442\u0440\u0435\u0442",
    desc: "\u0414\u043B\u044F \u0441\u0430\u0439\u0442\u0430 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438, \u0440\u0435\u0437\u044E\u043C\u0435 \u0438 LinkedIn. \u0421\u0442\u0440\u043E\u0433\u0438\u0439 \u043A\u043E\u0441\u0442\u044E\u043C, \u0441\u0435\u0440\u044B\u0439 \u0444\u043E\u043D.",
    light: "85 \u043C\u043C \xB7 f/4 \xB7 \u043E\u043A\u0442\u0430\u0431\u043E\u043A\u0441 150 + \u043A\u043E\u043D\u0442\u0440\u043E\u0432\u043E\u0439",
    swatch: "radial-gradient(circle at 35% 30%, #d8dbe0 0%, #9aa1ab 45%, #4a5059 100%)",
    prompt: "Premium corporate headshot, chest-up framing, subject slightly turned, confident approachable expression with a subtle natural smile. Wardrobe: impeccably tailored dark navy or charcoal suit or blazer with a crisp shirt, styled appropriately for the person. Background: neutral mid-grey seamless studio paper with a soft gradient. Lighting: large octabox key light at 45 degrees, soft fill, gentle hair light separating the subject from the background."
  },
  {
    id: "office",
    name: "\u0421\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0439 \u043E\u0444\u0438\u0441",
    desc: "\u0414\u0440\u0443\u0436\u0435\u043B\u044E\u0431\u043D\u044B\u0439 \u043F\u043E\u0440\u0442\u0440\u0435\u0442 \u0432 \u0441\u0432\u0435\u0442\u043B\u043E\u043C \u043E\u0444\u0438\u0441\u0435 \u0441 \u043C\u044F\u0433\u043A\u0438\u043C \u0440\u0430\u0437\u043C\u044B\u0442\u0438\u0435\u043C.",
    light: "85 \u043C\u043C \xB7 f/1.8 \xB7 \u043E\u043A\u043D\u043E + \u043E\u0442\u0440\u0430\u0436\u0430\u0442\u0435\u043B\u044C",
    swatch: "linear-gradient(135deg, #f4f1ea 0%, #c9d6de 45%, #7f98a8 100%)",
    prompt: "Modern professional portrait in a bright contemporary office with large windows, background beautifully blurred with creamy bokeh (glass, plants, warm wood). Waist-up framing, relaxed confident posture, genuine warm smile. Wardrobe: smart-casual, a quality blazer or knit over a clean shirt. Lighting: soft natural window light as key, white bounce fill, airy and optimistic mood."
  },
  {
    id: "bw_classic",
    name: "\u041A\u043B\u0430\u0441\u0441\u0438\u043A\u0430 \u0427/\u0411",
    desc: "\u0411\u043B\u0430\u0433\u043E\u0440\u043E\u0434\u043D\u044B\u0439 \u0447\u0451\u0440\u043D\u043E-\u0431\u0435\u043B\u044B\u0439 \u043F\u043E\u0440\u0442\u0440\u0435\u0442 \u0432 \u0434\u0443\u0445\u0435 \u0441\u0442\u0443\u0434\u0438\u0439\u043D\u043E\u0439 \u043A\u043B\u0430\u0441\u0441\u0438\u043A\u0438.",
    light: "105 \u043C\u043C \xB7 f/5.6 \xB7 \u0440\u0435\u043C\u0431\u0440\u0430\u043D\u0434\u0442\u043E\u0432\u0441\u043A\u0438\u0439 \u0441\u0432\u0435\u0442",
    swatch: "radial-gradient(circle at 30% 35%, #bdbdbd 0%, #505050 40%, #0e0e0e 80%)",
    prompt: "Timeless black and white fine-art studio portrait, head and shoulders, deep black background. Rembrandt lighting with a single key light creating a small triangle of light on the shadow cheek, dramatic yet refined contrast, silver gelatin film look with fine grain, thoughtful calm expression. Wardrobe: simple dark clothing, no patterns."
  },
  {
    id: "editorial",
    name: "\u041E\u0431\u043B\u043E\u0436\u043A\u0430 \u0436\u0443\u0440\u043D\u0430\u043B\u0430",
    desc: "\u041C\u043E\u0434\u043D\u0430\u044F \u0441\u044A\u0451\u043C\u043A\u0430: \u0441\u043E\u0447\u043D\u044B\u0439 \u0446\u0432\u0435\u0442\u043D\u043E\u0439 \u0444\u043E\u043D, \u0441\u0432\u0435\u0442 \u043A\u0430\u043A \u043D\u0430 \u043E\u0431\u043B\u043E\u0436\u043A\u0435.",
    light: "70 \u043C\u043C \xB7 f/8 \xB7 \u0431\u044C\u044E\u0442\u0438-\u0442\u0430\u0440\u0435\u043B\u043A\u0430",
    swatch: "radial-gradient(circle at 50% 30%, #ffb38a 0%, #e0583a 45%, #7a1f1a 100%)",
    prompt: "High-fashion magazine editorial portrait, bold saturated solid color seamless backdrop that complements the subject's skin tone, beauty dish key light from above-front with a clean catchlight, crisp specular highlights. Stylish contemporary designer outfit, strong confident pose, editorial styling of hair. Vogue / GQ cover quality, leave clean negative space above the head."
  },
  {
    id: "golden_hour",
    name: "\u0417\u043E\u043B\u043E\u0442\u043E\u0439 \u0447\u0430\u0441",
    desc: "\u0422\u0451\u043F\u043B\u044B\u0439 \u0437\u0430\u043A\u0430\u0442\u043D\u044B\u0439 \u0441\u0432\u0435\u0442 \u043D\u0430 \u0443\u043B\u0438\u0446\u0435, \u0436\u0438\u0432\u043E\u0435 \u0435\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u0435.",
    light: "135 \u043C\u043C \xB7 f/2 \xB7 \u043A\u043E\u043D\u0442\u0440\u043E\u0432\u043E\u0435 \u0441\u043E\u043B\u043D\u0446\u0435",
    swatch: "radial-gradient(circle at 75% 25%, #fff0c2 0%, #f3b25e 35%, #8a5a3a 100%)",
    prompt: "Outdoor lifestyle portrait during golden hour, the low sun behind the subject creating a warm glowing rim light in the hair, soft golden fill on the face from a reflector, dreamy background of a park or city street dissolved into large warm bokeh. Relaxed natural expression. Wardrobe: tasteful casual clothing in warm neutral tones."
  },
  {
    id: "luxury",
    name: "\u041F\u0440\u0435\u043C\u0438\u0443\u043C \u043B\u043E\u0443-\u043A\u0438",
    desc: "\u0422\u0451\u043C\u043D\u044B\u0439, \u0434\u043E\u0440\u043E\u0433\u043E\u0439, \u043A\u0438\u043D\u0435\u043C\u0430\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u0447\u043D\u044B\u0439 \u043E\u0431\u0440\u0430\u0437.",
    light: "85 \u043C\u043C \xB7 f/2.8 \xB7 \u0441\u0442\u0440\u0438\u043F\u0431\u043E\u043A\u0441 + \u0433\u043E\u0431\u043E",
    swatch: "radial-gradient(circle at 40% 40%, #3f5a5c 0%, #1b2627 50%, #07090a 100%)",
    prompt: "Luxurious low-key portrait, dark moody charcoal-teal painted canvas backdrop, narrow strip box key light sculpting the face, subtle warm accent light, cinematic color grade. Elegant premium wardrobe (dark tailored jacket, fine fabrics, understated accessories). Powerful, composed, successful look."
  },
  {
    id: "high_key",
    name: "\u0421\u0432\u0435\u0442\u043B\u044B\u0439 \u0445\u0430\u0439-\u043A\u0438",
    desc: "\u0427\u0438\u0441\u0442\u044B\u0439 \u0431\u0435\u043B\u044B\u0439 \u0444\u043E\u043D, \u043C\u044F\u0433\u043A\u0438\u0439 \u0441\u0432\u0435\u0442, \u0441\u0432\u0435\u0436\u0438\u0439 \u0438 \u043B\u0451\u0433\u043A\u0438\u0439 \u0441\u043D\u0438\u043C\u043E\u043A.",
    light: "85 \u043C\u043C \xB7 f/5.6 \xB7 \u0434\u0432\u0430 \u0441\u043E\u0444\u0442\u0431\u043E\u043A\u0441\u0430 + \u0444\u043E\u043D",
    swatch: "radial-gradient(circle at 50% 40%, #ffffff 0%, #f1f3f5 55%, #cfd5db 100%)",
    prompt: "Bright high-key studio portrait on a pure white seamless background, soft even wraparound lighting from two large softboxes plus background lights, very soft shadows, fresh and clean look, natural happy expression. Wardrobe: light neutral tones (white, cream, light grey)."
  },
  {
    id: "cinematic",
    name: "\u041A\u0438\u043D\u043E-\u043D\u0435\u043E\u043D",
    desc: "\u0426\u0432\u0435\u0442\u043D\u044B\u0435 \u0433\u0435\u043B\u0438, \u043A\u0430\u043A \u0432 \u043A\u0430\u0434\u0440\u0435 \u0438\u0437 \u0444\u0438\u043B\u044C\u043C\u0430.",
    light: "50 \u043C\u043C \xB7 f/1.4 \xB7 \u0433\u0435\u043B\u0438 \u043C\u0430\u0434\u0436\u0435\u043D\u0442\u0430/\u0446\u0438\u0430\u043D",
    swatch: "linear-gradient(120deg, #ff3fa4 0%, #6b2bd9 50%, #16c6d9 100%)",
    prompt: "Cinematic portrait with dual colored gel lighting: magenta key light from one side and cyan rim light from the other, dark background with subtle haze, anamorphic film look, moody and striking. Wardrobe: modern dark streetwear or a sleek jacket."
  }
];
var FORMATS = [
  { id: "4:5", name: "\u041F\u043E\u0440\u0442\u0440\u0435\u0442 4:5" },
  { id: "1:1", name: "\u041A\u0432\u0430\u0434\u0440\u0430\u0442 1:1" },
  { id: "9:16", name: "\u0421\u0442\u043E\u0440\u0438\u0441 9:16" },
  { id: "3:2", name: "\u0413\u043E\u0440\u0438\u0437\u043E\u043D\u0442 3:2" }
];
function buildPrompt(style, extra) {
  const parts = [IDENTITY, style.prompt, QUALITY];
  if (extra) parts.push("Additional client wishes (follow only if they do not change the person's identity): " + extra);
  return parts.join("\n\n");
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
function safe(handler) {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      console.error(e);
      return json({ error: e?.message || "\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430." }, 500);
    }
  };
}
function checkAccess(req) {
  if (!ACCESS_CODE) return true;
  return (req.headers.get("x-studio-code") || "").trim() === ACCESS_CODE;
}
function falKey() {
  const k = process.env.FAL_KEY || process.env.FAL_API_KEY;
  if (!k) throw new Error("\u041D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435 \u043D\u0435 \u0437\u0430\u0434\u0430\u043D FAL_KEY. Railway: \u0432\u043A\u043B\u0430\u0434\u043A\u0430 Variables. Netlify: Site configuration \u2192 Environment variables.");
  return k;
}
async function falFetch(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { authorization: "Key " + falKey(), "content-type": "application/json", ...opts.headers || {} }
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}
function falError(status, data) {
  let d = data?.detail ?? data?.error ?? data?.message ?? data?.raw ?? "";
  if (Array.isArray(d)) d = d.map((x) => x.msg || JSON.stringify(x)).join("; ");
  else if (typeof d === "object") d = JSON.stringify(d);
  if (status === 402 || /balance|credit|locked|billing/i.test(d)) return "\u041D\u0430 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0435 fal.ai \u0437\u0430\u043A\u043E\u043D\u0447\u0438\u043B\u0441\u044F \u0431\u0430\u043B\u0430\u043D\u0441. \u041F\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u0435\u0433\u043E \u043D\u0430 fal.ai/dashboard/billing.";
  if (status === 401 || status === 403) return `fal.ai \u043D\u0435 \u043F\u0440\u0438\u043D\u044F\u043B \u043A\u043B\u044E\u0447 (${status}). \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 FAL_KEY \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 \u0445\u043E\u0441\u0442\u0438\u043D\u0433\u0430. ${String(d).slice(0, 200)}`;
  if (/nsfw|safety|content policy|flagged/i.test(d)) return "\u0424\u043E\u0442\u043E \u043D\u0435 \u043F\u0440\u043E\u0448\u043B\u043E \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0443 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u0438. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0434\u0440\u0443\u0433\u043E\u0435 \u0444\u043E\u0442\u043E.";
  return `\u041E\u0448\u0438\u0431\u043A\u0430 \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438 (${status}). ${String(d).slice(0, 300)}`;
}

// netlify/functions/config.mjs
var config_default = async () => json({
  requiresCode: Boolean(ACCESS_CODE),
  maxVariants: MAX_IMAGES,
  styles: STYLES.map(({ id, name, desc, light, swatch }) => ({ id, name, desc, light, swatch })),
  formats: FORMATS
});
var config = { path: "/api/config" };

// netlify/functions/generate.mjs
var generate_exports = {};
__export(generate_exports, {
  config: () => config2,
  default: () => generate_default
});
var DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
var generate_default = safe(async (req) => {
  if (req.method !== "POST") return json({ error: "\u041C\u0435\u0442\u043E\u0434 \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F" }, 405);
  if (!checkAccess(req)) return json({ error: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043A\u043E\u0434 \u0434\u043E\u0441\u0442\u0443\u043F\u0430." }, 401);
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u0437\u0430\u043F\u0440\u043E\u0441." }, 400);
  }
  const photos = Array.isArray(body.photos) ? body.photos.slice(0, 3) : [];
  if (!photos.length) return json({ error: "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u043D\u043E \u0444\u043E\u0442\u043E." }, 400);
  if (!photos.every((p) => typeof p === "string" && DATA_URL.test(p))) return json({ error: "\u041F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u044E\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0444\u043E\u0442\u043E JPG, PNG \u0438\u043B\u0438 WEBP." }, 400);
  const totalSize = photos.reduce((s, p) => s + p.length, 0);
  if (totalSize > 5e6) return json({ error: "\u0424\u043E\u0442\u043E \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u0438\u0435. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u043C\u0435\u043D\u044C\u0448\u0435 \u0441\u043D\u0438\u043C\u043A\u043E\u0432." }, 413);
  const style = STYLES.find((s) => s.id === body.style);
  if (!style) return json({ error: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0442\u0438\u043B\u044C \u043F\u043E\u0440\u0442\u0440\u0435\u0442\u0430." }, 400);
  const format = FORMATS.find((f) => f.id === body.format)?.id || "4:5";
  const count = Math.min(MAX_IMAGES, Math.max(1, parseInt(body.count, 10) || 1));
  const extra = typeof body.wishes === "string" ? body.wishes.trim().slice(0, 300) : "";
  const base = {
    prompt: buildPrompt(style, extra),
    image_urls: photos,
    num_images: count,
    output_format: "png"
  };
  const full = { ...base, aspect_ratio: format, resolution: RESOLUTION };
  const url = `https://queue.fal.run/${MODEL}`;
  let r = await falFetch(url, { method: "POST", body: JSON.stringify(full) });
  if (r.status === 422) r = await falFetch(url, { method: "POST", body: JSON.stringify(base) });
  if (!r.ok) return json({ error: falError(r.status, r.data) }, 502);
  const { request_id, status_url, response_url } = r.data;
  if (!request_id) return json({ error: "fal.ai \u043D\u0435 \u043F\u0440\u0438\u043D\u044F\u043B \u0437\u0430\u0434\u0430\u0447\u0443. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437." }, 502);
  return json({ id: request_id, statusUrl: status_url, responseUrl: response_url });
});
var config2 = { path: "/api/generate" };

// netlify/functions/status.mjs
var status_exports = {};
__export(status_exports, {
  config: () => config3,
  default: () => status_default
});
var QUEUE_URL = /^https:\/\/queue\.fal\.run\/[\w\-./]+\/requests\/[\w-]+(\/status)?$/;
var status_default = safe(async (req) => {
  if (req.method !== "POST") return json({ error: "\u041C\u0435\u0442\u043E\u0434 \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F" }, 405);
  if (!checkAccess(req)) return json({ error: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043A\u043E\u0434 \u0434\u043E\u0441\u0442\u0443\u043F\u0430." }, 401);
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u0437\u0430\u043F\u0440\u043E\u0441." }, 400);
  }
  const { statusUrl, responseUrl } = body || {};
  if (!QUEUE_URL.test(statusUrl || "") || !QUEUE_URL.test(responseUrl || "")) {
    return json({ error: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u0438\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u0437\u0430\u0434\u0430\u0447\u0438." }, 400);
  }
  const st = await falFetch(statusUrl);
  if (!st.ok) return json({ error: falError(st.status, st.data) }, 502);
  if (st.data.status === "IN_QUEUE") return json({ state: "queue", position: st.data.queue_position ?? null });
  if (st.data.status === "IN_PROGRESS") return json({ state: "working" });
  if (st.data.status !== "COMPLETED") return json({ state: "working" });
  const res = await falFetch(responseUrl);
  if (!res.ok) return json({ error: falError(res.status, res.data) }, 502);
  const images = (res.data.images || []).map((i) => typeof i === "string" ? i : i.url).filter(Boolean);
  if (!images.length) return json({ error: "\u041C\u043E\u0434\u0435\u043B\u044C \u043D\u0435 \u0432\u0435\u0440\u043D\u0443\u043B\u0430 \u0441\u043D\u0438\u043C\u043A\u043E\u0432. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0434\u0440\u0443\u0433\u043E\u0435 \u0444\u043E\u0442\u043E \u0438\u043B\u0438 \u0441\u0442\u0438\u043B\u044C." }, 502);
  return json({ state: "done", images });
});
var config3 = { path: "/api/status" };

// netlify/functions/health.mjs
var health_exports = {};
__export(health_exports, {
  config: () => config4,
  default: () => health_default
});
var health_default = async () => {
  const key = (process.env.FAL_KEY || process.env.FAL_API_KEY || "").trim();
  const report = {
    model: MODEL,
    resolution: RESOLUTION,
    accessCodeEnabled: Boolean(ACCESS_CODE),
    falKeySet: Boolean(key),
    falKeyLooksValid: /^[\w-]+:[\w-]+$/.test(key),
    falAuth: "\u043D\u0435 \u043F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u043E",
    verdict: ""
  };
  if (!key) {
    report.verdict = "FAL_KEY \u043D\u0435 \u0437\u0430\u0434\u0430\u043D. Railway: \u0441\u0435\u0440\u0432\u0438\u0441 \u2192 Variables \u2192 New Variable. Netlify: Site configuration \u2192 Environment variables, \u0437\u0430\u0442\u0435\u043C Trigger deploy.";
    return json(report);
  }
  try {
    const app = MODEL.split("/").slice(0, 2).join("/");
    const r = await fetch(`https://queue.fal.run/${app}/requests/00000000-0000-0000-0000-000000000000/status`, {
      headers: { authorization: "Key " + key }
    });
    const text = await r.text();
    report.falStatus = r.status;
    report.falAnswer = text.slice(0, 300);
    if (/balance|locked|billing/i.test(text)) {
      report.falAuth = "\u043D\u0435\u0442 \u0431\u0430\u043B\u0430\u043D\u0441\u0430";
      report.verdict = "\u041A\u043B\u044E\u0447 \u0432\u0435\u0440\u043D\u044B\u0439, \u043D\u043E \u043D\u0430 fal.ai \u0437\u0430\u043A\u043E\u043D\u0447\u0438\u043B\u0441\u044F \u0431\u0430\u043B\u0430\u043D\u0441. \u041F\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435: fal.ai/dashboard/billing.";
    } else if (r.status === 401 || r.status === 403) {
      report.falAuth = "\u043A\u043B\u044E\u0447 \u043E\u0442\u043A\u043B\u043E\u043D\u0451\u043D";
      report.verdict = "fal.ai \u043D\u0435 \u043F\u0440\u0438\u043D\u044F\u043B \u043A\u043B\u044E\u0447. \u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043D\u043E\u0432\u044B\u0439 \u043D\u0430 fal.ai/dashboard/keys, \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u0435 FAL_KEY \u0438 \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 \u0441\u0430\u0439\u0442.";
    } else if (r.status === 404 || r.status === 400 || r.status === 422 || r.ok) {
      report.falAuth = "ok";
      report.verdict = "\u041A\u043B\u044E\u0447 \u043F\u0440\u0438\u043D\u044F\u0442. \u0415\u0441\u043B\u0438 \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u044F \u0432\u0441\u0451 \u0440\u0430\u0432\u043D\u043E \u043D\u0435 \u0438\u0434\u0451\u0442, \u043F\u0440\u0438\u0448\u043B\u0438\u0442\u0435 \u0442\u0435\u043A\u0441\u0442 \u043E\u0448\u0438\u0431\u043A\u0438 \u043F\u043E\u0434 \u043A\u043D\u043E\u043F\u043A\u043E\u0439 \xAB\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u043E\u0440\u0442\u0440\u0435\u0442\u044B\xBB.";
    } else {
      report.falAuth = "\u043E\u0448\u0438\u0431\u043A\u0430";
      report.verdict = "\u041D\u0435\u043E\u0436\u0438\u0434\u0430\u043D\u043D\u044B\u0439 \u043E\u0442\u0432\u0435\u0442 fal.ai, \u0441\u043C. falAnswer.";
    }
  } catch (e) {
    report.falAuth = "\u043D\u0435\u0442 \u0441\u0432\u044F\u0437\u0438";
    report.verdict = "\u0421\u0435\u0440\u0432\u0435\u0440 \u043D\u0435 \u0441\u043C\u043E\u0433 \u0441\u0432\u044F\u0437\u0430\u0442\u044C\u0441\u044F \u0441 fal.ai: " + e.message;
  }
  return json(report);
};
var config4 = { path: "/api/health" };

// netlify/functions/editor.mjs
var editor_exports = {};
__export(editor_exports, {
  config: () => config5,
  default: () => editor_default
});
var ENDPOINT = /^[\w-]+\/[\w\-./]+$/;
var QUEUE_URL2 = /^https:\/\/queue\.fal\.run\/[\w\-./]+\/requests\/[\w-]+(\/status)?(\?logs=1)?$/;
var editor_default = safe(async (req) => {
  if (req.method !== "POST") return json({ error: "\u041C\u0435\u0442\u043E\u0434 \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F" }, 405);
  if (!checkAccess(req)) return json({ error: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043A\u043E\u0434 \u0434\u043E\u0441\u0442\u0443\u043F\u0430." }, 401);
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u0437\u0430\u043F\u0440\u043E\u0441." }, 400);
  }
  let r;
  if (body.action === "submit") {
    if (!ENDPOINT.test(body.endpoint || "") || body.endpoint.includes("..")) return json({ error: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C." }, 400);
    if (!body.input || typeof body.input !== "object") return json({ error: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u043C\u043E\u0434\u0435\u043B\u0438." }, 400);
    const n = parseInt(body.input.num_images, 10);
    if (n > 4) body.input.num_images = 4;
    r = await falFetch(`https://queue.fal.run/${body.endpoint}`, { method: "POST", body: JSON.stringify(body.input) });
  } else if (body.action === "get") {
    if (!QUEUE_URL2.test(body.url || "")) return json({ error: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u0430\u0434\u0440\u0435\u0441 \u0437\u0430\u0434\u0430\u0447\u0438." }, 400);
    r = await falFetch(body.url);
  } else {
    return json({ error: "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435." }, 400);
  }
  return json(r.data, r.status);
});
var config5 = { path: "/api/editor" };

// server-src.mjs
var ROOT = path.dirname(fileURLToPath(import.meta.url));
var PUBLIC = fs.existsSync(path.join(ROOT, "public", "index.html")) ? path.join(ROOT, "public") : ROOT;
var PORT = process.env.PORT || 3e3;
var routes = {};
for (const mod of [config_exports, generate_exports, status_exports, health_exports, editor_exports]) routes[mod.config.path] = mod.default;
var TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webp": "image/webp" };
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const handler = routes[url.pathname];
    if (handler) {
      const chunks = [];
      let size = 0;
      for await (const c of req) {
        size += c.length;
        if (size > 8e6) {
          res.writeHead(413, { "content-type": "application/json" });
          res.end('{"error":"\u0424\u043E\u0442\u043E \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u0438\u0435."}');
          return;
        }
        chunks.push(c);
      }
      const request = new Request(url, {
        method: req.method,
        headers: req.headers,
        body: ["GET", "HEAD"].includes(req.method) ? void 0 : Buffer.concat(chunks)
      });
      const out = await handler(request);
      res.writeHead(out.status, Object.fromEntries(out.headers));
      res.end(Buffer.from(await out.arrayBuffer()));
      return;
    }
    let file = path.normalize(path.join(PUBLIC, decodeURIComponent(url.pathname)));
    if (!file.startsWith(PUBLIC)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (PUBLIC === ROOT && !/\.(html|png|jpe?g|svg|ico|webp)$/i.test(file) && path.extname(file)) {
      res.writeHead(404);
      res.end();
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!path.extname(file) && fs.existsSync(file + ".html")) file += ".html";
    if (!fs.existsSync(file)) file = path.join(PUBLIC, "index.html");
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    console.error(e);
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430." }));
  }
}).listen(PORT, () => console.log(`\u0421\u0442\u0443\u0434\u0438\u044F \u0437\u0430\u043F\u0443\u0449\u0435\u043D\u0430 \u043D\u0430 \u043F\u043E\u0440\u0442\u0443 ${PORT}`));
