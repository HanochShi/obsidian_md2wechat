import { DataAdapter, Notice } from 'obsidian';
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
	},
	yfqm: {
		name: "远方青木",
		container: "padding: 0 8px; font-family: 'PingFang SC NEW',system-ui,-apple-system,BlinkMacSystemFont,'Helvetica Neue','Hiragino Sans GB','Microsoft YaHei UI','Microsoft YaHei',Arial,sans-serif; font-size: 17px; letter-spacing: 0.034em; color: rgba(0, 0, 0, 0.9); line-height: 1.6; text-align: justify;",
		h1: "font-size: 22px; color: rgb(123, 12, 0); text-align: center; margin-bottom: 24px;",
		h2: "font-size: 20px; padding-left: 10px; border-left: 4px solid rgb(123, 12, 0);",
		h3: "font-size: 18px; border-bottom: 1px dashed rgba(123, 12, 0, 0.3); padding-bottom: 6px;",
		h4: "font-size: 17px;",
		h5: "font-size: 16px; color: rgba(0, 0, 0, 0.7);",
		h6: "font-size: 16px; color: rgba(0, 0, 0, 0.5); font-weight: normal;",
		p: 'margin-top: 0; margin-bottom: 24px; font-family: mp-quote, "PingFang SC", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif;',
		code: 'font-family: Consolas, Monaco, "Courier New", monospace; font-size: 15px; color: rgb(123, 12, 0); background-color: rgba(0, 0, 0, 0.04); padding: 2px 4px; border-radius: 4px; word-break: break-all;',
		blockquote: "margin: 0 0 24px 0; padding: 16px; background-color: rgba(123, 12, 0, 0.05); border-left: 3px solid rgb(123, 12, 0); border-radius: 0 4px 4px 0;",
		ul: "margin-top: 0; margin-bottom: 24px; padding-left: 24px;",
		ol: "margin-top: 0; margin-bottom: 24px; padding-left: 24px;",
		li: "margin-bottom: 8px; line-height: 1.6;",
		strong: "color: rgb(123, 12, 0); font-weight: bold;",
		link: "color: rgb(123, 12, 0); text-decoration: none; border-bottom: 1px solid rgba(123, 12, 0, 0.4);",
		em: "font-style: italic; color: rgba(0, 0, 0, 0.7);",
		del: "text-decoration: line-through; color: rgba(0, 0, 0, 0.4);",
		hr: "margin: 32px 0; border: none; border-top: 1px solid rgba(123, 12, 0, 0.15);",
		table: "width: 100%; margin-bottom: 24px; border-collapse: collapse; font-size: 15px;",
		th: "word-break: break-all;",
		td: "word-break: break-all;",
		pre: "margin-top: 0; margin-bottom: 24px; padding: 16px; background-color: #f6f6f6; border-radius: 6px; overflow-x: auto;",
		pre_code: "background-color: transparent; color: rgba(0, 0, 0, 0.8); font-size: 14px; padding: 0; border-radius: 0; white-space: pre;",
	},
	klx: {
		name: "看理想",
		container: "padding: 0 8px; font-family: 'PingFang SC NEW', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'Hiragino Sans GB', 'Microsoft YaHei UI', 'Microsoft YaHei', Arial, sans-serif; font-size: 16px; font-style: normal; letter-spacing: .034em; color: rgba(0, 0, 0, 0.9); line-height: 1.6; text-align: justify;",
		h1: "color: rgb(86, 124, 162); font-size: 20px; font-weight: bold; letter-spacing: 1px; line-height: 1.6em; text-align: center; margin-top: 20px; margin-bottom: 28.5px;",
		h2: "color: rgb(86, 124, 162); font-size: 16px; font-weight: bold; letter-spacing: 0.5px; line-height: 1.75em; text-align: center; margin-bottom: 28.5px;",
		h3: "color: rgba(0, 0, 0, 0.9); font-size: 16px; font-weight: bold; letter-spacing: 0.5px; line-height: 1.75em; text-align: left; margin-bottom: 20px; padding-left: 10px; border-left: 4px solid rgb(86, 124, 162);",
		h4: "color: rgba(0, 0, 0, 0.9); font-size: 15px; font-weight: bold; letter-spacing: 0.5px; line-height: 1.75em; margin-bottom: 15px;",
		h5: "font-weight: normal; font-size: 13px; color: #888888; text-align: center; letter-spacing: 0.5px; line-height: 1.75em; margin-top: 10px; margin-bottom: 20px;",
		h6: "font-weight: normal; font-size: 12px; color: #888888; text-align: center; letter-spacing: 0.5px; line-height: 1.75em; margin-top: -28.5px; margin-bottom: 28.5px;",
		p: "line-height: 1.75em; letter-spacing: 0.5px; font-family: 'Optima-Regular', 'PingFangTC-light'; font-size: 16px; font-weight: normal; margin-bottom: 28.5px; margin-top: 0;",
		code: 'font-family: Consolas, Monaco, "Courier New", monospace; font-size: 14px; color: rgb(86, 124, 162); background-color: #f7f7f7; padding: 2px 6px; border-radius: 4px; word-break: break-all;',
		blockquote: "margin: 0 0 28.5px 0; padding: 16px 20px; background-color: rgba(86, 124, 162, 0.05); border-left: 3px solid rgb(86, 124, 162); border-radius: 0 4px 4px 0;",
		ul: "margin-top: 0; margin-bottom: 28.5px; padding-left: 32px; color: rgba(0, 0, 0, 0.9);",
		ol: "margin-top: 0; margin-bottom: 28.5px; padding-left: 32px; color: rgba(0, 0, 0, 0.9);",
		li: "font-family: 'Optima-Regular', 'PingFangTC-light'; font-size: 16px; line-height: 1.75em; letter-spacing: 0.5px; margin-bottom: 8px;",
		strong: "font-weight: bold;",
		link: "color: rgb(86, 124, 162); text-decoration: none; border-bottom: 1px solid rgba(86, 124, 162, 0.4); padding-bottom: 1px;",
		em: "font-style: italic; color: rgb(86, 124, 162);",
		del: "text-decoration: line-through; color: #888888;",
		hr: "border: none; height: 12px; margin: 30px 0; background-image:\
			radial-gradient(circle, #d9d9d9 4.5px, transparent 5px),\
			radial-gradient(circle, #d9d9d9 4.5px, transparent 5px),\
			linear-gradient(to right, #d9d9d9, #d9d9d9),\
			linear-gradient(to right, #d9d9d9, #d9d9d9); background-size:\
			12px 12px,\
			12px 12px,\
			calc(50% - 25px) 1px,\
			calc(50% - 25px) 1px; background-position:\
			calc(50% - 8px) center,\
			calc(50% + 8px) center,\
			left center,\
			right center; background-repeat: no-repeat;",
		table: "width: 100%; border-collapse: collapse; margin-bottom: 28.5px; font-size: 14px; color: rgba(0, 0, 0, 0.9);",
		th: "font-weight: bold; background-color: rgba(86, 124, 162, 0.1); color: rgb(86, 124, 162);",
		td: "border: 1px solid #d9d9d9; padding: 10px 12px; text-align: left; line-height: 1.6em;",
		pre: "background-color: #f7f7f7; padding: 16px; border-radius: 6px; overflow-x: auto; margin-top: 0; margin-bottom: 28.5px; border: 1px solid #eeeeee;",
		pre_code: "background-color: transparent; color: #333333; font-size: 13px; padding: 0; border-radius: 0; white-space: pre; line-height: 1.6em;",
	},
	dlts: {
		name: "大浪淘沙",
		container: "padding: 0 8px; font-family: '文鼎大颜楷','PingFang SC NEW',system-ui,-apple-system,BlinkMacSystemFont,'Helvetica Neue','Hiragino Sans GB','Microsoft YaHei UI','Microsoft YaHei',Arial,sans-serif; font-size: 16px; letter-spacing: 0.034em; color: rgba(0, 0, 0, 0.9); line-height: 1.6; text-align: justify;",
		h1: "font-size: 18px; letter-spacing: 2px; line-height: 2em; text-align: center; margin-bottom: 24px; font-weight: bold; color: rgba(0, 0, 0, 0.95);",
		h2: "font-size: 16px; letter-spacing: 2px; line-height: 2em; text-align: center; margin-bottom: 24px;",
		h3: "font-size: 16px; letter-spacing: 2px; line-height: 2em; margin-bottom: 16px; font-weight: bold; color: rgba(0, 0, 0, 0.9);",
		h4: "font-size: 15px; letter-spacing: 1.5px; line-height: 2em; margin-bottom: 16px; font-weight: bold; color: rgba(0, 0, 0, 0.8);",
		h5: "font-size: 14px; letter-spacing: 1.5px; line-height: 1.8em; margin-bottom: 12px; font-weight: bold; color: rgba(0, 0, 0, 0.7);",
		h6: "font-size: 14px; letter-spacing: 1.5px; line-height: 1.8em; margin-bottom: 12px; font-weight: normal; color: rgba(0, 0, 0, 0.55);",
		p: "font-family: '文鼎大颜楷','PingFang SC NEW',system-ui,-apple-system,BlinkMacSystemFont,'Helvetica Neue','Hiragino Sans GB','Microsoft YaHei UI','Microsoft YaHei',Arial,sans-serif; font-size: 16px; letter-spacing: 2px; line-height: 2em; margin-bottom: 24px;",
		code: "font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; background-color: rgba(0, 0, 0, 0.04); padding: 2px 6px; margin: 0 2px; border-radius: 4px; font-size: 14px; color: rgba(0, 0, 0, 0.8); letter-spacing: 0;",
		blockquote: "-webkit-tap-highlight-color: rgba(0, 0, 0, 0); margin: 1em 0px; padding: 4px 0px 0px 10px; outline: 0px; border-left: 3px solid rgb(219, 219, 219); color: rgba(0, 0, 0, .55); font-size: 15px; text-indent: 0px; max-width: 100%; box-sizing: border-box !important; overflow-wrap: break-word !important; font-family: 'PingFang SC', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'Hiragino Sans GB', 'Microsoft YaHei UI', 'Microsoft YaHei', Arial, sans-serif; font-style: normal; font-weight: 400; letter-spacing: 0.544px; orphans: 2; text-align: justify; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; white-space: normal; background-color: rgb(255, 255, 255);",
		ul: "margin-top: 0; margin-bottom: 24px; padding-left: 28px; font-size: 16px; letter-spacing: 2px; line-height: 2em; color: rgba(0, 0, 0, 0.9);",
		ol: "margin-top: 0; margin-bottom: 24px; padding-left: 28px; font-size: 16px; letter-spacing: 2px; line-height: 2em; color: rgba(0, 0, 0, 0.9);",
		li: "margin-bottom: 8px;",
		strong: "font-weight: bold; color: #000000;",
		link: "color: #576b95; text-decoration: none; border-bottom: 1px solid rgba(87, 107, 149, 0.3);",
		em: "font-style: italic; color: rgba(0, 0, 0, 0.7);",
		del: "text-decoration: line-through; color: rgba(0, 0, 0, 0.4);",
		hr: "border: none; border-top: 1px solid rgb(219, 219, 219); margin: 32px 0 24px 0;",
		table: "width: 100%; border-collapse: collapse; margin-bottom: 24px; font-family: 'PingFang SC', system-ui, -apple-system, sans-serif; font-size: 14px; letter-spacing: 0.5px; line-height: 1.6;",
		th: "background-color: rgb(249, 249, 249); font-weight: bold; color: rgba(0, 0, 0, 0.8);",
		td: "border: 1px solid rgb(219, 219, 219); padding: 10px 8px; text-align: left;",
		pre: "background-color: rgb(249, 249, 249); border: 1px solid rgb(219, 219, 219); border-radius: 4px; padding: 16px; margin-bottom: 24px; overflow-x: auto; -webkit-overflow-scrolling: touch;",
		pre_code: "background-color: transparent; padding: 0; margin: 0; font-size: 13px; color: rgba(0, 0, 0, 0.8); letter-spacing: 0; line-height: 1.6;",
	}
};

