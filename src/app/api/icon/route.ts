import { NextRequest, NextResponse } from "next/server";
import zlib from "zlib";

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function buildBookIconPng(size: number): Buffer {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const spineW = Math.round(size * 0.14);
  const pad = Math.round(size * 0.16);

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0; // filter none
    for (let x = 0; x < size; x++) {
      const px = rowStart + 1 + x * 4;
      // Warm cream hardcover icon with vermilion book spine & dark Z letterform
      let r = 244,
        g = 239,
        b = 230;
      if (x < spineW) {
        r = 139;
        g = 38;
        b = 29;
      } else if (
        (y === pad || y === size - pad) &&
        x >= spineW + pad &&
        x <= size - pad
      ) {
        r = 25;
        g = 22;
        b = 19;
      } else {
        // Crisp geometric 'Z' monogram in the center
        const zx0 = Math.round(size * 0.34);
        const zx1 = Math.round(size * 0.78);
        const zy0 = Math.round(size * 0.3);
        const zy1 = Math.round(size * 0.7);
        const stroke = Math.max(4, Math.round(size * 0.065));

        const inTopBar = x >= zx0 && x <= zx1 && y >= zy0 && y <= zy0 + stroke;
        const inBotBar = x >= zx0 && x <= zx1 && y >= zy1 - stroke && y <= zy1;
        const diagT = (y - zy0) / (zy1 - zy0);
        const diagX = zx1 - diagT * (zx1 - zx0);
        const inDiag =
          y >= zy0 &&
          y <= zy1 &&
          Math.abs(x - diagX) <= stroke * 0.65;

        if (inTopBar || inBotBar || inDiag) {
          r = 25;
          g = 22;
          b = 19;
        }
      }
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
      raw[px + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const idat = zlib.deflateSync(raw);

  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

export async function GET(req: NextRequest) {
  const reqSize = Number(req.nextUrl.searchParams.get("size") || "192");
  const size = reqSize === 512 ? 512 : 192;
  const buf = buildBookIconPng(size);

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
