import { STYLES, FORMATS, MAX_IMAGES, ACCESS_CODE, json } from "../shared/studio.mjs";

export default async () =>
  json({
    requiresCode: Boolean(ACCESS_CODE),
    maxVariants: MAX_IMAGES,
    styles: STYLES.map(({ id, name, desc, light, swatch }) => ({ id, name, desc, light, swatch })),
    formats: FORMATS,
  });

export const config = { path: "/api/config" };
