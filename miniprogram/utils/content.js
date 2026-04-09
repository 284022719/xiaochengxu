const db = wx.cloud.database();

const DEFAULT_CONTENT = {
  secondhandPublish: {
    sectionTitleCreate: "提交闲置",
    sectionTitleEdit: "编辑闲置",
    tip: "提交成功后将立即显示。",
    titlePlaceholder: "标题（如：9成新电饭煲）",
    descPlaceholder: "描述（成色、使用情况等）",
    imageLabel: "图片（最多3张）",
    submitTextCreate: "提交闲置",
    submitTextEdit: "保存修改"
  },
  rentalPublish: {
    sectionTitleCreate: "提交房屋信息",
    sectionTitleEdit: "编辑房屋信息",
    tip: "提交成功后将立即显示。",
    titlePlaceholder: "标题（如：转租/合租）",
    descPlaceholder: "描述（如：户型、租金、起租时间等）",
    imageLabel: "房源图片（最多3张）",
    submitTextCreate: "提交房屋信息",
    submitTextEdit: "保存修改"
  }
};

function isObject(v) {
  return Object.prototype.toString.call(v) === "[object Object]";
}

function deepMerge(base, ext) {
  const out = { ...base };
  if (!isObject(ext)) return out;
  Object.keys(ext).forEach((key) => {
    if (isObject(base[key]) && isObject(ext[key])) {
      out[key] = deepMerge(base[key], ext[key]);
    } else {
      out[key] = ext[key];
    }
  });
  return out;
}

async function getContentConfig() {
  const cacheKey = "content_config_cache";
  const cached = wx.getStorageSync(cacheKey);
  if (cached) {
    return deepMerge(DEFAULT_CONTENT, cached);
  }

  try {
    const res = await db.collection("content_config").doc("ui_texts").get();
    const remote = (res && res.data) || {};
    const merged = deepMerge(DEFAULT_CONTENT, remote);
    wx.setStorageSync(cacheKey, merged);
    return merged;
  } catch (e) {
    return DEFAULT_CONTENT;
  }
}

module.exports = {
  getContentConfig,
  DEFAULT_CONTENT
};
