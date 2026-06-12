import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	Modal,
	Notice,
	requestUrl,
	RequestUrlParam,
	MarkdownView,
	ItemView,
	WorkspaceLeaf
} from 'obsidian';
import { marked } from 'marked';
import hljs from 'highlight.js';

// View type identifier for the sidebar view
const VIEW_TYPE_WECHAT_PREVIEW = "wechat-preview-view";

// Interface for plugin settings
interface Md2WeChatSettings {
	appId: string;
	appSecret: string;
	defaultStyle: string;
	customCss: string;
	enableImgUpload: boolean;
	imageHostingType: 'wechat' | 'none';
	defaultThumbMediaId: string;
	cachedMaterials: Array<{ mediaId: string; name: string }>;
	themeFolder: string;
}

const DEFAULT_SETTINGS: Md2WeChatSettings = {
	appId: '',
	appSecret: '',
	defaultStyle: 'elegant',
	customCss: '',
	enableImgUpload: true,
	imageHostingType: 'wechat',
	defaultThumbMediaId: '',
	cachedMaterials: [],
	themeFolder: 'wechat-format-themes'
};

// Preset WeChat CSS styles (as template strings for easy embedding as inline styles)
interface ThemeStyle {
	name: string;
	container: string;
	h1: string;
	h2: string;
	h3: string;
	h4?: string;
	h5?: string;
	h6?: string;
	p: string;
	code: string;
	blockquote: string;
	ul: string;
	ol: string;
	li: string;
	strong: string;
	link: string;
	em?: string;
	del?: string;
	hr?: string;
	table?: string;
	th?: string;
	td?: string;
	pre?: string;
	pre_code?: string;
}

