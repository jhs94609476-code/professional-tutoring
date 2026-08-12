const fs = require('fs');
const path = require('path');
const https = require('https');

// ★ 수정됨: 파일을 바깥이 아니라 현재 폴더(src)에 정확히 저장합니다.
const jsonFilePath = path.resolve(__dirname, 'high-english.json');
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

function extractH2Text(html, fallbackKeyword) {
    if (!html) return `${fallbackKeyword} 전문 강사진 | 1:1 맞춤 수업`;
    const match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (match && match[1]) {
        const cleanText = match[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        if (cleanText) return cleanText;
    }
    return `${fallbackKeyword} 전문 강사진 | 1:1 맞춤 수업`;
}

function extractDescription(html, fallbackKeyword) {
    if (!html) {
        return `검증되지 않은 대학생 과외에 지치셨나요? 초등 흥미유발부터 중고등 내신 역전, 완벽 수능 대비까지 전문 ${fallbackKeyword} 선생님이 책임집니다. 지금 무료 모의수업을 신청하세요.`;
    }
    let cleanText = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (cleanText.length > 130) {
        cleanText = cleanText.substring(0, 130) + '...';
    }
    return cleanText || `검증되지 않은 대학생 과외에 지치셨나요? 초등 흥미유발부터 중고등 내신 역전, 완벽 수능 대비까지 전문 ${fallbackKeyword} 선생님이 책임집니다. 지금 무료 모의수업을 신청하세요.`;
}

function injectMetaAndContent(templateHtml, title, description, resultHtml, sourceValue) {
    // 1. 기존 <title>, description, og:title, og:description 태그 제거
    let cleanHtml = templateHtml
        .replace(/<title>[\s\S]*?<\/title>/gi, '')
        .replace(/<meta\s+[^>]*?name=["']description["'][^>]*?>/gi, '')
        .replace(/<meta\s+[^>]*?content=["'][\s\S]*?["']\s+[^>]*?name=["']description["'][^>]*?>/gi, '')
        .replace(/<meta\s+[^>]*?property=["']og:title["'][^>]*?>/gi, '')
        .replace(/<meta\s+[^>]*?content=["'][\s\S]*?["']\s+[^>]*?property=["']og:title["'][^>]*?>/gi, '')
        .replace(/<meta\s+[^>]*?property=["']og:description["'][^>]*?>/gi, '')
        .replace(/<meta\s+[^>]*?content=["'][\s\S]*?["']\s+[^>]*?property=["']og:description["'][^>]*?>/gi, '');

    // 2. 새로운 태그 생성 및 주입
    const titleTag = `<title>${title}</title>`;
    const descTag = `<meta name="description" content="${description}">`;
    const ogTitleTag = `<meta property="og:title" content="${title}">`;
    const ogDescTag = `<meta property="og:description" content="${description}">`;
    const newTags = `\n    ${titleTag}\n    ${descTag}\n    ${ogTitleTag}\n    ${ogDescTag}`;

    let pageHtml;
    if (/<head[^>]*>/i.test(cleanHtml)) {
        pageHtml = cleanHtml.replace(/(<head[^>]*>)/i, `$1${newTags}`);
    } else {
        pageHtml = newTags + '\n' + cleanHtml;
    }

    // 3. 본문 결과 HTML 주입 (philosophy-section-placeholder 치환)
    pageHtml = pageHtml.replace(/<div id="philosophy-section-placeholder"><\/div>/g, () => `<div id="philosophy-section-placeholder">${resultHtml}</div>`);

    // 4. 유입경로(source) hidden input value 치환
    if (sourceValue) {
        pageHtml = pageHtml.replace(
            /(<input[^>]*?name=["']source["'][^>]*?value=["'])[^"']*(["'][^>]*>)/i,
            `$1${sourceValue}$2`
        );
    }

    return pageHtml;
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

        // 2. dist 폴더 비우고 생성 (Inode 유실 방지 로직 도입)
        console.log('dist 폴더 초기화 중...');
        const publicDir = path.resolve(__dirname, '../dist');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        } else {
            // Vercel 빌드 환경에서 dist 폴더 자체를 rmSync로 삭제하면 경로 추적(Inode) 유실이 발생할 수 있습니다.
            // 따라서 폴더 자체는 유지한 채, 내부의 파일과 폴더들만 깨끗이 비워줍니다.
            const files = fs.readdirSync(publicDir);
            for (const file of files) {
                const filePath = path.join(publicDir, file);
                try {
                    fs.rmSync(filePath, { recursive: true, force: true });
                } catch (e) {
                    // Windows 잠김 문제 시 무시하고 진행
                }
            }
        }

        // 3. static 자산 복사
        console.log('static 자산 복사 중...');
        fs.copyFileSync(path.resolve(__dirname, 'main.css'), path.resolve(publicDir, 'main.css'));
        fs.copyFileSync(path.resolve(__dirname, 'router.js'), path.resolve(publicDir, 'router.js'));
        
        // robots.txt 복사
        const robotsSrcPath = path.resolve(__dirname, 'robots.txt');
        if (fs.existsSync(robotsSrcPath)) {
            fs.copyFileSync(robotsSrcPath, path.resolve(publicDir, 'robots.txt'));
        }

        // favicon.png 복사
        const faviconSrcPath = path.resolve(__dirname, 'favicon.png');
        if (fs.existsSync(faviconSrcPath)) {
            fs.copyFileSync(faviconSrcPath, path.resolve(publicDir, 'favicon.png'));
        }

        // og-image.png 복사
        const ogImageSrcPath = path.resolve(__dirname, 'og-image.png');
        if (fs.existsSync(ogImageSrcPath)) {
            fs.copyFileSync(ogImageSrcPath, path.resolve(publicDir, 'og-image.png'));
        }
        
        const imagesSrc = path.resolve(__dirname, 'images');
        if (fs.existsSync(imagesSrc)) {
            copyDirSync(imagesSrc, path.resolve(publicDir, 'images'));
        }

        // rss.xml 복사 및 가공 (/?k= -> /)
        const rssSrcPath = path.resolve(__dirname, 'rss.xml');
        if (fs.existsSync(rssSrcPath)) {
            let rssContent = fs.readFileSync(rssSrcPath, 'utf8');
            rssContent = rssContent.replace(/\/\?k=/g, '/');
            fs.writeFileSync(path.resolve(publicDir, 'rss.xml'), rssContent, 'utf8');
        }

        // 4. index.html 템플릿 처리 (경로를 절대경로로 수정)
        console.log('HTML 템플릿 처리 중...');
        const templatePath = path.resolve(__dirname, 'index.html');
        let templateHtml = fs.readFileSync(templatePath, 'utf8');
        
        // 경로 치환
        templateHtml = templateHtml
            .replace(/href="main\.css"/g, 'href="/main.css"')
            .replace(/src="router\.js"/g, 'src="/router.js"')
            .replace(/href="favicon\.png"/g, 'href="/favicon.png"')
            .replace(/src="images\//g, 'src="/images/')
            .replace(/url\('images\//g, "url('/images/")
            .replace(/url\("images\//g, 'url("/images/');

        // 5. 개별 페이지 생성
        console.log('개별 HTML 페이지 생성 시작...');
        let count = 0;
        let hasMainRow = false; // A열=index 또는 B열=main인 행이 있는지 추적
        for (const item of jsonData) {
            const linkKey = (item["링크"] || '').trim();
            const regionEn = (item["지역 영문"] || item["지역영문"] || '').trim();
            if (!linkKey) continue;

            const region = item["지역(한글)"] || '';
            const subject = item["과목"] || '';
            const keyword = (region + ' ' + subject).trim() || '전문';

            const resultHtml = item["결과"] || '';

            // 본문 내용을 활용해 고유한 title과 description을 동적으로 추출
            const title = extractH2Text(resultHtml, keyword);
            const description = extractDescription(resultHtml, keyword);

            // ★ 메인 랜딩페이지 분기: A열=index 이거나 B열=main이면 dist/index.html로 직접 생성
            const isMainPage = (linkKey.toLowerCase() === 'index') || (regionEn.toLowerCase() === 'main');

            if (isMainPage) {
                hasMainRow = true;
                const pageHtml = injectMetaAndContent(templateHtml, title, description, resultHtml, '파워링크');
                fs.writeFileSync(path.resolve(publicDir, 'index.html'), pageHtml, 'utf8');
                console.log(`메인 랜딩페이지(dist/index.html) 생성 완료! (유입경로: 파워링크)`);
                count++;
                continue;
            }

            // ★ 일반 서브 페이지: 한글 지역명이 있으면 그 값, 없으면 '오가닉'
            const sourceValue = region.trim() || '오가닉';
            const pageHtml = injectMetaAndContent(templateHtml, title, description, resultHtml, sourceValue);

            const pageDir = path.resolve(publicDir, linkKey);
            fs.mkdirSync(pageDir, { recursive: true });
            fs.writeFileSync(path.resolve(pageDir, 'index.html'), pageHtml, 'utf8');

            count++;
            if (count % 1000 === 0) {
                console.log(`.. ${count}개 생성 완료`);
            }
        }
        console.log(`총 ${count}개의 개별 페이지 생성 완료! (메인 분기 포함)`);

        // 6. 메인 홈 index.html 생성 (시트에 index/main 행이 없을 때만 첫 번째 행으로 pre-render)
        if (!hasMainRow) {
            console.log('시트에 메인 행 없음 → 첫 번째 행 데이터로 dist/index.html 생성 중...');
            const firstItem = jsonData[0] || {};
            const region = firstItem["지역(한글)"] || '';
            const subject = firstItem["과목"] || '';
            const keyword = (region + ' ' + subject).trim() || '전문';

            const resultHtml = firstItem["결과"] || '';

            const title = extractH2Text(resultHtml, keyword);
            const description = extractDescription(resultHtml, keyword);

            const homeHtml = injectMetaAndContent(templateHtml, title, description, resultHtml, '오가닉');

            fs.writeFileSync(path.resolve(publicDir, 'index.html'), homeHtml, 'utf8');
        } else {
            console.log('메인 랜딩페이지는 시트 index/main 행에서 이미 생성됨 (스텝 6 건너뜀).');
        }

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
        fs.writeFileSync(path.resolve(publicDir, 'sitemap.xml'), sitemapContent, 'utf8');
        console.log('sitemap.xml 생성 및 저장 성공!');

    } catch (error) {
        console.error('변환 중 에러 발생:', error);
        process.exit(1);
    }
}

convertCSVToJson();