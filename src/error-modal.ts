import { Modal, App, Notice } from 'obsidian';
import { t, TRANSLATIONS } from './i18n';

type LangKey = keyof typeof TRANSLATIONS;

export class IpWhitelistErrorModal extends Modal {
	private ipAddress: string;
	private lang: LangKey;

	constructor(app: App, ipAddress: string, lang: LangKey) {
		super(app);
		this.ipAddress = ipAddress;
		this.lang = lang;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		const lang = this.lang;

		// Container
		const container = contentEl.createDiv({ cls: 'md2wechat-error-modal' });

		// Title
		const title = container.createDiv({ cls: 'md2wechat-error-modal-title' });
		title.setText(t('error_ip_whitelist_title', lang));

		// Description
		const desc = container.createDiv({ cls: 'md2wechat-error-modal-desc' });
		desc.setText(t('error_ip_whitelist_desc', lang));

		// IP Address display
		const ipBox = container.createDiv({ cls: 'md2wechat-error-modal-ip-box' });
		const ipLabel = ipBox.createDiv({ cls: 'md2wechat-error-modal-ip-label' });
		ipLabel.setText(t('error_ip_whitelist_your_ip', lang));
		const ipRow = ipBox.createDiv({ cls: 'md2wechat-error-modal-ip-row' });
		const ipValue = ipRow.createDiv({ cls: 'md2wechat-error-modal-ip-value' });
		ipValue.setText(this.ipAddress);
		const copyIpBtn = ipRow.createEl('button', { cls: 'md2wechat-error-modal-copy-btn', text: t('error_ip_whitelist_copy_ip', lang) });
		copyIpBtn.addEventListener('click', () => {
			void navigator.clipboard.writeText(this.ipAddress).then(() => {
				new Notice(t('error_ip_whitelist_ip_copied', lang));
			}).catch(() => {
				// Fallback copy
				const textArea = activeDocument.createElement('textarea');
				textArea.value = this.ipAddress;
				activeDocument.body.appendChild(textArea);
				textArea.select();
				// eslint-disable-next-line @typescript-eslint/no-deprecated
				activeDocument.execCommand('copy');
				activeDocument.body.removeChild(textArea);
				new Notice(t('error_ip_whitelist_ip_copied', lang));
			});
		});

		// Guide link - direct user to documentation for detailed setup steps
		const guideRow = container.createDiv({ cls: 'md2wechat-error-modal-guide' });
		guideRow.createSpan({ text: t('error_ip_whitelist_guide_prefix', lang) });
		const guideLink = guideRow.createEl('a', {
			text: t('error_ip_whitelist_guide_link_text', lang),
			cls: 'md2wechat-error-modal-link-url',
			attr: { href: 'https://github.com/HanochShi/obsidian_md2wechat#31-%E5%BE%AE%E4%BF%A1%E5%85%AC%E4%BC%97%E5%8F%B7-appid--appsecret', target: '_blank', rel: 'noopener' }
		});
		guideLink.addEventListener('click', (e) => {
			e.stopPropagation();
		});

		// Tip
		const tip = container.createDiv({ cls: 'md2wechat-error-modal-tip' });
		tip.setText(t('error_ip_whitelist_tip', lang));

		// Link to check IP
		const linkRow = container.createDiv({ cls: 'md2wechat-error-modal-link' });
		linkRow.createSpan({ text: t('error_ip_whitelist_check_ip_prefix', lang) });
		const link = linkRow.createEl('a', {
			text: 'HTTPS://tool.lu/IP',
			cls: 'md2wechat-error-modal-link-url',
			attr: { href: 'https://tool.lu/ip', target: '_blank', rel: 'noopener' }
		});
		link.addEventListener('click', (e) => {
			e.stopPropagation();
		});

		// Button
		const btnRow = container.createDiv({ cls: 'md2wechat-error-modal-btn-row' });
		const closeBtn = btnRow.createEl('button', {
			cls: 'mod-cta md2wechat-error-modal-close-btn',
			text: t('error_ip_whitelist_got_it', lang)
		});
		closeBtn.addEventListener('click', () => {
			this.close();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}