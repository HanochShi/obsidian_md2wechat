import { marked } from 'marked';
import hljs from 'highlight.js';
import { ThemeStyle } from './types';

// Parse and rewrite standard Markdown footnote definitions to WeChat compatible layout
export function preprocessWeChatFootnotes(markdown: string): { markdown: string; footnotes: Array<{ index: number; label: string; content: string }> } {
	const footnotes: Array<{ index: number; label: string; content: string }> = [];
	
	const definitionRegex = /^\s*\[\^([^\]]+)\]:\s*([^\n]+(?:\n(?!\s*\[\^|\s*\n)[^\n]+)*)/gm;
	const refMap: Record<string, { index: number; content: string }> = {};
	let counter = 1;

	let processedMarkdown = markdown;
	const definitions: Array<{ raw: string; label: string; content: string }> = [];
	
	let defMatch;
	while ((defMatch = definitionRegex.exec(markdown)) !== null) {
		definitions.push({
			raw: defMatch[0],
			label: defMatch[1].trim(),
			content: defMatch[2].trim()
		});
	}

	definitions.forEach(def => {
		processedMarkdown = processedMarkdown.replace(def.raw, '');
		if (!refMap[def.label]) {
			refMap[def.label] = { index: counter++, content: def.content };
		}
	});

	const inlineRefRegex = /\[\^([^\]]+)\](?!\s*:)/g;
	processedMarkdown = processedMarkdown.replace(inlineRefRegex, (match, label) => {
		const cleanLabel = label.trim();
		const ref = refMap[cleanLabel];
		if (ref) {
			if (!footnotes.some(f => f.label === cleanLabel)) {
				footnotes.push({ index: ref.index, label: cleanLabel, content: ref.content });
			}
			return `<sup class="wechat-footnote-ref" style="font-size: 0.75em; line-height: 0; position: relative; vertical-align: baseline; top: -0.5em; margin-left: 2px; margin-right: 2px; font-weight: bold; color: #2e6851;">[${ref.index}]</sup>`;
		}
		return match;
	});

	footnotes.sort((a, b) => a.index - b.index);
	return { markdown: processedMarkdown, footnotes };
}

