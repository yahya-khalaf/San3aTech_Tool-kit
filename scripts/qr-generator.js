// QR Code Generator with Logo Overlay
// Based on Python implementation using segno + PIL

(function () {
    'use strict';

    // Elements
    const qrTextInput = document.getElementById('qrText');
    const qrColorInput = document.getElementById('qrColor');
    const qrColorHexInput = document.getElementById('qrColorHex');
    const bgColorInput = document.getElementById('bgColor');
    const bgColorHexInput = document.getElementById('bgColorHex');
    const logoSizeSlider = document.getElementById('logoSize');
    const logoSizeValue = document.getElementById('logoSizeValue');
    const generateBtn = document.getElementById('generateBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const qrCanvas = document.getElementById('qrCanvas');
    const previewPlaceholder = document.querySelector('.preview-placeholder');
    const logoOptions = document.querySelectorAll('.logo-option');

    let selectedLogo = 'san3a';
    let generatedQRDataURL = null;

    // Logo sources - Using actual image files
    const logos = {
        san3a: '../images/San3a-Academy-logo.png', // Actual logo file
        facebook: 'svg', // Will use SVG
        instagram: 'svg', // Will use SVG
        none: null
    };

    // Logo SVG data (for Facebook and Instagram)
    const logoSVGs = {
        facebook: `
            <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" rx="22" fill="#1877F2"/>
                <path d="M66.7 50c0-9.2-7.5-16.7-16.7-16.7S33.3 40.8 33.3 50c0 8.3 6.1 15.2 14.1 16.5v-11.6h-4.2V50h4.2v-3.7c0-4.2 2.5-6.5 6.3-6.5 1.8 0 3.7.3 3.7.3v4.1h-2.1c-2.1 0-2.7 1.3-2.7 2.6V50h4.6l-.7 4.8h-3.9v11.6c8-1.3 14.1-8.2 14.1-16.5z" fill="white"/>
            </svg>
        `,
        instagram: `
            <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#FD5;stop-opacity:1" />
                        <stop offset="50%" style="stop-color:#FF543E;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#C837AB;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="100" height="100" rx="22" fill="url(#ig-gradient)"/>
                <path d="M50 35.7c4.5 0 5 0 6.8.1 4.6.2 6.7 2.4 6.9 6.9.1 1.8.1 2.3.1 6.8s0 5-.1 6.8c-.2 4.5-2.3 6.7-6.9 6.9-1.8.1-2.3.1-6.8.1s-5 0-6.8-.1c-4.6-.2-6.7-2.4-6.9-6.9-.1-1.8-.1-2.3-.1-6.8s0-5 .1-6.8c.2-4.5 2.3-6.7 6.9-6.9 1.8-.1 2.3-.1 6.8-.1zM50 32c-4.6 0-5.2 0-7 .1-6.1.2-9.7 3.8-9.9 9.9-.1 1.8-.1 2.4-.1 7s0 5.2.1 7c.2 6.1 3.8 9.7 9.9 9.9 1.8.1 2.4.1 7 .1s5.2 0 7-.1c6.1-.2 9.7-3.8 9.9-9.9.1-1.8.1-2.4.1-7s0-5.2-.1-7c-.2-6.1-3.8-9.7-9.9-9.9-1.8-.1-2.4-.1-7-.1zm0 9.7c-4.8 0-8.6 3.9-8.6 8.6s3.9 8.6 8.6 8.6 8.6-3.9 8.6-8.6-3.9-8.6-8.6-8.6zm0 14.2c-3.1 0-5.6-2.5-5.6-5.6s2.5-5.6 5.6-5.6 5.6 2.5 5.6 5.6-2.5 5.6-5.6 5.6zm8.9-16.4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="white"/>
            </svg>
        `
    };

    // ========================================================================
    // COLOR SYNC
    // ========================================================================
    qrColorInput.addEventListener('input', (e) => {
        qrColorHexInput.value = e.target.value.toUpperCase();
    });

    qrColorHexInput.addEventListener('input', (e) => {
        const hex = e.target.value;
        if (/^#[0-9A-F]{6}$/i.test(hex)) {
            qrColorInput.value = hex;
        }
    });

    bgColorInput.addEventListener('input', (e) => {
        bgColorHexInput.value = e.target.value.toUpperCase();
    });

    bgColorHexInput.addEventListener('input', (e) => {
        const hex = e.target.value;
        if (/^#[0-9A-F]{6}$/i.test(hex)) {
            bgColorInput.value = hex;
        }
    });

    // ========================================================================
    // LOGO SIZE SLIDER
    // ========================================================================
    logoSizeSlider.addEventListener('input', (e) => {
        logoSizeValue.textContent = e.target.value + '%';
    });

    // ========================================================================
    // LOGO SELECTION
    // ========================================================================
    logoOptions.forEach(option => {
        option.addEventListener('click', () => {
            logoOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            selectedLogo = option.dataset.logo;
        });
    });

    // ========================================================================
    // GENERATE QR CODE
    // ========================================================================
    generateBtn.addEventListener('click', async () => {
        const text = qrTextInput.value.trim();

        if (!text) {
            alert('Please enter text or URL for the QR code');
            return;
        }

        try {
            generateBtn.disabled = true;
            generateBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="spinner">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" stroke-opacity="0.3"/>
                    <path d="M10 2a8 8 0 018 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Generating...
            `;

            // Add spinner animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .spinner { animation: spin 1s linear infinite; }
            `;
            document.head.appendChild(style);

            await generateQRWithLogo(text);

            generateBtn.disabled = false;
            generateBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2V18M2 10H18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Generate QR Code
            `;

            downloadBtn.disabled = false;

        } catch (error) {
            console.error('Error generating QR code:', error);
            alert('Failed to generate QR code. Please try again.');
            generateBtn.disabled = false;
        }
    });

    // ========================================================================
    // GENERATE QR WITH LOGO (Main Function)
    // ========================================================================
    async function generateQRWithLogo(text) {
        const qrColor = qrColorInput.value;
        const bgColor = bgColorInput.value;
        const logoSizePercent = parseInt(logoSizeSlider.value);

        // Step 1: Generate base QR code
        const baseQRDataURL = await generateBaseQR(text, qrColor, bgColor);

        // Step 2: If no logo, just display the base QR
        if (selectedLogo === 'none') {
            generatedQRDataURL = baseQRDataURL;
            displayQR(baseQRDataURL);
            return;
        }

        // Step 3: Add logo to QR code
        const qrWithLogo = await addLogoToQR(baseQRDataURL, selectedLogo, logoSizePercent);

        generatedQRDataURL = qrWithLogo;
        displayQR(qrWithLogo);
    }

    // ========================================================================
    // GENERATE BASE QR CODE
    // ========================================================================
    function generateBaseQR(text, color, background) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');

            // Use QRious library
            const qr = new QRious({
                element: canvas,
                value: text,
                size: 600,
                level: 'H', // High error correction
                foreground: color,
                background: background
            });

            resolve(canvas.toDataURL('image/png'));
        });
    }

    // ========================================================================
    // ADD LOGO TO QR CODE
    // ========================================================================
    async function addLogoToQR(qrDataURL, logoType, logoSizePercent) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const qrImage = new Image();
            qrImage.onload = () => {
                canvas.width = qrImage.width;
                canvas.height = qrImage.height;

                // Draw QR code
                ctx.drawImage(qrImage, 0, 0);

                // Calculate logo size and position
                const qrSize = qrImage.width;
                const logoSize = Math.floor(qrSize * (logoSizePercent / 100));
                const logoPos = Math.floor((qrSize - logoSize) / 2);

                // Create white rounded background for logo
                const bgPadding = 10;
                const bgSize = logoSize + bgPadding * 2;
                const bgPos = Math.floor((qrSize - bgSize) / 2);
                const borderRadius = 20;

                // Draw white background with rounded corners
                ctx.fillStyle = bgColorInput.value;
                ctx.beginPath();
                ctx.moveTo(bgPos + borderRadius, bgPos);
                ctx.lineTo(bgPos + bgSize - borderRadius, bgPos);
                ctx.quadraticCurveTo(bgPos + bgSize, bgPos, bgPos + bgSize, bgPos + borderRadius);
                ctx.lineTo(bgPos + bgSize, bgPos + bgSize - borderRadius);
                ctx.quadraticCurveTo(bgPos + bgSize, bgPos + bgSize, bgPos + bgSize - borderRadius, bgPos + bgSize);
                ctx.lineTo(bgPos + borderRadius, bgPos + bgSize);
                ctx.quadraticCurveTo(bgPos, bgPos + bgSize, bgPos, bgPos + bgSize - borderRadius);
                ctx.lineTo(bgPos, bgPos + borderRadius);
                ctx.quadraticCurveTo(bgPos, bgPos, bgPos + borderRadius, bgPos);
                ctx.closePath();
                ctx.fill();

                // Draw logo based on type
                const logoSource = logos[logoType];

                if (logoSource === 'svg') {
                    // Use SVG for Facebook/Instagram
                    const logoSVG = logoSVGs[logoType];
                    const logoBlob = new Blob([logoSVG], { type: 'image/svg+xml' });
                    const logoURL = URL.createObjectURL(logoBlob);

                    const logoImage = new Image();
                    logoImage.onload = () => {
                        ctx.drawImage(logoImage, logoPos, logoPos, logoSize, logoSize);
                        URL.revokeObjectURL(logoURL);
                        resolve(canvas.toDataURL('image/png'));
                    };
                    logoImage.src = logoURL;
                } else {
                    // Use PNG for San3a logo
                    const logoImage = new Image();
                    logoImage.onload = () => {
                        ctx.drawImage(logoImage, logoPos, logoPos, logoSize, logoSize);
                        resolve(canvas.toDataURL('image/png'));
                    };
                    logoImage.onerror = () => {
                        console.error('Failed to load logo image');
                        resolve(canvas.toDataURL('image/png')); // Return QR without logo
                    };
                    logoImage.src = logoSource;
                }
            };
            qrImage.src = qrDataURL;
        });
    }

    // ========================================================================
    // DISPLAY QR CODE
    // ========================================================================
    function displayQR(dataURL) {
        qrCanvas.style.display = 'block';
        previewPlaceholder.style.display = 'none';

        const img = new Image();
        img.onload = () => {
            qrCanvas.width = img.width;
            qrCanvas.height = img.height;
            const ctx = qrCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
        };
        img.src = dataURL;
    }

    // ========================================================================
    // DOWNLOAD QR CODE
    // ========================================================================
    downloadBtn.addEventListener('click', () => {
        if (!generatedQRDataURL) {
            alert('Please generate a QR code first');
            return;
        }

        const link = document.createElement('a');
        const filename = `San3a_QR_${selectedLogo}_${Date.now()}.png`;
        link.download = filename;
        link.href = generatedQRDataURL;
        link.click();
    });

    // ========================================================================
    // KEYBOARD SHORTCUTS
    // ========================================================================
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to generate
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            generateBtn.click();
        }

        // Ctrl/Cmd + S to download
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (!downloadBtn.disabled) {
                downloadBtn.click();
            }
        }
    });

    console.log('%c🎨 QR Code Generator Ready', 'font-size: 14px; font-weight: bold; color: #DC2626;');
    console.log('%cKeyboard Shortcuts:', 'font-size: 12px; font-weight: bold;');
    console.log('%c  • Cmd/Ctrl + Enter: Generate QR', 'font-size: 11px;');
    console.log('%c  • Cmd/Ctrl + S: Download QR', 'font-size: 11px;');

})();
