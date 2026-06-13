import { ItemView, WorkspaceLeaf, MarkdownView, Notice, requestUrl } from 'obsidian';
import Md2WeChatPlugin from './main';
import { THEMES } from './themes';
import { convertToWeChatHtml } from './renderer';

export const VIEW_TYPE_WECHAT_PREVIEW = "wechat-preview-view";

export class WeChatPreviewView extends ItemView {
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
				markdownText = typeof activeView.setViewData === 'function' ? activeView.data : activeView.editor.getValue();
			} else if (this.lastMarkdown) {
				markdownText = this.lastMarkdown;
			} else {
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

		render(false);

		selector.addEventListener('change', () => {
			render(false);
		});

		refreshBtn.addEventListener('click', async () => {
			await this.plugin.loadCustomThemes();
			populateSelector();
			render(false);
			new Notice('Themes refreshed and preview updated!');
		});

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
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
				const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
				const tokenRes = await requestUrl({ url: tokenUrl, method: 'GET' });
				
				if (tokenRes.status !== 200) {
					throw new Error(`Token request failed with status ${tokenRes.status}`);
				}
				
				const tokenData = JSON.parse(tokenRes.text);
				if (tokenData.errcode) {
					throw new Error(`WeChat Token Error: [${tokenData.errcode}] ${tokenData.errmsg}`);
				}

				const accessToken = tokenData.access_token;
				new Notice('Token acquired! Creating Draft...');

				const title = this.lastTitle || 'Untitled Note';
				const digest = this.lastDigest || '';

				const thumbMediaId = this.plugin.settings.defaultThumbMediaId.trim();
				if (!thumbMediaId) {
					throw new Error("WeChat requires a cover image (thumb_media_id) to create draft. Please configure the 'Default Cover Media ID' in plugin settings first!");
				}

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
				
				const draftRes = await requestUrl({
					url: draftUrl,
					method: 'POST',
					contentType: 'application/json',
					body: JSON.stringify(requestPayload)
				});

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