const THEMES: Record<string, ThemeStyle> = {
	elegant: {
		name: "Elegant Green (雅绿)",
		container: "font-family: -apple-system-font, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei UI', Arial, sans-serif; font-size: 15px; color: #353535; line-height: 1.75; letter-spacing: 0.5px; word-wrap: break-word; text-align: justify;",
		h1: "font-size: 1.35em; color: #2e6851; border-bottom: 2px solid #2e6851; padding-bottom: 5px; margin-top: 1.8em; margin-bottom: 0.8em; font-weight: bold;",
		h2: "font-size: 1.2em; color: #2e6851; margin-top: 1.6em; margin-bottom: 0.8em; font-weight: bold; padding-left: 6px; border-left: 3px solid #2e6851;",
		h3: "font-size: 1.1em; color: #3e8868; margin-top: 1.4em; margin-bottom: 0.6em; font-weight: bold;",
		h4: "font-size: 1.0em; color: #3e8868; margin-top: 1.2em; margin-bottom: 0.6em; font-weight: bold;",
		h5: "font-size: 1.0em; color: #444444; margin-top: 1.2em; margin-bottom: 0.6em; font-weight: bold;",
		h6: "font-size: 0.9em; color: #666666; margin-top: 1.2em; margin-bottom: 0.6em; font-weight: bold;",
		p: "margin-top: 0px; margin-bottom: 1.4em; color: #3e3e3e; line-height: 1.8;",
		code: "font-family: Consolas, Monaco, monospace; font-size: 14px; background-color: #f8f8f8; color: #c7254e; padding: 2px 4px; border-radius: 4px; border: 1px solid #e1e1e8; word-break: break-all;",
		blockquote: "margin: 1.5em 0; padding: 10px 15px; background: #f4f9f6; border-left: 4px solid #2e6851; color: #555555; font-size: 0.95em; border-radius: 0 4px 4px 0;",
		ul: "margin-top: 0px; margin-bottom: 1.2em; padding-left: 20px; list-style-type: disc;",
		ol: "margin-top: 0px; margin-bottom: 1.2em; padding-left: 20px; list-style-type: decimal;",
		li: "margin-bottom: 6px; line-height: 1.7; color: #444444;",
		strong: "color: #2e6851; font-weight: bold;",
		link: "color: #2e6851; text-decoration: none; border-bottom: 1px dashed #2e6851;",
		em: "font-style: italic; color: #555555;",
		del: "text-decoration: line-through; color: #888888;",
		hr: "border: 0; border-top: 1px solid #2e6851; margin: 2em 0; opacity: 0.7;",
		table: "border-collapse: collapse; width: 100%; margin: 1.5em 0; font-size: 0.9em;",
		th: "border: 1px solid #dfdfdf; background-color: #f2fcf7; color: #2e6851; padding: 8px 12px; font-weight: bold; text-align: left;",
		td: "border: 1px solid #dfdfdf; padding: 8px 12px; color: #444444;",
		pre: "background-color: #1a1a1a; padding: 12px 16px; border-radius: 6px; overflow-x: auto; margin: 1.5em 0; line-height: 1.6; color: #abb2bf; font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; tab-size: 4; -moz-tab-size: 4; -o-tab-size: 4;",
		pre_code: "font-family: inherit; font-size: 13px; background-color: transparent; border: 0; padding: 0; color: inherit; line-height: inherit; word-wrap: normal;"
	},
	warm: {
		name: "Warm Gold (温暖暖金)",
		container: "font-family: -apple-system-font, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', sans-serif; font-size: 15px; color: #3e3a35; line-height: 1.8; letter-spacing: 0.5px;",
		h1: "font-size: 1.4em; color: #b25829; text-align: center; border-bottom: 1px dashed #b25829; padding-bottom: 8px; margin-top: 2em; margin-bottom: 1em; font-weight: bold;",
		h2: "font-size: 1.2em; color: #b25829; margin-top: 1.6em; margin-bottom: 0.8em; font-weight: bold; background: #faf4ee; padding: 4px 10px; border-radius: 4px;",
		h3: "font-size: 1.1em; color: #c67144; margin-top: 1.4em; margin-bottom: 0.6em; font-weight: bold;",
		h4: "font-size: 1.0em; color: #c67144; margin-top: 1.2em; margin-bottom: 0.6em; font-weight: bold;",
		h5: "font-size: 1.0em; color: #4a453f; margin-top: 1.2em; margin-bottom: 0.6em; font-weight: bold;",
		h6: "font-size: 0.9em; color: #7e756b; margin-top: 1.2em; margin-bottom: 0.6em; font-weight: bold;",
		p: "margin-top: 0px; margin-bottom: 1.4em; color: #4a453f; line-height: 1.8; text-align: justify;",
		code: "font-family: monospace; font-size: 14px; background-color: #faf4ee; color: #b25829; padding: 2px 4px; border-radius: 3px;",
		blockquote: "margin: 1.5em 0; padding: 12px 18px; background: #faf4ee; border-left: 4px solid #b25829; color: #6e655b; font-size: 0.95em;",
		ul: "margin-top: 0px; margin-bottom: 1.2em; padding-left: 20px; list-style-type: circle;",
		ol: "margin-top: 0px; margin-bottom: 1.2em; padding-left: 20px; list-style-type: decimal;",
		li: "margin-bottom: 6px; line-height: 1.7;",
		strong: "color: #b25829; font-weight: bold;",
		link: "color: #b25829; text-decoration: underline;",
		em: "font-style: italic; color: #6e655b;",
		del: "text-decoration: line-through; color: #9c9287;",
		hr: "border: 0; border-top: 1px dashed #b25829; margin: 2em 0; opacity: 0.8;",
		table: "border-collapse: collapse; width: 100%; margin: 1.5em 0; font-size: 0.9em;",
		th: "border: 1px solid #e9dfd6; background-color: #faf4ee; color: #b25829; padding: 8px 12px; font-weight: bold; text-align: left;",
		td: "border: 1px solid #e9dfd6; padding: 8px 12px; color: #4a453f;",
		pre: "background-color: #1a1a1a; border: 1px solid #e9dfd6; padding: 12px 16px; border-radius: 6px; overflow-x: auto; margin: 1.5em 0; line-height: 1.6; color: #abb2bf; font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; tab-size: 4; -moz-tab-size: 4; -o-tab-size: 4;",
		pre_code: "font-family: inherit; font-size: 13px; background-color: transparent; border: 0; padding: 0; color: inherit; line-height: inherit; word-wrap: normal;"
	},
	minimal: {
		name: "Minimalist Black (极简黑色)",
		container: "font-family: -apple-system-font, BlinkMacSystemFont, sans-serif; font-size: 15px; color: #222222; line-height: 1.7; letter-spacing: 0.2px;",
		h1: "font-size: 1.5em; color: #000000; font-weight: bold; margin-top: 1.8em; margin-bottom: 0.8em; border-bottom: 1px solid #000000; padding-bottom: 5px;",
		h2: "font-size: 1.25em; color: #000000; font-weight: bold; margin-top: 1.6em; margin-bottom: 0.8em;",
		h3: "font-size: 1.1em; color: #444444; font-weight: bold; margin-top: 1.4em; margin-bottom: 0.6em;",
		h4: "font-size: 1.0em; color: #444444; font-weight: bold; margin-top: 1.2em; margin-bottom: 0.6em;",
		h5: "font-size: 1.0em; color: #666666; font-weight: bold; margin-top: 1.2em; margin-bottom: 0.6em;",
		h6: "font-size: 0.9em; color: #888888; font-style: italic; margin-top: 1.2em; margin-bottom: 0.6em;",
		p: "margin-top: 0px; margin-bottom: 1.4em; color: #222222; text-align: justify;",
		code: "font-family: monospace; font-size: 14px; background-color: #f3f3f3; color: #000000; padding: 2px 4px; border-radius: 2px;",
		blockquote: "margin: 1.5em 0; padding: 10px 15px; background: #f9f9f9; border-left: 3px solid #000000; color: #666666; font-style: italic;",
		ul: "margin-top: 0px; margin-bottom: 1.2em; padding-left: 20px; list-style-type: square;",
		ol: "margin-top: 0px; margin-bottom: 1.2em; padding-left: 20px; list-style-type: decimal;",
		li: "margin-bottom: 6px; color: #333333;",
		strong: "color: #000000; font-weight: bold;",
		link: "color: #1a0dab; text-decoration: underline;",
		em: "font-style: italic;",
		del: "text-decoration: line-through; color: #999999;",
		hr: "border: 0; border-top: 1px solid #000000; margin: 2em 0;",
		table: "border-collapse: collapse; width: 100%; margin: 1.5em 0; font-size: 0.9em;",
		th: "border: 1px solid #dddddd; background-color: #f9f9f9; color: #000000; padding: 8px 12px; font-weight: bold; text-align: left;",
		td: "border: 1px solid #dddddd; padding: 8px 12px; color: #222222;",
		pre: "background-color: #1a1a1a; padding: 12px 16px; border-radius: 6px; overflow-x: auto; margin: 1.5em 0; line-height: 1.6; color: #abb2bf; font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; tab-size: 4; -moz-tab-size: 4; -o-tab-size: 4;",
		pre_code: "font-family: inherit; font-size: 13px; background-color: transparent; border: 0; padding: 0; color: inherit; line-height: inherit; word-wrap: normal;"
	}
};

export default class Md2WeChatPlugin extends Plugin {
	settings!: Md2WeChatSettings;
	customThemes: Record<string, ThemeStyle> = {};

