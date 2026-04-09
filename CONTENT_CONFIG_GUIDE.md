# 内容与结构分离说明

为减少后续审核频次，页面功能代码保持稳定，文案内容改为后台配置。

## 1. 云数据库集合

- 集合名：`content_config`
- 文档 ID：`ui_texts`

## 2. 文档示例

```json
{
  "_id": "ui_texts",
  "secondhandPublish": {
    "sectionTitleCreate": "提交闲置",
    "sectionTitleEdit": "编辑闲置",
    "tip": "提交成功后将立即显示。",
    "titlePlaceholder": "标题（如：9成新电饭煲）",
    "descPlaceholder": "描述（成色、使用情况等）",
    "imageLabel": "图片（最多3张）",
    "submitTextCreate": "提交闲置",
    "submitTextEdit": "保存修改"
  },
  "rentalPublish": {
    "sectionTitleCreate": "提交房屋信息",
    "sectionTitleEdit": "编辑房屋信息",
    "tip": "提交成功后将立即显示。",
    "titlePlaceholder": "标题（如：转租/合租）",
    "descPlaceholder": "描述（如：户型、租金、起租时间等）",
    "imageLabel": "房源图片（最多3张）",
    "submitTextCreate": "提交房屋信息",
    "submitTextEdit": "保存修改"
  }
}
```

## 3. 生效方式

1. 修改 `content_config/ui_texts` 文档内容
2. 重新打开发布页（或清理小程序缓存）即可看到新文案

## 4. 已接入页面

- `pages/secondhand/publish`
- `pages/rental/publish`

