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
            const btn = document.getElementById('submitBtn');
            const url = "https://script.google.com/macros/s/AKfycbyOqAm7KIOMEu4oBTSVzjBhHgKyE4-9WHjb6coU_swSSFUlAz9L4YDsw5mWTUxcmLog/exec";
            const formData = new FormData(form);
            const params = new URLSearchParams(formData).toString();
            alert('상담 신청이 완료되었습니다! 확인 후 즉시 연락드릴게요.');
            if(btn) { btn.innerText = "전송 완료!"; btn.disabled = true; }
            form.reset();
            fetch(url + "?" + params, { method: 'GET', mode: 'no-cors' });
            setTimeout(function(){
                if(btn) { btn.innerText = "무료 상담 및 모의수업 신청하기"; btn.disabled = false; }
            }, 3000);
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initInquiryForm);
    else initInquiryForm();
})();

// ==========================================
// Section 11: 단일 쿼리 파라미터(?k=조합키) 라우팅 (★수정됨)
// ==========================================
(function() {
    let englishData = [];

    async function loadData() {
        try {
            // 캐시를 무시하고 최신 JSON 파일을 강제로 가져옵니다.
            const response = await fetch('high-english.json?t=' + new Date().getTime());
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            englishData = await response.json();
            handleRouting();
        } catch (error) {
            console.error("데이터 로드 실패:", error);
            showFallback();
        }
    }

    function showFallback() {
        const placeholder = document.getElementById('philosophy-section-placeholder');
        if (placeholder) {
            if (englishData && englishData.length > 0 && englishData[0]["결과"]) {
                placeholder.innerHTML = englishData[0]["결과"];
            } else {
                placeholder.innerHTML = `<div style="text-align:center; padding: 40px; color: #ff7675;">데이터를 불러오는 데 실패했습니다. 관리자에게 문의해 주세요.</div>`;
            }
        }
    }

    function handleRouting() {
        if (!englishData || englishData.length === 0) {
            showFallback();
            return;
        }

        try {
            const urlParams = new URLSearchParams(window.location.search);
            const k = urlParams.get('k');

            if (!k) {
                showFallback();
                return;
            }

            const cleanK = decodeURIComponent(k).replace(/\s+/g, '').toLowerCase();
            let matched = englishData.find(item => {
                const linkVal = item["링크"];
                if (linkVal === undefined || linkVal === null) return false;
                const cleanLink = String(linkVal).replace(/\s+/g, '').toLowerCase();
                return cleanLink === cleanK;
            });

            const placeholder = document.getElementById('philosophy-section-placeholder');
            if (placeholder) {
                if (matched && matched["결과"]) {
                    placeholder.innerHTML = matched["결과"];
                } else {
                    showFallback();
                }
            }
        } catch (error) {
            console.error("라우팅 에러:", error);
            showFallback();
        }
    }

    function initRouter() {
        loadData();
        window.addEventListener('popstate', handleRouting);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initRouter);
    else initRouter();
})();