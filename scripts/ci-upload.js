const fs = require("fs");
const path = require("path");
const ci = require("miniprogram-ci");

const projectRoot = path.resolve(__dirname, "..");
const appid = process.env.WX_APPID || "wx0bc6e55e4cd3184e";
const privateKeyPath = process.env.WX_PRIVATE_KEY_PATH || path.join(projectRoot, "keys", "private.key");
const version = process.env.WX_VERSION || "1.0.0";
const desc = process.env.WX_DESC || "CI upload";
const robot = Number(process.env.WX_ROBOT || 1);

function assertFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label}不存在：${filePath}`);
  }
}

async function main() {
  assertFile(privateKeyPath, "小程序私钥文件");

  const project = new ci.Project({
    appid,
    type: "miniProgram",
    projectPath: projectRoot,
    privateKeyPath,
    ignores: ["node_modules/**/*"]
  });

  const result = await ci.upload({
    project,
    version,
    desc,
    robot,
    setting: {
      es6: true,
      minifyJS: true,
      minifyWXML: true,
      minifyWXSS: true
    },
    onProgressUpdate: console.log
  });

  console.log("上传成功：", result && result.subPackageInfo ? "含分包" : "主包");
  console.log(`版本号: ${version}`);
  console.log(`备注: ${desc}`);
}

main().catch((err) => {
  console.error("上传失败：", err.message || err);
  process.exit(1);
});
