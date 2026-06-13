import { App, PluginSettingTab, Setting, Notice, requestUrl } from 'obsidian';
import Md2WeChatPlugin from './main';

export class Md2WeChatSettingTab extends PluginSettingTab {
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
				this.plugin.settings.cachedMaterials.forEach((m: any) => {
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