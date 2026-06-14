import { ItemView, WorkspaceLeaf, MarkdownView, Notice, requestUrl, TFile } from 'obsidian';
import Md2WeChatPlugin from './main';
import { THEMES } from './themes';
import { convertToWeChatHtml } from './renderer';
import { uploadImageToWeChat, uploadThumbToWeChat } from './uploader';
import { t } from './i18n';

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
		// Use dynamic title translation based on language setting
		const lang = this.plugin?.settings?.lang || 'en';
		return t('view_title', lang);
	}

	getIcon(): string {
		return "messages-square";
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		
		const lang = this.plugin.settings.lang;

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
		const refreshBtn = toolbar.createEl('button', { text: t('button_refresh', lang) });
		refreshBtn.title = t('button_refresh_title', lang);
		const copyBtn = toolbar.createEl('button', { text: t('button_copy', lang) });
		const syncBtn = toolbar.createEl('button', { text: t('button_sync', lang) });
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
					previewArea.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted);">${t('view_empty_notice', lang)}</div>`;
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
			
			// Dynamic local image resolution for preview panel using getResourcePath
			let previewHtml = this.currentHtml;
			const activeFile = activeView ? activeView.file : null;
			
			try {
				const parser = new DOMParser();
				const doc = parser.parseFromString(`<div>${previewHtml}</div>`, 'text/html');
				
				// Make sure parsing succeeded and returned a body
				if (doc && doc.body && doc.body.firstElementChild) {
					const imgElements = doc.querySelectorAll('img');
					let hasLocalImages = false;
					
					imgElements.forEach(img => {
						const src = img.getAttribute('src') || '';
						if (src && !src.startsWith('http://') && !src.startsWith('https://')) {
							const file = resolveImageToFile(src, activeFile);
							if (file) {
								// Convert system local path to safe WebView app://local path
								const resourcePath = this.app.vault.adapter.getResourcePath(file.path);
								img.setAttribute('src', resourcePath);
								hasLocalImages = true;
							}
						}
					});
					
					if (hasLocalImages) {
						previewHtml = doc.body.firstElementChild.innerHTML;
					}
				}
			} catch (err) {
				console.error("Failed to parse dynamic local images in preview:", err);
			}

			previewArea.innerHTML = previewHtml;

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
			new Notice(t('notice_theme_refreshed', lang));
		});

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				render(true);
			})
		);

		// Copy button handler
		copyBtn.addEventListener('click', async () => {
			if (!this.currentHtml) {
				new Notice(t('notice_no_content_copy', lang));
				return;
			}

			try {
				const blob = new Blob([this.currentHtml], { type: 'text/html' });
				const data = [new ClipboardItem({ 'text/html': blob, 'text/plain': new Blob([this.lastMarkdown], { type: 'text/plain' }) })];
				await navigator.clipboard.write(data);
				new Notice(t('notice_copy_success', lang));
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
				new Notice(t('notice_copy_fallback_success', lang));
			}
		});

		// Helper to resolve Obsidian Wikilinks or Markdown images to TFile
		const resolveImageToFile = (pathStr: string, activeFile: TFile | null): TFile | null => {
			if (!pathStr) return null;
			// Decode URI spaces and formatting
			const decodedPath = decodeURIComponent(pathStr).trim();
			
			// 1. Try resolving using Obsidian metadata/firstMatch
			const file = this.app.metadataCache.getFirstLinkpathDest(decodedPath, activeFile ? activeFile.path : '');
			if (file) return file;

			// 2. Fallback search by file name
			const allFiles = this.app.vault.getFiles();
			const baseName = decodedPath.split('/').pop() || decodedPath;
			const found = allFiles.find(f => f.name === baseName || f.path === decodedPath);
			return found || null;
		};

		// Sync button handler
		syncBtn.addEventListener('click', async () => {
			if (!this.currentHtml) {
				new Notice(t('notice_no_content_sync', lang));
				return;
			}

			const { appId, appSecret, enableImgUpload } = this.plugin.settings;
			if (!appId || !appSecret) {
				new Notice(t('notice_configure_app', lang));
				return;
			}

			syncBtn.disabled = true;
			syncBtn.setText(t('button_syncing', lang));
			new Notice(t('notice_acquiring_token', lang));

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
				
				// ---------------- IMAGE UPLOADING & LINK REPLACEMENT ----------------
				let finalHtml = this.currentHtml;
				let activeFile = this.app.workspace.getActiveViewOfType(MarkdownView)?.file || null;
				let firstLocalImageFile: TFile | null = null;

				if (enableImgUpload) {
					new Notice(t('notice_uploading_cdn', lang));
					
					// Parse HTML using DOMParser to accurately locate and replace <img> tags
					const parser = new DOMParser();
					const doc = parser.parseFromString(`<div>${finalHtml}</div>`, 'text/html');
					const imgElements = doc.querySelectorAll('img');
					
					let uploadCount = 0;
					for (let i = 0; i < imgElements.length; i++) {
						const img = imgElements[i];
						const src = img.getAttribute('src') || '';
						
						// Skip http/https external links
						if (src.startsWith('http://') || src.startsWith('https://')) {
							continue;
						}

						const file = resolveImageToFile(src, activeFile);
						if (file) {
							if (!firstLocalImageFile) {
								firstLocalImageFile = file;
							}
							try {
								new Notice(t('notice_uploading_inline_img', lang)
									.replace('{current}', (i + 1).toString())
									.replace('{total}', imgElements.length.toString())
									.replace('{name}', file.name)
								);
								const wechatCdnUrl = await uploadImageToWeChat(this.app, file, accessToken);
								img.setAttribute('src', wechatCdnUrl);
								uploadCount++;
							} catch (uploadErr: any) {
								console.error(`Failed to upload ${file.name}:`, uploadErr);
								new Notice(`Warning: Failed to upload ${file.name}. Staying with local path.`);
							}
						}
					}

					if (uploadCount > 0) {
						new Notice(t('notice_upload_cdn_success', lang).replace('{count}', uploadCount.toString()));
					}
					finalHtml = (doc.body.firstElementChild as HTMLElement).innerHTML;
				}

				// ---------------- COVER IMAGE SELECTION / UPLOAD ----------------
				let thumbMediaId = this.plugin.settings.defaultThumbMediaId.trim();
				
				// Try to auto-extract and upload the first image as cover
				if (enableImgUpload) {
					// 1. Check if we have a local image found during scanning
					if (!firstLocalImageFile) {
						// Fallback: Check if there's any image link in the Markdown
						const imageRegex = /!\[.*?\]\((.*?)\)|!\[[[].*?]]/g;
						let match;
						while ((match = imageRegex.exec(this.lastMarkdown)) !== null) {
							const imgPath = match[1] || match[2];
							if (imgPath && !imgPath.startsWith('http://') && !imgPath.startsWith('https://')) {
								const file = resolveImageToFile(imgPath, activeFile);
								if (file) {
									firstLocalImageFile = file;
									break;
								}
							}
						}
					}

					if (firstLocalImageFile) {
						new Notice(t('notice_uploading_cover', lang).replace('{name}', firstLocalImageFile.name));
						try {
							const uploadedThumbId = await uploadThumbToWeChat(this.app, firstLocalImageFile, accessToken);
							if (uploadedThumbId) {
								thumbMediaId = uploadedThumbId;
								new Notice(t('notice_cover_success', lang));
							}
						} catch (thumbErr: any) {
							console.error("Failed to upload auto cover:", thumbErr);
							new Notice(t('notice_cover_fallback_warning', lang));
						}
					}
				}

				if (!thumbMediaId) {
					throw new Error("WeChat requires a cover image (thumb_media_id) to create draft. Please configure the 'Default Cover Media ID' in settings or include a local image in your note.");
				}

				new Notice(t('notice_syncing_draft', lang));

				const title = this.lastTitle || 'Untitled Note';
				const digest = this.lastDigest || '';

				const article = {
					title: title,
					author: '',
					digest: digest,
					content: finalHtml,
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

				new Notice(t('notice_sync_success', lang));

			} catch (err: any) {
				console.error("【微信同步】发生异常，详细堆栈如下：");
				console.error(err);
				new Notice(`Sync failed: ${err.message || err}`);
			} finally {
				syncBtn.disabled = false;
				syncBtn.setText(t('button_sync', lang));
			}
		});
	}

	async onClose() {
		// Nothing major to clean up
	}
}
