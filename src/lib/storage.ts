export type UploadConfig = {
  cloudinary?: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
};

export function getUploadConfig(): UploadConfig | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (cloudName && apiKey && apiSecret) {
    return { cloudinary: { cloudName, apiKey, apiSecret } };
  }
  return null;
}


