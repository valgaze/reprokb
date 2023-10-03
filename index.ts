import * as fs from "fs";
import { resolve } from "path";

// CONFIG
const ACCESS_TOKEN = `VF.DM.xxxxxxxxxxxxxxxx`;
const FILE_NAME = "bongo.txt"; // same directory as script

export async function uploadFile(
  fileName: string,
  fileData: Buffer
): Promise<void> {
  const url = "https://api.voiceflow.com/v3alpha/knowledge-base/docs/upload";
  const queryParams = new URLSearchParams({
    maxChunkSize: "1000",
    overwrite: "true",
  });

  const headers = {
    Authorization: `Bearer ${ACCESS_TOKEN}`, // assuming this.apiToken is available
    "Content-Type": "multipart/form-data",
    Accept: "application/json",
  };

  const formData = new FormData();
  const blob = new Blob([fileData], {
    type: guessContentType(fileName),
  });

  formData.append("file", blob, fileName);

  const response = await fetch(`${url}?${queryParams}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const json = await response.json();
    console.log("ERR", json);
    throw new Error(`File upload failed with status ${response.status}`);
  }
}

(async () => {
  try {
    const filePath = resolve(__dirname, FILE_NAME);

    const fileData = await fs.promises.readFile(filePath);
    await uploadFile(FILE_NAME, fileData);
    console.log("File uploaded successfully!");
  } catch (error) {
    console.error("Error uploading file:", error);
  }
})();

export const guessContentType = (extensionOrFileName: string) => {
  const hasDot = extensionOrFileName.indexOf(".") > -1;
  let extension = "";
  const pieces = extensionOrFileName.split(".");
  const hasMultipleDots = pieces.length > 2;
  const [prefix, ext] = pieces;
  if (hasDot) {
    // ".png"
    // "a.png"
    // "*.png"
    if (!prefix || prefix === "*") {
      extension = ext;
    }
    // a.b.c.png
    if (hasMultipleDots) {
      // last piece will be extension
      extension = pieces.pop() as string;
    }
  } else {
    // "png"
    extension = prefix;
  }
  const mapping: { [key: string]: string } = {
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    bmp: "image/bmp",
    gif: "image/gif",
    png: "image/png",
    txt: "text/plain",
    csv: "text/csv",
    html: "text/html",
    json: "application/json",
    "*": "application/octet-stream", // #gbogh
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    mpeg: "video/mpeg",
    mpkg: "application/vnd.apple.installer+xml",
    vf: "application/json", // voiceflow
  };
  const res = mapping[extension] || "application/octet-stream";
  return res;
};
