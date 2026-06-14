import { App, requestUrl, TFile } from 'obsidian';

// Helper to construct multipart/form-data manually for requestUrl
function createMultipartBody(filename: string, fileData: ArrayBuffer, contentType: string, boundary: string): ArrayBuffer {
	const encoder = new TextEncoder();
	const header = encoder.encode(
		`--${boundary}\r\n` +
		`Content-Disposition: form-data; name="media"; filename="${filename}"\r\n` +
		`Content-Type: ${contentType}\r\n\r\n`
	);
	const footer = encoder.encode(`\r\n--${boundary}--\r\n`);

	const totalLength = header.byteLength + fileData.byteLength + footer.byteLength;
	const body = new Uint8Array(totalLength);
	
	body.set(header, 0);
	body.set(new Uint8Array(fileData), header.byteLength);
	body.set(footer, header.byteLength + fileData.byteLength);

	return body.buffer;
}

// Get content type from file extension
function getContentType(ext: string): string {
	const lower = ext.toLowerCase();
	if (lower === 'png') return 'image/png';
	if (lower === 'jpg' || lower === 'jpeg') return 'image/jpeg';
	if (lower === 'gif') return 'image/gif';
	if (lower === 'webp') return 'image/webp';
	return 'application/octet-stream';
}

// Upload local image to WeChat CDN (for inline images in the article)
export async function uploadImageToWeChat(app: App, file: TFile, accessToken: string): Promise<string> {
	const fileData = await app.vault.readBinary(file);
	const ext = file.extension;
	const contentType = getContentType(ext);
	const filename = file.name;
	const boundary = `----ObsidianMd2WeChatBoundary${Math.random().toString(36).substring(2)}`;

	const body = createMultipartBody(filename, fileData, contentType, boundary);
	const url = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${accessToken}`;

	const res = await requestUrl({
		url: url,
		method: 'POST',
		contentType: `multipart/form-data; boundary=${boundary}`,
		body: body
	});

	if (res.status !== 200) {
		throw new Error(`WeChat image upload failed with status ${res.status}`);
	}

	const data = JSON.parse(res.text);
	if (data.errcode) {
		throw new Error(`WeChat Upload Image Error: [${data.errcode}] ${data.errmsg}`);
	}

	if (!data.url) {
		throw new Error(`WeChat image upload did not return a URL`);
	}

	return data.url;
}

// Upload local image to WeChat as a Permanent Material Image (for draft cover, allows up to 2MB)
export async function uploadThumbToWeChat(app: App, file: TFile, accessToken: string): Promise<string> {
	const fileData = await app.vault.readBinary(file);
	const ext = file.extension;
	const contentType = getContentType(ext);
	const filename = file.name;
	const boundary = `----ObsidianMd2WeChatBoundary${Math.random().toString(36).substring(2)}`;

	const body = createMultipartBody(filename, fileData, contentType, boundary);
	
	// We use the permanent material upload API ('add_material?type=image') which has a 2MB size limit,
	// instead of the temporary thumb API ('media/upload?type=thumb') which strictly limits size to 64KB.
	const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=image`;

	const res = await requestUrl({
		url: url,
		method: 'POST',
		contentType: `multipart/form-data; boundary=${boundary}`,
		body: body
	});

	if (res.status !== 200) {
		throw new Error(`WeChat permanent image upload failed with status ${res.status}`);
	}

	const data = JSON.parse(res.text);
	if (data.errcode) {
		throw new Error(`WeChat Upload Cover Error: [${data.errcode}] ${data.errmsg}`);
	}

	if (!data.media_id) {
		throw new Error(`WeChat permanent image upload did not return a media_id`);
	}

	return data.media_id;
}
