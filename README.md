# Obsidian 微信一键同步排版助手 (Markdown to WeChat MP Sync)

<p align="left">
    <img src="https://badgen.net/github/release/HanochShi/obsidian_md2wechat" alt="GitHub Release">
    <img src="https://badgen.net/github/assets-dl/HanochShi/obsidian_md2wechat/" alt="Github Release Downloads">
    <img src="https://badgen.net/static/license/AGPL-3.0/red" alt="License">
    <img src="https://badgen.net/github/last-commit/HanochShi/obsidian_md2wechat" alt="Last Commit Time">
</p>

<p align="left">
    简体中文
    ｜
    <a href="./README_zh-TW.md">繁體中文</a>
    ｜
    <a href="./README_en.md">English</a>
</p>


一键排版 Markdown 笔记并完美无缝同步至微信公众号草稿箱，包含图片自动上传微信 CDN、智能封面提取及自定义 CSS 主题支持。

---

## 0 支持本项目

本插件**100% 永久免费且开源**，未来也一直会是！

不过开发和维护的过程还是消耗了很多 AI token 和时间精力。所以如果这个插件有帮到你，比如帮你节省了时间，提升了写作体验，不妨请我吃碗沙县小吃！

你的支持将直接用于帮助我回血，并持续驱动后续的功能更新！🚀

<div align="center">
  <img src="./assets/wechatPayment.jpg" width="40%" alt="微信收款码" style="margin-right: 5%;"/>
  <img src="./assets/alipayPayment.jpg" width="40%" alt="支付宝收款码" />
</div>

---

## 1 核心特性

### 1.1 永久免费 🆓

正如上面所说，本插件永久免费且开源。（向会员费宣战！）

### 1.2 图片自动上传 🖼️

可以自动将笔记中的本地图片上传到公众号素材库中并嵌入到文章中对应位置，真正实现一键同步。这个特性在我看来是最大的痛点，必须从1.0版本开始就直接支持。
  
### 1.3 实时预览 👀

类似于mdnice的体验，左边是ob原生的笔记编辑区，右边是实时更新的渲染预览效果，支持同步滚动。

![左右分栏预览效果图](./assets/preview_scroll_screenshot.gif)

### 1.4 自定义CSS 🎨

内置了一个HTML渲染器，支持自定义CSS，想要什么样的排版风格完全由你说了算。(当然，中间这样的样式不推荐)

![自定义CSS演示](./assets/customCSS_screenshot.jpg)

### 1.5 一键同步 🚀

每次只需一个按钮，即可将带样式、带图片的笔记同步到公众号草稿箱，纵享丝滑。

![一键同步演示](./assets/oneKeySync_screenshot.gif)

### 1.6 自动提取首张图片作为封面 📔

告别繁琐的封面设置，只要将尺寸合适的图片直接放在开头即可。

后续如果需要，也可以在同步之后再去公众号后台进行修改。


### 1.7 复制到剪贴板（备用方案）📋

如果临时遇到bug或者网络问题，也可以手动将渲染好的文章复制到剪贴板，然后粘贴到公众号官方编辑器，避免浪费辛苦设置的CSS样式。

---

## 2 安装方法 🛠️

### 方法一：通过社区插件市场安装（推荐）
1. 打开 Obsidian 的 **设置**。
2. 进入 **第三场插件** -> **社区插件市场** -> **浏览 (Browse)**。
3. 搜索 `Markdown to WeChat MP Sync`。
4. 点击 **安装 (Install)** 并 **启用 (Enable)**。

