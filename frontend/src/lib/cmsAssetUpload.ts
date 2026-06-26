import { supabase } from './supabase';
import { uploadPublicAssetToImageKit } from './publicImagekitUpload';
import { uploadToR2 } from './r2Upload';
import { slugify } from '../utils/merchant';

export type CmsAssetKind = 'image' | 'video';

const IMAGEKIT_CMS_BUCKET_FOLDERS: Partial<Record<string, string>> = {
  'charm-bar-assets': 'charm-bar-assets',
  'rollerblade-assets': 'rollerblade-assets',
  'events-schedule': 'events-schedule',
};

// R2-enabled buckets (rollerblade uses R2)
const R2_CMS_BUCKETS = ['rollerblade-assets'];

export async function uploadCmsAsset(params: {
  file: File;
  bucket: string;
  prefix: string;
  kind: CmsAssetKind;
  maxSizeMb?: number;
  folder?: string;
  onUploaded?: (publicUrl: string) => void;
  showToast?: (type: 'success' | 'error', message: string) => void;
}) {
  const { file, bucket, prefix, kind, onUploaded, showToast } = params;
  const maxSizeMb = params.maxSizeMb ?? (kind === 'image' ? 5 : 50);
  const folder = params.folder ?? 'settings';

  if (!file.type.startsWith(`${kind}/`)) {
    throw new Error(`Please upload a valid ${kind} file`);
  }

  if (file.size > maxSizeMb * 1024 * 1024) {
    throw new Error(`${kind} size must be less than ${maxSizeMb}MB`);
  }

  const ext = file.name.split('.').pop() || (kind === 'image' ? 'jpg' : 'mp4');
  const baseName = slugify(file.name.replace(/\.[^.]+$/, '')) || `${kind}-asset`;
  const fileName = `${prefix}-${baseName}-${Date.now()}.${ext}`;
  const filePath = `${folder}/${fileName}`;

  showToast?.('success', `Uploading ${kind}...`);

  // Priority 1: R2 upload for specific buckets (Rollerblade CMS)
  // SAFETY: Only use R2 if explicitly enabled via environment variable
  const useR2 = R2_CMS_BUCKETS.includes(bucket) && 
                import.meta.env.VITE_USE_R2_UPLOAD === 'true';
  
  if (useR2) {
    try {
      console.log('[CMS Upload] Using R2 upload (productId = 0 for CMS)');
      
      // Use R2 with special CMS identifier (productId = 0 for CMS assets)
      const publicUrl = await uploadToR2({
        file,
        productId: 0, // Special ID for CMS assets (non-product images)
        onProgress: (progress) => {
          if (progress === 100) {
            showToast?.('success', `${kind === 'image' ? 'Image' : 'Video'} uploaded successfully to R2`);
          }
        },
      });

      onUploaded?.(publicUrl);
      return publicUrl;
    } catch (error) {
      console.warn('[CMS Upload] R2 upload failed, using Supabase Storage fallback:', error);
      // Silent fallback - continue to Supabase Storage without showing error to user
    }
  } else {
    console.log('[CMS Upload] R2 disabled (VITE_USE_R2_UPLOAD not set to "true"), using fallback');
  }

  // Priority 2: ImageKit upload for specific buckets
  const imageKitBucketFolder = IMAGEKIT_CMS_BUCKET_FOLDERS[bucket];
  if (imageKitBucketFolder) {
    const publicUrl = await uploadPublicAssetToImageKit({
      file,
      fileName,
      folderPath: `/public/${imageKitBucketFolder}/${folder}`,
    });

    onUploaded?.(publicUrl);
    showToast?.('success', `${kind === 'image' ? 'Image' : 'Video'} uploaded successfully`);
    return publicUrl;
  }

  // Priority 3: Fallback to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { upsert: true, cacheControl: '31536000' });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);

  onUploaded?.(publicUrl);
  showToast?.('success', `${kind === 'image' ? 'Image' : 'Video'} uploaded successfully`);

  return publicUrl;
}
