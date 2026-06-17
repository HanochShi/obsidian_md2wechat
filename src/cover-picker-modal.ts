import { App, Modal, requestUrl, Notice } from 'obsidian';
import { t } from './i18n';

const PAGE_SIZE = 18;

export class CoverPickerModal extends Modal {
	private appId: string;
	private appSecret: string;
	private currentMediaId: string;
	private lang: 'en' | 'zh-CN' | 'zh-TW';
	private onSelect: (mediaId: string) => void;
	private onUpdateCache: (materials: Array<{ mediaId: string; name: string; url: string }>) => void;

	private allMaterials: Array<{ mediaId: string; name: string; url: string }> = [];
	private offset: number = 0;
	private hasMore: boolean = true;
	private isLoading: boolean = false;
	private selectedMediaId: string;

	// DOM refs
	private scrollWrapper!: HTMLDivElement;
	private gridEl!: HTMLDivElement;
	private footerEl!: HTMLDivElement;
	private loadMoreEl!: HTMLDivElement;
	private loadingEl!: HTMLDivElement;
	private statusEl!: HTMLDivElement;

	constructor(
		app: App,
		appId: string,
		appSecret: string,
		currentMediaId: string,
		lang: 'en' | 'zh-CN' | 'zh-TW',
		onSelect: (mediaId: string) => void,
		onUpdateCache: (materials: Array<{ mediaId: string; name: string; url: string }>) => void
	) {
		super(app);
		this.appId = appId;
		this.appSecret = appSecret;
		this.currentMediaId = currentMediaId;
		this.selectedMediaId = currentMediaId;
		this.lang = lang;
		this.onSelect = onSelect;
		this.onUpdateCache = onUpdateCache;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('md2wechat-cover-picker');

		// Title
		const title = contentEl.createDiv({ cls: 'md2wechat-cover-picker-title' });
		title.setText(t('cover_picker_title', this.lang));

		// Loading indicator
		this.loadingEl = contentEl.createDiv({ cls: 'md2wechat-cover-picker-loading' });
		this.loadingEl.setText(t('cover_picker_loading', this.lang));

		// Scrollable wrapper: contains grid + load more + status
		this.scrollWrapper = contentEl.createDiv({ cls: 'md2wechat-cover-picker-scroll' });

		// Grid container
		this.gridEl = this.scrollWrapper.createDiv({ cls: 'md2wechat-cover-picker-grid' });
		this.gridEl.style.display = 'none';

		// Load more link (inside scroll wrapper, after grid)
		this.loadMoreEl = this.scrollWrapper.createDiv({ cls: 'md2wechat-cover-picker-load-more' });
		this.loadMoreEl.setText(t('cover_picker_load_more', this.lang));
		this.loadMoreEl.style.display = 'none';
		this.loadMoreEl.addEventListener('click', () => {
			this.fetchNextPage();
		});

		// Status text (for "no more" etc.)
		this.statusEl = this.scrollWrapper.createDiv({ cls: 'md2wechat-cover-picker-status' });
		this.statusEl.style.display = 'none';

		// Footer
		this.footerEl = contentEl.createDiv({ cls: 'md2wechat-cover-picker-footer' });
		this.footerEl.style.display = 'none';

		const cancelBtn = this.footerEl.createEl('button', { cls: 'md2wechat-cover-picker-cancel-btn' });
		cancelBtn.setText(t('cover_picker_cancel', this.lang));
		cancelBtn.addEventListener('click', () => {
			this.close();
		});

		const confirmBtn = this.footerEl.createEl('button', { cls: 'md2wechat-cover-picker-confirm-btn' });
		confirmBtn.setText(t('cover_picker_confirm', this.lang));
		confirmBtn.addEventListener('click', () => {
			this.confirm();
		});

		// Auto-load first page
		this.fetchNextPage();
	}

