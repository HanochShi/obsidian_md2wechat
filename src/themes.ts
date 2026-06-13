import { Notice } from 'obsidian';
import { ThemeStyle } from './types';

export const THEMES: Record<string, ThemeStyle> = {
	elegant: {
		name: "Elegant Green (雅绿)",
		container: "font-family: -apple-system-font, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei UI', Arial, sans-serif; font-size: 15px; color: #353535; line-height: 1.75; letter-spacing: 0.5px; word-wrap: break-word; text-align: justify;",
		h1: "font-size: 1.35em; color: #2e6851; border-bottom: 2px solid #2e6851; padding-bottom: 5px; margin-top: 1.8em; margin-bottom: 0.8em; font-weight: bold;",
		h2: "font-size: 1.2em; color: #2e6851; margin-top: 1.6em; margin-bottom: 0.8em; font-weight: bold; padding-left: 6px; border-left: 3px solid #2e6851;",
		h3: "font-size: 1.1em; color: #3e8868; margin-top: 1.4em; margin-bottom: 0.6em; font-weight: bold;",
		h4: "font-size: 1.0em; color: #3e8868; margin-top: 1.2em; margin-bottom: 0.6em; font-weight: bold;",
		h5: "font-size: 1.0em; color: #444444; margin-top: 1.2em; margin-bottom: 0.6em; font-weight: bold;",
		h6: "font-size: 0.9em; color: #666666; margin-top: 1.2em; margin-bottom: 0.6em; font-weight: bold;",
		p: "margin-top: 0px; margin-bottom: 1.4em; color: #3e3e3e; line-height: 1.8;",
		code: "font-family: Consolas, Monaco, monospace; font-size: 14px; background-color: #f8f8f8; color: #c7254e; padding: 2px 4px; border-radius: 4px; border: 1px solid #e1e1e8; word-break: break-all;",
		blockquote: "margin: 1.5em 0; padding: 10px 15px; background: #f4f9f6; border-left: 4px solid #2e6851; color: #555555; font-size: 0.95em; border-radius: 0 4px 4px 0;",
		ul: "margin-top: 0px; margin-bottom: 1.2em; padding-left: 20px; list-style-type: disc;",
		ol: "margin-top: 0px; margin-bottom: 1.2em; padding-left: 20px; list-style-type: decimal;",
		li: "margin-bottom: 6px; line-height: 1.7; color: #444444;",
		strong: "color: #2e6851; font-weight: bold;",
		link: "color: #2e6851; text-decoration: none; border-bottom: 1px dashed #2e6851;",
		em: "font-style: italic; color: #555555;",
		del: "text-decoration: line-through; color: #888888;",
		hr: "border: 0; border-top: 1px solid #2e6851; margin: 2em 0; opacity: 0.7;",
		table: "border-collapse: collapse; width: 100%; margin: 1.5em 0; font-size: 0.9em;",
		th: "border: 1px solid #dfdfdf; background-color: #f2fcf7; color: #2e6851; padding: 8px 12px; font-weight: bold; text-align: left;",
		td: "border: 1px solid #dfdfdf; padding: 8px 12px; color: #444444;",
		pre: "background-color: #1a1a1a; padding: 12px 16px; border-radius: 6px; overflow-x: auto; margin: 1.5em 0; line-height: 1.6; color: #abb2bf; font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; tab-size: 4; -moz-tab-size: 4; -o-tab-size: 4;",
		pre_code: "font-family: inherit; font-size: 13px; background-color: transparent; border: 0; padding: 0; color: inherit; line-height: inherit; word-wrap: normal;"
	},
	warm: {
		name: "Warm Gold (温暖暖金)",
		container: "font-family: -apple-system-font, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', sans-serif; font-size: 15px; color: #3e3a35; line-height: 1.8; letter-spacing: 0.5px;",
		h1: "font-size: 1.4em; color: #b25829; text-align: center; border-bottom: 1px dashed #b25829; padding-bottom: 8px; margin-top: 2em; margin-bottom: 1em; font-weight: bold;",
		h2: "font-size: 1.2em; color: #b25829; margin-top: 1.6em; margin-bottom: 0.8em; font-weight: bold; background: #faf4ee; padding: 4px 10px; border-radius: 4px;",
		h3: "font-size: 1.1em; color: #c67144; margin-top: 1.4em; margin-bottom: 0.6em; font-weight: bold;",
		h4: "font-size: 1.0em; color: #c67144; margin-top: 1.2em; margin-bottom: 0.6em; font-weight: bold;",
		h5: "font-size: 1.0em; color: #4a453f; margin-top: 1.2em; margin-bottom: 0.6em; font-weight: bold;",
		h6: "font-size: 0.9em; color: #7e756b; margin-top: 1.2em; margin-bottom: 0.6em; font-weight: bold;",
		p: "margin-top: 0px; margin-bottom: 1.4em; color: #4a453f; line-height: 1.8; text-align: justify;",
		code: "font-family: monospace; font-size: 14px; background-color: #faf4ee; color: #b25829; padding: 2px 4px; border-radius: 3px;",
		blockquote: "margin: 1.5em 0; padding: 12px 18px; background: #faf4ee; border-left: 4px solid #b25829; color: #6e655b; font-size: 0.95em;",
		ul: "margin-top: 0px; margin-bottom: 1.2em; padding-left: 20px; list-style-type: circle;",
		ol: "margin-top: 0px; margin-bottom: 1.2em; padding-left: 20px; list-style-type: decimal;",
		li: "margin-bottom: 6px; line-height: 1.7;",
		strong: "color: #b25829; font-weight: bold;",
		link: "color: #b25829; text-decoration: underline;",
		em: "font-style: italic; color: #6e655b;",
		del: "text-decoration: line-through; color: #9c9287;",
		hr: "border: 0; border-top: 1px dashed #b25829; margin: 2em 0; opacity: 0.8;",
		table: "border-collapse: collapse; width: 100%; margin: 1.5em 0; font-size: 0.9em;",
		th: "border: 1px solid #e9dfd6; background-color: #faf4ee; color: #b25829; padding: 8px 12px; font-weight: bold; text-align: left;",
		td: "border: 1px solid #e9dfd6; padding: 8px 12px; color: #4a453f;",
		pre: "background-color: #1a1a1a; border: 1px solid #e9dfd6; padding: 12px 16px; border-radius: 6px; overflow-x: auto; margin: 1.5em 0; line-height: 1.6; color: #abb2bf; font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; tab-size: 4; -moz-tab-size: 4; -o-tab-size: 4;",
		pre_code: "font-family: inherit; font-size: 13px; background-color: transparent; border: 0; padding: 0; color: inherit; line-height: inherit; word-wrap: normal;"
	},
	minimal: {
		name: "Minimalist Black (极简黑色)",
		container: "font-family: -apple-system-font, BlinkMacSystemFont, sans-serif; font-size: 15px; color: #222222; line-height: 1.7; letter-spacing: 0.2px;",
		h1: "font-size: 1.5em; color: #000000; font-weight: bold; margin-top: 1.8em; margin-bottom: 0.8em; border-bottom: 1px solid #000000; padding-bottom: 5px;",
		h2: "font-size: 1.25em; color: #000000; font-weight: bold; margin-top: 1.6em; margin-bottom: 0.8em;",
		h3: "font-size: 1.1em; color: #444444; font-weight: bold; margin-top: 1.4em; margin-bottom: 0.6em;",
		h4: "font-size: 1.0em; color: #444444; font-weight: bold; margin-top: 1.2em; margin-bottom: 0.6em;",
		h5: "font-size: 1.0em; color: #666666; font-weight: bold; margin-top: 1.2em; margin-bottom: 0.6em;",
		h6: "font-size: 0.9em; color: #888888; font-style: italic; margin-top: 1.2em; margin-bottom: 0.6em;",
		p: "margin-top: 0px; margin-bottom: 1.4em; color: #222222; text-align: justify;",
		code: "font-family: monospace; font-size: 14px; background-color: #f3f3f3; color: #000000; padding: 2px 4px; border-radius: 2px;",
		blockquote: "margin: 1.5em 0; padding: 10px 15px; background: #f9f9f9; border-left: 3px solid #000000; color: #666666; font-style: italic;",
		ul: "margin-top: 0px; margin-bottom: 1.2em; padding-left: 20px; list-style-type: square;",
		ol: "margin-top: 0px; margin-bottom: 1.2em; padding-left: 20px; list-style-type: decimal;",
		li: "margin-bottom: 6px; color: #333333;",
		strong: "color: #000000; font-weight: bold;",
		link: "color: #1a0dab; text-decoration: underline;",
		em: "font-style: italic;",
		del: "text-decoration: line-through; color: #999999;",
		hr: "border: 0; border-top: 1px solid #000000; margin: 2em 0;",
		table: "border-collapse: collapse; width: 100%; margin: 1.5em 0; font-size: 0.9em;",
		th: "border: 1px solid #dddddd; background-color: #f9f9f9; color: #000000; padding: 8px 12px; font-weight: bold; text-align: left;",
		td: "border: 1px solid #dddddd; padding: 8px 12px; color: #222222;",
		pre: "background-color: #1a1a1a; padding: 12px 16px; border-radius: 6px; overflow-x: auto; margin: 1.5em 0; line-height: 1.6; color: #abb2bf; font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; tab-size: 4; -moz-tab-size: 4; -o-tab-size: 4;",
		pre_code: "font-family: inherit; font-size: 13px; background-color: transparent; border: 0; padding: 0; color: inherit; line-height: inherit; word-wrap: normal;"
	}
};

