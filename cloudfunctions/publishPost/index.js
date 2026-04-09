const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const callerOpenid = wxContext.OPENID;
  const { collection, payload = {} } = event;

  if (!["secondhand", "rental"].includes(collection)) {
    return { code: 400, msg: "非法集合" };
  }

  let data = {};
  if (collection === "secondhand") {
    data = {
      title: (payload.title || "").trim(),
      desc: (payload.desc || "").trim(),
      images: Array.isArray(payload.images) ? payload.images.slice(0, 3) : [],
      price: Number(payload.price || 0),
      contact: (payload.contact || payload.nickName || "微信用户").trim(),
      nickName: (payload.nickName || "微信用户").trim(),
      avatarUrl: (payload.avatarUrl || "").trim(),
      _openid: callerOpenid,
      status: 1,
      sold: false,
      createTime: db.serverDate()
    };
  } else {
    data = {
      title: (payload.title || "").trim(),
      desc: (payload.desc || "").trim(),
      community: (payload.title || "").trim(),
      roomType: "",
      price: Number(payload.price || 0),
      startDate: "",
      contact: (payload.contact || payload.nickName || "微信用户").trim(),
      nickName: (payload.nickName || "微信用户").trim(),
      avatarUrl: (payload.avatarUrl || "").trim(),
      images: Array.isArray(payload.images) ? payload.images.slice(0, 3) : [],
      _openid: callerOpenid,
      status: 1,
      rented: false,
      createTime: db.serverDate()
    };
  }

  const required = collection === "secondhand"
    ? ["title", "desc"]
    : ["title", "desc"];

  for (const key of required) {
    if (!data[key]) return { code: 422, msg: `缺少字段：${key}` };
  }
  if (!data.images.length) return { code: 422, msg: "至少上传一张图片" };
  const res = await db.collection(collection).add({ data });
  return {
    code: 0,
    msg: "ok",
    id: res._id
  };
};
