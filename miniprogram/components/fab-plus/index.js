Component({
  properties: {
    text: {
      type: String,
      value: "提交"
    }
  },
  methods: {
    onTap() {
      this.triggerEvent("tap");
    }
  }
});