	private async fetchNextPage() {
		if (this.isLoading || !this.hasMore) return;
		this.isLoading = true;

		if (this.offset === 0) {
			this.loadingEl.style.display = 'block';
		} else {
			this.loadMoreEl.setText(t('cover_picker_loading', this.lang));
			this.loadMoreEl.addClass('is-loading');
		}

		try {
			// Get access token
			const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`;
			const tokenRes = await requestUrl({ url: tokenUrl, method: 'GET' });
			const tokenData = JSON.parse(tokenRes.text);
			if (tokenData.errcode) {
				throw new Error(tokenData.errmsg);
			}
			const token = tokenData.access_token;

			// Fetch materials page
			const matUrl = `https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=${token}`;
			const matRes = await requestUrl({
				url: matUrl,
				method: 'POST',
				contentType: 'application/json',
				body: JSON.stringify({
					type: 'image',
					offset: this.offset,
					count: PAGE_SIZE
				})
			});
			const matData = JSON.parse(matRes.text);
			if (matData.errcode) {
				throw new Error(matData.errmsg);
			}

			const items = matData.item || [];
			const newMaterials = items.map((item: any) => ({
				mediaId: item.media_id,
				name: item.name,
				url: item.url || ''
			}));

			this.allMaterials = [...this.allMaterials, ...newMaterials];
			this.offset += items.length;

			// If returned less than page size, no more data
			if (items.length < PAGE_SIZE) {
				this.hasMore = false;
			}

			// First page empty
			if (this.allMaterials.length === 0) {
				this.loadingEl.style.display = 'none';
				const empty = this.gridEl.parentElement?.createDiv({ cls: 'md2wechat-cover-picker-empty' });
				if (empty) empty.setText(t('cover_picker_empty', this.lang));
				return;
			}

			// Sync cache to settings
			this.onUpdateCache(this.allMaterials);

			// Render new items
			this.renderItems(newMaterials);

			// Show grid and footer
			this.loadingEl.style.display = 'none';
			this.gridEl.style.display = 'grid';
			this.scrollWrapper.style.display = 'block';
			this.footerEl.style.display = 'flex';

			// Update load more link
			if (this.hasMore) {
				this.loadMoreEl.style.display = 'block';
				this.loadMoreEl.setText(t('cover_picker_load_more', this.lang));
				this.loadMoreEl.removeClass('is-loading');
			} else {
				this.loadMoreEl.style.display = 'none';
				this.statusEl.style.display = 'block';
				this.statusEl.setText(t('cover_picker_no_more', this.lang));
			}

		} catch (err: any) {
			console.error('Failed to fetch materials:', err);
			this.loadingEl.style.display = 'none';
			new Notice(t('cover_picker_fetch_error', this.lang) + ' ' + (err.message || ''));
			
			// If we already have some items, just show footer
			if (this.allMaterials.length > 0) {
				this.footerEl.style.display = 'flex';
				this.loadMoreEl.setText(t('cover_picker_load_more', this.lang));
				this.loadMoreEl.removeClass('is-loading');
			}
		} finally {
			this.isLoading = false;
		}
	}

	private renderItems(materials: Array<{ mediaId: string; name: string; url: string }>) {
		materials.forEach((mat) => {
			const item = this.gridEl.createDiv({ cls: 'md2wechat-cover-picker-item' });
			if (mat.mediaId === this.selectedMediaId) {
				item.addClass('is-selected');
			}

			// Thumbnail
			const thumbWrap = item.createDiv({ cls: 'md2wechat-cover-picker-thumb' });
			if (mat.url) {
				const img = thumbWrap.createEl('img', {
					attr: {
						src: mat.url,
						loading: 'lazy',
						alt: mat.name,
					},
				});
				img.onerror = () => {
					img.style.display = 'none';
					thumbWrap.addClass('is-broken');
					const fallback = thumbWrap.createDiv({ cls: 'md2wechat-cover-picker-thumb-fallback' });
					fallback.setText('🖼️');
				};
			} else {
				thumbWrap.addClass('is-broken');
				const fallback = thumbWrap.createDiv({ cls: 'md2wechat-cover-picker-thumb-fallback' });
				fallback.setText('🖼️');
			}

			// Name
			const nameEl = item.createDiv({ cls: 'md2wechat-cover-picker-name' });
			const displayName = mat.name.length > 20 ? mat.name.substring(0, 20) + '...' : mat.name;
			nameEl.setText(displayName);
			nameEl.title = mat.name;

			// Click handler
			item.addEventListener('click', () => {
				this.gridEl.querySelectorAll('.md2wechat-cover-picker-item.is-selected').forEach((el) => {
					(el as HTMLElement).removeClass('is-selected');
				});
				item.addClass('is-selected');
				this.selectedMediaId = mat.mediaId;
			});

			// Double-click to confirm
			item.addEventListener('dblclick', () => {
				this.selectedMediaId = mat.mediaId;
				this.confirm();
			});
		});
	}

	private confirm() {
		this.onSelect(this.selectedMediaId);
		this.close();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}