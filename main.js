document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startOverlay = document.getElementById('start-overlay');
    const startBtn = document.getElementById('start-btn');
    const retryBtn = document.getElementById('retry-btn');
    const gameScene = document.getElementById('game-scene');
    const timerDisplay = document.getElementById('game-timer');
    const winnerTicker = document.getElementById('winner-ticker');

    // Modals
    const registerModal = document.getElementById('register-modal');
    const retryModal = document.getElementById('retry-modal');
    const closeModals = document.querySelectorAll('.close-modal');

    // HUD Target Slots
    const targetSlots = [
        document.getElementById('target-1'),
        document.getElementById('target-2'),
        document.getElementById('target-3')
    ];

    // Game State
    let score = 0;
    let timer = 10;
    let timerInterval;
    let isPlaying = false;
    let currentTargets = [];

    // Expanded Item Pool (25 Total)
    const allItems = [
        { id: 'laptop', char: '💻' },
        { id: 'coffee', char: '☕' },
        { id: 'plant', char: '🪴' },
        { id: 'phone', char: '📱' },
        { id: 'book', char: '📘' },
        { id: 'clip', char: '📎' },
        { id: 'pen', char: '🖊️' },
        { id: 'glasses', char: '🕶️' },
        { id: 'cam', char: '📷' },
        { id: 'lunch', char: '🥪' },
        { id: 'trash', char: '🗑️' },
        { id: 'mouse', char: '🖱️' },
        { id: 'cal', char: '📅' },
        { id: 'bulb', char: '💡' },
        { id: 'key', char: '🔑' },
        // 10 New Items
        { id: 'stapler', char: '🧷' }, // safety pin as stapler proxy
        { id: 'ruler', char: '📏' },
        { id: 'calc', char: '🧮' },
        { id: 'scissors', char: '✂️' },
        { id: 'tape', char: '📼' },
        { id: 'folder', char: '📁' },
        { id: 'envelope', char: '✉️' },
        { id: 'clock', char: '🕰️' },
        { id: 'badge', char: '📛' },
        { id: 'usb', char: '💾' },
    ];

    // Confetti
    function fireConfetti() {
        const colors = ['#fce18a', '#ff726d', '#b48def', '#f4306d'];
        const container = document.querySelector('.bg-confetti');
        container.innerHTML = '';

        for (let i = 0; i < 50; i++) {
            const confetto = document.createElement('div');
            confetto.style.width = '10px';
            confetto.style.height = '10px';
            confetto.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetto.style.position = 'absolute';
            confetto.style.left = Math.random() * 100 + '%';
            confetto.style.top = '-10px';
            confetto.style.transition = `top ${Math.random() * 2 + 1}s linear, transform ${Math.random() * 2 + 1}s linear`;
            confetto.style.transform = `rotate(${Math.random() * 360}deg)`;
            container.appendChild(confetto);

            setTimeout(() => {
                confetto.style.top = '110%';
                confetto.style.transform = `rotate(${Math.random() * 360 + 360}deg) translateX(${Math.random() * 40 - 20}px)`;
            }, 50);
        }
    }

    // Initialize Game
    function initGame() {
        score = 0;
        timer = 10;
        isPlaying = true;
        timerDisplay.textContent = "00:10";
        timerDisplay.classList.remove('urgent');

        // Clean up
        document.querySelectorAll('.scene-item').forEach(el => el.remove());
        targetSlots.forEach(slot => {
            slot.classList.remove('found');
            slot.textContent = '❓';
        });
        startOverlay.classList.add('hidden');
        registerModal.classList.add('hidden');
        retryModal.classList.add('hidden');

        // Pick 3 Random Targets
        const shuffled = [...allItems].sort(() => 0.5 - Math.random());
        currentTargets = shuffled.slice(0, 3);
        // Use ALL remaining items as distractors to fill screen
        const distractors = shuffled.slice(3, 25);

        // Update HUD
        currentTargets.forEach((item, index) => {
            targetSlots[index].textContent = item.char;
            targetSlots[index].dataset.id = item.id;
        });

        // Spawn All Items
        const itemsToSpawn = [...currentTargets, ...distractors];
        itemsToSpawn.sort(() => 0.5 - Math.random()); // Shuffle spawn order

        itemsToSpawn.forEach(item => {
            createItem(item);
        });

        // Start Timer
        clearInterval(timerInterval);
        timerInterval = setInterval(gameLoop, 1000);
    }

    function createItem(item) {
        const el = document.createElement('div');
        el.textContent = item.char;
        el.classList.add('scene-item');
        el.dataset.id = item.id;

        // Random Position
        // Using 5%-85% range to keep them reasonably valid
        el.style.left = (Math.random() * 85 + 2) + '%';
        el.style.top = (Math.random() * 85 + 2) + '%';

        const rot = Math.random() * 60 - 30;
        const scale = 0.8 + Math.random() * 0.4;
        el.style.transform = `rotate(${rot}deg) scale(${scale})`;

        // Interactions
        enableDrag(el);
        el.addEventListener('click', (e) => handleItemClick(e, item));
        el.addEventListener('touchstart', (e) => {
            // Prevent click if dragging, handled in drag logic but
            // we allow tap if no movement.
        });

        gameScene.appendChild(el);
    }

    // Drag Logic
    function enableDrag(el) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        const startDrag = (e) => {
            if (!isPlaying) return;
            isDragging = false; // Assume click first
            const evt = e.touches ? e.touches[0] : e;
            startX = evt.clientX;
            startY = evt.clientY;
            initialLeft = el.offsetLeft;
            initialTop = el.offsetTop;

            el.style.transition = 'none'; // distinct drag feel
            el.classList.add('dragging');

            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchmove', onDrag, { passive: false });
            document.addEventListener('touchend', endDrag);
        };

        const onDrag = (e) => {
            if (!isPlaying) return;
            const evt = e.touches ? e.touches[0] : e;
            const dx = evt.clientX - startX;
            const dy = evt.clientY - startY;

            // Threshold to consider it a drag
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                isDragging = true;
                e.preventDefault && e.preventDefault(); // Stop scroll on mobile
            }

            if (isDragging) {
                el.style.left = (initialLeft + dx) + 'px';
                el.style.top = (initialTop + dy) + 'px';
            }
        };

        const endDrag = () => {
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchmove', onDrag);
            document.removeEventListener('touchend', endDrag);

            el.classList.remove('dragging');
            el.style.transition = 'transform 0.1s'; // restore anim
        };

        el.addEventListener('mousedown', startDrag);
        el.addEventListener('touchstart', startDrag, { passive: false });

        // Attach "isDragging" state to element to check in click handler
        el.checkDragging = () => isDragging;
    }

    function handleItemClick(e, item) {
        if (!isPlaying) return;

        // Prevent ghost clicks / bubbling
        e.stopPropagation();
        e.preventDefault();

        // If we just finished a drag, don't count as click
        if (e.target.checkDragging && e.target.checkDragging()) return;

        const isTarget = currentTargets.find(t => t.id === item.id);

        if (isTarget) {
            // Check if already found
            if (e.target.classList.contains('found-anim')) return;

            e.target.classList.add('found-anim');
            score++;

            // Update HUD
            const slot = targetSlots.find(s => s.dataset.id === item.id);
            if (slot) {
                slot.classList.add('found');
                // slot.textContent = '✅'; // Optional: clear checkmark
            }

            if (score >= 3) gameWin();
        } else {
            // Shake
            const originalTransform = e.target.style.transform;
            e.target.style.transform += ' translate(5px, 0)';
            setTimeout(() => {
                e.target.style.transform = originalTransform;
            }, 100);
        }
    }

    // ... (Game Loop, Win, Lose, Ticker remain same) ...

    function gameLoop() {
        timer--;
        timerDisplay.textContent = `00:${timer.toString().padStart(2, '0')}`;

        if (timer <= 3) {
            timerDisplay.classList.add('urgent');
        }

        if (timer <= 0) {
            gameLose();
        }
    }

    function gameWin() {
        clearInterval(timerInterval);
        isPlaying = false;
        fireConfetti();
        setTimeout(() => {
            if (registerModal) registerModal.classList.remove('hidden');
        }, 500);
    }

    function gameLose() {
        clearInterval(timerInterval);
        isPlaying = false;
        retryModal.classList.remove('hidden');
    }

    // Ticker Logic
    const names = ['Aiman', 'Aisyah', 'Farah', 'Amir', 'Siti'];
    setInterval(() => {
        const name = names[Math.floor(Math.random() * names.length)];
        const time = Math.floor(Math.random() * 5) + 3;
        winnerTicker.textContent = `🏆 ${name} menang dalam ${time} saat!`;
    }, 3000);

    // Event Listeners
    startBtn.addEventListener('click', initGame);
    retryBtn.addEventListener('click', initGame);

    closeModals.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.add('hidden');
        });
    });

    // -------------------------------------------------------------------------
    // ROBUST FORM SUBMISSION (Hidden Iframe Method)
    // -------------------------------------------------------------------------

    // URL updated from your screenshot (Version 1)
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxXKY1pALFEjw267MVglrc4yrt9hoNgDEb8rSERErr78gYASmoUvuJEh7NbQDKRATCOqA/exec';

    const form = document.getElementById('campaign-form');

    // Configure Form to POST to Hidden Iframe
    form.action = GOOGLE_SCRIPT_URL;
    form.method = 'POST';
    form.target = 'hidden_iframe'; // Matches existing <iframe name="hidden_iframe">

    form.addEventListener('submit', (e) => {
        // DO NOT preventDefault(). Let the browser submit to the iframe.

        const submitBtn = form.querySelector('button');
        submitBtn.textContent = 'Menghantar...';
        submitBtn.disabled = true;

        // Since we can't read the response from Google (CORS/Iframe),
        // we assume success after a short delay if the form submitted.
        setTimeout(() => {
            alert('Tahniah! Maklumat anda telah dihantar.');
            form.reset();
            registerModal.classList.add('hidden');
            location.reload();
        }, 1500);
    });
});
});
