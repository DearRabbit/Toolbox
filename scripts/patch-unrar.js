const fs = require('node:fs');

const unrarFile = "node_modules/node-unrar-js/dist/js/unrar.js";

if (fs.existsSync(unrarFile)) {
  let content = fs.readFileSync(unrarFile, "utf8");
  content = content.replace("offsetLo+offsetHi*4294967296", "Number((BigInt(offsetLo) & 0xffffffffn) + (BigInt(offsetHi) * 0x100000000n))");
  fs.writeFileSync(unrarFile, content);
}
