const app = getApp();
const db = wx.cloud.database();
const { formatTime } = require("../../utils/format");

Page({
  data: {
    userInfo: null,
    secondhandList: [],
    rentalList: [],
    serviceList: [],
    newsList: []
  },

  onShow() {
    this.getProfile();
    this.fetchMyData();
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
    return openid;
  },

  getProfile() {
    if (this.data.userInfo) return;
    wx.getUserProfile({
      desc: "用于展示头像和昵称",
      success: (res) => {
        this.setData({ userInfo: res.userInfo });
        app.globalData.userInfo = res.userInfo;
      }
    });
  },

  async fetchMyData() {
    const openid = await this.ensureOpenid();
    if (!openid) {
      setTimeout(() => this.fetchMyData(), 800);
      return;
    }
    try {
      const [sRes, rRes, serviceRes, newsRes] = await Promise.all([
        db.collection("secondhand").where({ _openid: openid }).orderBy("createTime", "desc").get(),
        db.collection("rental").where({ _openid: openid }).orderBy("createTime", "desc").get(),
        db.collection("service_posts").where({ _openid: openid }).orderBy("createTime", "desc").get(),
        db.collection("life_news").where({ _openid: openid }).orderBy("createTime", "desc").get()
      ]);

      const secondhandList = (sRes.data || []).map((item) => ({
        ...item,
        showTime: formatTime(item.createTime)
      }));
      const rentalList = (rRes.data || []).map((item) => ({
        ...item,
        showTime: formatTime(item.createTime)
      }));
      const serviceList = (serviceRes.data || []).map((item) => ({
        ...item,
        showTime: formatTime(item.createTime)
      }));
      const newsList = (newsRes.data || []).map((item) => ({
        ...item,
        showTime: formatTime(item.createTime)
      }));
      this.setData({ secondhandList, rentalList, serviceList, newsList });
    } catch (e) {
      wx.showToast({ title: "加载失败", icon: "none" });
    }
  },

  async deleteItem(e) {
    const { id, collection } = e.currentTarget.dataset;
    const tipMap = {
      secondhand: "确定删除该闲置信息？",
      rental: "确定删除该房屋信息？",
      service_posts: "确定删除该服务信息？",
      life_news: "确定删除该生活资讯？"
    };
    const tip = tipMap[collection] || "确定删除该信息？";
    const confirm = await new Promise((resolve) => {
      wx.showModal({
        title: "提示",
        content: tip,
        success: (res) => resolve(res.confirm)
      });
    });
    if (!confirm) return;

    try {
      await db.collection(collection).doc(id).remove();
      wx.showToast({ title: "删除成功", icon: "none" });
      this.fetchMyData();
    } catch (e) {
      wx.showToast({ title: "删除失败（仅创建者可删）", icon: "none" });
    }
  },

  async updatePostStatus(e) {
    const { id, collection, field, value } = e.currentTarget.dataset;
    try {
      await db.collection(collection).doc(id).update({
        data: { [field]: value }
      });
      wx.showToast({ title: "状态已更新", icon: "none" });
      this.fetchMyData();
    } catch (e) {
      wx.showToast({ title: "更新失败（仅本人可改）", icon: "none" });
    }
  },

  editSecondhand(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/secondhand/publish?id=${id}` });
  },

  editRental(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/rental/publish?id=${id}` });
  }
});