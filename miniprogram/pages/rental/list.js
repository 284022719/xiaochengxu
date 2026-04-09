const db = wx.cloud.database();
const { formatTime } = require("../../utils/format");
const app = getApp();

Page({
  data: {
    list: [],
    openid: "",
    isAdmin: false
  },

  onLoad() {
    this.setData({ openid: app.globalData.openid || "" });
  },

  onShow() {
    this.ensureOpenid().then(() => {
      this.fetchList();
    });
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
    this.setData({
      openid,
      isAdmin: !!openid && openid === app.globalData.homeEditorOpenid
    });
    return openid;
  },

  async fetchList() {
    try {
      const res = await db.collection("rental").orderBy("createTime", "desc").get();
      const list = (res.data || []).map((item) => ({
        ...item,
        showTime: formatTime(item.createTime),
        rentText: item.rented ? "已出租" : "招租中"
      })).sort((a, b) => {
        if (!!a.rented === !!b.rented) return 0;
        return a.rented ? 1 : -1;
      });
      this.setData({ list });
    } catch (e) {
      wx.showToast({ title: "加载失败", icon: "none" });
    }
  },

  toPublish() {
    wx.navigateTo({ url: "/pages/rental/publish" });
  },

  previewImage(e) {
    const urls = e.currentTarget.dataset.urls || [];
    const current = e.currentTarget.dataset.current || "";
    if (!urls.length) return;
    wx.previewImage({ urls, current });
  },

  copyContact(e) {
    const contact = e.currentTarget.dataset.contact || "";
    wx.setClipboardData({
      data: contact,
      success: () => wx.showToast({ title: "联系方式已复制", icon: "none" })
    });
  },

  editItem(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/rental/publish?id=${id}` });
  },

  async deleteItem(e) {
    const id = e.currentTarget.dataset.id;
    const confirm = await new Promise((resolve) => {
      wx.showModal({
        title: "提示",
        content: "确定删除该转租信息？",
        success: (res) => resolve(res.confirm)
      });
    });
    if (!confirm) return;
    try {
      await db.collection("rental").doc(id).remove();
      wx.showToast({ title: "删除成功", icon: "none" });
      this.fetchList();
    } catch (err) {
      if (!this.data.isAdmin) {
        wx.showToast({ title: "删除失败（仅本人可删）", icon: "none" });
        return;
      }
      try {
        await wx.cloud.callFunction({
          name: "adminDeletePost",
          data: {
            collection: "rental",
            id
          }
        });
        wx.showToast({ title: "管理员删除成功", icon: "none" });
        this.fetchList();
      } catch (e) {
        wx.showToast({ title: "删除失败", icon: "none" });
      }
    }
  },

  async toggleRented(e) {
    const { id, rented } = e.currentTarget.dataset;
    try {
      await db.collection("rental").doc(id).update({
        data: { rented: !rented }
      });
      wx.showToast({ title: rented ? "已改为招租中" : "已标记已出租", icon: "none" });
      this.fetchList();
    } catch (err) {
      wx.showToast({ title: "操作失败（仅本人可改）", icon: "none" });
    }
  }
});