### 方法二：手动安装
1. 在 [GitHub Releases](https://github.com/HanochShi/obsidian_md2wechat/releases) 页面下载最新发布的版本文件（包含 `main.js`, `manifest.json`, `styles.css`）。
2. 在你库的 `.obsidian/plugins/` 路径下创建一个名为 `obsidian-md2wechat` 的子文件夹。
3. 将下载的 3 个文件放入该文件夹中。
4. 返回 Obsidian 的“社区插件”设置面板，刷新并启用该插件。

---

## 3 运行前的配置

![设置界面](./assets/settings_screenshot.jpg)

### 3.1 微信公众号 AppID & AppSecret

自动同步功能的实现主要是基于公众号官方提供的API接口，为了调用这些接口，我们需要获取自己公众号的 AppID 和 AppSecret，并将其配置到插件设置中。

#### 1

首先，进入自己的公众号后台，在左侧菜单栏中选择`设置与开发`→`开发接口管理`

![](./assets/WMPSetting1.jpg)

#### 2

这个时候，我们会看到一个这样的提示页面，点击红框中的链接，进入微信开发者平台

![](./assets//WMPSetting2.jpg)

#### 3

首次进入时需要扫码登录，用手机微信扫码即可。

登录后默认进入的是小程序的配置页面，我们需要点击左上角的`我的业务与服务`，在弹出的下拉菜单中选择`公众号`，切换到公众号的配置页面，如下图所示。

![](./assets/WMPSetting3.jpg)

#### 4

向下滚动页面直至看到`开发密钥`这一组设置，在`AppSecret`的右边，应该有一个`启用`按钮，我这里因为已经启用过了，所以显示的是`重置`和`冻结`。

![](./assets//WMPSetting4.jpg)

点击`启用`按钮，这一步也需要微信扫码授权。

授权完成之后会出现一个如下图所示的弹窗，这里要注意，AppSecret只会显示这一次，关闭弹窗之后无法再次查看，后续如果丢失了的话只能重置，所以最好是先复制到一个安全的地方保存起来。

![](./assets/WMPSetting5.jpg)

将这里的 AppID 和 AppSecret 分别复制到插件设置中对应的文本框里。

#### 5

最后一步，还需要把自己电脑的公网IP添加到微信开发者平台的IP白名单里，就在之前启用AppSecret的按钮的下方。

![](./assets/WMPSetting6.jpg)

我这里因为已经添加了多个IP，所以`编辑`按钮被挤到了右边，首次设置的时候应该是在`重置`按钮的正下方。

单击`编辑`按钮之后，会弹出添加IP的弹窗，将自己的公网IP粘贴进去即可，如果不知道自己的公网IP是多少，可以访问[https://tool.lu/ip](https://tool.lu/ip)查询

![](./assets/WMPSetting7.jpg)

**注意事项1**:如果需要设置多个IP，每行一个IP即可，不需要任何分隔符号（比如，；。）

**注意事项2**：如果你使用了代理，比如梯子，那么不同节点对应的公网IP也不一样，每次更换节点之后需要重新查询一下当前的公网IP，一并添加到白名单里，否则会同步失败。

**注意事项3**：此处不支持填写IPv6地址，如果你不知道什么是IPv6，忽略即可。

### 3.2 默认封面设置

公众号要求在保存草稿时必须有一张封面图，所以为了确保每次都能同步成功，我们需要设置一张默认封面图，用来在文章中没有任何图片的时候充当封面。

这个默认封面相当于只是先占个坑，后续可以在公众号后台手动再进行替换，所以其实也没那么重要，关键是一定要有一张，不能没有。

![](./assets/coverSetting.jpg)

在进行这一步之前，需要先确保 AppID、AppSecret和IP白名单已经正确配置。

在设置页面的最下方，点击`拉取素材`按钮，系统会自动拉取素材库中的图片列表，然后在右边的下拉列表中选取一张图片即可。

目前这里还不支持预览图片，只会显示文件名，后续会逐渐支持预览。

这项设置也完成之后，就可以任意打开一篇笔记，去尝试同步了。

### 3.3 打开插件面板

#### 1

打开你想要排版或同步的 Markdown 笔记。

#### 2

点击 Obsidian 左侧功能栏的图标![](assets/icon.png)（**推荐**），或使用快捷键 `Ctrl/Cmd + P` 打开命令行输入 `Open WeChat format preview and sync panel` 打开侧边栏。

#### 3

在侧边栏下拉菜单里切换选择你中意的样式主题。

#### 4

点击 **复制富文本** 可以把渲染好的文章复制到剪贴板；  
点击 **同步到草稿箱** 则会一键批量上传文中所有插图、自动绑定封面、全自动上传到公众号后台草稿箱。

### 3.4 自定义 CSS 主题 🎨 （可选）

你可以对排版视觉风格进行极高自由度的定制：

插件首次加载时，会自动在你obsidian仓库（vault）的根目录下创建一个名为 `wechat-format-themes` 的样式目录，并初始化放入一份示例主题文件。

你扔进该文件夹的任何 `.css` 文件，都会立即、自动被插件捕获并渲染到侧边栏主题下拉菜单中（例如放入一个 `my-style.css`，菜单里就会直接多出一个 `📂 my-style` 选项）。

编写自定义 CSS 非常简单，支持将特定的标准标签样式映射为微信行内样式：
   ```css
   .container {
       font-family: sans-serif;
       font-size: 15px;
       line-height: 1.8;
   }
   h1 {
       color: #d35400;
       border-bottom: 2px solid #d35400;
   }
   strong {
       color: #d35400;
       font-weight: bold;
   }
   ```

如果你不知道该怎么写css，也可以把这一节说明和插件自带的示例css文件丢给AI，让AI参考示例帮你写一份。

---

## 4 隐私与安全性声明 🔒

本插件没有任何中转服务器。所有请求、本地图片二进制数据上传以及草稿写入，均是通过你本地的电脑**直接与微信官方的 API 终点（`api.weixin.qq.com`）进行端到端通信**。你的 AppID、AppSecret 均加密存在你本地的 Obsidian 库设置文件中，任何人（包括插件作者）都无法获取。

---

## 5 反馈交流

欢迎加入反馈交流群，提建议、提需求、提bug、提PR，都欢迎。

扫码加我好友，备注「obsidian插件」或「ob插件」即可。

![](./assets/authorWechat.jpg)

## 6 开源许可证 📄

本项目基于 **GNU AGPLv3** 开源协议进行托管，完整授权详情请参阅项目中的 [LICENSE](LICENSE) 文件。