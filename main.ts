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
}

const DEFAULT_SETTINGS: Md2WeChatSettings = {
	appId: '',
	appSecret: '',
	defaultStyle: 'elegant',
	customCss: '',
	enableImgUpload: true,
	imageHostingType: 'wechat',
	defaultThumbMediaId: '',
	cachedMaterials: []
};

// Preset WeChat CSS styles (as template strings for easy embedding as inline styles)
interface ThemeStyle {
	name: string;
	container: string;
	h1: string;
	h2: string;
	h3: string;
	p: string;
	code: string;
	blockquote: string;
	ul: string;
	ol: string;
	li: string;
	strong: string;
	link: string;
}

const THEMES: Record<string, ThemeStyle> = {
	elegant: {
		name: "Elegant Green (雅绿)",
		container: "font-family: -apple-system-font, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei UI', Arial, sans-serif; font-size: 15px; color: #353535; line-height: 1.75; letter-spacing: 0.5px; word-wrap: break-word; text-align: justify;",
		h1: "font-size: 1.35em; color: #2e6851; border-bottom: 2px solid #2e6851; padding-bottom: 5px; margin-top: 1.8em; margin-bottom: 0.8em; font-weight: bold;",
		h2: "font-size: 1.2em; color: #2e6851; margin-top: 1.6em; margin-bottom: 0.8em; font-weight: bold; padding-left: 6px; border-left: 3px solid #2e6851;",
		h3: "font-size: 1.1em; color: #3e8868; margin-top: 1.4em; margin-bottom: 0.6em; font-weight: bold;",
		p: "margin-top: 0px; margin-bottom: 1.4em; color: #3e3e3e; line-height: 1.8;",
		code: "font-family: Consolas, Monaco, monospace; font-size: 14px; background-color: #f8f8f8; color: #c7254e; padding: 2px 4px; border-radius: 4px; border: 1px solid #e1e1e8; word-break: break-all;",
		blockquote: "margin: 1.5em 0; padding: 10px 15px; background: #f4f9f6; border-left: 4px solid #2e6851; color: #555555; font-size: 0.95em; border-radius: 0 4px 4px 0;",
		ul: "margin-top: 0px; margin-bottom: 1.2em; padding-left: 20px; list-style-type: disc;",
		ol: "margin-top: 0px; margin-bottom: 1.2em; padding-left: 20px; list-style-type: decimal;",
		li: "margin-bottom: 6px; line-height: 1.7; color: #444444;",
		strong: "color: #2e6851; font-weight: bold;",
		link: "color: #2e6851; text-decoration: none; border-bottom: 1px dashed #2e6851;"
	},
	warm: {
		name: "Warm Gold (温暖暖金)",
		container: "font-family: -apple-system-font, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', sans-serif; font-size: 15px; color: #3e3a35; line-height: 1.8; letter-spacing: 0.5px;",
		h1: "font-size: 1.4em; color: #b25829; text-align: center; border-bottom: 1px dashed #b25829; padding-bottom: 8px; margin-top: 2em; margin-bottom: 1em; font-weight: bold;",
		h2: "font-size: 1.2em; color: #b25829; margin-top: 1.6em; margin-bottom: 0.8em; font-weight: bold; background: #faf4ee; padding: 4px 10px; border-radius: 4px;",
		h3: "font-size: 1.1em; color: #c67144; margin-top: 1.4em; margin-bottom: 0.6em; font-weight: bold;",
		p: "margin-top: 0px; margin-bottom: 1.4em; color: #4a453f; line-height: 1.8; text-align: justify;",
		code: "font-family: monospace; font-size: 14px; background-color: #faf4ee; color: #b25829; padding: 2px 4px; border-radius: 3px;",
		blockquote: "margin: 1.5em 0; padding: 12px 18px; background: #faf4ee; border-left: 4px solid #b25829; color: #6e655b; font-size: 0.95em;",
		ul: "margin-top: 0px; margin-bottom: 1.2em; padding-left: 20px; list-style-type: circle;",
		ol: "margin-top: 0px; margin-bottom: 1.2em; padding-left: 20px; list-style-type: decimal;",
		li: "margin-bottom: 6px; line-height: 1.7;",
		strong: "color: #b25829; font-weight: bold;",
		link: "color: #b25829; text-decoration: underline;"
	},
	minimal: {
		name: "Minimalist Black (极简黑色)",
		container: "font-family: -apple-system-font, BlinkMacSystemFont, sans-serif; font-size: 15px; color: #222222; line-height: 1.7; letter-spacing: 0.2px;",
		h1: "font-size: 1.5em; color: #000000; font-weight: bold; margin-top: 1.8em; margin-bottom: 0.8em; border-bottom: 1px solid #000000; padding-bottom: 5px;",
		h2: "font-size: 1.25em; color: #000000; font-weight: bold; margin-top: 1.6em; margin-bottom: 0.8em;",
		h3: "font-size: 1.1em; color: #444444; font-weight: bold; margin-top: 1.4em; margin-bottom: 0.6em;",
		p: "margin-top: 0px; margin-bottom: 1.4em; color: #222222; text-align: justify;",
		code: "font-family: monospace; font-size: 14px; background-color: #f3f3f3; color: #000000; padding: 2px 4px; border-radius: 2px;",
		blockquote: "margin: 1.5em 0; padding: 10px 15px; background: #f9f9f9; border-left: 3px solid #000000; color: #666666; font-style: italic;",
		ul: "margin-top: 0px; margin-bottom: 1.2em; padding-left: 20px; list-style-type: square;",
		ol: "margin-top: 0px; margin-bottom: 1.2em; padding-left: 20px; list-style-type: decimal;",
		li: "margin-bottom: 6px; color: #333333;",
		strong: "color: #000000; font-weight: bold;",
		link: "color: #1a0dab; text-decoration: underline;"
	}
};

