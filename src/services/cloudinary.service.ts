import { v2 as cloudinary } from "cloudinary";
import { HttpError } from "../utils/error";
import {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
} from "../configs/env";

interface CloudinaryUploadResult {
  secure_url: string;
}

interface CloudinaryDeleteResult {
  deleted: string[];
}

interface CloudinaryError {
  message: string;
  http_code?: number;
}

export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
    });
  }

  public async uploadImage(
    fileBuffer: Buffer,
    folder: string,
    publicId: string
  ): Promise<string> {
    try {
      return await new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, public_id: publicId },
          (error: CloudinaryError | undefined, result) => {
            if (error)
              reject(
                new HttpError(500, "Gagal mengunggah gambar ke Cloudinary")
              );
            else resolve(result!.secure_url);
          }
        );
        stream.end(fileBuffer);
      });
    } catch (error) {
      throw this.handleError(error, "Gagal mengunggah gambar ke Cloudinary");
    }
  }

  public async deleteImage(publicId: string): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        cloudinary.uploader.destroy(
          publicId,
          { invalidate: true },
          (error: CloudinaryError | undefined) => {
            if (error)
              reject(
                new HttpError(500, "Gagal menghapus gambar dari Cloudinary")
              );
            else resolve();
          }
        );
      });
    } catch (error) {
      throw this.handleError(error, "Gagal menghapus gambar dari Cloudinary");
    }
  }

  public async deleteAllFilesInFolder(folder: string): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        cloudinary.api.delete_resources_by_prefix(
          folder,
          { resource_type: "image" },
          (error: CloudinaryError | undefined) => {
            if (error)
              reject(
                new HttpError(
                  500,
                  `Gagal menghapus file di folder ${folder} dari Cloudinary`
                )
              );
            else resolve();
          }
        );
      });
    } catch (error) {
      throw this.handleError(
        error,
        `Gagal menghapus file di folder ${folder} dari Cloudinary`
      );
    }
  }

  public async deleteFolder(folder: string): Promise<void> {
    try {
      await this.deleteAllFilesInFolder(folder);
      await new Promise<void>((resolve, reject) => {
        cloudinary.api.delete_folder(
          folder,
          (error: CloudinaryError | undefined) => {
            if (error)
              reject(
                new HttpError(
                  500,
                  `Gagal menghapus folder ${folder} dari Cloudinary`
                )
              );
            else resolve();
          }
        );
      });
    } catch (error) {
      throw this.handleError(
        error,
        `Gagal menghapus folder ${folder} dari Cloudinary`
      );
    }
  }

  public getPublicIdFromUrl(url: string): string {
    try {
      const parts = url.split("/");
      const fileName = parts[parts.length - 1];
      const folderPath = parts.slice(parts.indexOf("pengumuman"), -1).join("/");
      const publicId = fileName.split(".")[0];
      return `${folderPath}/${publicId}`;
    } catch (error) {
      throw this.handleError(
        error,
        "Gagal mengekstrak public ID dari URL Cloudinary"
      );
    }
  }

  private handleError(error: unknown, defaultMessage: string): HttpError {
    if (error instanceof HttpError) return error;
    console.error(defaultMessage, error);
    return new HttpError(500, defaultMessage);
  }
}
