const db = wx.cloud.database();
const _ = db.command;
const app = getApp();
const { formatTime } = require("../../utils/format");

Page({
  data: {
    list: [],
    openid: "",
    commentInputMap: {}
  },

  onShow() {
    this.ensureOpenid().then(() => this.fetchList());
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

  async fetchList() {
    try {
      const postRes = await db.collection("service_posts").orderBy("createTime", "desc").get();
      const posts = postRes.data || [];
      if (!posts.length) {
        this.setData({ list: [] });
        return;
      }

      const ids = posts.map((p) => p._id);
      const [commentRes, reactionRes] = await Promise.all([
        db.collection("service_comments").where({ postId: _.in(ids) }).orderBy("createTime", "asc").get(),
        this.data.openid
          ? db.collection("service_reactions").where({ postId: _.in(ids), _openid: this.data.openid }).get()
          : Promise.resolve({ data: [] })
      ]);

      const commentsByPost = {};
      (commentRes.data || []).forEach((c) => {
        if (!commentsByPost[c.postId]) commentsByPost[c.postId] = [];
        commentsByPost[c.postId].push({
          ...c,
          showTime: formatTime(c.createTime),
          canDelete: c._openid === this.data.openid
        });
      });

      const reactionMap = {};
      (reactionRes.data || []).forEach((r) => {
        reactionMap[r.postId] = r.type;
      });

      const list = posts.map((p) => ({
        ...p,
        showTime: formatTime(p.createTime),
        likeCount: p.likeCount || 0,
        dislikeCount: p.dislikeCount || 0,
        comments: commentsByPost[p._id] || [],
        myReaction: reactionMap[p._id] || "",
        canDelete: p._openid === this.data.openid
      }));

      this.setData({ list });
    } catch (e) {
      wx.showToast({ title: "加载失败", icon: "none" });
    }
  },

  toPublish() {
    wx.navigateTo({ url: "/pages/service/publish" });
  },

  previewImage(e) {
    const urls = e.currentTarget.dataset.urls || [];
    const current = e.currentTarget.dataset.current || "";
    if (!urls.length) return;
    wx.previewImage({ urls, current });
  },

  async deletePost(e) {
    const id = e.currentTarget.dataset.id;
    const confirm = await new Promise((resolve) => {
      wx.showModal({
        title: "提示",
        content: "确定删除该服务信息？",
        success: (res) => resolve(res.confirm)
      });
    });
    if (!confirm) return;

    try {
      await db.collection("service_posts").doc(id).remove();
      wx.showToast({ title: "删除成功", icon: "none" });
      this.fetchList();
    } catch (e) {
      wx.showToast({ title: "删除失败（仅本人可删）", icon: "none" });
    }
  },

  onCommentInput(e) {
    const { postid } = e.currentTarget.dataset;
    this.setData({
      [`commentInputMap.${postid}`]: e.detail.value
    });
  },

  async submitComment(e) {
    const { postid } = e.currentTarget.dataset;
    const content = (this.data.commentInputMap[postid] || "").trim();
    if (!content) {
      wx.showToast({ title: "请输入评论内容", icon: "none" });
      return;
    }
    try {
      await db.collection("service_comments").add({
        data: {
          postId: postid,
          content,
          createTime: db.serverDate()
        }
      });
      this.setData({ [`commentInputMap.${postid}`]: "" });
      this.fetchList();
    } catch (e) {
      wx.showToast({ title: "评论失败", icon: "none" });
    }
  },

  async deleteComment(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await db.collection("service_comments").doc(id).remove();
      wx.showToast({ title: "已删除评论", icon: "none" });
      this.fetchList();
    } catch (e) {
      wx.showToast({ title: "删除失败（仅本人可删）", icon: "none" });
    }
  },

  async toggleReaction(e) {
    const { postid, type } = e.currentTarget.dataset;
    try {
      await wx.cloud.callFunction({
        name: "toggleServiceReaction",
        data: { postId: postid, type }
      });
      this.fetchList();
    } catch (e2) {
      wx.showToast({ title: "操作失败", icon: "none" });
    }
  }
});
