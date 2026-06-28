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

        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
        console.log('JSON 변환 및 파일 저장 성공!');
    } catch (error) {
        console.error('변환 중 에러 발생:', error);
    }
}
convertCSVToJson();