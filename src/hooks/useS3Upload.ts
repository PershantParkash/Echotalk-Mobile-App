import AWS from 'aws-sdk';
import { Buffer } from 'buffer';
import { useCallback, useState } from 'react';
import RNFS from 'react-native-fs';
import {
  NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
  NEXT_PUBLIC_AWS_BUCKET_NAME_FOR_IMAGES,
  NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
  NEXT_PUBLIC_S3_REGION,
} from '@env';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VOICE_BYTES = 25 * 1024 * 1024;

const fileUriToFsPath = (uri: string): string => {
  let u = uri?.trim?.() ?? '';
  if (u.startsWith('file://')) {
    u = u.replace(/^file:\/\//, '');
  }
  try {
    return decodeURIComponent(u);
  } catch {
    return u;
  }
};

const useS3Upload = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadImageFromUri = useCallback(
    async (params: {
      uri: string;
      /** Prefer this on RN: reading local files via fetch(uri) often throws "Network request failed". */
      base64?: string | null;
      fileName?: string | null;
      mimeType?: string | null;
      fileSize?: number | null;
      /** Larger limit for voice notes (matches web chat attachment cap). */
      kind?: 'image' | 'voice';
    }) => {
      const { uri, base64, fileName, mimeType, fileSize, kind = 'image' } =
        params;
      const maxBytes = kind === 'voice' ? MAX_VOICE_BYTES : MAX_IMAGE_BYTES;
      const sizeLabel = kind === 'voice' ? 'Voice' : 'Image';
      setLoading(true);
      setError(null);
      setProgress(0);

      const bucketName =
        NEXT_PUBLIC_AWS_BUCKET_NAME_FOR_IMAGES?.trim?.() ?? '';
      const region = NEXT_PUBLIC_S3_REGION?.trim?.() ?? '';
      const accessKeyId = NEXT_PUBLIC_AWS_ACCESS_KEY_ID?.trim?.() ?? '';
      const secretAccessKey =
        NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY?.trim?.() ?? '';

      if (
        !bucketName?.length ||
        !region?.length ||
        !accessKeyId?.length ||
        !secretAccessKey?.length
      ) {
        const msg =
          'Upload is not configured. Add NEXT_PUBLIC_AWS_* S3 variables to .env.';
        setError(msg);
        setLoading(false);
        throw new Error(msg);
      }

      if (typeof fileSize === 'number' && fileSize > maxBytes) {
        const msg =
          kind === 'voice'
            ? 'Voice message is too large. Try a shorter recording.'
            : 'Image size should be less than 5MB';
        setError(msg);
        setLoading(false);
        throw new Error(msg);
      }

      try {
        AWS.config.update({
          region,
          accessKeyId,
          secretAccessKey,
        });

        const s3 = new AWS.S3({ signatureVersion: 'v4' });
        const defaultName = kind === 'voice' ? 'voice.m4a' : 'image.jpg';
        const safeName =
          fileName?.replace?.(/[^a-zA-Z0-9._-]/g, '_') ?? defaultName;
        const key = `chat-uploads/${Date.now()}-${safeName}`;
        const contentType =
          mimeType?.trim?.() ||
          (kind === 'voice' ? 'audio/mp4' : 'image/jpeg');

        let body: Buffer;
        const b64 = base64?.trim?.();
        if (b64?.length) {
          const raw = b64.replace(/^data:(image|audio)\/\w+;base64,/, '');
          body = Buffer.from(raw, 'base64');
        } else if (kind === 'voice') {
          const pathOnly = fileUriToFsPath(uri);
          const exists = await RNFS.exists(pathOnly);
          if (!exists) {
            throw new Error('Could not read voice recording from device.');
          }
          const rawB64 = await RNFS.readFile(pathOnly, 'base64');
          body = Buffer.from(rawB64, 'base64');
        } else {
          // On Android, `fetch(file://...)` frequently throws "Network request failed".
          // Read the file directly from the filesystem instead.
          const pathOnly = fileUriToFsPath(uri);
          const exists = await RNFS.exists(pathOnly);
          if (!exists) {
            throw new Error('Image data not found on device.');
          }
          const rawB64 = await RNFS.readFile(pathOnly, 'base64');
          body = Buffer.from(rawB64, 'base64');
        }

        if (body.length > maxBytes) {
          throw new Error(
            kind === 'voice'
              ? 'Voice message is too large. Try a shorter recording.'
              : 'Image size should be less than 5MB',
          );
        }

        const managed = s3.upload({
          Bucket: bucketName,
          Key: key,
          Body: body,
          ContentType: contentType,
        });

        managed.on('httpUploadProgress', evt => {
          const total = evt.total;
          const loaded = evt.loaded;
          if (total && total > 0) {
            setProgress(Math.round((loaded / total) * 100));
          }
        });

        const result = await managed.promise();
        const location = result?.Location;
        if (!location) {
          throw new Error('Upload finished but no URL was returned');
        }
        return location;
      } catch (e: unknown) {
        const msg =
          e instanceof Error
            ? e.message
            : `${sizeLabel} upload failed. Try again.`;
        setError(msg);
        throw e instanceof Error ? e : new Error(msg);
      } finally {
        setLoading(false);
        setProgress(0);
      }
    },
    [],
  );

  return { uploadImageFromUri, loading, error, progress };
};

export default useS3Upload;
