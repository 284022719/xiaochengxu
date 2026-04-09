const db = wx.cloud.database();
const { getContentConfig, DEFAULT_CONTENT } = require("../../utils/content");
const app = getApp();

Page({
  data: {
    id: "",
    isEdit: false,
    title: "",
    desc: "",
    images: [],
    submitting: false,
    content: DEFAULT_CONTENT.rentalPublish
  },

  async onLoad(options) {
    this.loadContent();
    const id = options.id || "";
    if (id) {
      wx.setNavigationBarTitle({ title: "编辑房屋信息" });
      this.setData({ id, isEdit: true });
      await this.loadDetail(id);
    }
  },

  async loadContent() {
    const config = await getContentConfig();
    this.setData({
      content: config.rentalPublish || DEFAULT_CONTENT.rentalPublish
    });
  },

  async loadDetail(id) {
    try {
      const res = await db.collection("rental").doc(id).get();
      const item = res.data || {};
      this.setData({
        title: item.title || item.community || "",
        desc: item.desc || "",
        images: item.images || []
      });
    } catch (e) {
      wx.showToast({ title: "加载失败", icon: "none" });
    }
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
        const tempFiles = (res.tempFiles || []).map((item) => item.tempFilePath);
        this.setData({ images: [...this.data.images, ...tempFiles].slice(0, 3) });
      }
    });
  },

  removeImage(e) {
    const idx = e.currentTarget.dataset.index;
    const next = [...this.data.images];
    next.splice(idx, 1);
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
      if (typeof path === "string" && path.startsWith("cloud://")) {
        return Promise.resolve({ fileID: path });
      }
      const ext = path.split(".").pop() || "jpg";
      const cloudPath = `rental/${Date.now()}_${index}.${ext}`;
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
      const fileIDs = await this.uploadImages();
      if (this.data.isEdit && this.data.id) {
        await db.collection("rental").doc(this.data.id).update({
          data: {
            title,
            desc,
            images: fileIDs,
            nickName: profile.nickName || "微信用户",
            avatarUrl: profile.avatarUrl || ""
          }
        });
      } else {
        await wx.cloud.callFunction({
          name: "publishPost",
          data: {
            collection: "rental",
            payload: {
              title,
              desc,
              images: fileIDs,
              nickName: profile.nickName || "微信用户",
              avatarUrl: profile.avatarUrl || ""
            }
          }
        });
      }

      wx.hideLoading();
      wx.showModal({
        title: this.data.isEdit ? "更新成功" : "提交成功",
        content: this.data.isEdit ? "信息已更新。" : "发布成功，已立即显示。",
        showCancel: false,
        success: () => this.afterSubmit()
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
  },

  afterSubmit() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: "/pages/rental/list" });
    }
  }
});