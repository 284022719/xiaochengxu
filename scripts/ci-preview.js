const fs = require("fs");
const path = require("path");
const ci = require("miniprogram-ci");

const projectRoot = path.resolve(__dirname, "..");
const appid = process.env.WX_APPID || "wx0bc6e55e4cd3184e";
const privateKeyPath = process.env.WX_PRIVATE_KEY_PATH || path.join(projectRoot, "keys", "private.key");
const desc = process.env.WX_DESC || "CI preview";
const pagePath = process.env.WX_PAGE || "pages/home/index";
const robot = Number(process.env.WX_ROBOT || 1);
const qrcodePath = path.join(projectRoot, "output", "preview.jpg");

function assertFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label}不存在：${filePath}`);
  }
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

async function main() {
  assertFile(privateKeyPath, "小程序私钥文件");
  ensureDir(path.dirname(qrcodePath));

  const project = new ci.Project({
    appid,
    type: "miniProgram",
    projectPath: projectRoot,
    privateKeyPath,
    ignores: ["node_modules/**/*"]
  });

  await ci.preview({
    project,
    desc,
    robot,
    qrcodeFormat: "image",
    qrcodeOutputDest: qrcodePath,
    pagePath,
    setting: {
      es6: true,
      minifyJS: true,
      minifyWXML: true,
      minifyWXSS: true
    },
    onProgressUpdate: console.log
  });

  console.log("预览二维码生成成功：", qrcodePath);
}

main().catch((err) => {
  console.error("预览失败：", err.message || err);
  process.exit(1);
});
