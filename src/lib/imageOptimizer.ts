export const generateOptimizedImages = async (base64Str: string) => {
  const sizes = [150, 600, 1200];
  const results: Record<string, string> = {};
  
  return new Promise<{ original: string, thumbnails: Record<string, string> }>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve({ original: base64Str, thumbnails: {} });

      sizes.forEach(size => {
        const ratio = Math.min(size / img.width, size / img.height);
        // Don't upscale
        const width = ratio < 1 ? img.width * ratio : img.width;
        const height = ratio < 1 ? img.height * ratio : img.height;
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        results[size.toString()] = canvas.toDataURL("image/webp", 0.82);
      });
      resolve({ original: base64Str, thumbnails: results });
    };
    img.onerror = () => resolve({ original: base64Str, thumbnails: {} });
    img.src = base64Str;
  });
};
