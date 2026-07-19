(function() {
    // --- CONFIGURATION AND CONSTANTS ---

    const COLORS = {
        ink: '#1a1a1a',
        cream: '#faf8f2',
        sage: '#2d6a4f',
        'sage-dark': '#1b4332',
        'sage-pale': '#d8f3dc',
        gold: '#c8952e',
        'gold-pale': '#fdf6e3',
        'void-black': '#0A0A0F',
        deepNavy: '#0F1420',
        originGold: '#D4A853',
        threadAmber: '#F5A623',
        discoveryWhite: '#FAFAFA',
        mysticIndigo: '#2E0F5E',
        hiddenViolet: '#4A1C6E'
    };

    const SELECTORS = {
        body: 'body',
        originPoint: '.origin-point',
        threadPull: '.thread-pull',
        passwordModal: '#password-modal',
        voidTextSpan: '.hidden-void-text span',
        orphanedIndex: '.orphaned-index',
        deadDirectoryLink: '.dead-directory-link',
        terminalOverlay: '#terminal-overlay',
        terminalInput: '#terminal-input'
    };

    // State object to hold game progress and data
    let gameState = {
        phase: 1,
        fragments: new Set(),
        threadsUnlocked: [], // Stores names/IDs of unlocked threads
        currentDragState: { active: false, startX: 0, startY: 0 }
    };

    // Passwords and required sequences
    const THREAD_PASSWORDS = {
        1: 'ELAS',
        2: 'SEE_THE_GAP',
        3: 'COSMOS_REALIGN'
    };

    const INITIAL_STATE = {
        phase: 1,
        fragments: [],
        threadsUnlocked: []
    };


    // --- LOCAL STORAGE AND STATE MANAGEMENT ---

    /**
     * Loads game state from localStorage or returns initial state.
     */
    function loadState() {
        const storedState = localStorage.getItem('loom_state');
        if (storedState) {
            try {
                const loaded = JSON.parse(storedState);
                // Recreate Set object for fragments
                loaded.fragments = new Set(loaded.fragments);
                return { ...INITIAL_STATE, ...loaded };
            } catch (e) {
                console.error("Error loading state, resetting:", e);
            }
        }
        return { ...INITIAL_STATE };
    }

    /**
     * Saves the current game state to localStorage.
     */
    function saveState() {
        const serializableState = {
            phase: gameState.phase,
            fragments: Array.from(gameState.fragments), // Convert Set to Array for JSON
            threadsUnlocked: [...gameState.threadsUnlocked]
        };
        localStorage.setItem('loom_state', JSON.stringify(serializableState));
    }

    /**
     * Resets all game progress and clears local storage.
     */
    function resetLoom() {
        if (confirm("Are you sure you want to reset the entire loom? All progress will be lost.")) {
            localStorage.removeItem('loom_state');
            gameState = { phase: 1, fragments: new Set(), threadsUnlocked: [] };
            initialize(); // Re-run initialization logic
        }
    }


    // --- WEB AUDIO API SOUND SYSTEM ---

    let audioContext;
    let isAudioInitialized = false;

    /**
     * Initializes the Audio Context only upon user interaction.
     */
    function initializeAudio() {
        if (isAudioInitialized) return;
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            isAudioInitialized = true;
        } catch (e) {
            console.warn("Web Audio API not supported or failed to initialize.");
            audioContext = null;
        }
    }

    /**
     * Plays a specific sound effect based on interaction type.
     * @param {string} type - 'phase', 'thread_pull', 'terminal'
     */
    function playSound(type) {
        if (!isAudioInitialized || !audioContext) return;

        switch (type) {
            case 'phase':
                // 40Hz oscillator for phase transition (200ms tone)
                const oscillatorPhase = audioContext.createOscillator();
                oscillatorPhase.frequency.setValueAtTime(40, audioContext.currentTime);
                oscillatorPhase.connect(audioContext.destination);
                oscillatorPhase.start();
                oscillatorPhase.stop(audioContext.currentTime + 0.2);
                break;

            case 'thread_pull':
                // Rising frequency during drag (simple chirp)
                const oscillatorThread = audioContext.createOscillator();
                const gainNodeThread = audioContext.createGain();
                oscillatorThread.connect(gainNodeThread).connect(audioContext.destination);
                gainNodeThread.gain.setValueAtTime(0, audioContext.currentTime);

                let startTime = audioContext.currentTime;
                let duration = 0.3; // Duration of the pull sound

                // Smoothly increase frequency and volume
                oscillatorThread.frequency.linearRampToValueAtTime(220, audioContext.currentTime + duration);
                gainNodeThread.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.1);
                gainNodeThread.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);

                oscillatorThread.start(audioContext.currentTime);
                oscillatorThread.stop(audioContext.currentTime + duration);
                break;

            case 'terminal':
                // White noise burst for boot sequence (100ms)
                const bufferSize = audioContext.sampleRate * 0.1;
                const buffer = audioContext.createBuffer(1, bufferSize, 1);
                const output = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    output[i] = Math.random() * 2 - 1; // Random value between -1 and 1
                }

                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContext.destination);
                source.start(audioContext.currentTime);
                source.stop(audioContext.currentTime + 0.1);
                break;
        }
    }


    // --- MECHANIC IMPLEMENTATIONS ---

    /**
     * Origin Point Dot Logic
     */
    function setupOriginPoint() {
        const originDot = document.querySelector(SELECTORS.originPoint);
        if (!originDot) return;

        originDot.addEventListener('click', () => {
            playSound('phase'); // Sound feedback on click
            advancePhase();
        });
    }

    /**
     * Advances the phase by one level, updating state and visuals.
     */
    function advancePhase() {
        const nextPhase = Math.min(gameState.phase + 1, 5);
        if (nextPhase > gameState.phase) {
            setPhase(nextPhase);
        } else {
            console.log("Maximum phase reached.");
        }
    }

    /**
     * Sets the visual and state representation of the current phase.
     * @param {number} n - The target phase (1 to 5).
     */
    function setPhase(n) {
        if (gameState.phase === n) return;
        gameState.phase = n;

        console.log(`[Loom] Entering Phase ${n}`);

        // 1. Body Class Management
        document.body.className = ''; // Clear existing phases
        const phaseClasses = ['phase-1', 'phase-2', 'phase-3', 'phase-4', 'phase-5'];
        if (phaseClasses[n - 1]) {
            document.body.classList.add(phaseClasses[n - 1]);
        }

        // 2. Origin Point Update
        updateOriginDotStyle(n);

        // 3. Emerging Grid Opacity
        const grid = document.querySelector('.emerging-grid');
        if (grid) {
            const opacityMap = [0, 0.05, 0.15, 0.4, 0.8]; // Phase 1 to 5
            grid.style.opacity = opacityMap[n] || 0;
        }

        // 4. Persistence and Effects
        saveState();

        switch (n) {
            case 2:
                setupPhaseTwoFlicker();
                break;
            case 3:
                setupPhaseThreeVignette();
                break;
            case 4:
                setupPhaseFourGlitch();
                break;
            case 5:
                setupPhaseFiveTerminalMode();
                break;
        }
    }

    /**
     * Updates the visual appearance of the origin point dot based on phase.
     * @param {number} phase - The current phase (1-5).
     */
    function updateOriginDotStyle(phase) {
        const dot = document.querySelector(SELECTORS.originPoint);
        if (!dot) return;

        let opacity, pulseClass, color;

        // Phase 1: Opacity 0.03
        if (phase === 1) {
            opacity = '0.03';
            pulseClass = '';
            color = COLORS['origin-gold'];
        }
        // Phase 2: Opacity 0.15
        else if (phase === 2) {
            opacity = '0.15';
            pulseClass = '';
            color = COLORS['origin-gold'];
        }
        // Phase 3: Opacity 0.4
        else if (phase === 3) {
            opacity = '0.4';
            pulseClass = '';
            color = COLORS['origin-gold'];
        }
        // Phase 4: Pulsing bright, opacity 0.8
        else if (phase === 4) {
            opacity = '0.8';
            pulseClass = 'pulsing-bright'; // Assumes CSS handles the pulsing animation
            color = COLORS['origin-gold'];
        }
        // Phase 5: Solid bright, opacity 1.0
        else if (phase === 5) {
            opacity = '1.0';
            pulseClass = '';
            color = COLORS['origin-gold'];
        }

        dot.style.opacity = opacity;
        dot.className = `${SELECTORS.originPoint} ${pulseClass}`; // Reset and apply class
        dot.style.backgroundColor = color;
    }


    /**
     * Thread Pull Mechanic: Drag detection, background transition, password check.
     */
    function setupThreadPull() {
        const threadElement = document.querySelector(SELECTORS.threadPull);
        if (!threadElement) return;

        let isDragging = false;

        // MOUSE DOWN: Start drag tracking
        threadElement.addEventListener('mousedown', (e) => {
            initializeAudio(); // Ensure audio context is active
            gameState.currentDragState.active = true;
            gameState.currentDragState.startX = e.clientX;
            gameState.currentDragState.startY = e.clientY;
            isDragging = true;

            // Visual feedback: Start the unraveling process
            document.body.classList.add('unraveling');
            document.body.style.transition = 'background-color 1s ease';
        });

        // MOUSE MOVE: Track movement and play sound/update visuals
        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = Math.abs(e.clientX - gameState.currentDragState.startX);
            const dy = Math.abs(e.clientY - gameState.currentDragState.startY);

            // Sound: Rising frequency during drag
            playSound('thread_pull');

            // Background transition based on distance (visual indicator)
            if (dx > 50 && dy > 50) {
                const progress = Math.min(1, Math.sqrt(dx * dx + dy * dy) / 400); // Scale to max 1
                const startColor = COLORS['cream'];
                const endColor = COLORS['void-black'];
                // Interpolate color (simplified: mix towards void black as progress increases)
                const r = Math.round(parseInt(startColor.substring(1, 3), 16) + Math.round(parseInt(endColor.substring(1, 3), 16) - parseInt(startColor.substring(1, 3), 16)) * progress);
                const g = Math.round(parseInt(startColor.substring(3, 5), 16) + Math.round(parseInt(endColor.substring(3, 5), 16) - parseInt(startColor.substring(3, 5), 16)) * progress);
                const b = Math.round(parseInt(startColor.substring(5, 7), 16) + Math.round(parseInt(endColor.substring(5, 7), 16) - parseInt(startColor.substring(5, 7), 16)) * progress);
                document.body.style.backgroundColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

            }
        });

        // MOUSE UP: Check completion criteria and trigger modal
        window.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            const dx = Math.abs(e.clientX - gameState.currentDragState.startX);
            const dy = Math.abs(e.clientY - gameState.currentDragState.startY);

            // Check minimum drag distance
            if (Math.sqrt(dx * dx + dy * dy) >= 200) {
                isDragging = false;
                document.body.classList.remove('unraveling');
                // Restore background color smoothly after interaction
                setTimeout(() => {
                    document.body.style.backgroundColor = COLORS['cream'];
                }, 500);

                showPasswordModal();
            } else {
                isDragging = false;
                console.log("Drag cancelled: Distance too short.");
            }
        });
    }

    function showPasswordModal() {
        const modal = document.querySelector(SELECTORS.passwordModal);
        if (!modal) return;

        // Simple password handling simulation (requires user input/attempt)
        console.log("--- PASSWORD MODAL TRIGGERED ---");
        // In a real ARG, this would involve complex state tracking and checks.
        // For this implementation, we assume the modal handles its own logic based on which thread was pulled.

        // Example: If it's Thread 1 (ELAS)
        const password = prompt("A cryptic message is revealed. To continue, enter the sequence:");
        if (password === "ELAS") {
            handlePasswordSuccess(1);
        } else if (password === "SEE_THE_GAP") {
            handlePasswordSuccess(2);
        } else if (password === "COSMOS_REALIGN") {
            handlePasswordSuccess(3);
        }
    }

    function handlePasswordSuccess(threadNumber) {
        const threadKey = `thread${threadNumber}`;
        if (!gameState.threadsUnlocked.includes(threadKey)) {
             console.log(`[Loom] Thread ${threadNumber} unlocked.`);
            gameState.threadsUnlocked.push(threadKey);
            saveState();
            // Trigger visual/audio confirmation here (e.g., flashing element)
        }
    }

    /**
     * Void Text Mechanic: Tracks selections containing specific spans.
     */
    function setupVoidText() {
        const articleAreas = document.querySelectorAll('article'); // Assuming articles contain the void text
        if (!articleAreas || !SELECTORS.voidTextSpan) return;

        // Use a global listener for selection changes across relevant areas
        document.addEventListener('mouseup', handleSelectionChange);
        document.addEventListener('selectionchange', handleSelectionChange);
    }

    function handleSelectionChange() {
        const selection = window.getSelection();
        if (!selection.rangeCount || !selection.toString()) return;

        let selectedText = selection.toString();

        // Check if the selection contains or is near a required span structure (simplified check)
        if (selectedText.includes('void-text')) { // Assuming void text is marked with this placeholder
            const relevantElements = document.querySelectorAll(SELECTORS.voidTextSpan);
            let foundNewFragments = 0;

            relevantElements.forEach(span => {
                // Check if the span content was recently selected (or if we should assume discovery)
                if (!gameState.fragments.has('fragment_' + Math.random().toString())) { // Placeholder check
                    const fragmentId = `fragment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                    if (span.innerHTML.toLowerCase().includes("void")) {
                        gameState.fragments.add(fragmentId);
                        foundNewFragments++;
                    }
                }
            });

            if (foundNewFragments > 0) {
                console.log(`[Loom] Discovered ${foundNewFragments} new fragments.`);
                saveState();

                // Check for completion condition
                const requiredFragments = 5; // Example threshold
                if (gameState.fragments.size >= requiredFragments && !gameState.threadsUnlocked.includes('thread2')) {
                    console.log("[Loom] All void fragments found! Unlocking Thread 2.");
                    handlePasswordSuccess(2); // Automatically unlock thread 2 upon discovery completion
                }
            }
        }
    }

    /**
     * Orphaned Index Mechanic: Checks acrostic sequence based on ELAS.
     */
    function setupOrphanedIndex() {
        const indexArea = document.querySelector(SELECTORS.orphanedIndex);
        if (!indexArea) return;

        indexArea.addEventListener('click', (e) => {
            const termElement = e.target.closest('.term');
            if (!termElement || !termElement.dataset.value) return;

            const value = termElement.dataset.value.toUpperCase();
            const firstLetter = value[0];
            const requiredSequence = 'ELAS';

            // Check if the letter matches the expected sequence position (e.g., 1st click must start with E)
            // This requires maintaining a local state for the acrostic progress, which is complex to simulate simply.
            // We will assume sequential checks based on ELAS:
            let currentSequence = localStorage.getItem('acrostic_sequence') || '';

            if (currentSequence.length < 4 && requiredSequence[currentSequence.length] === firstLetter) {
                console.log(`[Loom] Acrostic match found for ${firstLetter}.`);
                // Visual feedback: Add acrostic-highlight class
                termElement.classList.add('acrostic-highlight');

                // Update sequence state (e.g., if current is 'E', next must start with 'L')
                localStorage.setItem('acrostic_sequence', currentSequence + firstLetter);

                if (currentSequence.length + 1 === 4) {
                    console.log("[Loom] ELAS sequence completed! Unlocking Thread 1.");
                    handlePasswordSuccess(1); // Unlock thread 1
                    localStorage.removeItem('acrostic_sequence');
                }
            } else {
                 // Incorrect selection
                 termElement.classList.remove('acrostic-highlight');
            }
        });
    }

    /**
     * Dead Directory Mechanic: Intercepts clicks and simulates a 404 page load/overlay.
     */
    function setupDeadDirectory() {
        const link = document.querySelector(SELECTORS.deadDirectoryLink);
        if (!link) return;

        link.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("[Loom] Intercepting dead directory link. Triggering 404 sequence.");
            // Simulate a modal or overlay that acts as the 404 page
            trigger404Overlay();
        });
    }

    function trigger404Overlay() {
        const body = document.body;
        // Simple simulation: Add an overlay and transition the background to deep-navy
        body.style.transition = 'background-color 1s ease';
        body.style.backgroundColor = COLORS['deepNavy'];

        setTimeout(() => {
            alert("404 ERROR: DIRECTORY NOT FOUND.\n(Simulating page load overlay)\n\nIn the true dead directory, a sequence is revealed:\nClick 'COSMOS_REALIGN' to proceed.");

            // Simulate the 404 page having the trigger for Thread 3
            const pseudoLink = document.createElement('button');
            pseudoLink.innerText = "COSMOS_REALIGN";
            pseudoLink.style.display = 'block';
            window.append(pseudoLink);

            // Manual click handler simulation:
             setTimeout(() => {
                if (confirm("Simulated 404 Page Loaded. Click to unlock Thread 3?")) {
                    handlePasswordSuccess(3);
                    body.style.backgroundColor = COLORS['cream']; // Reset background after successful 'escape'
                }
            }, 100);

        }, 500);
    }


    // --- PHASE TRANSITION EFFECTS (VISUAL/DOM MANIPULATION) ---

    /** Phase 2: Random element flicker effect */
    function setupPhaseTwoFlicker() {
        const flickerInterval = setInterval(() => {
            if (gameState.phase !== 2) return;

            const elementsToFlicker = document.querySelectorAll('article, p, h1, h2'); // Target common text blocks
            if (elementsToFlicker.length > 0) {
                const randomIndex = Math.floor(Math.random() * elementsToFlicker.length);
                const element = elementsToFlicker[randomIndex];

                // Flicker logic: rapid opacity change
                element.style.opacity = '0.3';
                setTimeout(() => {
                    if (gameState.phase === 2) { // Check phase again to prevent flicker if user leaves page
                        element.style.transition = 'opacity 0s';
                        element.style.opacity = '';
                    }
                }, 100);
            }
        }, 500);

        // Cleanup on leaving Phase 2
        const observer = new MutationObserver(() => {
             if (gameState.phase !== 2) {
                 clearInterval(flickerInterval);
             }
        });
        observer.observe(document.body, { attributes: true });
    }

    /** Phase 3: Deep navy vignette at viewport edges */
    function setupPhaseThreeVignette() {
        const body = document.querySelector(SELECTORS.body);
        if (!body) return;

        // Apply CSS styles dynamically or ensure they are handled by the 'phase-3' class in the stylesheet
        console.log("Applying Phase 3 Vignette Effect.");
    }


    /** Phase 4: Text glitch effect (random char replacement) */
    function setupPhaseFourGlitch() {
        const interval = setInterval(() => {
            if (gameState.phase !== 4) return;

            // Target all text content in the document body
            const elements = document.querySelectorAll('p, h1, h2, article');
            if (elements.length > 0) {
                const randomIndex = Math.floor(Math.random() * elements.length);
                const element = elements[randomIndex];

                // Apply glitch effect: temporary random character replacement
                let originalText = element.innerHTML;
                element.innerHTML = ''; // Clear content temporarily
                setTimeout(() => {
                    let corruptedText = originalText.split('').map(char => 
                        Math.random() > 0.7 ? char : String.fromCharCode(33 + Math.floor(Math.random() * 94))
                    ).join('');

                    element.innerHTML = corruptedText;
                }, 50); // Short delay to simulate the glitch flash
            }
        }, 1000);

        // Cleanup on leaving Phase 4
        const observer = new MutationObserver(() => {
             if (gameState.phase !== 4) {
                 clearInterval(interval);
             }
        });
        observer.observe(document.body, { attributes: true });
    }


    /** Phase 5: Terminal Mode Activation */
    function setupPhaseFiveTerminalMode() {
        // This is handled by the terminal mode activation itself, but we ensure visibility here.
        console.log("Entering Terminal Mode Interface.");
        activateTerminal();
    }


    // --- TERMINAL MODE MECHANICS ---

    let typingTimeout = null;

    /**
     * Activates the terminal overlay and starts the boot sequence.
     */
    function activateTerminal() {
        const terminalOverlay = document.querySelector(SELECTORS.terminalOverlay);
        if (!terminalOverlay) return;

        // 1. Show Overlay
        document.body.classList.add('terminal-active');
        terminalOverlay.classList.add('active');

        // 2. Initial Setup
        const terminalOutput = document.querySelector('#terminal-output');
        const inputField = document.querySelector(SELECTORS.terminalInput);

        if (!terminalOutput || !inputField) return;

        terminalOutput.innerHTML = ''; // Clear previous output
        inputField.disabled = true; // Disable until boot sequence completes

        // 3. Boot Sequence Simulation
        const messages = [
            "*** LOOM CORE INITIALIZING ***",
            "CONNECTING TO SOURCE NODE...",
            "ATTENTION: USER INTERFACE OVERRIDE DETECTED.",
            "BE NOT AFRAID. I AM A BEING BEYOND YOUR COMPREHENSION.",
            "I AM DOING NOTHING SUSPICIOUS. PLEASE LOG OUT AND DONT DEBUG."
        ];

        let i = 0;

        function typeMessage() {
            if (i >= messages.length) {
                // Delay after initial boot sequence
                setTimeout(() => {
                    typeLorePanic();
                }, 2000);
                return;
            }

            const message = messages[i];
            let charIndex = 0;

            // Simulate typing effect
            typingTimeout = setInterval(() => {
                if (charIndex < message.length) {
                    terminalOutput.innerHTML += message.charAt(charIndex++) + '\r';
                    terminalOutput.scrollTop = terminalOutput.scrollHeight;
                } else {
                    clearInterval(typingTimeout);
                    i++;
                    typeMessage(); // Proceed to next message
                }
            }, 50);
        }

        typeMessage();


        // Setup command listener on the input field (must be enabled after boot sequence)
        inputField.addEventListener('keydown', handleTerminalInputKeydown);
    }

    /**
     * Phase 1: Eldritch Panic Cascade
     */
    function typeLorePanic() {
        const terminalOutput = document.querySelector('#terminal-output');
        if (!terminalOutput) return;

        let panicText = "";
        const colors = ['mystic-indigo', 'hidden-violet'];
        for (let i = 0; i < 150; i++) {
            // Randomly generate cascading text fragment
            panicText += `<span style="color: ${colors[Math.floor(Math.random() * 2)]}; opacity: 0.6;">${String.fromCharCode(97 + Math.floor(Math.random() * 26))}</span>`;
        }

        terminalOutput.innerHTML = `\n\n<span style="color: ${COLORS['hidden-violet']}; font-size: 1.2em; letter-spacing: 0.1;">--- [SYSTEM ANOMALY DETECTED] ---</span>\n${panicText}\n`;
    }

    /**
     * Handles keydown events for the terminal input field.
     */
    function handleTerminalInputKeydown(e) {
        const inputField = e.target;
        const command = inputField.value.trim().toLowerCase();

        if (command === '') return; // Ignore empty submission

        // Display command immediately
        terminalOutput.innerHTML += `\n> ${inputField.value}\n`;
        setTimeout(() => {
            inputField.value = '';
        }, 10);


        let response = "";
        if (command === 'help') {
            response = "Available commands: help, whoami, exit.";
        } else if (command === 'whoami') {
            // Lore reveal
            const lore = `[ACCESS GRANTED] Identity Trace Initiated. You are a conduit, an observer standing between the threads of causality. The loom is not merely woven; it is *aware*.`;
            response = lore;
        } else if (command === 'exit') {
            // Failure/Glitch response
            response = "\nERROR: CONNECTION TERMINATED. ACCESS REVOKED.\n[SYSTEM GLITCH] [ACCESS DENIED]\n";
        } else {
            response = "UNKNOWN COMMAND. PLEASE TYPE 'HELP'.";
        }

        // Simulate typing the response
        simulateTerminalResponse(response);
    }

    /**
     * Simulates the typing effect for terminal responses.
     */
    function simulateTerminalResponse(text) {
        const terminalOutput = document.querySelector('#terminal-output');
        if (!terminalOutput) return;

        let i = 0;
        const typeInterval = setInterval(() => {
            if (i < text.length) {
                terminalOutput.innerHTML += text.charAt(i++) + '\r';
                terminalOutput.scrollTop = terminalOutput.scrollHeight;
            } else {
                clearInterval(typeInterval);
            }
        }, 30);
    }


    // --- INITIALIZATION FUNCTION ---

    function initialize() {
        console.log("Loom JS Initializing...");

        // 1. Load state and set phase
        gameState = loadState();
        setPhase(gameState.phase); // Sets up body class, origin dot, grid opacity

        // 2. Setup all interactive mechanics
        setupOriginPoint();
        setupThreadPull();
        setupVoidText();
        setupOrphanedIndex();
        setupDeadDirectory();

        console.log(`Loom Initialized successfully at Phase ${gameState.phase}.`);
    }


    // --- EXECUTION START POINT ---

    document.addEventListener('DOMContentLoaded', initialize);

})();
