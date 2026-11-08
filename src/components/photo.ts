/** Photo → small JPEG + pixels, all on this device. Nothing is uploaded. */

const MAX_EDGE = 480;
const MAX_BYTES = 150 * 1024;

export interface LoadedPhoto {
  dataUrl: string;
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
}

/** Approximate decoded size of a base64 data URL. */
const bytesOf = (dataUrl: string) => Math.ceil(((dataUrl.length - dataUrl.indexOf(",") - 1) * 3) / 4);

export async function loadPhoto(file: File): Promise<LoadedPhoto> {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't an image we can read.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("That file isn't an image we can read.");
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("This browser can't read photos.");
  // JPEG has no alpha: paint paper white first so transparent PNGs don't turn black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const pixels = ctx.getImageData(0, 0, width, height).data;
  for (const q of [0.8, 0.65, 0.5]) {
    const dataUrl = canvas.toDataURL("image/jpeg", q);
    if (bytesOf(dataUrl) <= MAX_BYTES) return { dataUrl, pixels, width, height };
  }
  throw new Error("That photo is too large to keep.");
}
