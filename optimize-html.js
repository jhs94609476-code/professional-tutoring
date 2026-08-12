// dist/ 내 모든 HTML 파일 렌더링 블로킹 최적화
// 1. <script src=...> → <script src=... defer>  (defer/async 없는 경우만)
// 2. <head> 직후에 preconnect 태그 주입 (이미 있으면 스킵)

const fs = require('fs');
const path = require('path');

const distPath = path.resolve(__dirname, 'dist');

const preconnectBlock = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`;

function getAllHtmlFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of list) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results = results.concat(getAllHtmlFiles(full));
        } else if (entry.name.endsWith('.html')) {
            results.push(full);
        }
    }
    return results;
}

const files = getAllHtmlFiles(distPath);
console.log(`총 ${files.length}개 HTML 파일 처리 시작...`);

let modified = 0;
let count = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // 1. <script src="..."> 에 defer 추가 (defer/async 없는 경우만)
    content = content.replace(
        /(<script\s+src=["'][^"']+["'])(\s*>)/gi,
        (match, p1, p2) => {
            if (/defer|async/i.test(match)) return match;
            return p1 + ' defer' + p2;
        }
    );

    // 2. preconnect 주입 (<head> 직후, 아직 없는 경우만)
    if (!content.includes('fonts.googleapis.com')) {
        content = content.replace(
            /(<head[^>]*>)/i,
            `$1\n${preconnectBlock}`
        );
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        modified++;
    }

    count++;
    if (count % 1000 === 0) {
        console.log(`.. ${count} / ${files.length} 처리 완료 (수정: ${modified})`);
    }
}

console.log(`\n완료: 전체 ${files.length}개 파일 중 ${modified}개 수정됨`);