export async function initThemeDirectory(adapter: any, folderPath: string, templateCss: string) {
	try {
		const exists = await adapter.exists(folderPath);
		if (!exists) {
			await adapter.mkdir(folderPath);
		}
		await writeThemeWithConflictCheck(adapter, folderPath, "红色热情 (示例)", templateCss);
	} catch (e) {
		console.error("【微信同步】初始化主题目录失败:", e);
	}
}

export async function writeThemeWithConflictCheck(adapter: any, folderPath: string, baseName: string, content: string) {
	const normalizeContent = (str: string) => str.trim().replace(/\r\n/g, '\n');
	const targetPath = `${folderPath}/${baseName}.css`;
	
	const fileExists = await adapter.exists(targetPath);
	if (!fileExists) {
		await adapter.write(targetPath, content);
		console.log(`【微信同步】成功生成全新主题示例: ${targetPath}`);
		return;
	}

	const existingContent = await adapter.read(targetPath);
	if (normalizeContent(existingContent) === normalizeContent(content)) {
		console.log(`【微信同步】示例主题 ${baseName}.css 内容未被修改，保持现状。`);
		return;
	}

	let index = 1;
	while (true) {
		const candidatePath = `${folderPath}/${baseName} (${index}).css`;
		const candidateExists = await adapter.exists(candidatePath);
		if (!candidateExists) {
			await adapter.write(candidatePath, content);
			new Notice(`检测到您自定义了默认示例，已自动将最新的全面标记模版保存为 "${baseName} (${index}).css"！`);
			console.log(`【微信同步】检测到冲突，已将最新示例模版备份到: ${candidatePath}`);
			return;
		}
		
		const candidateContent = await adapter.read(candidatePath);
		if (normalizeContent(candidateContent) === normalizeContent(content)) {
			console.log(`【微信同步】最新的示例内容已经完美存在于: ${candidatePath}`);
			return;
		}
		
		index++;
	}
}

