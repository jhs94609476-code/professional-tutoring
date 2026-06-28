const fs = require('fs');
const path = require('path');
const https = require('https');

// 파일 경로 설정 (최상위 루트 경로로 지정)
const jsonFilePath = path.join(__dirname, '../high-english.json');
const sheetCsvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vStAETGqwhy2ux_FQAzPeS_bPUu_pIk_F7n79vO7LKCgAZ1KYHnqJ37WX5c2Higqtzx8gG6HBq7zouS/pub?gid=806514591&single=true&output=csv';

/**
 * RFC 4180 규격을 준수하는 상태 머신 기반의 CSV 파서
 * @param {string} csvText - 전체 CSV 텍스트 데이터
 * @returns {string[][]} 파싱된 2차원 배열 데이터
 */
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
                    // 이스케이프된 큰따옴표 ""
                    currentField += '"';
                    i++; // 다음 큰따옴표 건너뜀
                } else {
                    // 따옴표 닫힘
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
                // 빈 줄이 아닐 경우만 행으로 인정하여 푸시
                if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
                    rows.push(currentRow);
                }
                currentRow = [];
                if (char === '\r' && nextChar === '\n') {
                    i++; // CRLF 라인 피드 처리
                }
            } else {
                currentField += char;
            }
        }
    }
    // 마지막 필드 및 행 마무리 처리
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }

    return rows;
}

/**
 * 리다이렉션을 추적하여 안전하게 CSV 데이터를 비동기 다운로드하는 헬퍼 함수
 */
function fetchCSV(url) {
    return new Promise((resolve, reject) => {
        const get = (targetUrl) => {
            https.get(targetUrl, (res) => {
                const { statusCode } = res;
                
                // Redirect 처리
                if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
                    return get(res.headers.location);
                }
                
                if (statusCode !== 200) {
                    reject(new Error(`CSV 다운로드 실패. 상태 코드: ${statusCode}`));
                    return;
                }
                
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    resolve(data);
                });
            }).on('error', (err) => {
                reject(err);
            });
        };
        get(url);
    });
}

async function convertCSVToJson() {
    try {
        console.log(`구글 스프레드시트 CSV 데이터를 가져오는 중... URL: ${sheetCsvUrl}`);
        const csvText = await fetchCSV(sheetCsvUrl);

        console.log('정석적인 CSV 파싱 시작...');
        const rows = parseCSV(csvText);

        if (rows.length === 0) {
            console.error('에러: CSV 데이터가 비어있습니다.');
            return;
        }

        // 첫 번째 행은 헤더
        const rawHeaders = rows[0];
        // 헤더명 정제: 가장 왼쪽 컬럼(A열)은 "링크"로 지정하고, 공백 트림 및 괄호 깨짐(예: "지역(한글") 보정
        const headers = rawHeaders.map((header, index) => {
            if (index === 0) {
                return '링크';
            }
            let h = header.trim();
            if (h === '지역(한글') {
                h = '지역(한글)';
            }
            return h;
        });

        console.log(`감지된 헤더 컬럼: ${headers.join(', ')}`);

        const jsonData = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const obj = {};
            
            headers.forEach((header, index) => {
                // 필드 값이 정의되지 않았을 경우 빈 문자열 할당
                obj[header] = row[index] !== undefined ? row[index] : '';
            });
            
            jsonData.push(obj);
        }

        console.log(`변환 완료: 총 ${jsonData.length} 개의 데이터 행`);

        console.log(`JSON 파일 쓰기 중: ${jsonFilePath}`);
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
        console.log('JSON 변환 및 파일 저장 성공!');
    } catch (error) {
        console.error('변환 중 에러 발생:', error);
    }
}

// 변환 작업 실행
convertCSVToJson();
