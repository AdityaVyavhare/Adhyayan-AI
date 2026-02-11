import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import mime from "mime";
import { Alert } from "react-native";
import { supabase } from "./supabase";

/**
 * Get public URL of uploaded file
 */
const geturl = (fileName: string): string => {
  const { data } = supabase.storage.from("Adhyayan").getPublicUrl(fileName);
  return data.publicUrl;
};

/**
 * Upload ANY type of file (image, pdf, video, audio, etc.)
 */
const upload = async (
  uid: string,
  uri: string,
  itemName: string
): Promise<string | undefined> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error("File does not exist");
    }

    const extension = uri.split(".").pop() ?? "bin";
    const sanitizedItemName = itemName.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `${uid}/${sanitizedItemName}.${extension}`;

    const contentType =
      mime.getType(uri) ?? "application/octet-stream";

    console.log("Uploading:", {
      fileName,
      contentType,
      size: fileInfo.size,
    });

    // Read as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 → Uint8Array (RN-safe)
    const fileBuffer = Uint8Array.from(
      Buffer.from(base64, "base64")
    );

    const { error } = await supabase.storage
      .from("Adhyayan")
      .upload(fileName, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      throw error;
    }

    return geturl(fileName);
  } catch (error: any) {
    console.error("Upload error:", error);
    Alert.alert("Upload Error", error.message || "Upload failed");
    return undefined;
  }
};

/**
 * Delete file from Supabase Storage
 */
export const deletee = async (path: string): Promise<void> => {
  const { error } = await supabase.storage
    .from("Adhyayan")
    .remove([path]);

  if (error) {
    console.log("Delete error:", error.message);
  } else {
    console.log("File deleted successfully");
  }
};

export default upload;
