import { Plugin, WorkspaceLeaf, addIcon } from 'obsidian';
import { WECHAT_MP_ICON } from './icons';
import { Md2WeChatSettings, ThemeStyle } from './types';
import { Md2WeChatSettingTab } from './settings';
import { WeChatPreviewView, VIEW_TYPE_WECHAT_PREVIEW } from './view';
import { loadCustomThemes, initThemeDirectory } from './themes'; // We will define loader wrappers inside main or bind them

const DEFAULT_SETTINGS: Md2WeChatSettings = {
	lang: 'zh-CN',
	appId: '',
	appSecret: '',
	defaultStyle: 'elegant',
	customCss: '',
	enableImgUpload: true,
	imageHostingType: 'wechat',
	defaultThumbMediaId: '',
	cachedMaterials: [],
	themeFolder: 'wechat-format-themes',
	syncScroll: true
};

export default class Md2WeChatPlugin extends Plugin {
	declare settings: Md2WeChatSettings;
	customThemes: Record<string, ThemeStyle> = {};

	async onload() {
		await this.loadSettings();
		await this.initThemeDirectory();
		await this.loadCustomThemes();

		// Register custom WeChat MP icon
		addIcon('wechat-mp', WECHAT_MP_ICON);

		// Register Sidebar View
		this.registerView(
			VIEW_TYPE_WECHAT_PREVIEW,
			(leaf) => new WeChatPreviewView(leaf, this)
		);

		// Add Ribbon icon for preview
		this.addRibbonIcon('wechat-mp', 'WeChat Format & Sync', () => {
			this.activateView();
		});

		// Add Command Palette Command
		this.addCommand({
			id: 'preview-wechat-format',
			name: 'Open WeChat format preview and sync panel',
			callback: () => {
				this.activateView();
			}
		});

		this.addSettingTab(new Md2WeChatSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView() {
		const { workspace } = this.app;
		
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_WECHAT_PREVIEW);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({
					type: VIEW_TYPE_WECHAT_PREVIEW,
					active: true,
				});
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	async initThemeDirectory() {
		const adapter = this.app.vault.adapter;
		const folderPath = this.settings.themeFolder;
		// Delegate to themes.ts logic by writing there or doing inline
		const templateCss = `/* 
微信自定义主题模板 (Custom WeChat Theme Template)
文件名将作为主题名称显示在下拉列表中 (e.g. "蓝色极客.css" => "蓝色极客")

支持的选择器说明 (Supported Selectors):
- .container  : 外部大包裹容器样式 (整体字体、行高、对齐等)
- h1, h2, h3, h4, h5, h6 : 一至六级标题样式
- p           : 普通段落样式
- code        : 行内单行代码标签
- blockquote  : 引用块
- ul, ol      : 无序/有序列表容器
- li          : 列表项样式
- strong      : 加粗文本
- a           : 链接 (微信端将渲染为高亮下划线)
- em          : 斜体文本
- del         : 删除线
- hr          : 分割线
- table, th, td : 表格和单元格样式
- pre         : 多行代码块背景框
- pre_code    : 多行代码文本样式 (对应代码块内部的 code 标签)
*/

.container {
    font-family: -apple-system-font, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
    font-size: 15px;
    color: #333333;
    line-height: 1.8;
    letter-spacing: 0.5px;
    text-align: justify;
}

h1 {
    font-size: 1.45em;
    color: #d35400; /* 珊瑚红 */
    border-bottom: 2px solid #d35400;
    padding-bottom: 6px;
    margin-top: 1.8em;
    margin-bottom: 0.8em;
    font-weight: bold;
}

h2 {
    font-size: 1.25em;
    color: #d35400;
    margin-top: 1.6em;
    margin-bottom: 0.8em;
    font-weight: bold;
    border-left: 4px solid #d35400;
    padding-left: 8px;
}

h3 {
    font-size: 1.12em;
    color: #e67e22;
    margin-top: 1.4em;
    margin-bottom: 0.6em;
    font-weight: bold;
}

h4 {
    font-size: 1.0em;
    color: #e67e22;
    margin-top: 1.2em;
    margin-bottom: 0.6em;
    font-weight: bold;
}

h5 {
    font-size: 1.0em;
    color: #444444;
    margin-top: 1.2em;
    margin-bottom: 0.6em;
    font-weight: bold;
}

h6 {
    font-size: 0.9em;
    color: #666666;
    margin-top: 1.2em;
    margin-bottom: 0.6em;
    font-weight: bold;
}

p {
    margin-top: 0px;
    margin-bottom: 1.4em;
    color: #333333;
}

code {
    font-family: Consolas, Monaco, monospace;
    font-size: 14px;
    background-color: #fbeee6;
    color: #d35400;
    padding: 2px 6px;
    border-radius: 4px;
}

blockquote {
    margin: 1.5em 0;
    padding: 12px 18px;
    background: #fdf5e6;
    border-left: 4px solid #d35400;
    color: #5d4037;
    font-size: 0.95em;
    border-radius: 0 4px 4px 0;
}

ul {
    margin-top: 0px;
    margin-bottom: 1.2em;
    padding-left: 20px;
    list-style-type: disc;
}

ol {
    margin-top: 0px;
    margin-bottom: 1.2em;
    padding-left: 20px;
    list-style-type: decimal;
}

li {
    margin-bottom: 6px;
    line-height: 1.7;
    color: #444444;
}

strong {
    color: #d35400;
    font-weight: bold;
}

a {
    color: #d35400;
    text-decoration: none;
    border-bottom: 1px dashed #d35400;
}

em {
    font-style: italic;
    color: #5d4037;
}

del {
    text-decoration: line-through;
    color: #888888;
}

hr {
    border: 0;
    border-top: 1px solid #d35400;
    margin: 2.5em 0;
    opacity: 0.8;
}

table {
    border-collapse: collapse;
    width: 100%;
    margin: 2em 0;
    font-size: 0.9em;
}

th {
    border: 1px solid #f9ebdf;
    background-color: #fdf5e6;
    color: #d35400;
    padding: 10px 14px;
    font-weight: bold;
}

td {
    border: 1px solid #f9ebdf;
    padding: 10px 14px;
    color: #444444;
}

pre {
    background-color: #282c34;
    padding: 14px 18px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 1.8em 0;
    line-height: 1.6;
}

pre_code {
    font-family: Consolas, Monaco, monospace;
    font-size: 13px;
    color: #abb2bf;
}
`;
		await initThemeDirectory(adapter, folderPath, templateCss);
	}

	async loadCustomThemes() {
		this.customThemes = await loadCustomThemes(this.app.vault.adapter, this.settings.themeFolder);
	}
}