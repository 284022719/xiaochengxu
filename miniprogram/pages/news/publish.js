const db = wx.cloud.database();
const app = getApp();

Page({
  data: {
    title: "",
    content: "",
    submitting: false
  },

  onInput(e) {
    const key = e.currentTarget.dataset.key || "content";
    this.setData({ [key]: e.detail.value });
  },

  async ensurePublisherProfile() {
    if (app.globalData.userInfo && app.globalData.userInfo.nickName) {
      return app.globalData.userInfo;
    }
    try {
      const res = await wx.getUserProfile({ desc: "用于展示生活资讯发布者信息" });
      if (res && res.userInfo) {
        app.globalData.userInfo = res.userInfo;
        return res.userInfo;
      }
    } catch (e) {}
    return {
      nickName: "微信用户",
      avatarUrl: ""
    };
  },

  async submit() {
    const title = (this.data.title || "").trim();
    const content = (this.data.content || "").trim();
    if (!title || !content) {
      wx.showToast({ title: "请填写标题和内容", icon: "none" });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: "提交中..." });
    try {
      const profile = await this.ensurePublisherProfile();
      await db.collection("life_news").add({
        data: {
          title,
          content,
          nickName: profile.nickName || "微信用户",
          avatarUrl: profile.avatarUrl || "",
          likeCount: 0,
          dislikeCount: 0,
          createTime: db.serverDate()
        }
      });
      wx.hideLoading();
      wx.showModal({
        title: "提交成功",
        content: "生活资讯已提交。",
        showCancel: false,
        success: () => {
          const pages = getCurrentPages();
          if (pages.length > 1) wx.navigateBack();
          else wx.switchTab({ url: "/pages/home/index" });
        }
      });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: "提交失败，请重试", icon: "none" });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
