(function() {
    // --- GLOBAL STATE AND CONSTANTS ---
    const STORAGE_KEYS = {
        PHASE: 'loom_phase',
        FRAGMENTS: 'loom_fragments',
        THREADS: 'loom_threads',
        ELAS_SEQUENCE: ['E', 'L', 'A', 'S'] // Acrostic sequence for Orphaned Index
    };

    let loomState = {
        phase: 1,
        fragments: new Set(),
        threadsUnlocked: new Set()
    };

    // --- UTILITY FUNCTIONS (STATE MANAGEMENT & DOM HELPERS) ---

    /** Loads state from localStorage and updates the internal state object. */
    const loadLoomState = () => {
        try {
            const storedPhase = localStorage.getItem(STORAGE_KEYS.PHASE);
            if (storedPhase) {
                loomState.phase = parseInt(storedPhase, 10);
            } else {
                // Default phase is 1 if nothing is found
                localStorage.setItem(STORAGE_KEYS.PHASE, 1);
                loomState.phase = 1;
            }

            const storedFragments = localStorage.getItem(STORAGE_KEYS.FRAGMENTS);
            if (storedFragments) {
                JSON.parse(storedFragments).forEach(f => loomState.fragments.add(f));
            } else {
                 localStorage.setItem(STORAGE_KEYS.FRAGMENTS, JSON.stringify([]));
            }

            const storedThreads = localStorage.getItem(STORAGE_KEYS.THREADS);
            if (storedThreads) {
                JSON.parse(storedThreads).forEach(t => loomState.threadsUnlocked.add(t));
            } else {
                localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify([]));
            }

        } catch (e) {
            console.error("Error loading loom state:", e);
            // Fallback to default state if storage fails
        }
    };

    /** Saves current internal state to localStorage. */
    const saveLoomState = () => {
        localStorage.setItem(STORAGE_KEYS.PHASE, loomState.phase);

        // Save fragments array
        const fragmentArray = Array.from(loomState.fragments);
        localStorage.setItem(STORAGE_KEYS.FRAGMENTS, JSON.stringify(fragmentArray));

        // Save threads array
        const threadArray = Array.from(loomState.threadsUnlocked);
        localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(threadArray));
    };

    /** Updates the phase class on body and triggers related mechanics. */
    const setPhase = (newPhase) => {
        if (newPhase < 1 || newPhase > 5) return;
        
        console.log(`[Loom] Advancing to Phase ${newPhase}`);

        // 1. Update Body Class
        document.body.className = document.body.className.replace(/phase-[0-9]/g, '').trim();
        document.body.classList.add(`phase-${newPhase}`);
        loomState.phase = newPhase;
        saveLoomState();

        // 2. Play Sound Tone
        if (window.audioContext && window.audioContext.state === 'running') {
            playTone(40, 100); // Lower frequency tone for phase change
        } else if (!window.audioContext) {
             console.warn("Audio context not initialized yet.");
        }

        // 3. Check Phase 5 Activation (Terminal Overlay)
        if (newPhase === 5) {
            setTimeout(() => {
                const terminalOverlay = document.createElement('div');
                terminalOverlay.id = 'terminal-overlay';
                terminalOverlay.className = 'terminal-overlay active';
                document.body.prepend(terminalOverlay);
            }, 1000);
        }

        // 4. Auto-Advance Check (If all fragments found)
        if (newPhase < 5 && loomState.fragments.size >= 3 && !loomState.threadsUnlocked.has('SEE_THE_GAP')) {
             console.log("[Loom] All fragments revealed! Forcing Phase Advance and unlocking Thread 2.");
             // This simulates the discovery leading to a phase jump
             setPhase(newPhase + 1);
             unlockThread('SEE_THE_GAP');
        }
    };

    /** Resets all loom state, local storage, and DOM classes. */
    const resetLoom = () => {
        if (confirm("Are you sure you want to reset the entire Loom state? This cannot be undone.")) {
            localStorage.removeItem(STORAGE_KEYS.PHASE);
            localStorage.removeItem(STORAGE_KEYS.FRAGMENTS);
            localStorage.removeItem(STORAGE_KEYS.THREADS);

            document.body.className = document.body.className.replace(/phase-[0-9]/g, '').trim();
            loomState.phase = 1;
            loomState.fragments.clear();
            loomState.threadsUnlocked.clear();
            
            console.log("[Loom] State reset successful.");
            // Optionally reload page here if needed, but we will just update state for this implementation
        }
    };

    // --- AUDIO IMPLEMENTATION (Web Audio API) ---

    let audioContext = null;
    let isAudioInitialized = false;

    /** Initializes the AudioContext on first user interaction. */
    const initializeAudioContext = () => {
        if (!isAudioInitialized) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                isAudioInitialized = true;
                console.log("[Loom Audio] Context initialized.");
            } catch (e) {
                console.error("Web Audio API is not supported in this browser.", e);
                audioContext = null;
            }
        }
    };

    /** Plays a simple tone for phase changes. */
    const playTone = (freq, durationMs) => {
        if (!audioContext || audioContext.state !== 'running') return;

        const osc = audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioContext.currentTime);
        
        osc.connect(audioContext.destination);
        osc.start();
        setTimeout(() => {
            osc.stop();
        }, durationMs / 1000);
    };

    /** Plays a rising tone for Thread-Pull drag completion. */
    const playRisingTone = () => {
        if (!audioContext || audioContext.state !== 'running') return;

        const startFreq = 80;
        const endFreq = 400;
        const duration = 1.5; // seconds

        const osc = audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, audioContext.currentTime);
        
        // Exponentially increase frequency over time (sweep)
        const now = audioContext.currentTime;
        osc.frequency.linearRampToValueAtTime(endFreq, now + duration);

        osc.connect(audioContext.destination);
        osc.start();
        osc.stop(now + duration);
    };


    // --- MECHANIC 1: ORIGIN POINT (.origin-point) ---

    const setupOriginPoint = () => {
        const originPoint = document.querySelector('.origin-point');
        if (originPoint) {
            originPoint.addEventListener('click', () => {
                let nextPhase = loomState.phase + 1;
                setPhase(nextPhase);
            });
        } else {
             console.warn("[Loom] Origin Point element not found.");
        }
    };

    // --- MECHANIC 2: THREAD-PULL (.thread-pull) ---

    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    const MIN_DRAG_DISTANCE = 200;
    const threadData = {
        1: { name: 'ELAS', password: 'ELAS' },
        2: { name: 'SEE_THE_GAP', password: 'SEE_THE_GAP' },
        3: { name: 'COSMOS_REALIGN', password: 'COSMOS_REALIGN' }
    };

    const setupThreadPull = () => {
        const threadSpan = document.querySelector('.thread-pull span');
        if (!threadSpan) return;

        // 1. MOUSE DOWN (Start tracking)
        threadSpan.addEventListener('mousedown', (e) => {
            initializeAudioContext(); // Ensure audio context is active on first user gesture
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            isDragging = true;
            document.body.classList.add('unraveling');
        });

        // 2. MOUSE MOVE (Track distance and play sound)
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const deltaX = Math.abs(e.clientX - dragStartX);
            const deltaY = Math.abs(e.clientY - dragStartY);
            const totalDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // Play rising tone as user drags
            if (window.audioContext && window.audioContext.state === 'running') {
                playRisingTone(); 
            }
        });

        // 3. MOUSE UP (Check distance and trigger modal)
        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            const deltaX = Math.abs(e.clientX - dragStartX);
            const deltaY = Math.abs(e.clientY - dragStartY);
            const totalDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            document.body.classList.remove('unraveling');

            if (totalDistance >= MIN_DRAG_DISTANCE) {
                console.log("[Loom] Thread pulled sufficiently! Showing password modal.");
                showPasswordModal(`Thread Pull Complete`, `Enter the sequence for this thread.`);
            }
        });
    };

    // --- MECHANIC 3: HIDDEN VOID TEXT (.hidden-void-text) ---

    const setupVoidText = () => {
        const articleContent = document.querySelector('.article-content');
        if (!articleContent) return;

        // Use a MutationObserver or selectionchange listener for robust text tracking
        document.addEventListener('mouseup', handleSelectionChange);
        document.addEventListener('keyup', handleSelectionChange); // Keyup handles cases where selection is lost

        function handleSelectionChange() {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;

            const selectedText = selection.toString();

            // Check if the selection contains any target spans
            let foundTargets = Array.from(selectedText.matchAll(new RegExp(`(<span class="hidden-void-text"[^>]*?>.*?<\/span>)`, 'gi')));

            if (foundTargets.length > 0) {
                foundTargets.forEach(match => {
                    const fullMatch = match[0];
                    const spanElement = fullMatch.includes('class="hidden-void-text"') ? document.createElement('div').innerHTML : null;
                    
                    // Simple check to find the actual span element within the selection context
                    let targetSpan = Array.from(document.querySelectorAll('.hidden-void-text'))[0];

                    if (targetSpan && !targetSpan.hasAttribute('data-revealed')) {
                        const fragment = targetSpan.innerText.trim();
                        if (fragment && !loomState.fragments.has(fragment)) {
                            // Reveal the text visually and programmatically
                            targetSpan.setAttribute('data-revealed', 'true');
                            targetSpan.classList.add('revealed');
                            
                            // Track fragment
                            loomState.fragments.add(fragment);
                            saveLoomState();
                        }
                    }
                });

                // Clear selection after processing
                selection.removeAllRanges();
            }
        }
    };


    // --- MECHANIC 4: ORPHANED INDEX (.orphaned-index .term) ---

    let acrosticSequence = [];
    const setupOrphanedIndex = () => {
        const terms = document.querySelectorAll('.orphaned-index .term');
        if (terms.length === 0) return;

        // Initialize the sequence tracking structure
        acrosticSequence = new Array(STORAGE_KEYS.ELAS_SEQUENCE.length).fill(null);
        let currentStep = 1;
        
        document.querySelectorAll('.orphaned-index').forEach(container => {
            container.addEventListener('click', (e) => {
                const termElement = e.target.closest('.term');
                if (!termElement || acrosticSequence[0] === null) return;

                const clickedTermText = termElement.getAttribute('data-initial') || termElement.innerText.trim().toUpperCase();
                const requiredInitial = STORAGE_KEYS.ELAS_SEQUENCE[currentStep - 1];

                if (clickedTermText.startsWith(requiredInitial)) {
                    // Correct click
                    termElement.classList.add('acrostic-highlight');
                    acrosticSequence[currentStep - 1] = clickedTermText;
                    currentStep++;

                    saveLoomState();
                    console.log(`[Loom Acrostic] Step ${currentStep - 1} correct: ${clickedTermText}`);


                    if (currentStep > STORAGE_KEYS.ELAS_SEQUENCE.length) {
                        // Sequence ELAS completed!
                        unlockThread('ELAS');
                        setPhase(loomState.phase + 1); // Advance phase upon completion
                    }

                } else if (clickedTermText.startsWith('')) {
                     // Wrong click
                    termElement.classList.add('error-flash'); // Assuming CSS handles this class
                    setTimeout(() => {
                        termElement.classList.remove('error-flash');
                    }, 300);

                    // Reset sequence on failure (Simplified reset)
                    acrosticSequence = new Array(STORAGE_KEYS.ELAS_SEQUENCE.length).fill(null);
                    currentStep = 1;
                    console.log("[Loom Acrostic] Sequence broken. Restarting.");
                }
            });
        });
    };

    // --- MECHANIC 5: DEAD DIRECTORY LINKS (.dead-directory-link) ---

    const setupDeadLinks = () => {
        document.body.addEventListener('click', (e) => {
            if (e.target.closest('.dead-directory-link')) {
                // Do NOT preventDefault, allow natural navigation to /404.html
                console.log("[Loom] Redirecting to Dead Directory.");
            }
        });
    };

    // --- MECHANIC 6: PASSWORD MODAL (#password-modal) ---

    const modalElement = document.getElementById('password-modal');
    if (!modalElement) {
        console.error("[Loom] Password Modal #password-modal not found in DOM.");
    } else {
        let currentThreadId = null;

        /** Shows the password modal for a given thread. */
        const showPasswordModal = (title, message) => {
            if (!modalElement) return;
            currentThreadId = title.toLowerCase().replace(' ', '_'); 
            
            document.getElementById('modal-title').textContent = title;
            document.getElementById('modal-message').textContent = message;
            modalElement.style.display = 'flex';

            const inputField = document.getElementById('password-input');
            if (inputField) {
                inputField.value = '';
                inputField.focus();
                // Clear previous listeners to prevent double binding
                inputField.removeEventListener('keyup', handlePasswordSubmit); 
                handlePasswordSubmit = (e) => validatePassword(e, currentThreadId);
                inputField.addEventListener('keyup', handlePasswordSubmit);
            }
        };

        /** Handles password submission logic. */
        const validatePassword = (e, threadId) => {
            if (!threadId) return;

            let password = e.target.value.trim().toUpperCase();
            const expectedPassword = threadData[parseInt(threadId.split('_')[0])]?.password;
            
            if (!expectedPassword) {
                console.error("Unknown thread ID:", threadId);
                return;
            }

            if (password === expectedPassword) {
                // Success
                alert(`Success! The ${threadData[parseInt(threadId.split('_')[0])]?.name || 'thread'} is unlocked.`);
                document.body.classList.remove('unraveling'); // Remove background effect
                modalElement.style.display = 'none';
                unlockThread(expectedPassword);
                setPhase(loomState.phase + 1);

            } else {
                // Failure: Shake the input
                e.target.setAttribute('data-shake', '');
                setTimeout(() => e.target.removeAttribute('data-shake'), 500);
                console.warn("[Loom] Incorrect password.");
            }
        };

        /** Unlocks a specific thread and updates state. */
        const unlockThread = (threadName) => {
            if (!loomState.threadsUnlocked.has(threadName)) {
                loomState.threadsUnlocked.add(threadName);
                saveLoomState();
                console.log(`[Loom] Thread Unlocked: ${threadName}`);
            }
        };

        // Expose showPasswordModal globally or make it accessible to the thread-pull setup
        window.showPasswordModal = showPasswordModal; 
    }


    // --- MECHANIC 7: EMERGING GRID (.emerging-grid) ---

    const setupEmergingGrid = () => {
        let gridElement = document.querySelector('.emerging-grid');
        if (!gridElement) {
            console.log("[Loom] Emerging Grid not found, creating it now.");
            gridElement = document.createElement('div');
            gridElement.className = 'emerging-grid';
            document.body.appendChild(gridElement);
        }
    };


    // --- MAIN INITIALIZATION FUNCTION ---

    const initLoomEngine = () => {
        console.log("--- loom.js Initializing ARG Engine ---");

        // 1. Load State and Set Phase
        loadLoomState();
        setPhase(loomState.phase); // Reapply phase class and triggers

        // 2. Setup Core Mechanics Listeners (Order matters for dependencies)
        setupOriginPoint();      // Requires DOMContentLoaded
        setupVoidText();         // Requires document listener setup
        setupOrphanedIndex();    // Requires specific selectors/event delegation
        setupDeadLinks();        // Uses event delegation on body click
        setupThreadPull();       // Requires mousedown listeners

        // 3. Setup Passive Elements
        setupEmergingGrid();     // Ensures the element exists

        // Note: Password Modal setup must happen after DOM is ready, but we rely on the selector check above.
    };

    // Wait for all resources to be loaded before running the engine
    document.addEventListener('DOMContentLoaded', initLoomEngine);

})();
