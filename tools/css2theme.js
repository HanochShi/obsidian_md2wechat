#!/usr/bin/env node

/**
 * css2theme.js — 将普通 CSS 文件转换为 obsidian-md2wechat 主题格式
 *
 * 用法:
 *   node tools/css2theme.js <input.css> [--name "主题名称"] [--key themeKey]
 *
 * 示例:
 *   node tools/css2theme.js my-theme.css --name "Ocean Blue (海洋蓝)" --key ocean
 *
 * 输出可直接粘贴到 src/themes.ts 的 THEMES 对象中。
 */

const fs = require('fs');
const path = require('path');

// ─── 选择器到 ThemeStyle key 的映射 ────────────────────────────────────
const SELECTOR_MAP = {
	'container':    'container',
	'.container':   'container',
	'h1':           'h1',
	'h2':           'h2',
	'h3':           'h3',
	'h4':           'h4',
	'h5':           'h5',
	'h6':           'h6',
	'p':            'p',
	'code':         'code',
	'blockquote':   'blockquote',
	'ul':           'ul',
	'ol':           'ol',
	'li':           'li',
	'strong':       'strong',
	'b':            'strong',
	'a':            'link',
	'em':           'em',
	'i':            'em',
	'del':          'del',
	's':            'del',
	'hr':           'hr',
	'table':        'table',
	'th':           'th',
	'td':           'td',
	'pre':          'pre',
	'pre code':     'pre_code',
	'pre_code':     'pre_code',
};

// ThemeStyle 所有字段（按输出顺序排列）
const THEME_FIELDS = [
	'name',
	'container',
	'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
	'p', 'code', 'blockquote',
	'ul', 'ol', 'li',
	'strong', 'link', 'em', 'del', 'hr',
	'table', 'th', 'td',
	'pre', 'pre_code',
];

// ─── 解析命令行参数 ──────────────────────────────────────────────────
function parseArgs(argv) {
	const args = { input: '', name: '', key: '' };
	const rest = argv.slice(2);

	for (let i = 0; i < rest.length; i++) {
		if ((rest[i] === '--name' || rest[i] === '-n') && rest[i + 1]) {
			args.name = rest[++i];
		} else if ((rest[i] === '--key' || rest[i] === '-k') && rest[i + 1]) {
			args.key = rest[++i];
		} else if (!rest[i].startsWith('-') && !args.input) {
			args.input = rest[i];
		}
	}

	if (!args.input) {
		console.error('❌ 请提供 CSS 文件路径');
		console.error('用法: node tools/css2theme.js <input.css> [--name "主题名"] [--key themeKey]');
		process.exit(1);
	}

	return args;
}

// ─── 读取 CSS 文件 ────────────────────────────────────────────────────
function readCss(filePath) {
	const resolved = path.resolve(filePath);
	if (!fs.existsSync(resolved)) {
		console.error(`❌ 文件不存在: ${resolved}`);
		process.exit(1);
	}
	return fs.readFileSync(resolved, 'utf-8');
}

// ─── 去除注释 ─────────────────────────────────────────────────────────
function stripComments(css) {
	return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

// ─── 解析 CSS 规则 ────────────────────────────────────────────────────
function parseCss(cssText) {
	const cleaned = stripComments(cssText);
	const ruleRegex = /([^{]+)\{([^}]+)\}/g;
	const rules = [];
	let match;

	while ((match = ruleRegex.exec(cleaned)) !== null) {
		const rawSelector = match[1].trim();
		const rawDeclarations = match[2].trim();

		// 处理逗号分隔的多选择器，如 "strong, b { ... }"
		const selectors = rawSelector.split(',').map(s => s.trim().toLowerCase());

		// 将声明块转为内联样式字符串
		const inlineStyle = rawDeclarations
			.split(';')
			.map(r => r.trim())
			.filter(r => r.length > 0)
			.join('; ') + ';';

		for (const sel of selectors) {
			rules.push({ selector: sel, style: inlineStyle });
		}
	}

	return rules;
}

// ─── 构建主题对象 ──────────────────────────────────────────────────────
function buildTheme(rules, themeName) {
	const theme = {};

	// 设置 name
	theme.name = themeName;

	for (const { selector, style } of rules) {
		const field = SELECTOR_MAP[selector];
		if (field) {
			// 如果同一个字段出现多次，后出现的覆盖前面的
			theme[field] = style;
		} else {
			console.warn(`⚠️  未识别的选择器被忽略: "${selector}"`);
		}
	}

	return theme;
}

// ─── 生成 TypeScript 代码 ──────────────────────────────────────────────
function generateTypeScript(key, theme) {
	const lines = [];
	lines.push(`${key}: {`);

	for (const field of THEME_FIELDS) {
		if (field === 'name') {
			lines.push(`\tname: "${theme.name || ''}",`);
		} else if (theme[field]) {
			lines.push(`\t${field}: "${theme[field]}",`);
		}
		// 未出现的可选字段不输出
	}

	lines.push('}');
	return lines.join('\n');
}

// ─── 主流程 ───────────────────────────────────────────────────────────
function main() {
	const args = parseArgs(process.argv);

	// 从文件名推断默认 key 和 name
	const basename = path.basename(args.input, '.css');
	const key = args.key || basename.replace(/[^a-zA-Z0-9_]/g, '_');
	const name = args.name || `${basename} (自定义)`;

	console.log(`\n🔄 正在转换: ${args.input}`);
	console.log(`   主题 key: ${key}`);
	console.log(`   主题名称: ${name}\n`);

	const cssText = readCss(args.input);
	const rules = parseCss(cssText);

	if (rules.length === 0) {
		console.error('❌ 未从 CSS 文件中解析到任何规则');
		process.exit(1);
	}

	console.log(`📋 解析到 ${rules.length} 条 CSS 规则\n`);

	const theme = buildTheme(rules, name);
	const recognizedFields = Object.keys(theme).filter(k => k !== 'name');

	if (recognizedFields.length === 0) {
		console.error('❌ 没有匹配到任何可识别的选择器，请检查 CSS 文件');
		process.exit(1);
	}

	console.log('✅ 以下选择器已成功映射:');
	for (const field of recognizedFields) {
		console.log(`   ${field}`);
	}
	console.log('');

	const output = generateTypeScript(key, theme);

	console.log('══════════════════════════════════════════════════════');
	console.log('📄 将以下代码粘贴到 src/themes.ts 的 THEMES 对象中:');
	console.log('══════════════════════════════════════════════════════\n');
	console.log(output);
	console.log('\n══════════════════════════════════════════════════════');

	// 同时输出到文件（可选）
	const outPath = path.resolve(args.input).replace(/\.css$/, '.theme.ts');
	fs.writeFileSync(outPath, output, 'utf-8');
	console.log(`\n💾 已保存到: ${outPath}`);
}

main();