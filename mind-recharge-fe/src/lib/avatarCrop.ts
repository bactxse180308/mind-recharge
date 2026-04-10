export const CROP_SIZE = 280;
export const OUTPUT_SIZE = 512;

export type CropDraft = {
  file: File;
  previewUrl: string;
  imageUrl: string;
  zoom: number;
  offsetX: number;
  offsetY: number;
  naturalWidth: number;
  naturalHeight: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getCoverMetrics(
  naturalWidth: number,
  naturalHeight: number,
  zoom: number,
  offsetX: number,
  offsetY: number
) {
  const baseScale = Math.max(CROP_SIZE / naturalWidth, CROP_SIZE / naturalHeight);
  const scale = baseScale * zoom;
  const displayWidth = naturalWidth * scale;
  const displayHeight = naturalHeight * scale;
  const maxOffsetX = Math.max(0, (displayWidth - CROP_SIZE) / 2);
  const maxOffsetY = Math.max(0, (displayHeight - CROP_SIZE) / 2);

  return {
    scale,
    displayWidth,
    displayHeight,
    offsetX: clamp(offsetX, -maxOffsetX, maxOffsetX),
    offsetY: clamp(offsetY, -maxOffsetY, maxOffsetY),
  };
}

export async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export async function createCroppedFile(draft: CropDraft) {
  const image = await loadImage(draft.imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const metrics = getCoverMetrics(
    draft.naturalWidth,
    draft.naturalHeight,
    draft.zoom,
    draft.offsetX,
    draft.offsetY
  );

  const imageLeft = (CROP_SIZE - metrics.displayWidth) / 2 + metrics.offsetX;
  const imageTop = (CROP_SIZE - metrics.displayHeight) / 2 + metrics.offsetY;
  const sourceX = (0 - imageLeft) / metrics.scale;
  const sourceY = (0 - imageTop) / metrics.scale;
  const sourceSize = CROP_SIZE / metrics.scale;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available");
  }

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );

  const outputType = draft.file.type === "image/png" ? "image/png" : "image/jpeg";
  const extension = outputType === "image/png" ? "png" : "jpg";

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (!result) {
        reject(new Error("Cannot create cropped image"));
        return;
      }
      resolve(result);
    }, outputType, 0.92);
  });

  return new File([blob], `avatar-crop.${extension}`, { type: outputType });
}
