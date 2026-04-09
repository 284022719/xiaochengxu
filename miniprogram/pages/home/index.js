const db = wx.cloud.database();
const _ = db.command;
const app = getApp();
const { formatTime } = require("../../utils/format");

Page({
  data: {
    groupTitle: "三都汇邻里生活群",
    groupDesc: "本群用于大家交流生活资讯、闲置流转、租房信息、寻宠寄养、美食探店、邻里互助等",
    newsList: [],
    openid: "",
    commentInputMap: {}
  },

  onShow() {
    this.ensureOpenid().then(() => this.fetchNews());
  },

  async ensureOpenid() {
    let openid = app.globalData.openid || "";
    if (!openid) {
      try {
        const res = await wx.cloud.callFunction({ name: "getOpenid" });
        openid = (res.result && res.result.openid) || "";
        app.globalData.openid = openid;
      } catch (e) {}
    }
    this.setData({ openid });
    return openid;
  },

  async fetchNews() {
    try {
      const res = await db.collection("life_news").orderBy("createTime", "desc").limit(20).get();
      const news = res.data || [];
      if (!news.length) {
        this.setData({ newsList: [] });
        return;
      }
      const ids = news.map((item) => item._id);
      let commentsRes = { data: [] };
      let reactionsRes = { data: [] };

      try {
        commentsRes = await db.collection("life_news_comments")
          .where({ newsId: _.in(ids) })
          .orderBy("createTime", "asc")
          .get();
      } catch (e) {
        // 评论集合未创建或无权限时，降级为仅展示资讯主体
      }

      if (this.data.openid) {
        try {
          reactionsRes = await db.collection("life_news_reactions")
            .where({ newsId: _.in(ids), _openid: this.data.openid })
            .get();
        } catch (e) {
          // 赞踩集合未创建或无权限时，降级为仅展示资讯主体
        }
      }

      const commentsByNews = {};
      (commentsRes.data || []).forEach((c) => {
        if (!commentsByNews[c.newsId]) commentsByNews[c.newsId] = [];
        commentsByNews[c.newsId].push({
          ...c,
          showTime: formatTime(c.createTime),
          canDelete: c._openid === this.data.openid
        });
      });

      const myReactionMap = {};
      (reactionsRes.data || []).forEach((r) => {
        myReactionMap[r.newsId] = r.type;
      });

      const newsList = news.map((item) => ({
        ...item,
        showTime: formatTime(item.createTime),
        likeCount: item.likeCount || 0,
        dislikeCount: item.dislikeCount || 0,
        comments: commentsByNews[item._id] || [],
        myReaction: myReactionMap[item._id] || ""
      }));
      this.setData({ newsList });
    } catch (e) {
      wx.showToast({ title: "生活资讯主列表加载失败", icon: "none" });
    }
  },

  toNewsPublish() {
    wx.navigateTo({ url: "/pages/news/publish" });
  },

  onCommentInput(e) {
    const { newsid } = e.currentTarget.dataset;
    this.setData({ [`commentInputMap.${newsid}`]: e.detail.value });
  },

  async submitComment(e) {
    const newsId = e.currentTarget.dataset.newsid;
    const content = (this.data.commentInputMap[newsId] || "").trim();
    if (!content) {
      wx.showToast({ title: "请输入评论内容", icon: "none" });
      return;
    }
    try {
      await db.collection("life_news_comments").add({
        data: {
          newsId,
          content,
          createTime: db.serverDate()
        }
      });
      this.setData({ [`commentInputMap.${newsId}`]: "" });
      this.fetchNews();
    } catch (e) {
      wx.showToast({ title: "评论失败", icon: "none" });
    }
  },

  async deleteComment(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await db.collection("life_news_comments").doc(id).remove();
      wx.showToast({ title: "已删除评论", icon: "none" });
      this.fetchNews();
    } catch (e) {
      wx.showToast({ title: "删除失败（仅本人可删）", icon: "none" });
    }
  },

  async toggleReaction(e) {
    const newsId = e.currentTarget.dataset.newsid;
    const type = e.currentTarget.dataset.type;
    try {
      await wx.cloud.callFunction({
        name: "toggleLifeNewsReaction",
        data: { newsId, type }
      });
      this.fetchNews();
    } catch (e) {
      wx.showToast({ title: "操作失败", icon: "none" });
    }
  }
});