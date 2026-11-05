import type { CreateListingState } from "@/lib/types";

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.72;
const SKIP_UNDER_BYTES = 1024 * 1024;
const TARGET_MAX_BYTES = 1024 * 1024;

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type ListingFormAction = (
  previous: CreateListingState,
  formData: FormData,
) => Promise<CreateListingState>;

function jpegFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "") || "photo";
  return `${base}.jpg`;
}

function scaleDimensions(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) {
    return { width, height };
  }
  const scale = maxEdge / longEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
  if (!blob) {
    throw new Error("Could not encode the photo.");
  }
  return blob;
}

export async function compressPhoto(file: File): Promise<File> {
  if (!ACCEPTED_TYPES.has(file.type)) {
    return file;
  }

  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });

  try {
    const { width, height } = scaleDimensions(
      bitmap.width,
      bitmap.height,
      MAX_EDGE,
    );
    const alreadySmall =
      file.size <= SKIP_UNDER_BYTES &&
      width === bitmap.width &&
      height === bitmap.height &&
      file.type === "image/jpeg";

    if (alreadySmall) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not prepare the photo.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);

    let quality = JPEG_QUALITY;
    let blob = await canvasToJpegBlob(canvas, quality);

    while (blob.size > TARGET_MAX_BYTES && quality > 0.4) {
      quality = Math.max(0.4, quality - 0.1);
      blob = await canvasToJpegBlob(canvas, quality);
    }

    return new File([blob], jpegFileName(file.name), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

export async function replacePhotosInFormData(
  formData: FormData,
): Promise<FormData> {
  const photos = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (photos.length === 0) {
    return formData;
  }

  const compressed = await Promise.all(photos.map((photo) => compressPhoto(photo)));
  const next = new FormData();

  for (const [key, value] of formData.entries()) {
    if (key === "photos") {
      continue;
    }
    next.append(key, value);
  }

  for (const photo of compressed) {
    next.append("photos", photo);
  }

  return next;
}

export async function submitWithCompressedPhotos(
  serverAction: ListingFormAction,
  previous: CreateListingState,
  formData: FormData,
): Promise<CreateListingState> {
  try {
    const compressed = await replacePhotosInFormData(formData);
    return serverAction(previous, compressed);
  } catch {
    return {
      fieldErrors: {
        photos: "Could not prepare the photos. Try different images.",
      },
    };
  }
}
