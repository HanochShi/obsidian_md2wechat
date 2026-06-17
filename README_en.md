# Obsidian Markdown to WeChat MP Sync

<p align="left">
    <img src="https://img.shields.io/github/v/release/HanochShi/obsidian_md2wechat" alt="GitHub Release">
    <img src="https://img.shields.io/github/downloads/HanochShi/obsidian_md2wechat/total?color=483699" alt="Downloads">
    <img src="https://img.shields.io/github/license/HanochShi/obsidian_md2wechat" alt="License">
</p>

<p align="left">
    <a href="./README.md">简体中文</a>
    ｜
    <a href="./README_zh-TW.md">繁體中文</a>
    ｜
    English
</p>

One-click formatting of Markdown notes and seamless synchronization to your WeChat Official Account draft box. Includes automatic image uploads to WeChat CDN, smart cover extraction, and custom CSS theme support.

---

## 0 Support This Project

This plugin is **100% permanently free and open-source**, and always will be!

However, the development and maintenance process consumes a lot of AI tokens, time, and effort. So if this plugin has helped you—for example, by saving your time or improving your writing experience—consider buying me a cup of coffee (or a bowl of Shaxian snacks)!

Your support will directly help me recover costs and keep me motivated to drive future feature updates! 🚀

<div align="center">
  <img src="./assets/wechatPayment.jpg" width="40%" alt="WeChat Pay QR Code" style="margin-right: 5%;"/>
  <img src="./assets/alipayPayment.jpg" width="40%" alt="Alipay QR Code" />
</div>

---

## 1 Core Features

### 1.1 Permanently Free 🆓

As mentioned above, this plugin is permanently free and open-source. (Declaring war on subscription fees!)

### 1.2 Automatic Image Upload 🖼️

It can automatically upload local images from your notes into the WeChat Official Account media library and embed them in the corresponding positions within the article, truly achieving one-click synchronization. In my opinion, this is the biggest pain point, and it absolutely had to be supported from version 1.0.
  
### 1.3 Real-time Preview 👀

Similar to the mdnice experience, the left side is OB's native note-taking area, while the right side displays a real-time updated rendering preview, supporting synchronized scrolling.

![Screenshot of the split-screen preview](./assets/preview_scroll_screenshot.gif)

### 1.4 Custom CSS 🎨

