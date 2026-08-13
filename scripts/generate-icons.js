"use strict";

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function makeIcon(size) {
  const rows = [];
  const corner = Math.max(2, Math.floor(size * 0.18));
  const margin = Math.max(2, Math.floor(size * 0.17));

  for (let y = 0; y < size; y += 1) {
    const row = Buffer.alloc(1 + size * 4);
    for (let x = 0; x < size; x += 1) {
      const dx = Math.min(x, size - 1 - x);
      const dy = Math.min(y, size - 1 - y);
      const outsideCorner = dx < corner && dy < corner && ((corner - dx) ** 2 + (corner - dy) ** 2 > corner ** 2);
      const offset = 1 + x * 4;
      const insideMark = x >= margin && x < size - margin && y >= margin && y < size - margin;
      const drawBar = insideMark && (
        (y >= Math.floor(size * 0.30) && y < Math.floor(size * 0.39)) ||
        (y >= Math.floor(size * 0.47) && y < Math.floor(size * 0.56) && x >= Math.floor(size * 0.30)) ||
        (y >= Math.floor(size * 0.64) && y < Math.floor(size * 0.73) && x >= Math.floor(size * 0.44))
      );

      if (outsideCorner) {
        row.set([0, 0, 0, 0], offset);
      } else if (drawBar) {
        row.set([255, 255, 255, 255], offset);
      } else {
        row.set([0, 120, 212, 255], offset);
      }
    }
    rows.push(row);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 6, 0, 0, 0], 8);

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

const outputDirectory = path.resolve(__dirname, "..", "icons");
fs.mkdirSync(outputDirectory, { recursive: true });

for (const size of [16, 32, 48, 128]) {
  fs.writeFileSync(path.join(outputDirectory, `icon-${size}.png`), makeIcon(size));
}
