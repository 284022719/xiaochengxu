App({
  globalData: {
    envId: "cloud1-8g7qwnkt9f531597",
    openid: "",
    homeEditorOpenid: "olxg13YwLHevaY7qYxzN14xEeBbk",
    userInfo: null,
    selectedCommunity: {
      _id: "comm-001",
      name: "三都汇",
      propertyPhone: "028-63826363",
      address: "华府大道",
      repairPriceList: "水龙头更换50元起；门锁维修80元起；电路检修120元起",
      committeePhone: "010-66668888"
    }
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error("请使用基础库 2.2.3 或以上以支持云能力");
      return;
    }

    wx.cloud.init({
      env: this.globalData.envId,
      traceUser: true
    });

    const cached = wx.getStorageSync("selectedCommunity");
    if (cached) this.globalData.selectedCommunity = cached;

    this.getOpenid();
  },

  getOpenid() {
    wx.cloud.callFunction({
      name: "getOpenid"
    }).then(res => {
      this.globalData.openid = res.result.openid;
    }).catch(err => {
      console.error("获取 openid 失败", err);
    });
  }
});