export async function loadCustomThemes(adapter: any, folderPath: string): Promise<Record<string, ThemeStyle>> {
	const customThemes: Record<string, ThemeStyle> = {};
	try {
		const exists = await adapter.exists(folderPath);
		if (!exists) return customThemes;

		const files = await adapter.list(folderPath);
		const cssFiles = files.files.filter((f: string) => f.endsWith('.css'));

		for (const file of cssFiles) {
			const content = await adapter.read(file);
			const fileName = file.split('/').pop() || '';
			const themeName = fileName.replace(/\.css$/, '');
			const parsedTheme = parseCssToTheme(themeName, content);
			if (parsedTheme) {
				customThemes[themeName] = parsedTheme;
			}
		}
	} catch (e) {
		console.error("【微信同步】加载自定义主题失败:", e);
	}
	return customThemes;
}

export function parseCssToTheme(themeName: string, cssText: string): ThemeStyle | null {
	const baseline: ThemeStyle = {
		name: `${themeName} (自定义)`,
		container: "font-family: -apple-system-font, BlinkMacSystemFont, sans-serif; font-size: 15px; color: #353535; line-height: 1.75; text-align: justify;",
		h1: "font-size: 1.35em; font-weight: bold;",
		h2: "font-size: 1.2em; font-weight: bold;",
		h3: "font-size: 1.1em; font-weight: bold;",
		h4: "font-size: 1.0em; font-weight: bold;",
		h5: "font-size: 1.0em; font-weight: bold;",
		h6: "font-size: 0.9em; font-weight: bold;",
		p: "margin-top: 0px; margin-bottom: 1.4em;",
		code: "font-family: monospace; font-size: 14px;",
		blockquote: "margin: 1.5em 0; padding: 10px 15px;",
		ul: "margin-top: 0px; margin-bottom: 1.2em; padding-left: 20px;",
		ol: "margin-top: 0px; margin-bottom: 1.2em; padding-left: 20px;",
		li: "margin-bottom: 6px;",
		strong: "font-weight: bold;",
		link: "text-decoration: none;",
		em: "font-style: italic;",
		del: "text-decoration: line-through;",
		hr: "border: 0; border-top: 1px solid #cccccc; margin: 2em 0;",
		table: "border-collapse: collapse; width: 100%; margin: 1.5em 0;",
		th: "border: 1px solid #cccccc; padding: 8px 12px; font-weight: bold; text-align: left;",
		td: "border: 1px solid #cccccc; padding: 8px 12px;",
		pre: "padding: 12px 16px; border-radius: 6px; overflow-x: auto; margin: 1.5em 0; font-family: monospace;",
		pre_code: "font-family: inherit; font-size: 13px;"
	};

	try {
		const strippedCss = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
		const ruleRegex = /([^{]+)\{([^}]+)\}/g;
		let match;

		while ((match = ruleRegex.exec(strippedCss)) !== null) {
			const selector = match[1].trim().toLowerCase();
			const rulesRaw = match[2].trim();
			
			const rules = rulesRaw
				.split(';')
				.map(r => r.trim())
				.filter(r => r.length > 0)
				.join('; ') + ';';

			if (selector === '.container' || selector === 'container') {
				baseline.container = rules;
			} else if (selector === 'h1') {
				baseline.h1 = rules;
			} else if (selector === 'h2') {
				baseline.h2 = rules;
			} else if (selector === 'h3') {
				baseline.h3 = rules;
			} else if (selector === 'h4') {
				baseline.h4 = rules;
			} else if (selector === 'h5') {
				baseline.h5 = rules;
			} else if (selector === 'h6') {
				baseline.h6 = rules;
			} else if (selector === 'p') {
				baseline.p = rules;
			} else if (selector === 'code') {
				baseline.code = rules;
			} else if (selector === 'blockquote') {
				baseline.blockquote = rules;
			} else if (selector === 'ul') {
				baseline.ul = rules;
			} else if (selector === 'ol') {
				baseline.ol = rules;
			} else if (selector === 'li') {
				baseline.li = rules;
			} else if (selector === 'strong' || selector === 'b') {
				baseline.strong = rules;
			} else if (selector === 'a') {
				baseline.link = rules;
			} else if (selector === 'em' || selector === 'i') {
				baseline.em = rules;
			} else if (selector === 'del' || selector === 's') {
				baseline.del = rules;
			} else if (selector === 'hr') {
				baseline.hr = rules;
			} else if (selector === 'table') {
				baseline.table = rules;
			} else if (selector === 'th') {
				baseline.th = rules;
			} else if (selector === 'td') {
				baseline.td = rules;
			} else if (selector === 'pre') {
				baseline.pre = rules;
			} else if (selector === 'pre code' || selector === 'pre_code') {
				baseline.pre_code = rules;
			}
		}
		return baseline;
	} catch (e) {
		console.error(`【微信同步】解析CSS主题 ${themeName} 失败:`, e);
		return null;
	}
}