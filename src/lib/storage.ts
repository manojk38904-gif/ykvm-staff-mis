import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export class LocalStorageAdapter {
  private uploadDir: string;

  constructor(uploadDir?: string) {
    // Vercel serverless supports writing only in /tmp
    this.uploadDir = uploadDir ?? path.join("/tmp", "uploads");
  }

  private async ensureDir() {
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  private safeExt(ext?: string) {
    const e = (ext || "").toLowerCase().replace(".", "");
    const allowed = new Set(["png", "jpg", "jpeg", "webp", "pdf"]);
    return allowed.has(e) ? e : "bin";
  }

  private randomName(ext: string) {
    const id = crypto.randomBytes(16).toString("hex");
    return `${id}.${ext}`;
  }

  async saveBuffer(buffer: Buffer, ext?: string) {
    await this.ensureDir();

    const safe = this.safeExt(ext);
    const fileName = this.randomName(safe);
    const filePath = path.join(this.uploadDir, fileName);

    await fs.writeFile(filePath, buffer);

    return {
      fileName,
      filePath,
      urlPath: `/uploads/${fileName}`,
    };
  }

  async saveBase64Image(base64: string, ext?: string) {
    let data = base64;
    let detectedExt = ext;

    const match = base64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

    if (match) {
      const mime = match[1];
      data = match[2];

      if (!detectedExt) {
        if (mime.includes("png")) detectedExt = "png";
        else if (mime.includes("jpeg")) detectedExt = "jpg";
        else if (mime.includes("webp")) detectedExt = "webp";
      }
    }

    const buffer = Buffer.from(data, "base64");
    return this.saveBuffer(buffer, detectedExt);
  }
}
