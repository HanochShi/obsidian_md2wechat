import { ItemView, WorkspaceLeaf, MarkdownView, Notice, requestUrl, TFile, debounce, setIcon } from 'obsidian';
import Md2WeChatPlugin from './main';
import { THEMES } from './themes';
import { convertToWeChatHtml } from './renderer';
import { uploadImageToWeChat, uploadThumbToWeChat } from './uploader';
import { t } from './i18n';
import { IpWhitelistErrorModal } from './error-modal';

export const VIEW_TYPE_WECHAT_PREVIEW = "wechat-preview-view";

// WeChat API response types
interface WeChatTokenResponse {
	access_token: string;
	expires_in?: number;
	errcode?: number;
	errmsg?: string;
}

interface WeChatDraftResponse {
	media_id?: string;
	errcode?: number;
	errmsg?: string;
}

function getErrorMessage(err: unknown): string {
	if (err instanceof Error) return err.message;
	if (typeof err === 'string') return err;
	return String(err);
}

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
		const lang = this.plugin?.settings?.lang || 'en';
		return t('view_title', lang);
	}

	getIcon(): string {
		return "wechat-mp";
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		
		const lang = this.plugin.settings.lang;

		const container = contentEl.createDiv({ cls: 'md2wechat-preview-container' });

		// Toolbar
		const toolbar = container.createDiv({ cls: 'md2wechat-preview-toolbar' });

		// Left group: theme selector + refresh
		const toolbarLeft = toolbar.createDiv({ cls: 'md2wechat-toolbar-left' });

		// Theme selector
		const selector = toolbarLeft.createEl('select', { cls: 'md2wechat-style-select' });
		
		const populateSelector = () => {
			const currentlySelected = selector.value;
			selector.empty();
			
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

		// Refresh button
		const refreshBtn = toolbarLeft.createEl('button', { cls: 'md2wechat-icon-btn' });
		setIcon(refreshBtn, 'refresh-cw');
		refreshBtn.title = t('button_refresh_title', lang);

		// Scroll Sync Toggle Button
		const scrollSyncBtn = toolbarLeft.createEl('button', { 
			cls: 'md2wechat-icon-btn md2wechat-scroll-sync-btn'
		});
		setIcon(scrollSyncBtn, 'link');
		scrollSyncBtn.title = t('button_scroll_sync', lang);
		if (this.plugin.settings.syncScroll) {
			scrollSyncBtn.addClass('is-active');
		}

		// Spacer
		toolbar.createDiv({ cls: 'md2wechat-toolbar-spacer' });

		// Right group: copy + sync
		const toolbarRight = toolbar.createDiv({ cls: 'md2wechat-toolbar-right' });

		const copyBtn = toolbarRight.createEl('button', { cls: 'md2wechat-icon-btn' });
		setIcon(copyBtn, 'copy');
		copyBtn.title = t('button_copy', lang);

		const syncBtn = toolbarRight.createEl('button', { cls: 'md2wechat-icon-btn mod-cta' });
		setIcon(syncBtn, 'upload-cloud');
		syncBtn.title = t('button_sync', lang);

		// Preview Wrapper
		const previewWrapper = container.createDiv({ cls: 'md2wechat-preview-content-wrapper' });
		const previewArea = previewWrapper.createDiv({ cls: 'md2wechat-preview-content' });

		let isSyncingScroll = false;
		let editorScrollMap: Array<{ editorScrollTop: number, previewScrollTop: number }> | null = null;

		const getVisibleMarkdownView = (): MarkdownView | null => {
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (activeView) return activeView;
			const leaves = this.app.workspace.getLeavesOfType('markdown');
			for (const leaf of leaves) {
				if (leaf.view instanceof MarkdownView && leaf.view.editor) {
					return leaf.view;
				}
			}
			return null;
		};

		const resolveImageToFile = (pathStr: string, activeFile: TFile | null): TFile | null => {
			if (!pathStr) return null;
			const decodedPath = decodeURIComponent(pathStr).trim();
			const file = this.app.metadataCache.getFirstLinkpathDest(decodedPath, activeFile ? activeFile.path : '');
			if (file) return file;
			const allFiles = this.app.vault.getFiles();
			const baseName = decodedPath.split('/').pop() || decodedPath;
			const found = allFiles.find(f => f.name === baseName || f.path === decodedPath);
			return found || null;
		};

		// Build paragraph-level position map between Editor and Preview
		const buildScrollMap = () => {
			if (!this.plugin.settings.syncScroll) {
				editorScrollMap = null;
				return;
			}

			const activeView = getVisibleMarkdownView();
			if (!activeView) {
				editorScrollMap = null;
				return;
			}

			 
			const editorScroller = (activeView.editor as { cm?: { scrollDOM: HTMLElement } }).cm?.scrollDOM;
			 
			const editorContent = (activeView.editor as { cm?: { contentDOM: HTMLElement } }).cm?.contentDOM;
			if (!editorScroller || !editorContent) {
				editorScrollMap = null;
				return;
			}

			const map: Array<{ editorScrollTop: number, previewScrollTop: number }> = [];

			const previewElements = previewArea.querySelectorAll('p, h1, h2, h3, h4, h5, h6, pre, li, hr, table');
			const lineCount = activeView.editor.lineCount();

			if (previewElements.length === 0 || lineCount === 0) {
				editorScrollMap = null;
				return;
			}

			const editorContentPaddingBottom = 360;
			const maxEditorScroll = editorScroller.scrollHeight - editorContentPaddingBottom - editorScroller.clientHeight;
			const maxPreviewScroll = previewWrapper.scrollHeight - previewWrapper.clientHeight;

			if (maxEditorScroll <= 0 || maxPreviewScroll <= 0) {
				editorScrollMap = null;
				return;
			}

			map.push({ editorScrollTop: 0, previewScrollTop: 0 });

			const nonEmptyLines: number[] = [];
			for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
				const lineText = activeView.editor.getLine(lineIndex).trim();
				if (lineText !== '') {
					nonEmptyLines.push(lineIndex);
				}
			}

			const totalPairs = Math.min(previewElements.length, nonEmptyLines.length);

			for (let i = 0; i < totalPairs; i++) {
				const pEl = previewElements[i] as HTMLElement;
				if (!pEl) continue;

				const lineNum = nonEmptyLines[i];
				const lineStartOffset = activeView.editor.posToOffset({ line: lineNum, ch: 0 });
				
				let editorScrollTop = 0;
				try {
					 
					const lineBlock = (activeView.editor as { cm?: { lineBlockAt: (offset: number) => { top: number } } }).cm?.lineBlockAt(lineStartOffset);
					if (lineBlock) {
						editorScrollTop = lineBlock.top;
					} else {
						editorScrollTop = (lineNum / lineCount) * maxEditorScroll;
					}
				} catch {
					editorScrollTop = (lineNum / lineCount) * maxEditorScroll;
				}

				const previewScrollTop = pEl.offsetTop - 65;
				editorScrollTop = editorScrollTop + 73.59;

				map.push({
					editorScrollTop: Math.max(0, Math.min(editorScrollTop, maxEditorScroll)),
					previewScrollTop: Math.max(0, Math.min(previewScrollTop, maxPreviewScroll))
				});
			}

			map.push({ editorScrollTop: maxEditorScroll, previewScrollTop: maxPreviewScroll });
			map.sort((a, b) => a.editorScrollTop - b.editorScrollTop);
			editorScrollMap = map;
		};

		// Render function
		const render = (onlyIfMarkdown = false) => {
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			let markdownText = '';
			
			if (activeView) {
				markdownText = activeView.editor.getValue();
			} else if (this.lastMarkdown) {
				markdownText = this.lastMarkdown;
			} else {
				if (!onlyIfMarkdown) {
					previewArea.empty();
					const emptyMsg = previewArea.createDiv({ cls: 'md2wechat-preview-empty-notice-msg' });
					const emptyIcon = emptyMsg.createDiv({ cls: 'md2wechat-empty-icon' });
					setIcon(emptyIcon, 'file-text');
					emptyMsg.createDiv({ text: t('view_empty_notice', lang) });
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
			
			let previewHtml = this.currentHtml;
			const activeFile = activeView ? activeView.file : null;
			
			try {
				const parser = new DOMParser();
				const doc = parser.parseFromString(`<div>${previewHtml}</div>`, 'text/html');
				
				if (doc && doc.body && doc.body.firstElementChild) {
					const imgElements = doc.querySelectorAll('img');
					let hasLocalImages = false;
					
					imgElements.forEach(img => {
						const src = img.getAttribute('src') || '';
						if (src && !src.startsWith('http://') && !src.startsWith('https://')) {
							const file = resolveImageToFile(src, activeFile);
							if (file) {
								const resourcePath = this.app.vault.adapter.getResourcePath(file.path);
								img.setAttribute('src', resourcePath);
								hasLocalImages = true;
							}
						}
					});
					
					if (hasLocalImages) {
						previewHtml = (doc.body.firstElementChild as HTMLElement).innerHTML;
					}
				}
			} catch {
				// Silently ignore DOM parsing errors for preview
			}

			// Safe preview render using native DOM injection
			previewArea.empty();
			const previewContainer = previewArea.createDiv();
			
			const parserForPreview = new DOMParser();
			const safeDoc = parserForPreview.parseFromString(`<div>${previewHtml}</div>`, 'text/html');
			const parsedContainer = safeDoc.body.firstElementChild;
			if (parsedContainer) {
				previewContainer.appendChild(parsedContainer);
			} else {
				previewContainer.setText(previewHtml);
			}

			this.lastMarkdown = markdownText;
			if (activeView) {
				this.lastTitle = activeView.file ? activeView.file.basename : 'Untitled Note';
				const firstHeaderMatch = markdownText.match(/^#\s+(.+)$/m);
				if (firstHeaderMatch) {
					this.lastTitle = firstHeaderMatch[1].trim();
				}
			}
			this.lastDigest = markdownText.substring(0, 120).replace(/[#*`>]/g, '').trim();

			if (this.plugin.settings.syncScroll) {
				buildScrollMap();
			} else {
				editorScrollMap = null;
			}
		};

		render(false);

		selector.addEventListener('change', () => {
			render(false);
		});

		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		refreshBtn.addEventListener('click', async () => {
			await this.plugin.loadCustomThemes();
			populateSelector();
			render(false);
			new Notice(t('notice_theme_refreshed', lang));
		});

		// Scroll sync toggle handler
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		scrollSyncBtn.addEventListener('click', async () => {
			this.plugin.settings.syncScroll = !this.plugin.settings.syncScroll;
			await this.plugin.saveSettings();
			
			if (this.plugin.settings.syncScroll) {
				scrollSyncBtn.addClass('is-active');
				buildScrollMap();
				new Notice(t('notice_scroll_sync_enabled', lang));
			} else {
				scrollSyncBtn.removeClass('is-active');
				editorScrollMap = null;
				new Notice(t('notice_scroll_sync_disabled', lang));
			}
		});

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				render(true);
			})
		);

		const debouncedRender = debounce(() => {
			render(true);
		}, 300, true);

		this.registerEvent(
			this.app.workspace.on('editor-change', () => {
				debouncedRender();
			})
		);

		let handleEditorScroll = () => {};
		let handlePreviewScroll = () => {};

		previewWrapper.addEventListener('scroll', () => {
			handlePreviewScroll();
		});

		const attachEditorScrollListener = () => {
			const mdView = getVisibleMarkdownView();
			if (mdView) {
				 
				const scroller = (mdView.editor as { cm?: { scrollDOM: HTMLElement } }).cm?.scrollDOM;
				if (scroller) {
					scroller.removeEventListener('scroll', handleEditorScroll);
					scroller.addEventListener('scroll', handleEditorScroll);
				}
			}
		};

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				attachEditorScrollListener();
				if (this.plugin.settings.syncScroll) {
					buildScrollMap();
				}
			})
		);

		const initialMdView = getVisibleMarkdownView();
		if (initialMdView) {
			 
			const scroller = (initialMdView.editor as { cm?: { scrollDOM: HTMLElement } }).cm?.scrollDOM;
			if (scroller) {
				scroller.addEventListener('scroll', handleEditorScroll);
			}
		}

		this.registerEvent(
			this.app.workspace.on('editor-change', () => {
				attachEditorScrollListener();
			})
		);

		handleEditorScroll = () => {
			if (!this.plugin.settings.syncScroll || isSyncingScroll) return;
			
			const mdView = getVisibleMarkdownView();
			if (!mdView) return;

			 
			const editorScroller = (mdView.editor as { cm?: { scrollDOM: HTMLElement } }).cm?.scrollDOM;
			if (!editorScroller) return;

			if (!editorScrollMap) {
				buildScrollMap();
			}
			if (!editorScrollMap || editorScrollMap.length < 2) return;

			isSyncingScroll = true;

			const currentEditorScrollTop = editorScroller.scrollTop;

			let lowerAnchor = editorScrollMap[0];
			let upperAnchor = editorScrollMap[editorScrollMap.length - 1];

			for (let i = 0; i < editorScrollMap.length - 1; i++) {
				const curr = editorScrollMap[i];
				const next = editorScrollMap[i + 1];
				if (currentEditorScrollTop >= curr.editorScrollTop && currentEditorScrollTop <= next.editorScrollTop) {
					lowerAnchor = curr;
					upperAnchor = next;
					break;
				}
			}

			let targetPreviewScrollTop = lowerAnchor.previewScrollTop;
			const editorRange = upperAnchor.editorScrollTop - lowerAnchor.editorScrollTop;
			if (editorRange > 0) {
				const interpolationFactor = (currentEditorScrollTop - lowerAnchor.editorScrollTop) / editorRange;
				targetPreviewScrollTop = lowerAnchor.previewScrollTop + interpolationFactor * (upperAnchor.previewScrollTop - lowerAnchor.previewScrollTop);
			}

			previewWrapper.scrollTop = targetPreviewScrollTop;

			window.setTimeout(() => { isSyncingScroll = false; }, 50);
		};

		handlePreviewScroll = () => {
			if (!this.plugin.settings.syncScroll || isSyncingScroll) return;

			const mdView = getVisibleMarkdownView();
			if (!mdView) return;

			 
			const editorScroller = (mdView.editor as { cm?: { scrollDOM: HTMLElement } }).cm?.scrollDOM;
			if (!editorScroller) return;

			if (!editorScrollMap) {
				buildScrollMap();
			}
			if (!editorScrollMap || editorScrollMap.length < 2) return;

			isSyncingScroll = true;

			const currentPreviewScrollTop = previewWrapper.scrollTop;

			let lowerAnchor = editorScrollMap[0];
			let upperAnchor = editorScrollMap[editorScrollMap.length - 1];

			for (let i = 0; i < editorScrollMap.length - 1; i++) {
				const curr = editorScrollMap[i];
				const next = editorScrollMap[i + 1];
				if (currentPreviewScrollTop >= curr.previewScrollTop && currentPreviewScrollTop <= next.previewScrollTop) {
					lowerAnchor = curr;
					upperAnchor = next;
					break;
				}
			}

			let targetEditorScrollTop = lowerAnchor.editorScrollTop;
			const previewRange = upperAnchor.previewScrollTop - lowerAnchor.previewScrollTop;
			if (previewRange > 0) {
				const interpolationFactor = (currentPreviewScrollTop - lowerAnchor.previewScrollTop) / previewRange;
				targetEditorScrollTop = lowerAnchor.editorScrollTop + interpolationFactor * (upperAnchor.editorScrollTop - lowerAnchor.editorScrollTop);
			}

			editorScroller.scrollTop = targetEditorScrollTop;

			window.setTimeout(() => { isSyncingScroll = false; }, 50);
		};

		// Helper: convert ArrayBuffer to base64 string
		const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
			let binary = '';
			const bytes = new Uint8Array(buffer);
			for (let i = 0; i < bytes.byteLength; i++) {
				binary += String.fromCharCode(bytes[i]);
			}
			return btoa(binary);
		};

		// Helper: get MIME type from file extension
		const getMimeType = (ext: string): string => {
			const lower = ext.toLowerCase();
			if (lower === 'png') return 'image/png';
			if (lower === 'jpg' || lower === 'jpeg') return 'image/jpeg';
			if (lower === 'gif') return 'image/gif';
			if (lower === 'webp') return 'image/webp';
			if (lower === 'svg') return 'image/svg+xml';
			return 'image/png';
		};

		// Helper: embed local images as base64 Data URIs into HTML for clipboard copy
		const embedLocalImagesAsBase64 = async (html: string): Promise<string> => {
			const activeFile = this.app.workspace.getActiveViewOfType(MarkdownView)?.file || null;
			try {
				const parser = new DOMParser();
				const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
				if (!doc || !doc.body || !doc.body.firstElementChild) return html;

				const imgElements = doc.querySelectorAll('img');
				let hasLocalImages = false;

				for (let i = 0; i < imgElements.length; i++) {
					const img = imgElements[i];
					const src = img.getAttribute('src') || '';
					if (!src || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
						continue;
					}

					const file = resolveImageToFile(src, activeFile);
					if (file) {
						try {
							const binaryData = await this.app.vault.readBinary(file);
							const base64 = arrayBufferToBase64(binaryData);
							const mimeType = getMimeType(file.extension);
							img.setAttribute('src', `data:${mimeType};base64,${base64}`);
							hasLocalImages = true;
						} catch {
							// Silently skip images that cannot be read
						}
					}
				}

				if (hasLocalImages) {
					return (doc.body.firstElementChild as HTMLElement).innerHTML;
				}
			} catch {
				// Silently ignore DOM parsing errors
			}
			return html;
		};

		// Copy button handler
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		copyBtn.addEventListener('click', async () => {
			if (!this.currentHtml) {
				new Notice(t('notice_no_content_copy', lang));
				return;
			}

			try {
				const htmlWithImages = await embedLocalImagesAsBase64(this.currentHtml);
				const blob = new Blob([htmlWithImages], { type: 'text/html' });
				const data = [new ClipboardItem({ 'text/html': blob, 'text/plain': new Blob([this.lastMarkdown], { type: 'text/plain' }) })];
				void navigator.clipboard.write(data);
				new Notice(t('notice_copy_success', lang));
			} catch {
				new Notice('Failed to copy to clipboard automatically. Trying fallback...');
				
				const htmlWithImages = await embedLocalImagesAsBase64(this.currentHtml);
				const el = activeDocument.createElement('div');
				
				const innerDiv = el.createDiv();
				try {
					const parserForCopy = new DOMParser();
					const copyDoc = parserForCopy.parseFromString(`<div>${htmlWithImages}</div>`, 'text/html');
					const copyContainer = copyDoc.body.firstElementChild;
					if (copyContainer) {
						innerDiv.appendChild(copyContainer);
					}
				} catch {
					// Silently ignore DOM parsing errors
				}
				
				el.setCssStyles({
					position: 'fixed',
					pointerEvents: 'none',
					opacity: '0'
				});
				
				activeDocument.body.appendChild(el);
				window.getSelection()?.removeAllRanges();
				const range = activeDocument.createRange();
				range.selectNode(el);
				window.getSelection()?.addRange(range);
				// eslint-disable-next-line @typescript-eslint/no-deprecated
				activeDocument.execCommand('copy');
				activeDocument.body.removeChild(el);
				new Notice(t('notice_copy_fallback_success', lang));
			}
		});

		// Sync button handler
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
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
			setIcon(syncBtn, 'loader');
			const loaderSvg = syncBtn.querySelector('svg');
			if (loaderSvg) loaderSvg.addClass('rotate-spin');
			syncBtn.title = t('button_syncing', lang);
			new Notice(t('notice_acquiring_token', lang));

			try {
				const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
				const tokenRes = await requestUrl({ url: tokenUrl, method: 'GET' });
				
				if (tokenRes.status !== 200) {
					throw new Error(`Token request failed with status ${tokenRes.status}`);
				}
				
				const tokenData = JSON.parse(tokenRes.text) as WeChatTokenResponse;
				if (tokenData.errcode) {
					throw new Error(`WeChat Token Error: [${tokenData.errcode}] ${tokenData.errmsg}`);
				}

				const accessToken = tokenData.access_token;
				
				// ---------------- IMAGE UPLOADING & LINK REPLACEMENT ----------------
				let finalHtml = this.currentHtml;
				const activeFile = this.app.workspace.getActiveViewOfType(MarkdownView)?.file || null;
				let firstLocalImageFile: TFile | null = null;

				if (enableImgUpload) {
					new Notice(t('notice_uploading_cdn', lang));
					
					const parser = new DOMParser();
					const doc = parser.parseFromString(`<div>${finalHtml}</div>`, 'text/html');
					const imgElements = doc.querySelectorAll('img');
					
					let uploadCount = 0;
					for (let i = 0; i < imgElements.length; i++) {
						const img = imgElements[i];
						const src = img.getAttribute('src') || '';
						
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
							} catch (uploadErr: unknown) {
								 
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
				
				if (enableImgUpload) {
					if (!firstLocalImageFile) {
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
						} catch {
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

				const draftData = JSON.parse(draftRes.text) as WeChatDraftResponse;
				if (draftData.errcode) {
					if (draftData.errcode === 40007 || draftData.errcode === 40009) {
						throw new Error(`WeChat Draft Error: Invalid cover image (thumb_media_id). Please make sure you have set up a valid media ID or created an article with a cover first.`);
					}
					throw new Error(`WeChat Sync Error: [${draftData.errcode}] ${draftData.errmsg}`);
				}

				new Notice(t('notice_sync_success', lang));

			} catch (err: unknown) {
				 
				console.error("【微信同步】发生异常:", err);
				
				const errMsg = getErrorMessage(err);
				const ipMatch = errMsg.match(/invalid ip\s+([\d.]+)/i);
				if (errMsg.includes('40164') && ipMatch) {
					const detectedIp = ipMatch[1];
					const modal = new IpWhitelistErrorModal(this.app, detectedIp, lang);
					modal.open();
				} else {
					new Notice(`Sync failed: ${errMsg}`);
				}
			} finally {
				syncBtn.disabled = false;
				setIcon(syncBtn, 'upload-cloud');
				syncBtn.title = t('button_sync', lang);
			}
		});
	}

	async onClose() {
		// Nothing major to clean up
	}
}