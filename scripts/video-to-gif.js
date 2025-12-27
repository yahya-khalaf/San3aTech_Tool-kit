// Video to GIF Converter Logic

(function () {
    'use strict';

    // Elements
    const dropZone = document.getElementById('dropZone');
    const videoInput = document.getElementById('videoInput');
    const videoPreview = document.getElementById('videoPreview');
    const controlsArea = document.getElementById('controlsArea');
    const generateBtn = document.getElementById('generateBtn');

    // Sliders
    const rangeProgress = document.getElementById('rangeProgress');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const startTimeLabel = document.getElementById('startTimeLabel');
    const endTimeLabel = document.getElementById('endTimeLabel');
    const durationBadge = document.getElementById('durationBadge');

    // Configs
    const fpsInput = document.getElementById('fps');
    const widthInput = document.getElementById('width');
    const speedInput = document.getElementById('speed');

    // Output
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const progressText = document.getElementById('progressText');
    const gifContainer = document.getElementById('gifContainer');
    const videoContainer = document.getElementById('videoContainer');
    const emptyPreview = document.getElementById('emptyPreview');
    const gifOutput = document.getElementById('gifOutput');
    const gifMeta = document.getElementById('gifMeta');
    const downloadActions = document.getElementById('downloadActions');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');

    // State
    let videoDuration = 0;
    let gifBlob = null;
    let workerBlobURL = null;

    // ========================================================================
    // INITIALIZATION: PREPARE WORKER
    // ========================================================================
    // We fetch the worker code and create a Blob URL to avoid CORS/Path issues
    async function prepareWorker() {
        try {
            const response = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
            const workerScript = await response.text();
            const blob = new Blob([workerScript], { type: 'application/javascript' });
            workerBlobURL = URL.createObjectURL(blob);
            console.log('GIF Worker prepared');
        } catch (error) {
            console.error('Failed to load GIF worker:', error);
            // Fallback: try direct CDN link (might fail due to CORS)
            workerBlobURL = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js';
        }
    }
    prepareWorker();

    // ========================================================================
    // FILE HANDLING
    // ========================================================================
    dropZone.addEventListener('click', () => videoInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    videoInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.startsWith('video/')) {
            alert('Please upload a valid video file.');
            return;
        }

        const url = URL.createObjectURL(file);
        videoPreview.src = url;

        // Reset UI
        videoContainer.style.display = 'block';
        emptyPreview.style.display = 'none';
        gifContainer.style.display = 'none';
        downloadActions.style.display = 'none';

        videoPreview.onloadedmetadata = () => {
            videoDuration = videoPreview.duration;
            durationBadge.textContent = formatTime(videoDuration);

            // Adjust sliders
            startTimeInput.max = videoDuration;
            endTimeInput.max = videoDuration;
            endTimeInput.value = videoDuration;

            updateSliderUI();
            controlsArea.classList.remove('disabled');
        };
    }

    // ========================================================================
    // SLIDER LOGIC
    // ========================================================================
    function updateSliderUI() {
        const start = parseFloat(startTimeInput.value);
        const end = parseFloat(endTimeInput.value);
        const max = parseFloat(endTimeInput.max);

        // Enforce min gap
        if (end - start < 1) {
            if (event && event.target === startTimeInput) {
                startTimeInput.value = end - 1;
            } else {
                endTimeInput.value = start + 1;
            }
        }

        const currentStart = parseFloat(startTimeInput.value);
        const currentEnd = parseFloat(endTimeInput.value);

        startTimeLabel.textContent = formatTime(currentStart);
        endTimeLabel.textContent = formatTime(currentEnd);

        // Update progress bar visual
        const percentStart = (currentStart / max) * 100;
        const percentEnd = (currentEnd / max) * 100;

        rangeProgress.style.left = percentStart + '%';
        rangeProgress.style.width = (percentEnd - percentStart) + '%';
    }

    startTimeInput.addEventListener('input', updateSliderUI);
    endTimeInput.addEventListener('input', updateSliderUI);

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);
        return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
    }

    // ========================================================================
    // GIF GENERATION LOGIC
    // ========================================================================
    generateBtn.addEventListener('click', async () => {
        if (generateBtn.classList.contains('processing')) return;

        // UI Updates
        startProcessingState();

        const startTime = parseFloat(startTimeInput.value);
        const endTime = parseFloat(endTimeInput.value);
        const fps = parseInt(fpsInput.value);
        const speed = parseFloat(speedInput.value);
        const width = widthInput.value === 'original' ? videoPreview.videoWidth : parseInt(widthInput.value);

        // Calculate dimensions maintaining aspect ratio
        const aspectRatio = videoPreview.videoWidth / videoPreview.videoHeight;
        const height = Math.round(width / aspectRatio);

        // Canvas for Frame Capture
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Initialize GIF Encoder
        const gif = new GIF({
            workers: 2,
            quality: 10,
            width: width,
            height: height,
            workerScript: workerBlobURL
        });

        // Event: Progress
        gif.on('progress', (p) => {
            const pct = Math.round(p * 100);
            progressFill.style.width = pct + '%';
            progressPercent.textContent = pct + '%';
            progressText.textContent = 'Rendering GIF...';
        });

        // Event: Finished
        gif.on('finished', (blob) => {
            gifBlob = blob;
            const url = URL.createObjectURL(blob);
            gifOutput.src = url;

            // Meta info
            const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
            gifMeta.textContent = `Size: ${sizeMB} MB | Duration: ${(endTime - startTime).toFixed(1)}s`;

            finishProcessingState();
        });

        // Capture Frames
        try {
            const captureInterval = 1 / fps; // how often to capture in video time
            const frameDelay = (1000 / fps) / speed; // delay between frames in GIF

            let currentTime = startTime;

            progressText.textContent = 'Capturing frames...';

            // Use a seek-capture loop
            while (currentTime <= endTime) {
                // Seek
                videoPreview.currentTime = currentTime;

                // Wait for seek (simple promise wrapper)
                await new Promise(r => {
                    const onSeek = () => {
                        videoPreview.removeEventListener('seeked', onSeek);
                        r();
                    };
                    videoPreview.addEventListener('seeked', onSeek);
                });

                // Draw to canvas
                ctx.drawImage(videoPreview, 0, 0, width, height);

                // Add frame
                gif.addFrame(ctx, {
                    copy: true,
                    delay: frameDelay
                });

                // Increment
                currentTime += captureInterval * speed; // Jump by speed-adjusted interval?
                // Actually, if we want 10FPS GIF, we need to capture every 0.1s of VIDEO time if speed is 1x.
                // If speed is 2x, we capture every 0.2s of video time, but play it back as 0.1s delay.
                // Logic:
                // Step size in video = (1/fps) * speed
                // Delay in GIF = 1000 / fps
            }

            // Render
            gif.render();

        } catch (err) {
            console.error(err);
            alert('Error generating GIF');
            resetUIState();
        }
    });

    // ========================================================================
    // UI HELPERS
    // ========================================================================
    function startProcessingState() {
        generateBtn.classList.add('processing');
        generateBtn.disabled = true;
        generateBtn.innerHTML = 'Processing...';

        progressContainer.style.display = 'block';
        progressFill.style.width = '0%';
        progressPercent.textContent = '0%';

        gifContainer.style.display = 'none';
        downloadActions.style.display = 'none';
    }

    function finishProcessingState() {
        generateBtn.classList.remove('processing');
        generateBtn.disabled = false;
        generateBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 3L19 12L5 21V3Z" fill="currentColor"/>
            </svg>
            Convert to GIF
        `;

        progressContainer.style.display = 'none';
        gifContainer.style.display = 'block';
        downloadActions.style.display = 'grid';

        // Scroll to result
        gifContainer.scrollIntoView({ behavior: 'smooth' });
    }

    function resetUIState() {
        generateBtn.classList.remove('processing');
        generateBtn.disabled = false;
        progressContainer.style.display = 'none';
    }

    // ========================================================================
    // DOWNLOAD & RESET
    // ========================================================================
    downloadBtn.addEventListener('click', () => {
        if (!gifBlob) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(gifBlob);
        link.download = `San3a_GIF_${Date.now()}.gif`;
        link.click();
    });

    resetBtn.addEventListener('click', () => {
        videoInput.value = '';
        videoPreview.src = '';
        videoContainer.style.display = 'none';
        gifContainer.style.display = 'none';
        downloadActions.style.display = 'none';
        emptyPreview.style.display = 'flex';
        controlsArea.classList.add('disabled');
        progressContainer.style.display = 'none';
    });

    console.log('%c🎬 Video to GIF Tool Loaded', 'color: #DC2626; font-weight: bold;');

})();
