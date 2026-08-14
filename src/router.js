// ==========================================
// Section 1~10 유지
// ==========================================
(function() {
    function initScrollBtn() {
        var scrollBtn = document.getElementById('hero-scroll-btn');
        if (scrollBtn) {
            scrollBtn.addEventListener('click', function(e) {
                e.preventDefault(); 
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            });
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initScrollBtn);
    else initScrollBtn();
})();

(function() {
    function initDiagRolling() {
        const fItems = document.querySelectorAll('#diag-final-force-v4 .diag-item-f');
        const fPanes = document.querySelectorAll('#diag-final-force-v4 .diag-pane-f');
        if (fItems.length === 0) return;
        let fIdx = 0; let rolling;

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
                    if(fPanes[i]) { fPanes[i].style.display = 'block'; setTimeout(() => { fPanes[i].classList.add('active'); }, 10); }
                } else {
                    item.style.backgroundColor = 'transparent';
                    item.style.transform = 'translateX(0)';
                    if(num) { num.style.color = '#ffffff'; num.style.opacity = '0.3'; }
                    if(h3) { h3.style.color = '#ffffff'; h3.style.opacity = '0.5'; }
                    if(p) { p.style.color = '#cbd5e1'; p.style.opacity = '0.3'; }
                    if(fPanes[i]) { fPanes[i].classList.remove('active'); fPanes[i].style.display = 'none'; }
                }
            });
            fIdx = index;
        }

        fItems.forEach((item, i) => {
            item.addEventListener('click', () => {
                clearInterval(rolling); updateUI(i);
                if(window.innerWidth < 768) {
                    const contentSide = document.querySelector('#diag-final-force-v4 .diag-content-side');
                    if (contentSide) contentSide.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        });

        function start() { clearInterval(rolling); rolling = setInterval(() => { updateUI((fIdx + 1) % fItems.length); }, 3000); }
        updateUI(0); start();
        window.addEventListener('resize', () => { updateUI(fIdx); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDiagRolling);
    else initDiagRolling();
})();

(function() {
    function initReviewTracker() {
        const track = document.getElementById('text-track-force-9');
        const container = document.getElementById('infinite-text-container-9');
        if (!track || !container) return;
        const clone = track.innerHTML;
        track.innerHTML = clone + clone + clone;
        let speed = window.innerWidth < 1024 ? 0.7 : 1.0; 
        let currentPos = 0; let isPaused = false;
        function animate() {
            if (!isPaused) {
                currentPos -= speed;
                if (Math.abs(currentPos) >= track.scrollWidth / 3) currentPos = 0;
                track.style.transform = `translateX(${currentPos}px)`;
            }
            requestAnimationFrame(animate);
        }
        container.addEventListener('mouseenter', () => isPaused = true);
        container.addEventListener('mouseleave', () => isPaused = false);
        container.addEventListener('touchstart', () => isPaused = true, {passive: true});
        container.addEventListener('touchend', () => { setTimeout(() => { isPaused = false; }, 500); });
        window.addEventListener('resize', () => { speed = window.innerWidth < 1024 ? 0.7 : 1.0; });
        animate();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initReviewTracker);
    else initReviewTracker();
})();

(function() {
    function initInquiryForm() {
        const form = document.getElementById('myGSSForm');
        if (!form) return;
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            // 입력된 이름(name)과 연락처(tel) 값 검증 (trim 기준)
            const nameEl = form.querySelector('[name="name"]');
            const telEl = form.querySelector('[name="tel"]');
            const nameVal = nameEl ? nameEl.value.trim() : '';
            const telVal = telEl ? telEl.value.trim() : '';

            if (!nameVal || !telVal) {
                alert("이름과 연락처를 입력해 주세요.");
                return;
            }

            const btn = document.getElementById('submitBtn');

            // ★ form.reset() 전에 모든 입력값 1:1 명시 캡처
            const gradeVal = (form.querySelector('[name="grade"]') || {}).value || '';
            const subjectVal = (form.querySelector('[name="subject"]') || {}).value || '';
            const rawLocationVal = (form.querySelector('[name="location"]') || {}).value || '';
            const sourceEl = document.getElementById('source-input');
            const sourceInputVal = (sourceEl && sourceEl.value) ? sourceEl.value.trim() : '';

            // URL 쿼리 파라미터 (?source= 또는 ?utm_source=)
            const urlParams = new URLSearchParams(window.location.search);
            const querySource = urlParams.get('source') || urlParams.get('utm_source');

            // 메인 / 유료마케팅(CPC) 페이지 여부 판단
            const pathname = window.location.pathname.replace(/\/$/, '');
            const isMainOrCPC = (sourceInputVal === '파워링크') || 
                                (pathname === '' || pathname === '/index.html') || 
                                !!querySource;

            let targetUrl = "";
            let finalLocation = rawLocationVal;
            let finalSource = sourceInputVal;

            if (isMainOrCPC) {
                // 메인 / 유료마케팅 전용 CPC 앱스 스크립트 URL
                targetUrl = "https://script.google.com/macros/s/AKfycbxiR--kQnni3jjXWrDmdNeFkQ0d7M78_xuQKCHXSs5lNO3Y0yKdm_OdMEp4jj4AvjYT/exec";
                
                // 쿼리 파라미터가 있으면 해당 값 사용, 없으면 기본값 '파워링크'
                const cpcSource = querySource ? querySource.trim() : '파워링크';
                finalSource = cpcSource;

                // location 전송 시 '입력받은지역 (유입경로)' 형태로 결합
                finalLocation = rawLocationVal ? `${rawLocationVal} (${cpcSource})` : `(${cpcSource})`;
            } else {
                // 9,000개 하위 페이지 전용 기존 앱스 스크립트 URL 및 로직 100% 보존
                targetUrl = "https://script.google.com/macros/s/AKfycbyOqAm7KIOMEu4oBTSVzjBhHgKyE4-9WHjb6coU_swSSFUlAz9L4YDsw5mWTUxcmLog/exec";
                finalSource = sourceInputVal || '오가닉';
                finalLocation = rawLocationVal;
            }

            // 1:1 파라미터 규격 생성 (100% 완료)
            const params = new URLSearchParams({
                name: nameVal,
                tel: telVal,
                grade: gradeVal,
                subject: subjectVal,
                location: finalLocation,
                source: finalSource
            }).toString();

            alert('상담 신청이 완료되었습니다! 확인 후 즉시 연락드릴게요.');
            if (btn) { btn.innerText = "전송 완료!"; btn.disabled = true; }
            form.reset();

            fetch(targetUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            });

            setTimeout(function() {
                if (btn) { btn.innerText = "무료 상담 및 모의수업 신청하기"; btn.disabled = false; }
            }, 3000);
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initInquiryForm);
    else initInquiryForm();
})();

// ==========================================
// Section 11: 구형 쿼리 파라미터(?k=키워드) 대응 리다이렉트 (★수정됨)
// ==========================================
(function() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const k = urlParams.get('k');
        if (k) {
            const cleanK = decodeURIComponent(k).trim();
            if (cleanK) {
                window.location.replace('/' + cleanK);
            }
        }
    } catch (e) {
        console.error("리다이렉트 처리 중 에러:", e);
    }
})();