export interface Md2WeChatSettings {
	appId: string;
	appSecret: string;
	defaultStyle: string;
	customCss: string;
	enableImgUpload: boolean;
	imageHostingType: 'wechat' | 'none';
	defaultThumbMediaId: string;
	cachedMaterials: Array<{ mediaId: string; name: string }>;
	themeFolder: string;
}

export interface ThemeStyle {
	name: string;
	container: string;
	h1: string;
	h2: string;
	h3: string;
	h4?: string;
	h5?: string;
	h6?: string;
	p: string;
	code: string;
	blockquote: string;
	ul: string;
	ol: string;
	li: string;
	strong: string;
	link: string;
	em?: string;
	del?: string;
	hr?: string;
	table?: string;
	th?: string;
	td?: string;
	pre?: string;
	pre_code?: string;
}