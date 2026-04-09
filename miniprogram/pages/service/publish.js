const db = wx.cloud.database();
const app = getApp();

Page({
  data: {
    title: "",
    desc: "",
    images: [],
    submitting: false
  },

  onInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [key]: e.detail.value });
  },

  chooseImage() {
    const remain = 3 - this.data.images.length;
    if (remain <= 0) return;
    wx.chooseMedia({
      count: remain,
      mediaType: ["image"],
      success: (res) => {
        const files = (res.tempFiles || []).map((item) => item.tempFilePath);
        this.setData({ images: [...this.data.images, ...files].slice(0, 3) });
      }
    });
  },

  removeImage(e) {
    const index = Number(e.currentTarget.dataset.index);
    const next = [...this.data.images];
    next.splice(index, 1);
    this.setData({ images: next });
  },

  previewImage(e) {
    const current = e.currentTarget.dataset.current || "";
    const urls = this.data.images || [];
    if (!urls.length) return;
    wx.previewImage({ current, urls });
  },

  async uploadImages() {
    const tasks = this.data.images.map((path, index) => {
      const ext = path.split(".").pop() || "jpg";
      const cloudPath = `service/${Date.now()}_${index}.${ext}`;
      return wx.cloud.uploadFile({ cloudPath, filePath: path });
    });
    const res = await Promise.all(tasks);
    return res.map((item) => item.fileID);
  },

  async submit() {
    const { title, desc } = this.data;
    if (!title || !desc) {
      wx.showToast({ title: "请完整填写信息", icon: "none" });
      return;
    }
    if (!this.data.images.length) {
      wx.showToast({ title: "请至少上传1张图片", icon: "none" });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: "提交中..." });
    try {
      const profile = await this.ensurePublisherProfile();
      const imageIds = await this.uploadImages();
      await db.collection("service_posts").add({
        data: {
          title,
          desc,
          images: imageIds,
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
        content: "已发布到群友服务。",
        showCancel: false,
        success: () => {
          const pages = getCurrentPages();
          if (pages.length > 1) wx.navigateBack();
          else wx.switchTab({ url: "/pages/service/list" });
        }
      });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: "提交失败，请重试", icon: "none" });
    } finally {
      this.setData({ submitting: false });
    }
  },

  async ensurePublisherProfile() {
    if (app.globalData.userInfo && app.globalData.userInfo.nickName) {
      return app.globalData.userInfo;
    }
    try {
      const res = await wx.getUserProfile({ desc: "用于展示发布者昵称和头像" });
      if (res && res.userInfo) {
        app.globalData.userInfo = res.userInfo;
        return res.userInfo;
      }
    } catch (e) {}
    return { nickName: "微信用户", avatarUrl: "" };
  }
});
