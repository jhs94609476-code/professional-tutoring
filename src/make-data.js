const fs = require('fs');
const path = require('path');
const https = require('https');

// ★ 수정됨: 파일을 바깥이 아니라 현재 폴더(src)에 정확히 저장합니다.
const jsonFilePath = path.join(__dirname, 'high-english.json');
const sheetCsvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vStAETGqwhy2ux_FQAzPeS_bPUu_pIk_F7n79vO7LKCgAZ1KYHnqJ37WX5c2Higqtzx8gG6HBq7zouS/pub?gid=806514591&single=true&output=csv';

function parseCSV(csvText) {
    let inQuotes = false;
    let currentField = '';
    let currentRow = [];
    const rows = [];

    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (inQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    currentField += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                currentRow.push(currentField);
                currentField = '';
            } else if (char === '\r' || char === '\n') {
                currentRow.push(currentField);
                currentField = '';
                if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
                    rows.push(currentRow);
                }
                currentRow = [];
                if (char === '\r' && nextChar === '\n') {
                    i++;
                }
            } else {
                currentField += char;
            }
        }
    }
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }
    return rows;
}

function fetchCSV(url) {
    return new Promise((resolve, reject) => {
        const get = (targetUrl) => {
            https.get(targetUrl, (res) => {
                const { statusCode } = res;
                if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
                    return get(res.headers.location);
                }
                if (statusCode !== 200) {
                    reject(new Error(`CSV 다운로드 실패. 상태 코드: ${statusCode}`));
                    return;
                }
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => { resolve(data); });
            }).on('error', (err) => { reject(err); });
        };
        get(url);
    });
}

