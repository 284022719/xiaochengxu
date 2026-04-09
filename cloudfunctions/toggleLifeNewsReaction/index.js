const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { newsId, type } = event || {};
  if (!newsId || !["like", "dislike"].includes(type)) {
    return { code: 422, msg: "参数错误" };
  }

  const newsRef = db.collection("life_news").doc(newsId);
  const reactionId = `${newsId}_${openid}`;
  const reactionRef = db.collection("life_news_reactions").doc(reactionId);
  let current = null;
  try {
    const reactionRes = await reactionRef.get();
    current = reactionRes.data || null;
  } catch (e) {
    current = null;
  }

  if (!current) {
    await reactionRef.set({
      data: {
        newsId,
        type,
        createTime: db.serverDate()
      }
    });
    await newsRef.update({
      data: type === "like"
        ? { likeCount: _.inc(1) }
        : { dislikeCount: _.inc(1) }
    });
    return { code: 0, reaction: type };
  }

  if (current.type === type) {
    await reactionRef.remove();
    await newsRef.update({
      data: type === "like"
        ? { likeCount: _.inc(-1) }
        : { dislikeCount: _.inc(-1) }
    });
    return { code: 0, reaction: "" };
  }

  await reactionRef.update({
    data: { type }
  });
  await newsRef.update({
    data: type === "like"
      ? { likeCount: _.inc(1), dislikeCount: _.inc(-1) }
      : { likeCount: _.inc(-1), dislikeCount: _.inc(1) }
  });
  return { code: 0, reaction: type };
};
