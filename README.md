# Obsidian WeChat Format Sync (`obsidian-md2wechat`)

Format and sync your Obsidian Markdown notes to your WeChat Official Account drafts in just one click, complete with auto-image hosting and custom CSS themes.

---

## 💖 Support the Project

This plugin is **100% free and open-source, and always will be!** 

However, developing and maintaining this project—especially leveraging advanced AI "vibe coding" tools—consumes a significant amount of API tokens and server costs. If this plugin saves you time and elevates your writing workflow, please consider buying me a coffee! Your support helps cover these token costs and keeps the updates rolling. 🚀

`[SPONSORSHIP PLACEHOLDER: A section or image link showing your WeChat Pay / Alipay QR code or Buy Me a Coffee link for donations]`

---

## ✨ Features

- **🚀 One-Click Sync to WeChat**: Automatically compiles your notes into inline-styled HTML and creates a draft in your WeChat Official Account. No manual copy-pasting required!
- **🖼️ Auto Image Uploads to WeChat CDN**: Scans your notes for any local images (including standard Markdown syntax `![](...)` and Obsidian wikilinks `![[...]`), uploads them directly to the WeChat CDN, and replaces references dynamically. No more broken images!
- **🏷️ Smart Cover Extraction**: Automatically extracts the first image in your note, uploads it as a permanent thumbnail, and sets it as the draft cover. If no image is found, it falls back gracefully to your selected default cover.
- **🎨 Live Preview Sidebar with Beautiful Built-In & Custom CSS Themes**:
  - Live side-by-side preview panel that updates instantly.
  - Built-in premium templates: *Elegant Green (雅绿)*, *Warm Gold (暖金)*, *Minimalist Black (极简)*, and *Red Passion (红色热情)*.
  - **Custom Themes**: Add your own CSS files to the designated folder; the plugin automatically parses them and makes them selectable in the sidebar with strict conflict-protection.
- **🌐 Full i18n Support**: Native localization for 6 major languages: **English**, **Simplified Chinese (简体中文)**, **Traditional Chinese (繁體中文)**, **Spanish (Español)**, **French (Français)**, and **Japanese (日本語)**. Perfect for global creators.
- **📋 Copy Rich Text (Clipboard fallback)**: Copy perfectly formatted rich-text directly to your clipboard with custom CSS rules inlined, ready to paste into any editor (WeChat, Medium, Substack, etc.).
- **🔗 WeChat Dual Footnotes**: Formats standard markdown footnotes into clean, WeChat-compatible superscript references and styled lists at the bottom of the article.

---

## 📸 Screenshots & Workflow

### 1. Settings Configuration
Set up your Developer Credentials, default style, and fetch cover materials directly from your WeChat permanent library.

`[IMAGE PLACEHOLDER: A screenshot of the plugin settings tab showing WeChat AppID, AppSecret, Language selector, Custom CSS folder path, WeChat Image Upload toggle, and the permanent library Cover Dropdown with "Fetch Materials" button]`

### 2. Live Format Preview Panel
The responsive side-by-side view allows you to see how your article will look on mobile screens in real-time.

`[IMAGE PLACEHOLDER: A screenshot of Obsidian with a split view: markdown note on the left, and the WeChat Format Sync sidebar preview on the right showcasing formatted headings, code blocks, inlined images, and styled footnotes]`

### 3. Successfully Synced Draft in WeChat
No more formatting bugs—perfectly compiled text, highlists, blockquotes, and lists visible in the WeChat draft editor.

`[IMAGE PLACEHOLDER: A screenshot of the WeChat Official Account Creator Platform (微信公众平台) showing the newly synced draft containing inline highlighted code blocks, centered images, and footnotes]`

---

## 🛠️ Installation

### Option 1: Via Community Plugins (Recommended once listed)
1. Open Obsidian settings.
2. Navigate to **Community plugins** -> **Browse**.
3. Search for `WeChat Format Sync` or `obsidian-md2wechat`.
4. Click **Install**, then **Enable**.

### Option 2: Manual Installation
1. Download the latest release (`main.js`, `manifest.json`, `styles.css`) from the [GitHub Releases](https://github.com/HanochShi/obsidian_md2wechat/releases) page.
2. Create a folder named `obsidian-md2wechat` under your vault's `.obsidian/plugins/` directory.
3. Move the downloaded files into that folder.
4. Go to **Community plugins** in Obsidian settings and enable the plugin.

---

## 📖 How to Use

### Step 1: Configure WeChat Credentials
To enable Draft Synchronization and Auto-Image Upload, you need a **WeChat Subscription/Service Account (订阅号/服务号)**:
1. Log in to the [WeChat Official Account Platform](https://mp.weixin.qq.com/).
2. Navigate to **Settings and Development (设置与开发)** -> **Basic Configuration (基本配置)**.
3. Find your **AppID** and **AppSecret** (you may need to reset and authenticate it).
4. Add your **IP address** to the IP Whitelist (IP白名单) to allow requests from your computer.
5. In Obsidian settings, enter your **AppID** and **AppSecret**.

### Step 2: Set up a Default Cover
1. In the plugin settings, click **Fetch Materials**. This downloads the permanent images from your WeChat media library.
2. Choose one from the dropdown to use as your default fallback cover.

### Step 3: Preview and Sync
1. Open the Markdown note you wish to sync.
2. Click the **WeChat Icon (Share-2)** on the left ribbon bar or run the command `Open WeChat format preview and sync panel` from the Command Palette (`Ctrl/Cmd + P`).
3. Select your favorite style from the dropdown.
4. Click **Copy Rich Text** to copy formatting immediately, or click **Sync to Draft** to automatically push the article, positive inline images, and cover image to your WeChat account draft box!

---

## 🎨 Custom CSS Customization

You can fully customize your layout!
1. The plugin automatically creates a folder inside your vault (defaults to `wechat-format-themes/`) with a template theme CSS.
2. Any `.css` file you drop in this folder will instantly show up as a selectable theme in the sidebar selector (e.g., `geek-blue.css` will be listed as `📂 geek-blue`).
3. We support mapping tags to standard WeChat classes. Example:
   ```css
   .container {
       font-family: sans-serif;
       font-size: 15px;
   }
   h1 {
       color: #d35400;
       border-bottom: 2px solid #d35400;
   }
   strong {
       color: #d35400;
   }
   ```

---

## 🔒 Security & Privacy

This plugin communicates **directly** and **exclusively** with official WeChat API endpoints (`api.weixin.qq.com`) to fetch materials and upload drafts. Your credentials (AppID and AppSecret) are stored locally in your private Obsidian settings file and are **never** shared with third parties.

---

## 📄 License

This project is licensed under the GNU AGPLv3 License - see the [LICENSE](LICENSE) file for details.