function copyDirSync(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

async function convertCSVToJson() {
    try {
        console.log(`구글 스프레드시트 CSV 데이터를 가져오는 중...`);
        const csvText = await fetchCSV(sheetCsvUrl);
        const rows = parseCSV(csvText);

        if (rows.length === 0) return;

        const rawHeaders = rows[0];
        const headers = rawHeaders.map((header, index) => {
            if (index === 0) return '링크';
            let h = header.trim();
            if (h === '지역(한글') h = '지역(한글)';
            return h;
        });

        const jsonData = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index] !== undefined ? row[index] : '';
            });
            jsonData.push(obj);
        }

        // 1. 기존처럼 JSON 저장 (참조용)
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
        console.log('JSON 변환 및 파일 저장 성공!');

        // 2. public 폴더 비우고 생성
        console.log('public 폴더 초기화 중...');
        const publicDir = path.join(__dirname, '..', 'public');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        } else {
            // Vercel 빌드 환경에서 public 폴더 자체를 rmSync로 삭제하면 경로 추적(Inode) 유실이 발생할 수 있습니다.
            // 따라서 폴더 자체는 유지한 채, 내부의 파일과 폴더들만 깨끗이 비워줍니다.
            const files = fs.readdirSync(publicDir);
            for (const file of files) {
                const filePath = path.join(publicDir, file);
                fs.rmSync(filePath, { recursive: true, force: true });
            }
        }

        // 3. static 자산 복사
        console.log('static 자산 복사 중...');
        fs.copyFileSync(path.join(__dirname, 'main.css'), path.join(publicDir, 'main.css'));
        fs.copyFileSync(path.join(__dirname, 'router.js'), path.join(publicDir, 'router.js'));
        
        const imagesSrc = path.join(__dirname, 'images');
        if (fs.existsSync(imagesSrc)) {
            copyDirSync(imagesSrc, path.join(publicDir, 'images'));
        }

        // rss.xml 복사 및 가공 (/?k= -> /)
        const rssSrcPath = path.join(__dirname, 'rss.xml');
        if (fs.existsSync(rssSrcPath)) {
            let rssContent = fs.readFileSync(rssSrcPath, 'utf8');
            rssContent = rssContent.replace(/\/\?k=/g, '/');
            fs.writeFileSync(path.join(publicDir, 'rss.xml'), rssContent, 'utf8');
        }

        // 4. index.html 템플릿 처리 (경로를 절대경로로 수정)
        console.log('HTML 템플릿 처리 중...');
        const templatePath = path.join(__dirname, 'index.html');
        let templateHtml = fs.readFileSync(templatePath, 'utf8');
        
        // 경로 치환
        templateHtml = templateHtml
            .replace(/href="main\.css"/g, 'href="/main.css"')
            .replace(/src="router\.js"/g, 'src="/router.js"')
            .replace(/src="images\//g, 'src="/images/')
            .replace(/url\('images\//g, "url('/images/")
            .replace(/url\("images\//g, 'url("/images/');

        // 5. 9,377개 페이지 개별 생성
        console.log('개별 HTML 페이지 생성 시작 (약 9,300개)...');
        let count = 0;
        for (const item of jsonData) {
            const linkKey = item["링크"];
            if (!linkKey) continue;

            const region = item["지역(한글)"] || '';
            const subject = item["과목"] || '';
            const keyword = (region + ' ' + subject).trim() || '전문';

            const title = `${keyword} 전문 강사진 | 1:1 맞춤 수업`;
            const description = `검증되지 않은 대학생 과외에 지치셨나요? 초등 흥미유발부터 중고등 내신 역전, 완벽 수능 대비까지 전문 ${keyword} 선생님이 책임집니다. 지금 무료 모의수업을 신청하세요.`;
            const resultHtml = item["결과"] || '';

            // 템플릿 채우기 (특수 문자 $ 오동작 방지를 위해 함수 형태 활용)
            let pageHtml = templateHtml
                .replace(/<title>.*?<\/title>/g, () => `<title>${title}</title>`)
                .replace(/<meta name="description" content=".*?"/g, () => `<meta name="description" content="${description}"`)
                .replace(/<div id="philosophy-section-placeholder"><\/div>/g, () => `<div id="philosophy-section-placeholder">${resultHtml}</div>`);

            const pageDir = path.join(publicDir, linkKey);
            fs.mkdirSync(pageDir, { recursive: true });
            fs.writeFileSync(path.join(pageDir, 'index.html'), pageHtml, 'utf8');

            count++;
            if (count % 1000 === 0) {
                console.log(`.. ${count}개 생성 완료`);
            }
        }
        console.log(`총 ${count}개의 개별 페이지 생성 완료!`);

        // 6. 메인 홈 index.html 생성 (첫 번째 행 데이터로 pre-render)
        console.log('메인 홈 index.html 생성 중...');
        const firstItem = jsonData[0] || {};
        const region = firstItem["지역(한글)"] || '';
        const subject = firstItem["과목"] || '';
        const keyword = (region + ' ' + subject).trim() || '전문';

        const title = `${keyword} 전문 강사진 | 1:1 맞춤 수업`;
        const description = `검증되지 않은 대학생 과외에 지치셨나요? 초등 흥미유발부터 중고등 내신 역전, 완벽 수능 대비까지 전문 ${keyword} 선생님이 책임집니다. 지금 무료 모의수업을 신청하세요.`;
        const resultHtml = firstItem["결과"] || '';

        let homeHtml = templateHtml
            .replace(/<title>.*?<\/title>/g, () => `<title>${title}</title>`)
            .replace(/<meta name="description" content=".*?"/g, () => `<meta name="description" content="${description}"`)
            .replace(/<div id="philosophy-section-placeholder"><\/div>/g, () => `<div id="philosophy-section-placeholder">${resultHtml}</div>`);

        fs.writeFileSync(path.join(publicDir, 'index.html'), homeHtml, 'utf8');

        // 7. sitemap.xml 동적 생성
        console.log('sitemap.xml 생성 중...');
        const today = new Date().toISOString().split('T')[0];
        let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        sitemapContent += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        sitemapContent += `  <url>\n`;
        sitemapContent += `    <loc>https://professional-tutoring.vercel.app/</loc>\n`;
        sitemapContent += `    <lastmod>${today}</lastmod>\n`;
        sitemapContent += `    <changefreq>daily</changefreq>\n`;
        sitemapContent += `    <priority>1.0</priority>\n`;
        sitemapContent += `  </url>\n`;

        for (const item of jsonData) {
            const linkKey = item["링크"];
            if (!linkKey) continue;
            sitemapContent += `  <url>\n`;
            sitemapContent += `    <loc>https://professional-tutoring.vercel.app/${linkKey}</loc>\n`;
            sitemapContent += `    <lastmod>${today}</lastmod>\n`;
            sitemapContent += `    <changefreq>weekly</changefreq>\n`;
            sitemapContent += `    <priority>0.8</priority>\n`;
            sitemapContent += `  </url>\n`;
        }
        sitemapContent += `</urlset>\n`;
        fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapContent, 'utf8');
        console.log('sitemap.xml 생성 및 저장 성공!');

    } catch (error) {
        console.error('변환 중 에러 발생:', error);
        process.exit(1);
    }
}

convertCSVToJson();