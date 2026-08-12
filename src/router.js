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

            // ★ form.reset() 전에 모든 값을 먼저 캡처 (source 누락 방지)
            const formData = new FormData(form);

            // ★ source 값이 빈 경우 폴백 처리: 페이지 hidden input 직접 조회
            const sourceEl = document.getElementById('source-input');
            const sourceVal = (sourceEl && sourceEl.value) ? sourceEl.value : '오가닉';
            formData.set('source', sourceVal);

            const params = new URLSearchParams(formData).toString();

            alert('상담 신청이 완료되었습니다! 확인 후 즉시 연락드릴게요.');
            if (btn) { btn.innerText = "전송 완료!"; btn.disabled = true; }
            form.reset(); // reset은 fetch 전송 후에도 params에 영향 없음

            // ★ POST 방식으로 전환 (Apps Script doPost 와 호환)
            fetch(url, {
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