With a built-in HTML renderer, it supports custom CSS, meaning the layout style is completely up to you. (Of course, a style like the one shown in the middle isn't particularly recommended.)

![Custom CSS demonstration](./assets/customCSS_screenshot.jpg)

### 1.5 One-click Sync 🚀

With just a single button press, you can sync your fully-styled, image-embedded notes to your Official Account draft box, enjoying a silky-smooth experience.

![One-click sync demonstration](./assets/oneKeySync_screenshot.gif)

### 1.6 Automatically Extract First Image as Cover 📔

Say goodbye to tedious cover settings; just place an appropriately sized image right at the beginning of your note.

If needed, you can always modify it later in the Official Account backend after syncing.

### 1.7 Copy to Clipboard (Backup Solution) 📋

If you encounter temporary bugs or network issues, you can manually copy the rendered article to your clipboard and paste it into the official WeChat editor to avoid wasting your hard-earned CSS styles.

---

## 2 Installation 🛠️

### Method 1: Install via Community Plugins (Recommended)
1. Open Obsidian **Settings**.
2. Go to **Community plugins** -> **Browse**.
3. Search for `Markdown to WeChat MP Sync`.
4. Click **Install** and **Enable**.

### Method 2: Manual Installation
1. Go to the [GitHub Releases](https://github.com/HanochShi/obsidian_md2wechat/releases) page and download the latest release files (which include `main.js`, `manifest.json`, and `styles.css`).
2. Create a subfolder named `obsidian-md2wechat` under the `.obsidian/plugins/` directory of your vault.
3. Place the 3 downloaded files into this folder.
4. Return to the "Community plugins" settings panel in Obsidian, refresh, and enable the plugin.

---

## 3 Pre-run Configuration

![Settings Interface](./assets/settings_screenshot.jpg)

### 3.1 WeChat Official Account AppID & AppSecret

The automatic sync feature relies heavily on the official API provided by WeChat. To call these interfaces, we need to obtain the AppID and AppSecret of your Official Account and configure them in the plugin settings.

#### 1

First, log into your Official Account backend. On the left menu bar, select `Settings and Development` (`设置与开发`) -> `Development Interface Management` (`开发接口管理`).

![](./assets/WMPSetting1.jpg)

#### 2

At this point, you will see a prompt page like this. Click the link within the red box to enter the WeChat Open Platform.

![](./assets//WMPSetting2.jpg)

#### 3

Logging in for the first time requires scanning a QR code using WeChat on your phone.

After logging in, you will be taken to the Mini Program configuration page by default. You need to click `My Business and Services` (`我的业务与服务`) in the upper-left corner, and select `Official Account` (`公众号`) from the drop-down menu to switch to the Official Account configuration page, as shown below.

![](./assets/WMPSetting3.jpg)

#### 4

Scroll down the page until you see the `Developer ID and Secret` (`开发密钥`) settings. To the right of `AppSecret`, there should be an `Enable` (`启用`) button (mine shows `Reset` and `Freeze` because it's already enabled).

![](./assets//WMPSetting4.jpg)

Click the `Enable` button. This step also requires a WeChat QR code authorization.

Once authorized, a pop-up window like the one below will appear. Note: the AppSecret will only be displayed this one time. If you close the pop-up, you won't be able to view it again. If lost, it can only be reset, so it's highly recommended to copy and save it in a secure place first.

![](./assets/WMPSetting5.jpg)

Copy this AppID and AppSecret into the corresponding text boxes in the plugin settings.

#### 5

For the final step, you need to add your computer's public IP to the IP whitelist on the WeChat Open Platform. This is located right below the button where you enabled the AppSecret.

![](./assets/WMPSetting6.jpg)

Since I have already added multiple IPs, the `Edit` (`编辑`) button has been pushed to the right. When setting it up for the first time, it should be directly below the `Reset` button.

After clicking the `Edit` button, a pop-up for adding IPs will appear. Simply paste your public IP into it. If you don't know what your public IP is, you can visit [https://tool.lu/ip](https://tool.lu/ip) to check.

![](./assets/WMPSetting7.jpg)

**Note 1**: If you need to add multiple IPs, enter one IP per line without any separator characters (such as commas or semicolons).

**Note 2**: If you are using a proxy (like a VPN), your public IP will change depending on the node. Every time you switch nodes, you must re-check your current public IP and add it to the whitelist, otherwise the sync will fail.

**Note 3**: Filling in IPv6 addresses is not supported here. If you don't know what IPv6 is, you can safely ignore this.

### 3.2 Default Cover Settings

WeChat Official Accounts require a cover image when saving drafts. To ensure a successful sync every time, we need to set a default cover image to be used whenever the article itself contains no images.

This default cover essentially acts as a placeholder. You can always replace it manually in the Official Account backend later. The key point is that you *must* have one; it cannot be left blank.

![](./assets/coverSetting.jpg)

Before doing this step, make sure your AppID, AppSecret, and IP whitelist have been configured correctly.

At the very bottom of the settings page, click the `Fetch Media` (`拉取素材`) button. The system will automatically fetch the image list from your media library. Then, simply select an image from the drop-down list on the right.

Currently, previewing images is not supported here (only filenames are displayed), but preview support will be added in future updates.

Once this setting is complete, you can open any note and test the synchronization.

### 3.3 Open the Plugin Panel

#### 1

Open the Markdown note you wish to format or sync.

#### 2

Click the plugin icon ![](assets/icon.png) on the left ribbon of Obsidian (**Recommended**), or use the shortcut `Ctrl/Cmd + P` to open the command palette and type `Open WeChat format preview and sync panel` to open the sidebar.

#### 3

Use the drop-down menu in the sidebar to select your preferred style theme.

#### 4

Click **Copy Rich Text** (`复制富文本`) to copy the rendered article to your clipboard;  
Click **Sync to Draft Box** (`同步到草稿箱`) to batch upload all inline images, automatically bind a cover, and fully automate the upload to your Official Account draft box.

### 3.4 Custom CSS Themes 🎨 (Optional)

You can customize the visual layout style with an extremely high degree of freedom:

When the plugin loads for the first time, it automatically creates a directory named `wechat-format-themes` in the root of your Obsidian vault and initializes it with a sample theme file.

Any `.css` file you drop into this folder will instantly and automatically be captured by the plugin and displayed in the sidebar's theme drop-down menu (for example, if you add a `my-style.css`, a `📂 my-style` option will appear in the menu).

Writing custom CSS is straightforward, as it supports mapping standard tags to WeChat inline styles:
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

If you don't know how to write CSS, you can pass this section's instructions and the plugin's built-in sample CSS file to an AI assistant, and have it help you generate one based on the example.

---

## 4 Privacy and Security Statement 🔒

This plugin does not use any relay servers. All requests, local image binary data uploads, and draft writing are handled **end-to-end directly from your local computer to the official WeChat API endpoint (`api.weixin.qq.com`)**. Your AppID and AppSecret are encrypted and stored locally in your Obsidian vault's settings file, and absolutely no one (including the plugin author) can access them.

---

## 5 Feedback and Communication

Welcome to join the feedback and communication group. Suggestions, feature requests, bug reports, and PRs are all highly welcome.

Scan the QR code with Wechat to add me as a friend, and please add the note "obsidian plugin" or "ob plugin".

![](./assets/authorWechat.jpg)

## 6 Open Source License 📄

This project is hosted under the **GNU AGPLv3** open-source license. For complete authorization details, please refer to the [LICENSE](LICENSE) file in the project.