	async onload() {
		await this.loadSettings();
		await this.initThemeDirectory();
		await this.loadCustomThemes();

		// Register Sidebar View
		this.registerView(
			VIEW_TYPE_WECHAT_PREVIEW,
			(leaf) => new WeChatPreviewView(leaf, this)
		);

		// Add Ribbon icon for preview
		this.addRibbonIcon('share-2', 'WeChat Format & Sync', () => {
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
			// Already exists, just make active
			leaf = leaves[0];
		} else {
			// Create a new leaf in the right sidebar
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

	// Initialize theme directory and write custom CSS template
	async initThemeDirectory() {
		const folderPath = this.settings.themeFolder;
		try {
			const adapter = this.app.vault.adapter;
			const exists = await adapter.exists(folderPath);
			if (!exists) {
				await this.app.vault.createFolder(folderPath);
				
				// Create a default theme template file with comments and guide
				const templateCss = `/* 
微信自定义主题模板 (Custom WeChat Theme Template)
文件名将作为主题名称显示在下拉列表中 (e.g. "酷炫黑.css" => "酷炫黑")

支持的选择器说明 (Supported Selectors):
- .container  : 外部大包裹容器样式 (字体、行高、对齐方式)
- h1, h2, h3, h4, h5, h6 : 各级标题
- p           : 普通段落
- code        : 行内代码
- blockquote  : 引用块
- ul, ol      : 无序/有序列表容器
- li          : 列表项
- strong      : 加粗文本
- a           : 链接
- em          : 斜体文本
- del         : 删除线
- hr          : 分割线
- table, th, td : 表格和单元格样式
- pre         : 多行代码块背景框
- pre code    : 多行代码文本样式
*/

.container {
    font-family: -apple-system-font, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', sans-serif;
    font-size: 15px;
    color: #2b2b2b;
    line-height: 1.8;
    letter-spacing: 0.5px;
    text-align: justify;
}

h1 {
    font-size: 1.4em;
    color: #e74c3c;
    border-bottom: 2px solid #e74c3c;
    padding-bottom: 6px;
    margin-top: 1.8em;
    margin-bottom: 0.8em;
    font-weight: bold;
}

h2 {
    font-size: 1.25em;
    color: #e74c3c;
    margin-top: 1.6em;
    margin-bottom: 0.8em;
    font-weight: bold;
    border-left: 4px solid #e74c3c;
    padding-left: 8px;
}

h3 {
    font-size: 1.1em;
    color: #c0392b;
    margin-top: 1.4em;
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
    background-color: #fadbd8;
    color: #c0392b;
    padding: 2px 6px;
    border-radius: 4px;
}

blockquote {
    margin: 1.5em 0;
    padding: 12px 18px;
    background: #fdf2e9;
    border-left: 4px solid #e74c3c;
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
    color: #e74c3c;
    font-weight: bold;
}

a {
    color: #e74c3c;
    text-decoration: none;
    border-bottom: 1px dashed #e74c3c;
}

em {
    font-style: italic;
    color: #555555;
}

del {
    text-decoration: line-through;
    color: #888888;
}

hr {
    border: 0;
    border-top: 1px solid #e74c3c;
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
    border: 1px solid #fadbd8;
    background-color: #fdf2e9;
    color: #e74c3c;
    padding: 10px 14px;
    font-weight: bold;
}

td {
    border: 1px solid #fadbd8;
    padding: 10px 14px;
    color: #444444;
}

pre {
    background-color: #2d3748;
    padding: 14px 18px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 1.8em 0;
    line-height: 1.5;
}

pre_code {
    font-family: Consolas, Monaco, monospace;
    font-size: 13px;
    color: #f7fafc;
}
`;
				await adapter.write(`${folderPath}/红色热情 (示例).css`, templateCss);
			}
		} catch (e) {
			console.error("【微信同步】创建自定义主题目录失败:", e);
		}
	}

	// Load and parse all CSS files in the theme folder
	async loadCustomThemes() {
		this.customThemes = {};
		const folderPath = this.settings.themeFolder;
		try {
			const adapter = this.app.vault.adapter;
			const exists = await adapter.exists(folderPath);
			if (!exists) return;

			const files = await adapter.list(folderPath);
			// Filter only .css files
			const cssFiles = files.files.filter(f => f.endsWith('.css'));

			for (const file of cssFiles) {
				const content = await adapter.read(file);
				const fileName = file.split('/').pop() || '';
				const themeName = fileName.replace(/\.css$/, '');
				const parsedTheme = this.parseCssToTheme(themeName, content);
				if (parsedTheme) {
					this.customThemes[themeName] = parsedTheme;
				}
			}
		} catch (e) {
			console.error("【微信同步】加载自定义主题失败:", e);
		}
	}

	// Simple and robust parser for CSS selectors and rules
	parseCssToTheme(themeName: string, cssText: string): ThemeStyle | null {
		// Create a baseline default layout structure
		const baseline: ThemeStyle = {
			name: `${themeName} (自定义)`,
			container: "font-family: -apple-system-font, BlinkMacSystemFont, sans-serif; font-size: 15px; color: #353535; line-height: 1.75; text-align: justify;",
			h1: "font-size: 1.35em; font-weight: bold;",
			h2: "font-size: 1.2em; font-weight: bold;",
			h3: "font-size: 1.1em; font-weight: bold;",
			h4: "font-size: 1.0em; font-weight: bold;",
			h5: "font-size: 1.0em; font-weight: bold;",
			h6: "font-size: 0.9em; font-weight: bold;",
			p: "margin-top: 0px; margin-bottom: 1.4em;",
			code: "font-family: monospace; font-size: 14px;",
			blockquote: "margin: 1.5em 0; padding: 10px 15px;",
			ul: "margin-top: 0px; margin-bottom: 1.2em; padding-left: 20px;",
			ol: "margin-top: 0px; margin-bottom: 1.2em; padding-left: 20px;",
			li: "margin-bottom: 6px;",
			strong: "font-weight: bold;",
			link: "text-decoration: none;",
			em: "font-style: italic;",
			del: "text-decoration: line-through;",
			hr: "border: 0; border-top: 1px solid #cccccc; margin: 2em 0;",
			table: "border-collapse: collapse; width: 100%; margin: 1.5em 0;",
			th: "border: 1px solid #cccccc; padding: 8px 12px; font-weight: bold; text-align: left;",
			td: "border: 1px solid #cccccc; padding: 8px 12px;",
			pre: "padding: 12px 16px; border-radius: 6px; overflow-x: auto; margin: 1.5em 0; font-family: monospace;",
			pre_code: "font-family: inherit; font-size: 13px;"
		};

		try {
			// Strip out block comments /* ... */
			const strippedCss = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
			
			// Match "selector { rules }"
			const ruleRegex = /([^{]+)\{([^}]+)\}/g;
			let match;

			while ((match = ruleRegex.exec(strippedCss)) !== null) {
				const selector = match[1].trim().toLowerCase();
				const rulesRaw = match[2].trim();
				
				// Standardize property declarations
				const rules = rulesRaw
					.split(';')
					.map(r => r.trim())
					.filter(r => r.length > 0)
					.join('; ') + ';';

				// Map selectors to baseline keys
				if (selector === '.container' || selector === 'container') {
					baseline.container = rules;
				} else if (selector === 'h1') {
					baseline.h1 = rules;
				} else if (selector === 'h2') {
					baseline.h2 = rules;
				} else if (selector === 'h3') {
					baseline.h3 = rules;
				} else if (selector === 'h4') {
					baseline.h4 = rules;
				} else if (selector === 'h5') {
					baseline.h5 = rules;
				} else if (selector === 'h6') {
					baseline.h6 = rules;
				} else if (selector === 'p') {
					baseline.p = rules;
				} else if (selector === 'code') {
					baseline.code = rules;
				} else if (selector === 'blockquote') {
					baseline.blockquote = rules;
				} else if (selector === 'ul') {
					baseline.ul = rules;
				} else if (selector === 'ol') {
					baseline.ol = rules;
				} else if (selector === 'li') {
					baseline.li = rules;
				} else if (selector === 'strong' || selector === 'b') {
					baseline.strong = rules;
				} else if (selector === 'a') {
					baseline.link = rules;
				} else if (selector === 'em' || selector === 'i') {
					baseline.em = rules;
				} else if (selector === 'del' || selector === 's') {
					baseline.del = rules;
				} else if (selector === 'hr') {
					baseline.hr = rules;
				} else if (selector === 'table') {
					baseline.table = rules;
				} else if (selector === 'th') {
					baseline.th = rules;
				} else if (selector === 'td') {
					baseline.td = rules;
				} else if (selector === 'pre') {
					baseline.pre = rules;
				} else if (selector === 'pre code' || selector === 'pre_code') {
					baseline.pre_code = rules;
				}
			}
			return baseline;
		} catch (e) {
			console.error(`【微信同步】解析CSS主题 ${themeName} 失败:`, e);
			return null;
		}
	}
}

// Parse and rewrite standard Markdown footnote definitions to WeChat compatible layout
function preprocessWeChatFootnotes(markdown: string): { markdown: string; footnotes: Array<{ index: number; label: string; content: string }> } {
	const footnotes: Array<{ index: number; label: string; content: string }> = [];
	
	// 1. High tolerance regex to match footnote definitions: e.g., [^1]: https://google.com
	// Allows leading spaces/tabs and matches multiline or single line definitions.
	const definitionRegex = /^\s*\[\^([^\]]+)\]:\s*([^\n]+(?:\n(?!\s*\[\^|\s*\n)[^\n]+)*)/gm;
	
	const refMap: Record<string, { index: number; content: string }> = {};
	let counter = 1;

	let processedMarkdown = markdown;
	const definitions: Array<{ raw: string; label: string; content: string }> = [];
	
	let defMatch;
	// Use a copy to find matches without losing regex state on replace
	while ((defMatch = definitionRegex.exec(markdown)) !== null) {
		definitions.push({
			raw: defMatch[0],
			label: defMatch[1].trim(),
			content: defMatch[2].trim()
		});
	}

	// Safely peel off all definitions from the original text body
	definitions.forEach(def => {
		processedMarkdown = processedMarkdown.replace(def.raw, '');
		if (!refMap[def.label]) {
			refMap[def.label] = { index: counter++, content: def.content };
		}
	});

	// 2. Inline replacement, replacing [^1] or [^ref] inside body text with superscript HTML tags
	// We avoid matching footnote definition itself by using a label boundary check
	const inlineRefRegex = /\[\^([^\]]+)\](?!\s*:)/g;
	processedMarkdown = processedMarkdown.replace(inlineRefRegex, (match, label) => {
		const cleanLabel = label.trim();
		const ref = refMap[cleanLabel];
		if (ref) {
			// Save active footnote reference
			if (!footnotes.some(f => f.label === cleanLabel)) {
				footnotes.push({ index: ref.index, label: cleanLabel, content: ref.content });
			}
			// Replace with stylized superscript HTML tags to bypass markdown render and go straight to HTML
			// Using deep green or theme colored text for footnote index
			return `<sup class="wechat-footnote-ref" style="font-size: 0.75em; line-height: 0; position: relative; vertical-align: baseline; top: -0.5em; margin-left: 2px; margin-right: 2px; font-weight: bold; color: #2e6851;">[${ref.index}]</sup>`;
		}
		return match;
	});

	// Sort footnotes to ensure correct order
	footnotes.sort((a, b) => a.index - b.index);

	return { markdown: processedMarkdown, footnotes };
}

// Convert Obsidian Markdown to WeChat-ready inline HTML using Marked and DOM-based Inliner
function convertToWeChatHtml(markdownText: string, theme: ThemeStyle): string {
	// 1. Preprocess WeChat compatible footnotes
	const { markdown: preparedMarkdown, footnotes } = preprocessWeChatFootnotes(markdownText);

	// 2. Configure marked parser to highlight code using highlight.js
	// Use marked's renderer custom code hook to parse syntax highlights synchronously
	const renderer = new marked.Renderer();
	renderer.code = function({ text, lang, escaped }: { text: string; lang?: string; escaped?: boolean }): string {
		const validLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
		const highlighted = hljs.highlight(text, { language: validLang }).value;
		return `<pre><code class="hljs language-${validLang}">${highlighted}</code></pre>`;
	};

	// Generate standard HTML from markdown with custom renderer
	let rawHtml = marked.parse(preparedMarkdown, { renderer, async: false }) as string;

	// 3. Append standard WeChat Footnotes list at the bottom if references exist
	if (footnotes.length > 0) {
		let footnoteListHtml = `<div class="wechat-footnotes-section" style="margin-top: 3em; border-top: 1px solid #e1e1e8; padding-top: 1.5em; font-size: 13px; color: #666666;">`;
		// Subheader for reference section
		footnoteListHtml += `<h4 style="font-size: 14px; font-weight: bold; margin-bottom: 1em; color: #444444;">参考资料:</h4>`;
		footnoteListHtml += `<ol style="padding-left: 18px; margin: 0; list-style-type: decimal; line-height: 1.65;">`;
		
		footnotes.forEach(fn => {
			// Convert links inside footnote content to pure text with styling since WeChat strips external a tags
			let content = fn.content;
			// Convert markdown [Google](https://google.com) to plain text with bracketed URL
			content = content.replace(/\[(.*?)\]\((.*?)\)/g, '$1: $2');
			footnoteListHtml += `<li style="margin-bottom: 6px; text-align: justify; word-break: break-all;"><span style="font-weight: bold; margin-right: 4px;">[${fn.index}]</span> ${content}</li>`;
		});

		footnoteListHtml += `</ol></div>`;
		rawHtml += footnoteListHtml;
	}

	// 4. Parse HTML string to a DOM structure using parser (supported natively in Obsidian's electron browser env)
	const parser = new DOMParser();
	const doc = parser.parseFromString(`<div>${rawHtml}</div>`, 'text/html');
	const container = doc.body.firstElementChild as HTMLElement;

	if (!container) return '';

	// 5. Inject global container style
	container.setAttribute('style', theme.container || '');

	// Helper to apply css to selectors inside our container
	const applyStyle = (selector: string, styleText: string | undefined) => {
		if (!styleText) return;
		const elements = container.querySelectorAll(selector);
		elements.forEach(el => {
			const existingStyle = el.getAttribute('style') || '';
			// Merge styles gracefully
			el.setAttribute('style', existingStyle ? `${existingStyle} ${styleText}` : styleText);
		});
	};

	// 6. Inject styles block-by-block and inline them cleanly
	applyStyle('h1', theme.h1);
	applyStyle('h2', theme.h2);
	applyStyle('h3', theme.h3);
	applyStyle('h4', theme.h4);
	applyStyle('h5', theme.h5);
	applyStyle('h6', theme.h6);
	applyStyle('p', theme.p);
	applyStyle('code', theme.code);
	applyStyle('blockquote', theme.blockquote);
	applyStyle('ul', theme.ul);
	applyStyle('ol', theme.ol);
	applyStyle('li', theme.li);
	applyStyle('strong', theme.strong);
	applyStyle('a', theme.link);
	applyStyle('em', theme.em);
	applyStyle('del', theme.del);
	applyStyle('hr', theme.hr);
	applyStyle('table', theme.table);
	applyStyle('th', theme.th);
	applyStyle('td', theme.td);
	applyStyle('pre', theme.pre);

	// 7. Map highlight.js classes directly to inline styles for code highlighting
	// We map the main class tokens used by highlight.js to WeChat compatible colored styles
	const syntaxColors: Record<string, string> = {
		'hljs-keyword': 'color: #f92672; font-weight: bold;',
		'hljs-string': 'color: #a6e22e;',
		'hljs-comment': 'color: #75715e; font-style: italic;',
		'hljs-number': 'color: #ae81ff;',
		'hljs-function': 'color: #a6e22e;',
		'hljs-title': 'color: #66d9ef;',
		'hljs-params': 'color: #f8f8f2;',
		'hljs-built_in': 'color: #66d9ef;',
		'hljs-type': 'color: #66d9ef; font-style: italic;',
		'hljs-class': 'color: #a6e22e;',
		'hljs-attr': 'color: #f92672;',
		'hljs-attribute': 'color: #e6db74;',
		'hljs-variable': 'color: #f8f8f2;',
		'hljs-meta': 'color: #75715e;',
		'hljs-literal': 'color: #ae81ff;'
	};

	Object.keys(syntaxColors).forEach(className => {
		const elements = container.querySelectorAll(`.${className}`);
		elements.forEach(el => {
			const existing = el.getAttribute('style') || '';
			el.setAttribute('style', existing ? `${existing} ${syntaxColors[className]}` : syntaxColors[className]);
		});
	});

	// Special treatment for multi-line pre code blocks to override code rules and style them properly
	// Force tab-size, remove letter-spacing and word-spacing to fix super wide spaces and tabs
	const preBlocks = container.querySelectorAll('pre');
	preBlocks.forEach(el => {
		const existingStyle = el.getAttribute('style') || '';
		el.setAttribute('style', `${existingStyle} letter-spacing: 0px !important; word-spacing: normal !important; tab-size: 4 !important; -moz-tab-size: 4 !important; -o-tab-size: 4 !important;`);
	});

	const preCodeBlocks = container.querySelectorAll('pre code');
	preCodeBlocks.forEach(el => {
		const baseStyle = theme.pre_code || '';
		el.setAttribute('style', `${baseStyle} letter-spacing: 0px !important; word-spacing: normal !important; tab-size: 4 !important; -moz-tab-size: 4 !important; -o-tab-size: 4 !important;`);
	});

	// For elements inside blockquotes, make sure standard paragraph margin/styles are overridden gracefully or aligned
	const blockquoteParagraphs = container.querySelectorAll('blockquote p');
	blockquoteParagraphs.forEach(p => {
		const style = p.getAttribute('style') || '';
		p.setAttribute('style', `${style} margin: 0.5em 0; color: inherit; line-height: inherit;`);
	});

	// Set color of wechat-footnote-ref matching the theme's default strong/link colors dynamically
	// We extract color attribute from theme's strong style
	let themeColor = '#2e6851'; // elegant green baseline
	if (theme.strong) {
		const colorMatch = theme.strong.match(/color:\s*(#[0-9a-fA-F]+)/);
		if (colorMatch) {
			themeColor = colorMatch[1];
		}
	}
	const footnoteRefs = container.querySelectorAll('.wechat-footnote-ref');
	footnoteRefs.forEach(ref => {
		const style = ref.getAttribute('style') || '';
		ref.setAttribute('style', style.replace('color: #2e6851;', `color: ${themeColor};`));
	});

	// 8. Serialize back to high compatibility inline HTML string
	return container.outerHTML;
}

// Permanent Sidebar View for Preview and Sync
class WeChatPreviewView extends ItemView {
	plugin: Md2WeChatPlugin;
	currentHtml: string = '';
	lastTitle: string = 'Untitled Note';
	lastDigest: string = '';
	lastMarkdown: string = '';

	constructor(leaf: WorkspaceLeaf, plugin: Md2WeChatPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_WECHAT_PREVIEW;
	}

	getDisplayText(): string {
		return "WeChat Format Sync";
	}

	getIcon(): string {
		return "share-2";
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Create HTML layout
		const container = contentEl.createDiv({ cls: 'md2wechat-preview-container' });

		// Toolbar
		const toolbar = container.createDiv({ cls: 'md2wechat-preview-toolbar' });

		// Theme selector
		const selector = toolbar.createEl('select', { cls: 'md2wechat-style-select' });
		
		// Function to rebuild options dynamically including custom themes
		const populateSelector = () => {
			// Record currently selected value before clearing to preserve selection state
			const currentlySelected = selector.value;
			
			selector.empty();
			
			// Built-in themes
			Object.keys(THEMES).forEach(key => {
				const option = selector.createEl('option');
				option.value = key;
				option.text = THEMES[key].name;
				if (currentlySelected) {
					if (key === currentlySelected) option.selected = true;
				} else {
					if (key === this.plugin.settings.defaultStyle) option.selected = true;
				}
			});

			// Custom themes
			Object.keys(this.plugin.customThemes).forEach(key => {
				const option = selector.createEl('option');
				option.value = `custom:${key}`;
				option.text = `📂 ${key}`;
				if (currentlySelected) {
					if (`custom:${key}` === currentlySelected) option.selected = true;
				} else {
					if (`custom:${key}` === this.plugin.settings.defaultStyle) option.selected = true;
				}
			});

			// If the previously selected theme is still valid, restore it explicitly
			if (currentlySelected) {
				selector.value = currentlySelected;
			}
		};

		populateSelector();

		// Buttons
		const refreshBtn = toolbar.createEl('button', { text: '🔄' });
		refreshBtn.title = "Refresh Themes & Preview";
		const copyBtn = toolbar.createEl('button', { text: 'Copy Rich Text' });
		const syncBtn = toolbar.createEl('button', { text: 'Sync to Draft' });
		syncBtn.addClass('mod-cta');

		// Preview Wrapper
		const previewWrapper = container.createDiv({ cls: 'md2wechat-preview-content-wrapper' });
		const previewArea = previewWrapper.createDiv({ cls: 'md2wechat-preview-content' });

		// Render function
		const render = (onlyIfMarkdown = false) => {
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			let markdownText = '';
			
			if (activeView) {
				// 1. If we have a focused markdown view, get its text
				markdownText = typeof activeView.setViewData === 'function' ? activeView.data : activeView.editor.getValue();
			} else if (this.lastMarkdown) {
				// 2. If we lost focus (e.g. focused on sidebar), fallback to cached lastMarkdown to prevent clearing
				markdownText = this.lastMarkdown;
			} else {
				// 3. Complete fallback (fresh open with no focus and no cache)
				if (!onlyIfMarkdown) {
					previewArea.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted);">Please open and select a markdown note first!</div>`;
				}
				return;
			}
			
			let theme = THEMES.elegant;
			const selectedVal = selector.value;
			if (selectedVal && selectedVal.startsWith('custom:')) {
				const customKey = selectedVal.replace('custom:', '');
				theme = this.plugin.customThemes[customKey] || THEMES.elegant;
			} else if (selectedVal) {
				theme = THEMES[selectedVal] || THEMES.elegant;
			}

			this.currentHtml = convertToWeChatHtml(markdownText, theme);
			previewArea.innerHTML = this.currentHtml;

			// Store metadata of the last successfully rendered article
			this.lastMarkdown = markdownText;
			if (activeView) {
				this.lastTitle = activeView.file ? activeView.file.basename : 'Untitled Note';
				const firstHeaderMatch = markdownText.match(/^#\s+(.+)$/m);
				if (firstHeaderMatch) {
					this.lastTitle = firstHeaderMatch[1].trim();
				}
			}
			this.lastDigest = markdownText.substring(0, 120).replace(/[#*`>]/g, '').trim();
		};

		// Initial Render (force show placeholder if no markdown view is active)
		render(false);

		// Listeners
		selector.addEventListener('change', () => {
			render(false);
		});

		refreshBtn.addEventListener('click', async () => {
			await this.plugin.loadCustomThemes();
			populateSelector();
			render(false);
			new Notice('Themes refreshed and preview updated!');
		});

		// Automatically refresh preview when user switches file or edits
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				// Only update/render if a Markdown file is active. 
				// This prevents the preview from clearing when the user clicks/focuses on the preview sidebar itself.
				render(true);
			})
		);

		// Copy button handler
		copyBtn.addEventListener('click', async () => {
			if (!this.currentHtml) {
				new Notice('No rendered content to copy! Please open and select a markdown note first.');
				return;
			}

			try {
				const blob = new Blob([this.currentHtml], { type: 'text/html' });
				const data = [new ClipboardItem({ 'text/html': blob, 'text/plain': new Blob([this.lastMarkdown], { type: 'text/plain' }) })];
				await navigator.clipboard.write(data);
				new Notice('Rich text copied successfully! Ready to paste into WeChat editor.');
			} catch (err) {
				console.error(err);
				new Notice('Failed to copy to clipboard automatically. Trying fallback...');
				const el = document.createElement('div');
				el.innerHTML = this.currentHtml;
				el.style.position = 'fixed';
				el.style.pointerEvents = 'none';
				el.style.opacity = '0';
				document.body.appendChild(el);
				window.getSelection()?.removeAllRanges();
				const range = document.createRange();
				range.selectNode(el);
				window.getSelection()?.addRange(range);
				document.execCommand('copy');
				document.body.removeChild(el);
				new Notice('Copied as HTML successfully via fallback!');
			}
		});

		// Sync button handler
		syncBtn.addEventListener('click', async () => {
			if (!this.currentHtml) {
				new Notice('No rendered content to sync! Please open and select a markdown note first.');
				return;
			}

			const { appId, appSecret } = this.plugin.settings;
			if (!appId || !appSecret) {
				new Notice('Please configure WeChat AppID and AppSecret in the plugin settings first!');
				return;
			}

			syncBtn.disabled = true;
			syncBtn.setText('Syncing...');
			new Notice('Acquiring WeChat access token...');

			try {
				console.log("【微信同步】开始同步流程...");
				console.log("【微信同步】配置参数 - AppID:", appId, "AppSecret:", appSecret ? "****** (已填写)" : "(未填写)");

				// 1. Get Access Token
				const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
				console.log("【微信同步】正在获取 Access Token, 请求URL:", tokenUrl);
				
				const tokenRes = await requestUrl({ url: tokenUrl, method: 'GET' });
				console.log("【微信同步】获取 Token 响应状态码:", tokenRes.status);
				
				if (tokenRes.status !== 200) {
					console.error("【微信同步】获取 Token 失败，原始响应:", tokenRes.text);
					throw new Error(`Token request failed with status ${tokenRes.status}`);
				}
				
				const tokenData = JSON.parse(tokenRes.text);
				console.log("【微信同步】Token 接口返回数据:", tokenData);

				if (tokenData.errcode) {
					throw new Error(`WeChat Token Error: [${tokenData.errcode}] ${tokenData.errmsg}`);
				}

				const accessToken = tokenData.access_token;
				new Notice('Token acquired! Creating Draft...');

				// 2. Use stored metadata
				const title = this.lastTitle || 'Untitled Note';
				const digest = this.lastDigest || '';

				// 3. For WeChat drafts, we need a thumb_media_id (cover image)
				const thumbMediaId = this.plugin.settings.defaultThumbMediaId.trim();
				console.log("【微信同步】封面图 thumb_media_id:", thumbMediaId);
				if (!thumbMediaId) {
					throw new Error("WeChat requires a cover image (thumb_media_id) to create draft. Please configure the 'Default Cover Media ID' in plugin settings first!");
				}

				new Notice('Uploading draft content to WeChat...');
				
				// Create a draft article object
				const article = {
					title: title,
					author: '',
					digest: digest,
					content: this.currentHtml,
					content_source_url: '',
					thumb_media_id: thumbMediaId,
					need_open_comment: 0,
					only_fans_can_comment: 0
				};

				const draftUrl = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`;
				const requestPayload = { articles: [article] };
				
				console.log("【微信同步】正在向微信新建草稿, 目标接口:", draftUrl);
				console.log("【微信同步】发送的数据 payload:", requestPayload);

				const draftRes = await requestUrl({
					url: draftUrl,
					method: 'POST',
					contentType: 'application/json',
					body: JSON.stringify(requestPayload)
				});

				console.log("【微信同步】新建草稿 响应状态码:", draftRes.status);
				console.log("【微信同步】新建草稿 微信返回数据:", draftRes.text);

				const draftData = JSON.parse(draftRes.text);
				if (draftData.errcode) {
					if (draftData.errcode === 40007 || draftData.errcode === 40009) {
						throw new Error(`WeChat Draft Error: Invalid cover image (thumb_media_id). Please make sure you have set up a valid media ID or created an article with a cover first.`);
					}
					throw new Error(`WeChat Sync Error: [${draftData.errcode}] ${draftData.errmsg}`);
				}

				new Notice('Successfully synchronized draft to WeChat Official Account!');

			} catch (err: any) {
				console.error("【微信同步】发生异常，详细堆栈如下：");
				console.error(err);
				new Notice(`Sync failed: ${err.message || err}`);
			} finally {
				syncBtn.disabled = false;
				syncBtn.setText('Sync to Draft');
			}
		});
	}

	async onClose() {
		// Nothing major to clean up
	}
}

// Settings tab UI
class Md2WeChatSettingTab extends PluginSettingTab {
	plugin: Md2WeChatPlugin;

	constructor(app: App, plugin: Md2WeChatPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Markdown to WeChat Settings' });

		new Setting(containerEl)
			.setName('WeChat AppID')
			.setDesc('Your WeChat Official Account Developer AppID')
			.addText(text => text
				.setPlaceholder('wx...')
				.setValue(this.plugin.settings.appId)
				.onChange(async (value) => {
					this.plugin.settings.appId = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('WeChat AppSecret')
			.setDesc('Your WeChat Official Account Developer AppSecret')
			.addText(text => text
				.setPlaceholder('Enter app secret')
				.setValue(this.plugin.settings.appSecret)
				.onChange(async (value) => {
					this.plugin.settings.appSecret = value;
					await this.plugin.saveSettings();
				}));

		// Dynamically populate default style dropdown with built-in and custom themes
		const styleSetting = new Setting(containerEl)
			.setName('Default Theme')
			.setDesc('Default style template used for renders');

		styleSetting.addDropdown(dropdown => {
			dropdown.addOption('elegant', 'Elegant Green (雅绿)');
			dropdown.addOption('warm', 'Warm Gold (暖金)');
			dropdown.addOption('minimal', 'Minimalist Black (极简)');
			
			// Load custom themes too
			Object.keys(this.plugin.customThemes).forEach(key => {
				dropdown.addOption(`custom:${key}`, `📂 ${key}`);
			});

			dropdown.setValue(this.plugin.settings.defaultStyle);
			dropdown.onChange(async (value) => {
				this.plugin.settings.defaultStyle = value;
				await this.plugin.saveSettings();
			});
		});

		new Setting(containerEl)
			.setName('Custom Themes Folder')
			.setDesc('Folder in your vault where custom WeChat CSS themes are stored. (Will auto-initialize if not existing)')
			.addText(text => text
				.setPlaceholder('wechat-format-themes')
				.setValue(this.plugin.settings.themeFolder)
				.onChange(async (value) => {
					this.plugin.settings.themeFolder = value.trim() || 'wechat-format-themes';
					await this.plugin.saveSettings();
					await this.plugin.initThemeDirectory();
					await this.plugin.loadCustomThemes();
				}));

		new Setting(containerEl)
			.setName('WeChat Image Uploads')
			.setDesc('Enable automatic image upload directly to WeChat CDN')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableImgUpload)
				.onChange(async (value) => {
					this.plugin.settings.enableImgUpload = value;
					await this.plugin.saveSettings();
				}));

		// Fetch & Select Materials Setting
		const materialsSetting = new Setting(containerEl)
			.setName('Select Cover from WeChat')
			.setDesc('Click "Fetch" to load images from your WeChat library, then choose one.')
			.addButton(btn => btn
				.setButtonText('Fetch Materials')
				.onClick(async () => {
					const { appId, appSecret } = this.plugin.settings;
					if (!appId || !appSecret) {
						new Notice('Please enter AppID and AppSecret first!');
						return;
					}
					btn.setDisabled(true);
					btn.setButtonText('Fetching...');
					new Notice('Fetching permanent images from WeChat...');

					try {
						// Get Access Token
						const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
						const tokenRes = await requestUrl({ url: tokenUrl, method: 'GET' });
						const tokenData = JSON.parse(tokenRes.text);
						if (tokenData.errcode) {
							throw new Error(tokenData.errmsg);
						}
						const token = tokenData.access_token;

						// Fetch Materials list
						const matUrl = `https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=${token}`;
						const matRes = await requestUrl({
							url: matUrl,
							method: 'POST',
							contentType: 'application/json',
							body: JSON.stringify({
								type: 'image',
								offset: 0,
								count: 20
							})
						});
						const matData = JSON.parse(matRes.text);
						if (matData.errcode) {
							throw new Error(matData.errmsg);
						}

						const items = matData.item || [];
						if (items.length === 0) {
							new Notice('No permanent images found in your WeChat material library!');
							return;
						}

						this.plugin.settings.cachedMaterials = items.map((item: any) => ({
							mediaId: item.media_id,
							name: item.name
						}));
						await this.plugin.saveSettings();
						new Notice(`Successfully loaded ${items.length} materials!`);
						this.display(); // Redraw settings tab to populate dropdown
					} catch (err: any) {
						console.error(err);
						new Notice(`Failed to fetch: ${err.message || err}`);
					} finally {
						btn.setDisabled(false);
						btn.setButtonText('Fetch Materials');
					}
				}));

		if (this.plugin.settings.cachedMaterials && this.plugin.settings.cachedMaterials.length > 0) {
			materialsSetting.addDropdown(dropdown => {
				dropdown.addOption('', '-- Select an Image --');
				this.plugin.settings.cachedMaterials.forEach(m => {
					dropdown.addOption(m.mediaId, m.name.substring(0, 30));
				});
				dropdown.setValue(this.plugin.settings.defaultThumbMediaId);
				dropdown.onChange(async (val) => {
					this.plugin.settings.defaultThumbMediaId = val;
					await this.plugin.saveSettings();
					this.display(); // Refresh to update text input
				});
			});
		}

		new Setting(containerEl)
			.setName('Default Cover Media ID')
			.setDesc('Manually paste a WeChat Media ID, or select it from the dropdown helper above.')
			.addText(text => text
				.setPlaceholder('wx_media_id_...')
				.setValue(this.plugin.settings.defaultThumbMediaId)
				.onChange(async (value) => {
					this.plugin.settings.defaultThumbMediaId = value.trim();
					await this.plugin.saveSettings();
				}));
	}
}