export default class Md2WeChatPlugin extends Plugin {
	settings!: Md2WeChatSettings;

	async onload() {
		await this.loadSettings();

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
}

// Convert Obsidian Markdown to WeChat-ready inline HTML
function convertToWeChatHtml(markdownText: string, theme: ThemeStyle): string {
	// Simple renderer for Demo. Standard Markdown contains blocks: Headers, blockquotes, lists, links, bold, code, images
	let lines = markdownText.split('\n');
	let html = '';
	let inList = false;
	let listType: 'ul' | 'ol' | null = null;
	let inBlockquote = false;

	const escapeHtml = (text: string) => {
		return text
			.replace(/&/g, "&")
			.replace(/</g, "<")
			.replace(/>/g, ">");
	};

	const inlineRender = (text: string): string => {
		let rendered = escapeHtml(text);
		// bold
		rendered = rendered.replace(/\*\*(.*?)\*\*/g, `<strong style="${theme.strong}">$1</strong>`);
		rendered = rendered.replace(/__(.*?)__/g, `<strong style="${theme.strong}">$1</strong>`);
		// inline code
		rendered = rendered.replace(/`(.*?)`/g, `<code style="${theme.code}">$1</code>`);
		// links
		rendered = rendered.replace(/\[(.*?)\]\((.*?)\)/g, `<a href="$2" style="${theme.link}">$1</a>`);
		return rendered;
	};

	for (let i = 0; i < lines.length; i++) {
		let line = lines[i].trim();

		// Handle empty lines (closes lists and blockquotes)
		if (line === '') {
			if (inList) {
				html += `</${listType}>`;
				inList = false;
				listType = null;
			}
			if (inBlockquote) {
				html += `</blockquote>`;
				inBlockquote = false;
			}
			continue;
		}

		// Blockquote
		if (line.startsWith('>')) {
			if (!inBlockquote) {
				if (inList) {
					html += `</${listType}>`;
					inList = false;
					listType = null;
				}
				html += `<blockquote style="${theme.blockquote}">`;
				inBlockquote = true;
			}
			let content = line.substring(1).trim();
			html += `<p style="${theme.p}">${inlineRender(content)}</p>`;
			continue;
		} else if (inBlockquote) {
			html += `</blockquote>`;
			inBlockquote = false;
		}

		// Headers
		if (line.startsWith('# ')) {
			html += `<h1 style="${theme.h1}">${inlineRender(line.substring(2))}</h1>`;
		} else if (line.startsWith('## ')) {
			html += `<h2 style="${theme.h2}">${inlineRender(line.substring(3))}</h2>`;
		} else if (line.startsWith('### ')) {
			html += `<h3 style="${theme.h3}">${inlineRender(line.substring(4))}</h3>`;
		} else if (line.startsWith('- ') || line.startsWith('* ')) {
			// Unordered List
			if (!inList || listType !== 'ul') {
				if (inList) html += `</${listType}>`;
				html += `<ul style="${theme.ul}">`;
				inList = true;
				listType = 'ul';
			}
			html += `<li style="${theme.li}">${inlineRender(line.substring(2))}</li>`;
		} else if (/^\d+\.\s/.test(line)) {
			// Ordered List
			if (!inList || listType !== 'ol') {
				if (inList) html += `</${listType}>`;
				html += `<ol style="${theme.ol}">`;
				inList = true;
				listType = 'ol';
			}
			let content = line.replace(/^\d+\.\s/, '');
			html += `<li style="${theme.li}">${inlineRender(content)}</li>`;
		} else {
			// Normal Paragraph
			if (inList) {
				html += `</${listType}>`;
				inList = false;
				listType = null;
			}
			html += `<p style="${theme.p}">${inlineRender(line)}</p>`;
		}
	}

	// Clean up lists or blockquotes at EOF
	if (inList) {
		html += `</${listType}>`;
	}
	if (inBlockquote) {
		html += `</blockquote>`;
	}

	return `<div style="${theme.container}">${html}</div>`;
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
		Object.keys(THEMES).forEach(key => {
			const option = selector.createEl('option');
			option.value = key;
			option.text = THEMES[key].name;
			if (key === this.plugin.settings.defaultStyle) option.selected = true;
		});

		// Buttons
		const refreshBtn = toolbar.createEl('button', { text: '🔄' });
		refreshBtn.title = "Refresh Preview";
		const copyBtn = toolbar.createEl('button', { text: 'Copy Rich Text' });
		const syncBtn = toolbar.createEl('button', { text: 'Sync to Draft' });
		syncBtn.addClass('mod-cta');

		// Preview Wrapper
		const previewWrapper = container.createDiv({ cls: 'md2wechat-preview-content-wrapper' });
		const previewArea = previewWrapper.createDiv({ cls: 'md2wechat-preview-content' });

		// Render function
		const render = (onlyIfMarkdown = false) => {
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView) {
				if (!onlyIfMarkdown) {
					previewArea.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted);">Please open and select a markdown note first!</div>`;
				}
				return;
			}
			const markdownText = typeof activeView.setViewData === 'function' ? activeView.data : activeView.editor.getValue();
			const theme = THEMES[selector.value] || THEMES.elegant;
			this.currentHtml = convertToWeChatHtml(markdownText, theme);
			previewArea.innerHTML = this.currentHtml;

			// Store metadata of the last successfully rendered article
			this.lastMarkdown = markdownText;
			this.lastTitle = activeView.file ? activeView.file.basename : 'Untitled Note';
			const firstHeaderMatch = markdownText.match(/^#\s+(.+)$/m);
			if (firstHeaderMatch) {
				this.lastTitle = firstHeaderMatch[1].trim();
			}
			this.lastDigest = markdownText.substring(0, 120).replace(/[#*`>]/g, '').trim();
		};

		// Initial Render (force show placeholder if no markdown view is active)
		render(false);

		// Listeners
		selector.addEventListener('change', () => {
			render(false);
		});

		refreshBtn.addEventListener('click', () => {
			render(false);
			new Notice('Preview refreshed!');
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

		new Setting(containerEl)
			.setName('Default Theme')
			.setDesc('Default style template used for renders')
			.addDropdown(dropdown => dropdown
				.addOption('elegant', 'Elegant Green (雅绿)')
				.addOption('warm', 'Warm Gold (暖金)')
				.addOption('minimal', 'Minimalist Black (极简)')
				.setValue(this.plugin.settings.defaultStyle)
				.onChange(async (value) => {
					this.plugin.settings.defaultStyle = value;
					await this.plugin.saveSettings();
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
