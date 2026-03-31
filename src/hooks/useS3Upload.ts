import AWS from 'aws-sdk';
import { Buffer } from 'buffer';
import { useCallback, useState } from 'react';
import {
  NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
  NEXT_PUBLIC_AWS_BUCKET_NAME_FOR_IMAGES,
  NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
  NEXT_PUBLIC_S3_REGION,
} from '@env';

const MAX_BYTES = 5 * 1024 * 1024;

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
    }) => {
      const { uri, base64, fileName, mimeType, fileSize } = params;
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
          'Image upload is not configured. Add NEXT_PUBLIC_AWS_* S3 variables to .env.';
        setError(msg);
        setLoading(false);
        throw new Error(msg);
      }

      if (typeof fileSize === 'number' && fileSize > MAX_BYTES) {
        const msg = 'Image size should be less than 5MB';
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
        const safeName =
          fileName?.replace?.(/[^a-zA-Z0-9._-]/g, '_') ?? 'image.jpg';
        const key = `${Date.now()}-${safeName}`;
        const contentType = mimeType?.trim?.() || 'image/jpeg';

        let body: Buffer;
        const b64 = base64?.trim?.();
        if (b64?.length) {
          const raw = b64.replace(/^data:image\/\w+;base64,/, '');
          body = Buffer.from(raw, 'base64');
        } else {
          const res = await fetch(uri);
          if (!res?.ok) {
            throw new Error('Could not read image from device');
          }
          const ab = await res.arrayBuffer();
          body = Buffer.from(ab);
        }

        if (body.length > MAX_BYTES) {
          throw new Error('Image size should be less than 5MB');
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
          e instanceof Error ? e.message : 'Image upload failed. Try again.';
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
