import { App, PluginSettingTab, Setting, Notice, requestUrl } from 'obsidian';
import Md2WeChatPlugin from './main';
import { t } from './i18n';

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
				dropdown.onChange(async (value: any) => {
					this.plugin.settings.lang = value;
					await this.plugin.saveSettings();
					
					// Force active view update to refresh text if view exists
					const activeViews = this.app.workspace.getLeavesOfType("wechat-preview-view");
					activeViews.forEach(leaf => {
						if (leaf.view && typeof (leaf.view as any).onOpen === 'function') {
							(leaf.view as any).onOpen();
						}
					});
					
					this.display(); // Redraw settings tab
				});
			});

		new Setting(containerEl)
			.setName(t('settings_appid_name', lang))
			.setDesc(t('settings_appid_desc', lang))
			.addText(text => text
				.setPlaceholder('wx...')
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
			.setName(t('settings_folder_name', lang))
			.setDesc(t('settings_folder_desc', lang))
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
			.setName(t('settings_upload_name', lang))
			.setDesc(t('settings_upload_desc', lang))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableImgUpload)
				.onChange(async (value) => {
					this.plugin.settings.enableImgUpload = value;
					await this.plugin.saveSettings();
				}));

		// Fetch & Select Materials Setting
		const materialsSetting = new Setting(containerEl)
			.setName(t('settings_fetch_name', lang))
			.setDesc(t('settings_fetch_desc', lang))
			.addButton(btn => btn
				.setButtonText(t('settings_fetch_btn', lang))
				.onClick(async () => {
					const { appId, appSecret } = this.plugin.settings;
					if (!appId || !appSecret) {
						new Notice(t('settings_notice_enter_api', lang));
						return;
					}
					btn.setDisabled(true);
					btn.setButtonText(t('settings_fetching_btn', lang));
					new Notice(t('settings_notice_fetching', lang));

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
							new Notice(t('settings_notice_no_img', lang));
							return;
						}

						this.plugin.settings.cachedMaterials = items.map((item: any) => ({
							mediaId: item.media_id,
							name: item.name
						}));
						await this.plugin.saveSettings();
						new Notice(t('settings_notice_loaded', lang).replace('{count}', items.length.toString()));
						this.display(); // Redraw settings tab to populate dropdown
					} catch (err: any) {
						console.error(err);
						new Notice(`Failed to fetch: ${err.message || err}`);
					} finally {
						btn.setDisabled(false);
						btn.setButtonText(t('settings_fetch_btn', lang));
					}
				}));

		if (this.plugin.settings.cachedMaterials && this.plugin.settings.cachedMaterials.length > 0) {
			materialsSetting.addDropdown(dropdown => {
				dropdown.addOption('', t('settings_cover_select_placeholder', lang));
				this.plugin.settings.cachedMaterials.forEach((m: any) => {
					dropdown.addOption(m.mediaId, m.name.substring(0, 30));
				});
				dropdown.setValue(this.plugin.settings.defaultThumbMediaId);
				dropdown.onChange(async (val) => {
					this.plugin.settings.defaultThumbMediaId = val;
					await this.plugin.saveSettings();
				});
			});
		}
	}
}