export async function initThemeDirectory(adapter: DataAdapter, folderPath: string, templateCss: string) {
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

export async function writeThemeWithConflictCheck(adapter: DataAdapter, folderPath: string, baseName: string, content: string) {
	const normalizeContent = (str: string) => str.trim().replace(/\r\n/g, '\n');
	const targetPath = `${folderPath}/${baseName}.css`;
	
	const fileExists = await adapter.exists(targetPath);
	if (!fileExists) {
		await adapter.write(targetPath, content);
		return;
	}

	const existingContent = await adapter.read(targetPath);
	if (normalizeContent(existingContent) === normalizeContent(content)) {
		return;
	}

	let index = 1;
	while (true) {
		const candidatePath = `${folderPath}/${baseName} (${index}).css`;
		const candidateExists = await adapter.exists(candidatePath);
		if (!candidateExists) {
			await adapter.write(candidatePath, content);
			new Notice(`检测到您自定义了默认示例，已自动将最新的全面标记模版保存为 "${baseName} (${index}).css"！`);
			return;
		}
		
		const candidateContent = await adapter.read(candidatePath);
		if (normalizeContent(candidateContent) === normalizeContent(content)) {
			return;
		}
		
		index++;
	}
}

export async function loadCustomThemes(adapter: DataAdapter, folderPath: string): Promise<Record<string, ThemeStyle>> {
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