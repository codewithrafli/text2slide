/**
 * Supabase Storage utilities for profile picture uploads
 */

import { supabase } from '../db/client';

const getBucketName = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'profiles';
};

const bucketName = getBucketName();

/**
 * Upload a profile picture to Supabase Storage
 * @param file - The image file to upload
 * @param userId - Unique identifier (we'll use generation ID or timestamp)
 * @returns Public URL of the uploaded image
 */
export async function uploadProfilePicture(
  file: File,
  userId: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { url: null, error: error.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(data.path);

    return { url: publicUrl, error: null };
  } catch (err) {
    console.error('Unexpected upload error:', err);
    return {
      url: null,
      error: err instanceof Error ? err.message : 'Upload failed',
    };
  }
}

/**
 * Delete a profile picture from Supabase Storage
 * @param url - The public URL of the image to delete
 */
export async function deleteProfilePicture(
  url: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Extract file path from URL
    const urlParts = url.split(`${bucketName}/`);
    if (urlParts.length < 2) {
      return { success: false, error: 'Invalid URL format' };
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Unexpected delete error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Delete failed',
    };
  }
}
