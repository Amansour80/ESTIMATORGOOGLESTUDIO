export async function getLogoAsBase64(logoUrl: string | null): Promise<string | null> {
  if (!logoUrl) return null;

  try {
    const response = await fetch(logoUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting logo to base64:', error);
    return null;
  }
}

export function calculateLogoSize(
  maxWidth: number,
  maxHeight: number,
  imgWidth: number,
  imgHeight: number
): { width: number; height: number } {
  const aspectRatio = imgWidth / imgHeight;

  let width = maxWidth;
  let height = maxWidth / aspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = maxHeight * aspectRatio;
  }

  return { width, height };
}