// Convert Obsidian Markdown to WeChat-ready inline HTML using Marked and DOM-based Inliner
export function convertToWeChatHtml(markdownText: string, theme: ThemeStyle): string {
	// Preprocess: Insert Zero-Width Space (\u200B) between formatting asterisks/tildes and Chinese punctuation marks
	// This forces marked to recognize bold/italic boundaries next to full-width punctuation
	let preprocessedMarkdown = markdownText;
	
	// Case 1: **“ or *“ or ~~“ -> insert \u200B before “ (e.g. **\u200B“text)
	// Covers open symbols: “ (left double quote), ‘ (left single quote), 《 (left book quote), 「 (left corner bracket), （ (left parenthesis), 【 (left bracket)
	preprocessedMarkdown = preprocessedMarkdown.replace(/(\*\*|\*|~~)([“‘《「（【])/g, '$1\u200B$2');
	
	// Case 2: ”** or ”* or ”~~ -> insert \u200B after ” (e.g. text\u200B”**)
	// Covers close symbols: ” (right double quote), ’ (right single quote), 》 (right book quote), 」 (right corner bracket), ） (right parenthesis), 】 (right bracket)
	preprocessedMarkdown = preprocessedMarkdown.replace(/([”’》」）】])(\*\*|\*|~~)/g, '$1\u200B$2');

	const { markdown: preparedMarkdown, footnotes } = preprocessWeChatFootnotes(preprocessedMarkdown);

	const renderer = new marked.Renderer();
	renderer.code = function({ text, lang, escaped }: { text: string; lang?: string; escaped?: boolean }): string {
		const validLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
		const highlighted = hljs.highlight(text, { language: validLang }).value;
		return `<pre><code class="hljs language-${validLang}">${highlighted}</code></pre>`;
	};

	let rawHtml = marked.parse(preparedMarkdown, { renderer, async: false }) as string;

	if (footnotes.length > 0) {
		let footnoteListHtml = `<div class="wechat-footnotes-section" style="margin-top: 3em; border-top: 1px solid #e1e1e8; padding-top: 1.5em; font-size: 13px; color: #666666;">`;
		footnoteListHtml += `<h4 style="font-size: 14px; font-weight: bold; margin-bottom: 1em; color: #444444;">参考资料:</h4>`;
		footnoteListHtml += `<ol style="padding-left: 18px; margin: 0; list-style-type: decimal; line-height: 1.65;">`;
		
		footnotes.forEach(fn => {
			let content = fn.content;
			content = content.replace(/\[(.*?)\]\((.*?)\)/g, '$1: $2');
			footnoteListHtml += `<li style="margin-bottom: 6px; text-align: justify; word-break: break-all;"><span style="font-weight: bold; margin-right: 4px;">[${fn.index}]</span> ${content}</li>`;
		});

		footnoteListHtml += `</ol></div>`;
		rawHtml += footnoteListHtml;
	}

	const parser = new DOMParser();
	const doc = parser.parseFromString(`<div>${rawHtml}</div>`, 'text/html');
	const container = doc.body.firstElementChild as HTMLElement;

	if (!container) return '';

	container.setAttribute('style', theme.container || '');

	const applyStyle = (selector: string, styleText: string | undefined) => {
		if (!styleText) return;
		const elements = container.querySelectorAll(selector);
		elements.forEach(el => {
			const existingStyle = el.getAttribute('style') || '';
			el.setAttribute('style', existingStyle ? `${existingStyle} ${styleText}` : styleText);
		});
	};

	applyStyle('h1', theme.h1);
	applyStyle('h2', theme.h2);
	applyStyle('h3', theme.h3);
	applyStyle('h4', theme.h4);
	applyStyle('h5', theme.h5);
	applyStyle('h6', theme.h6);
	applyStyle('p', theme.p);
	applyStyle('code', theme.code);
	applyStyle('blockquote', theme.blockquote);
	applyStyle('ul', theme.ul);
	applyStyle('ol', theme.ol);
	applyStyle('li', theme.li);
	applyStyle('strong', theme.strong);
	applyStyle('a', theme.link);
	applyStyle('em', theme.em);
	applyStyle('del', theme.del);
	applyStyle('hr', theme.hr);
	applyStyle('table', theme.table);
	applyStyle('th', theme.th);
	applyStyle('td', theme.td);
	applyStyle('pre', theme.pre);

	const syntaxColors: Record<string, string> = {
		'hljs-keyword': 'color: #f92672; font-weight: bold;',
		'hljs-string': 'color: #a6e22e;',
		'hljs-comment': 'color: #75715e; font-style: italic;',
		'hljs-number': 'color: #ae81ff;',
		'hljs-function': 'color: #a6e22e;',
		'hljs-title': 'color: #66d9ef;',
		'hljs-params': 'color: #f8f8f2;',
		'hljs-built_in': 'color: #66d9ef;',
		'hljs-type': 'color: #66d9ef; font-style: italic;',
		'hljs-class': 'color: #a6e22e;',
		'hljs-attr': 'color: #f92672;',
		'hljs-attribute': 'color: #e6db74;',
		'hljs-variable': 'color: #f8f8f2;',
		'hljs-meta': 'color: #75715e;',
		'hljs-literal': 'color: #ae81ff;'
	};

	Object.keys(syntaxColors).forEach(className => {
		const elements = container.querySelectorAll(`.${className}`);
		elements.forEach(el => {
			const existing = el.getAttribute('style') || '';
			el.setAttribute('style', existing ? `${existing} ${syntaxColors[className]}` : syntaxColors[className]);
		});
	});

	const preBlocks = container.querySelectorAll('pre');
	preBlocks.forEach(el => {
		const existingStyle = el.getAttribute('style') || '';
		el.setAttribute('style', `${existingStyle} letter-spacing: 0px !important; word-spacing: normal !important; tab-size: 4 !important; -moz-tab-size: 4 !important; -o-tab-size: 4 !important;`);
	});

	const preCodeBlocks = container.querySelectorAll('pre code');
	preCodeBlocks.forEach(el => {
		const baseStyle = theme.pre_code || '';
		el.setAttribute('style', `${baseStyle} letter-spacing: 0px !important; word-spacing: normal !important; tab-size: 4 !important; -moz-tab-size: 4 !important; -o-tab-size: 4 !important;`);
	});

	const blockquoteParagraphs = container.querySelectorAll('blockquote p');
	blockquoteParagraphs.forEach(p => {
		const style = p.getAttribute('style') || '';
		p.setAttribute('style', `${style} margin: 0.5em 0; color: inherit; line-height: inherit;`);
	});

	let themeColor = '#2e6851';
	if (theme.strong) {
		const colorMatch = theme.strong.match(/color:\s*(#[0-9a-fA-F]+)/);
		if (colorMatch) {
			themeColor = colorMatch[1];
		}
	}
	const footnoteRefs = container.querySelectorAll('.wechat-footnote-ref');
	footnoteRefs.forEach(ref => {
		const style = ref.getAttribute('style') || '';
		ref.setAttribute('style', style.replace('color: #2e6851;', `color: ${themeColor};`));
	});

	// Postprocess: Clean up all Zero-Width Spaces (\u200B) to restore clean HTML
	return container.outerHTML.replace(/\u200B/g, '');
}
