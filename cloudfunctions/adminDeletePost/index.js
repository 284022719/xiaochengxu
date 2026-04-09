const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const ADMIN_OPENID = "olxg13YwLHevaY7qYxzN14xEeBbk";

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const callerOpenid = wxContext.OPENID;
  const { collection, id } = event || {};

  if (callerOpenid !== ADMIN_OPENID) {
    return { code: 403, msg: "无权限" };
  }
  if (!["secondhand", "rental"].includes(collection)) {
    return { code: 400, msg: "非法集合" };
  }
  if (!id) {
    return { code: 422, msg: "缺少id" };
  }

  await db.collection(collection).doc(id).remove();
  return { code: 0, msg: "ok" };
};
