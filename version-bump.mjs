import { readFileSync, writeFileSync } from "fs";

// 获取你刚才输入的最新版本号
const targetVersion = process.env.npm_package_version;

// 1. 修改 manifest.json
let manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));

// 2. 修改 versions.json (Obsidian用来管理兼容性的文件，如果有的话)
try {
	let versions = JSON.parse(readFileSync("versions.json", "utf8"));
	versions[targetVersion] = minAppVersion;
	writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));
} catch (e) {
	// 如果你没有 versions.json，就忽略
}

console.log(`✅ manifest.json 版本已自动更新为: ${targetVersion}`);