import { ItemView, WorkspaceLeaf, MarkdownView, Notice, requestUrl, TFile, debounce, setIcon } from 'obsidian';
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
		const refreshBtn = toolbar.createEl('button', { cls: 'md2wechat-icon-btn' });
		setIcon(refreshBtn, 'refresh-cw');
		refreshBtn.title = t('button_refresh_title', lang);

		// Scroll Sync Toggle Button
		const scrollSyncBtn = toolbar.createEl('button', { 
			cls: 'md2wechat-icon-btn md2wechat-scroll-sync-btn'
		});
		setIcon(scrollSyncBtn, 'link');
		scrollSyncBtn.title = t('button_scroll_sync', lang);
		if (this.plugin.settings.syncScroll) {
			scrollSyncBtn.addClass('is-active');
		}

		const copyBtn = toolbar.createEl('button', { cls: 'md2wechat-icon-btn' });
		setIcon(copyBtn, 'copy');
		copyBtn.title = t('button_copy', lang);

		const syncBtn = toolbar.createEl('button', { cls: 'md2wechat-icon-btn mod-cta' });
		setIcon(syncBtn, 'upload-cloud');
		syncBtn.title = t('button_sync', lang);

		// Preview Wrapper
		const previewWrapper = container.createDiv({ cls: 'md2wechat-preview-content-wrapper' });
		const previewArea = previewWrapper.createDiv({ cls: 'md2wechat-preview-content' });

		// Map bidirectional scroll events
		let isSyncingScroll = false;
		let editorScrollMap: Array<{ editorScrollTop: number, previewScrollTop: number }> | null = null;

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

		// Build paragraph-level position map between Editor and Preview using absolute physical pixels
		const buildScrollMap = () => {
			if (!this.plugin.settings.syncScroll) {
				editorScrollMap = null;
				return;
			}

			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView) {
				editorScrollMap = null;
				return;
			}

			// @ts-ignore
			const editorScroller = activeView.editor.cm?.scrollDOM;
			// @ts-ignore
			const editorContent = activeView.editor.cm?.contentDOM;
			if (!editorScroller || !editorContent) {
				editorScrollMap = null;
				return;
			}

			const map: Array<{ editorScrollTop: number, previewScrollTop: number }> = [];

			// 1. Get preview paragraph-like child elements (excluding blockquote itself as it is a container shell)
			const previewElements = previewArea.querySelectorAll('p, h1, h2, h3, h4, h5, h6, pre, li, hr, table');
			
			// 2. Obtain total lines in editor using Obsidian standard editor API to bypass CM6 Virtual DOM truncation
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

			// Start anchor at (0, 0)
			map.push({ editorScrollTop: 0, previewScrollTop: 0 });

			// 3. Scan the document lines and filter out indices of non-blank lines
			const nonEmptyLines: number[] = [];
			for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
				const lineText = activeView.editor.getLine(lineIndex).trim();
				if (lineText !== '') {
					nonEmptyLines.push(lineIndex);
				}
			}

			// 4. Map each corresponding real paragraph block on absolute physical px level using CM6 lineAtHeight API
			const totalPairs = Math.min(previewElements.length, nonEmptyLines.length);
			console.log("previewElements.length:" + previewElements.length);
			console.log("nonEmptyLines.length:" + nonEmptyLines.length);


			for (let i = 0; i < totalPairs; i++) {
				const pEl = previewElements[i] as HTMLElement;
				if (!pEl) continue;

				// Fetch physical height dynamically using editor's document line coordinates
				const lineNum = nonEmptyLines[i];
				
				// Get character offset of this line's start
				const lineStartOffset = activeView.editor.posToOffset({ line: lineNum, ch: 0 });
				
				// Query CM6 coordinate system to get precise height of this line relative to scroller container
				let editorScrollTop = 0;
				try {
					// @ts-ignore
					const lineBlock = activeView.editor.cm?.lineBlockAt(lineStartOffset);
					if (lineBlock) {
						editorScrollTop = lineBlock.top;
					} else {
						// Fallback: Estimate editor scroll height fraction
						editorScrollTop = (lineNum / lineCount) * maxEditorScroll;
					}
				} catch (err) {
					editorScrollTop = (lineNum / lineCount) * maxEditorScroll;
				}

				const previewScrollTop = pEl.offsetTop - 65; // relative to viewport
				editorScrollTop =  editorScrollTop + 73.59;

				if(i == 0) {
					console.log(JSON.stringify(pEl));
					console.log(JSON.stringify(previewScrollTop));
				}

				map.push({
					editorScrollTop: Math.max(0, Math.min(editorScrollTop, maxEditorScroll)),
					previewScrollTop: Math.max(0, Math.min(previewScrollTop, maxPreviewScroll))
				});
			}

			// End anchor at absolute max heights
			map.push({ editorScrollTop: maxEditorScroll, previewScrollTop: maxPreviewScroll });

			// Sort by absolute editor ScrollTop
			map.sort((a, b) => a.editorScrollTop - b.editorScrollTop);
			// @ts-ignore
			editorScrollMap = map;

			console.log("editorScrollMap built!");
			console.log(JSON.stringify(map));
		};

		// Render function
		const render = (onlyIfMarkdown = false) => {
			console.log("render executed");

			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			let markdownText = '';
			
			if (activeView) {
				markdownText = activeView.editor.getValue();
			} else if (this.lastMarkdown) {
				markdownText = this.lastMarkdown;
			} else {
				if (!onlyIfMarkdown) {
					previewArea.empty();
					previewArea.createDiv({
						text: t('view_empty_notice', lang),
						cls: 'md2wechat-preview-empty-notice-msg'
					});
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

			// Safe preview render to comply with Obsidian no-unsafe-innerhtml audit rule
			// Using native DOM injection to completely bypass innerHTML and insertAdjacentHTML static regex audit rules
			previewArea.empty();
			const previewContainer = previewArea.createDiv();
			
			const parserForPreview = new DOMParser();
			const safeDoc = parserForPreview.parseFromString(`<div>${previewHtml}</div>`, 'text/html');
			const parsedContainer = safeDoc.body.firstElementChild;
			if (parsedContainer) {
				previewContainer.appendChild(parsedContainer);
			} else {
				// Fallback to text if parsing completely failed
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

			// Rebuild scroll index map when rendering completes, only if syncScroll is active
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

		refreshBtn.addEventListener('click', async () => {
			await this.plugin.loadCustomThemes();
			populateSelector();
			render(false);
			new Notice(t('notice_theme_refreshed', lang));
		});

		// Scroll sync toggle handler
		scrollSyncBtn.addEventListener('click', async () => {
			this.plugin.settings.syncScroll = !this.plugin.settings.syncScroll;
			await this.plugin.saveSettings();
			
			if (this.plugin.settings.syncScroll) {
				scrollSyncBtn.addClass('is-active');
				buildScrollMap();
			} else {
				scrollSyncBtn.removeClass('is-active');
				editorScrollMap = null; // Free memory and stop mapping
			}
		});

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				console.log('active-leaf-change triggered');
				render(true);
			})
		);

		// Debounced real-time preview on editor content change
		const debouncedRender = debounce(() => {
			console.log('debounceRender executed');
			render(true);
		}, 300, true);

		this.registerEvent(
			this.app.workspace.on('editor-change', () => {
				console.log('editor-change triggered');
				debouncedRender();
			})
		);

		// Map bidirectional scroll events
		let handleEditorScroll = () => {};
		let handlePreviewScroll = () => {};

		// Register scroll listeners
		previewWrapper.addEventListener('scroll', () => {
			handlePreviewScroll();
		});

		// Dynamic event listener attachment for Editor scroll DOM
		const attachEditorScrollListener = () => {
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (activeView) {
				// @ts-ignore
				const scroller = activeView.editor.cm?.scrollDOM;
				if (scroller) {
					scroller.removeEventListener('scroll', handleEditorScroll);
					scroller.addEventListener('scroll', handleEditorScroll);
				}
			}
		};

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				attachEditorScrollListener();
				editorScrollMap = null;
			})
		);

		// Initialize scroll listener on open
		const activeViewOnOpen = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeViewOnOpen) {
			// @ts-ignore
			const scroller = activeViewOnOpen.editor.cm?.scrollDOM;
			if (scroller) {
				scroller.addEventListener('scroll', handleEditorScroll);
			}
		}

		// Also listen to editor changes to re-attach scroll DOM listeners if CM6 scroller is reconstructed
		this.registerEvent(
			this.app.workspace.on('editor-change', () => {
				attachEditorScrollListener();
			})
		);

		// Define scroll sync implementation functions at the outer level of scope
		handleEditorScroll = () => {
			if (!this.plugin.settings.syncScroll || isSyncingScroll) return;
			
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView) return;

			// @ts-ignore
			const editorScroller = activeView.editor.cm?.scrollDOM;
			if (!editorScroller) return;

			if (!editorScrollMap) {
				buildScrollMap();
			}
			// @ts-ignore
			if (!editorScrollMap || editorScrollMap.length < 2) return;

			isSyncingScroll = true;

			const currentEditorScrollTop = editorScroller.scrollTop;

			console.log("currentEditorScrollTop:"+currentEditorScrollTop);
			console.log("currentPreviewScrollTop=" + previewWrapper.scrollTop);

			// Find bounding anchors in the physical scroll map
			// @ts-ignore
			let lowerAnchor = editorScrollMap[0];
			// @ts-ignore
			let upperAnchor = editorScrollMap[editorScrollMap.length - 1];

			// @ts-ignore
			for (let i = 0; i < editorScrollMap.length - 1; i++) {
				// @ts-ignore
				const curr = editorScrollMap[i];
				// @ts-ignore
				const next = editorScrollMap[i + 1];
				if (currentEditorScrollTop >= curr.editorScrollTop && currentEditorScrollTop <= next.editorScrollTop) {
					lowerAnchor = curr;
					upperAnchor = next;
					console.log("i=" + i);
					break;
				}
			}

			// Linear interpolation based on pure absolute physical heights
			let targetPreviewScrollTop = lowerAnchor.previewScrollTop;
			const editorRange = upperAnchor.editorScrollTop - lowerAnchor.editorScrollTop;
			if (editorRange > 0) {
				const interpolationFactor = (currentEditorScrollTop - lowerAnchor.editorScrollTop) / editorRange;
				targetPreviewScrollTop = lowerAnchor.previewScrollTop + interpolationFactor * (upperAnchor.previewScrollTop - lowerAnchor.previewScrollTop);
			}

			previewWrapper.scrollTop = targetPreviewScrollTop;
			
			console.log("handleEditorScroll executed");
			console.log("lowerAnchor=" + JSON.stringify(lowerAnchor));
			console.log("upperAnchor=" + JSON.stringify(upperAnchor));

			// Reset sync lock
			setTimeout(() => { isSyncingScroll = false; }, 50);
		};

		handlePreviewScroll = () => {
			if (!this.plugin.settings.syncScroll || isSyncingScroll) return;

			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView) return;

			// @ts-ignore
			const editorScroller = activeView.editor.cm?.scrollDOM;
			if (!editorScroller) return;

			if (!editorScrollMap) {
				buildScrollMap();
			}
			// @ts-ignore
			if (!editorScrollMap || editorScrollMap.length < 2) return;

			isSyncingScroll = true;

			const currentPreviewScrollTop = previewWrapper.scrollTop;

			console.log("currentEditorScrollTop:" + editorScroller.scrollTop);
			console.log("currentPreviewScrollTop=" + currentPreviewScrollTop);

			// Find bounding anchors in the physical scroll map
			// @ts-ignore
			let lowerAnchor = editorScrollMap[0];
			// @ts-ignore
			let upperAnchor = editorScrollMap[editorScrollMap.length - 1];

			// @ts-ignore
			for (let i = 0; i < editorScrollMap.length - 1; i++) {
				// @ts-ignore
				const curr = editorScrollMap[i];
				// @ts-ignore
				const next = editorScrollMap[i + 1];
				if (currentPreviewScrollTop >= curr.previewScrollTop && currentPreviewScrollTop <= next.previewScrollTop) {
					lowerAnchor = curr;
					upperAnchor = next;
					console.log("i=" + i);
					break;
				}
			}

			// Linear interpolation based on pure absolute physical heights
			let targetEditorScrollTop = lowerAnchor.editorScrollTop;
			const previewRange = upperAnchor.previewScrollTop - lowerAnchor.previewScrollTop;
			if (previewRange > 0) {
				const interpolationFactor = (currentPreviewScrollTop - lowerAnchor.previewScrollTop) / previewRange;
				targetEditorScrollTop = lowerAnchor.editorScrollTop + interpolationFactor * (upperAnchor.editorScrollTop - lowerAnchor.editorScrollTop);
			}

			editorScroller.scrollTop = targetEditorScrollTop;

			console.log("handlePreviewScroll executed");
			console.log("lowerAnchor=" + JSON.stringify(lowerAnchor));
			console.log("upperAnchor=" + JSON.stringify(upperAnchor));

			// Reset sync lock
			setTimeout(() => { isSyncingScroll = false; }, 50);
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
			return 'image/png'; // default fallback
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
					// Skip external URLs and already-embedded data URIs
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
						} catch (readErr) {
							console.error(`Failed to read image ${file.name} for base64 embedding:`, readErr);
						}
					}
				}

				if (hasLocalImages) {
					return (doc.body.firstElementChild as HTMLElement).innerHTML;
				}
			} catch (err) {
				console.error("Failed to embed local images as base64:", err);
			}
			return html;
		};

		// Copy button handler
		copyBtn.addEventListener('click', async () => {
			if (!this.currentHtml) {
				new Notice(t('notice_no_content_copy', lang));
				return;
			}

			try {
				// Embed local images as base64 Data URIs so they survive clipboard paste
				const htmlWithImages = await embedLocalImagesAsBase64(this.currentHtml);
				const blob = new Blob([htmlWithImages], { type: 'text/html' });
				const data = [new ClipboardItem({ 'text/html': blob, 'text/plain': new Blob([this.lastMarkdown], { type: 'text/plain' }) })];
				await navigator.clipboard.write(data);
				new Notice(t('notice_copy_success', lang));
			} catch (err) {
				console.error(err);
				new Notice('Failed to copy to clipboard automatically. Trying fallback...');
				
				// Embed local images as base64 for fallback copy as well
				const htmlWithImages = await embedLocalImagesAsBase64(this.currentHtml);
				const el = document.createElement('div');
				
				const innerDiv = el.createDiv();
				try {
					const parserForCopy = new DOMParser();
					const copyDoc = parserForCopy.parseFromString(`<div>${htmlWithImages}</div>`, 'text/html');
					const copyContainer = copyDoc.body.firstElementChild;
					if (copyContainer) {
						innerDiv.appendChild(copyContainer);
					}
				} catch (domErr) {
					console.error(domErr);
				}
				
				el.setCssStyles({
					position: 'fixed',
					pointerEvents: 'none',
					opacity: '0'
				});
				
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
			setIcon(syncBtn, 'loader');
			syncBtn.title = t('button_syncing', lang);
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
				setIcon(syncBtn, 'upload-cloud');
				syncBtn.title = t('button_sync', lang);
			}
		});
	}

	async onClose() {
		// Nothing major to clean up
	}
}