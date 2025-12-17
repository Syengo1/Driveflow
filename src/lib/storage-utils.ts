import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a file to Supabase storage and returns the public URL.
 * @param file The Browser File object
 * @param folder The folder path (e.g., 'models' or 'units')
 */
export const uploadMedia = async (file: File, folder: string): Promise<string | null> => {
  try {
    // 1. Generate a unique filename to prevent overwriting
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // 2. Upload the file to the 'fleet-media' bucket
    const { error: uploadError } = await supabase.storage
      .from('fleet-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 3. Get the Public URL so the website can display it
    const { data } = supabase.storage
      .from('fleet-media')
      .getPublicUrl(filePath);

    return data.publicUrl;

  } catch (error) {
    console.error("Upload failed:", error);
    throw error; // Re-throw so the wizard knows it failed
  }
};