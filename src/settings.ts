import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import Md2WeChatPlugin from './main';
import { t } from './i18n';
import { CoverPickerModal } from './cover-picker-modal';
import { WeChatPreviewView } from './view';

export class Md2WeChatSettingTab extends PluginSettingTab {
	plugin: Md2WeChatPlugin;

	constructor(app: App, plugin: Md2WeChatPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		
		const lang = this.plugin.settings.lang;

		new Setting(containerEl)
			.setName(t('settings_title', lang))
			.setHeading();

		// Language Setting dropdown
		new Setting(containerEl)
			.setName(t('settings_lang_name', lang))
			.setDesc(t('settings_lang_desc', lang))
			.addDropdown(dropdown => {
				dropdown.addOption('en', 'English');
				dropdown.addOption('zh-CN', '简体中文');
				dropdown.addOption('zh-TW', '繁體中文');
				
				dropdown.setValue(this.plugin.settings.lang);
				dropdown.onChange((value: string) => {
					this.plugin.settings.lang = value as 'en' | 'zh-CN' | 'zh-TW';
					void this.plugin.saveSettings();
					
					// Force active view update to refresh text if view exists
					const activeViews = this.app.workspace.getLeavesOfType("wechat-preview-view");
					activeViews.forEach(leaf => {
					if (leaf.view instanceof WeChatPreviewView) {
						void leaf.view.onOpen();
					}
					});
					
					// eslint-disable-next-line @typescript-eslint/no-deprecated
					this.display(); // Redraw settings tab
				});
			});

		new Setting(containerEl)
			.setName(t('settings_appid_name', lang))
			.setDesc(t('settings_appid_desc', lang))
			.addText(text => text
				.setPlaceholder('Wx...')
				.setValue(this.plugin.settings.appId)
				.onChange(async (value) => {
					this.plugin.settings.appId = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(t('settings_appsecret_name', lang))
			.setDesc(t('settings_appsecret_desc', lang))
			.addText(text => text
				.setPlaceholder('Enter app secret')
				.setValue(this.plugin.settings.appSecret)
				.onChange(async (value) => {
					this.plugin.settings.appSecret = value;
					await this.plugin.saveSettings();
				}));

		// Dynamically populate default style dropdown with built-in and custom themes
		const styleSetting = new Setting(containerEl)
			.setName(t('settings_theme_name', lang))
			.setDesc(t('settings_theme_desc', lang));

		styleSetting.addDropdown(dropdown => {
			dropdown.addOption('elegant', 'Elegant green (雅绿)');
			dropdown.addOption('warm', 'Warm gold (暖金)');
			dropdown.addOption('minimal', 'Minimalist black (极简)');
			
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
			.setName(t('settings_folder_name', lang))
			.setDesc(t('settings_folder_desc', lang))
			.addText(text => text
				.setPlaceholder('Wechat-format-themes')
				.setValue(this.plugin.settings.themeFolder)
				.onChange(async (value) => {
					this.plugin.settings.themeFolder = value.trim() || 'wechat-format-themes';
					await this.plugin.saveSettings();
					await this.plugin.initThemeDirectory();
					await this.plugin.loadCustomThemes();
				}));

		new Setting(containerEl)
			.setName(t('settings_upload_name', lang))
			.setDesc(t('settings_upload_desc', lang))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableImgUpload)
				.onChange(async (value) => {
					this.plugin.settings.enableImgUpload = value;
					await this.plugin.saveSettings();
				}));

		// Cover Image Setting — opens CoverPickerModal with pagination
		const materialsSetting = new Setting(containerEl)
			.setName(t('settings_fetch_name', lang))
			.setDesc(t('settings_fetch_desc', lang))
			.addButton(btn => btn
				.setButtonText(t('cover_picker_title', lang))
				.onClick(() => {
					const { appId, appSecret } = this.plugin.settings;
					if (!appId || !appSecret) {
						new Notice(t('settings_notice_enter_api', lang));
						return;
					}
					const modal = new CoverPickerModal(
						this.app,
						appId,
						appSecret,
						this.plugin.settings.defaultThumbMediaId,
						lang,
						(mediaId: string) => {
							this.plugin.settings.defaultThumbMediaId = mediaId;
							void this.plugin.saveSettings();
							// eslint-disable-next-line @typescript-eslint/no-deprecated
							this.display(); // Redraw to update preview
						},
						(materials: Array<{ mediaId: string; name: string; url: string }>) => {
							// Sync cache from modal to plugin settings
							this.plugin.settings.cachedMaterials = materials;
							void this.plugin.saveSettings();
						}
					);
					modal.open();
				})
			);

		// Current cover preview (if cached)
		if (this.plugin.settings.cachedMaterials && this.plugin.settings.cachedMaterials.length > 0) {
			const currentCover = this.plugin.settings.cachedMaterials.find(
				(m) => m.mediaId === this.plugin.settings.defaultThumbMediaId
			);
			
			if (currentCover && currentCover.url) {
				const previewContainer = materialsSetting.controlEl.createDiv({ cls: 'md2wechat-cover-preview-container' });
				const previewLabel = previewContainer.createDiv({ cls: 'md2wechat-cover-preview-label' });
				previewLabel.setText(t('cover_current_preview', lang));
				const previewImg = previewContainer.createEl('img', {
					cls: 'md2wechat-cover-preview-img',
					attr: { src: currentCover.url, alt: currentCover.name }
				});
				previewImg.onerror = () => {
					previewImg.addClass('md2wechat-is-hidden');
				};
			}
		}
	}
}