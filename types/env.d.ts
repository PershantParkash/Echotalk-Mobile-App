declare module "@env" {
  export const NEXT_PUBLIC_API_URL: string;
  export const NEXT_PUBLIC_API_BASE: string;
  export const NEXT_PUBLIC_S3_REGION: string;
  export const NEXT_PUBLIC_AWS_ACCESS_KEY_ID: string;
  export const NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY: string;
  export const NEXT_PUBLIC_AWS_BUCKET_NAME_FOR_IMAGES: string;
  export const NEXT_PUBLIC_AGORA_APP_ID: string;
  export const NEXT_PUBLIC_AGORA_APP_CERTIFICATE: string;
  export const NEXT_PUBLIC_SIGN_WS_URL: string;
  export const NEXT_PUBLIC_FRAME_INTERVAL: string;
}

declare module '@env' {
  export const NEXT_PUBLIC_API_URL: string;
  export const NEXT_PUBLIC_API_BASE: string;
  export const API_URL: string;
  export const API_KEY: string;
  /** Same S3 vars as chat-and-talk-frontend (useS3Upload). */
  export const NEXT_PUBLIC_AWS_BUCKET_NAME_FOR_IMAGES: string;
  export const NEXT_PUBLIC_S3_REGION: string;
  export const NEXT_PUBLIC_AWS_ACCESS_KEY_ID: string;
  export const NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY: string;
  export const NEXT_PUBLIC_SIGN_WS_URL: string;
  export const NEXT_PUBLIC_FRAME_INTERVAL: string;
}