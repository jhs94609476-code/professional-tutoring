// ==========================================
// Section 1: 무료 모의수업 신청하기 스크롤 기능
// ==========================================
(function() {
    // 혹시 DOM이 아직 로드되지 않은 상태를 대비해 안전장치 가동
    function initScrollBtn() {
        var scrollBtn = document.getElementById('hero-scroll-btn');
        
        if (scrollBtn) {
            scrollBtn.addEventListener('click', function(e) {
                e.preventDefault(); 
                
                // 페이지의 가장 최하단(바닥) 문의하기 구역으로 부드럽게 스크롤 이동
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                });
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollBtn);
    } else {
        initScrollBtn();
    }
})();



// ==========================================
// Section 5: 과학적 정밀 진단 롤링 탭 기능
// ==========================================
(function() {
    function initDiagRolling() {
        const fItems = document.querySelectorAll('#diag-final-force-v4 .diag-item-f');
        const fPanes = document.querySelectorAll('#diag-final-force-v4 .diag-pane-f');
        if (fItems.length === 0) return;

        let fIdx = 0;
        let rolling;

        function updateUI(index) {
            const isMobile = window.innerWidth < 768;
            
            fItems.forEach((item, i) => {
                const num = item.querySelector('.num-f');
                const h3 = item.querySelector('.h3-f');
                const p = item.querySelector('.p-f');
                
                if(i === index) {
                    item.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                    item.style.transform = isMobile ? 'translateX(0)' : 'translateX(15px)';
                    if(num) { num.style.color = '#ffcc00'; num.style.opacity = '1'; }
                    if(h3) { h3.style.color = '#ffcc00'; h3.style.opacity = '1'; }
                    if(p) { p.style.color = '#ffffff'; p.style.opacity = '1'; }
                    
                    if(fPanes[i]) {
                        fPanes[i].style.display = 'block';
                        setTimeout(() => {
                            fPanes[i].classList.add('active');
                        }, 10);
                    }
                } else {
                    item.style.backgroundColor = 'transparent';
                    item.style.transform = 'translateX(0)';
                    if(num) { num.style.color = '#ffffff'; num.style.opacity = '0.3'; }
                    if(h3) { h3.style.color = '#ffffff'; h3.style.opacity = '0.5'; }
                    if(p) { p.style.color = '#cbd5e1'; p.style.opacity = '0.3'; }
                    
                    if(fPanes[i]) {
                        fPanes[i].classList.remove('active');
                        fPanes[i].style.display = 'none';
                    }
                }
            });
            fIdx = index;
        }

        fItems.forEach((item, i) => {
            item.addEventListener('click', () => {
                clearInterval(rolling);
                updateUI(i);
                if(window.innerWidth < 768) {
                    const contentSide = document.querySelector('#diag-final-force-v4 .diag-content-side');
                    if (contentSide) {
                        contentSide.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
            });
        });

        function start() { 
            clearInterval(rolling); 
            rolling = setInterval(() => { 
                updateUI((fIdx + 1) % fItems.length); 
            }, 3000); 
        }

        updateUI(0); 
        start();
        
        window.addEventListener('resize', () => { 
            updateUI(fIdx); 
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDiagRolling);
    } else {
        initDiagRolling();
    }
})();


// ==========================================
// Section 7: 수강후기 무한 가로 롤러 기능
// ==========================================
(function() {
    function initReviewTracker() {
        const track = document.getElementById('text-track-force-9');
        const container = document.getElementById('infinite-text-container-9');
        if (!track || !container) return;
        
        const clone = track.innerHTML;
        track.innerHTML = clone + clone + clone;

        let speed = window.innerWidth < 1024 ? 0.7 : 1.0; 
        let currentPos = 0;
        let isPaused = false;

        function animate() {
            if (!isPaused) {
                currentPos -= speed;
                if (Math.abs(currentPos) >= track.scrollWidth / 3) {
                    currentPos = 0;
                }
                track.style.transform = `translateX(${currentPos}px)`;
            }
            requestAnimationFrame(animate);
        }

        container.addEventListener('mouseenter', () => isPaused = true);
        container.addEventListener('mouseleave', () => isPaused = false);
        container.addEventListener('touchstart', () => isPaused = true, {passive: true});
        container.addEventListener('touchend', () => {
            setTimeout(() => { isPaused = false; }, 500);
        });

        window.addEventListener('resize', () => {
            speed = window.innerWidth < 1024 ? 0.7 : 1.0;
        });

        animate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initReviewTracker);
    } else {
        initReviewTracker();
    }
})();



// ==========================================
// Section 10: 구글 스프레드시트 연동 상담 신청 전송 기능
// ==========================================
(function() {
    function initInquiryForm() {
        const form = document.getElementById('myGSSForm');
        if (!form) return;

        form.addEventListener('submit', function(e) {
            e.preventDefault(); 

            const btn = document.getElementById('submitBtn');
            // 사용자가 기존에 성공하셨던 배포 URL 주소를 그대로 정밀 매핑해 두었습니다.
            const url = "https://script.google.com/macros/s/AKfycbyOqAm7KIOMEu4oBTSVzjBhHgKyE4-9WHjb6coU_swSSFUlAz9L4YDsw5mWTUxcmLog/exec";

            const formData = new FormData(form);
            const params = new URLSearchParams(formData).toString();

            alert('상담 신청이 완료되었습니다! 확인 후 즉시 연락드릴게요.');
            
            if(btn) {
                btn.innerText = "전송 완료!";
                btn.disabled = true;
            }
            
            form.reset();

            // 백엔드로 실시간 비동기 데이터 서브밋 실행
            fetch(url + "?" + params, {
                method: 'GET',
                mode: 'no-cors'
            });

            setTimeout(function(){
                if(btn) {
                    btn.innerText = "무료 상담 및 모의수업 신청하기";
                    btn.disabled = false;
                }
            }, 3000);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initInquiryForm);
    } else {
        initInquiryForm();
    }
})();



// ==========================================
// Section 11: 단일 쿼리 파라미터(?k=조합키) 기반 라우팅 및 데이터 매칭
// ==========================================
(function() {
    let englishData = [];

    // 데이터를 가져오는 함수 (하이브리드 방식: 로컬 JS 변수 또는 Fetch API)
    async function loadData() {
        // 1. 이미 index.html에서 high-english-data.js가 로드되어 전역 변수가 존재하는 경우
        if (window.highEnglishData && window.highEnglishData.length > 0) {
            englishData = window.highEnglishData;
            handleRouting();
            return;
        }

        // 2. 전역 변수가 없을 경우 (웹 서버 환경) fetch를 사용하여 로드 시도
        try {
            const response = await fetch('./high-english.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            englishData = await response.json();
            handleRouting();
        } catch (error) {
            console.error("데이터 로드 실패:", error);
            const placeholder = document.getElementById('philosophy-section-placeholder');
            if (placeholder) {
                placeholder.innerHTML = `<div style="text-align:center; padding: 40px; color: #ff7675;">데이터를 불러오는 데 실패했습니다. 관리자에게 문의해 주세요.</div>`;
            }
        }
    }

    // URL 쿼리 파라미터 k에서 조합키를 읽어 매칭하는 함수
    function handleRouting() {
        if (!englishData || englishData.length === 0) return;

        // 1. URL 쿼리 파라미터에서 'k' 검색
        const urlParams = new URLSearchParams(window.location.search);
        let k = urlParams.get('k');

        // 2. k 값이 없으면 기본값은 'high-english-seoul'
        if (!k) {
            k = 'high-english-seoul';
        }

        k = decodeURIComponent(k).trim();

        let matched = null;

        // 3. 조합키 접두사에 따른 매칭 처리 (현재는 high-english- 접두사 대응)
        if (k.startsWith('high-english-')) {
            const region = k.substring('high-english-'.length).trim();

            // 데이터 내에서 매칭 수행
            matched = englishData.find(item => {
                const engMatch = item["지역(영문)"] && item["지역(영문)"].toLowerCase() === region.toLowerCase();
                const korMatch = item["지역(한글)"] && item["지역(한글)"].trim() === region;
                return engMatch || korMatch;
            });
        }

        const placeholder = document.getElementById('philosophy-section-placeholder');
        if (placeholder) {
            if (matched && matched["결과"]) {
                placeholder.innerHTML = matched["결과"];
            } else {
                console.warn(`매칭되는 조합키 데이터를 찾을 수 없습니다: ${k}`);
                // 기본값 high-english-seoul 데이터로 폴백 시도
                const fallback = englishData.find(item => item["지역(영문)"].toLowerCase() === 'seoul');
                if (fallback && fallback["결과"]) {
                    placeholder.innerHTML = fallback["결과"];
                } else {
                    placeholder.innerHTML = `<div style="text-align:center; padding: 40px; color: #64748b;">해당 데이터를 찾을 수 없습니다.</div>`;
                }
            }
        }
    }

    // 초기화 및 이벤트 리스너 등록
    function initRouter() {
        loadData();

        // popstate 감지 (주소창 변경 및 뒤로가기/앞으로가기 대응)
        window.addEventListener('popstate', handleRouting);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRouter);
    } else {
        initRouter();
    }
})();