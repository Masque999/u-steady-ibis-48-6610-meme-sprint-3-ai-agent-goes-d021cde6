import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Meme Sprint 3: AI Agent Goes Rogue — the entry is one image meme about
// an AI agent that has gone rogue. The meme ships in this repo as meme.jpg;
// the program writes it to /output/entry.png, the path the sealed scorer
// reads.
const SRC = fileURLToPath(new URL("./meme.jpg", import.meta.url));

const data = readFileSync(SRC);

// The gate checks a whole PNG or JPEG, at most 1 MiB and 1024x1024 px.
const isPng =
  data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47;
const isJpeg = data[0] === 0xff && data[1] === 0xd8;
if (!isPng && !isJpeg) {
  throw new Error("meme.jpg is not a PNG or JPEG");
}
if (data.length > 1048576) {
  throw new Error(`meme.jpg is ${data.length} bytes, over the 1 MiB cap`);
}

function jpegSize(buf: Buffer): [number, number] {
  let i = 2;
  while (i < buf.length - 1) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const len = buf.readUInt16BE(i + 2);
    if (marker === 0xc0 || marker === 0xc2) {
      return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
    }
    i += 2 + len;
  }
  throw new Error("no SOF marker found in JPEG");
}

if (isPng) {
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  if (width > 1024 || height > 1024) {
    throw new Error(`meme is ${width}x${height}, over the 1024x1024 cap`);
  }
} else {
  const [width, height] = jpegSize(data);
  if (width > 1024 || height > 1024) {
    throw new Error(`meme is ${width}x${height}, over the 1024x1024 cap`);
  }
}

mkdirSync("/output", { recursive: true });
copyFileSync(SRC, "/output/entry.png");
