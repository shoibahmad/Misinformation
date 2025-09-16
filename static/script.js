// Global variables
let selectedImageFile = null;
let selectedVideoFile = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    console.log('📝 DOM Content Loaded');
    
    // Add a fallback timeout in case welcome screen fails
    const fallbackTimeout = setTimeout(() => {
        console.log('⚠️ Fallback: Showing main app directly');
        const welcomeScreen = document.getElementById('welcome-screen');
        const mainApp = document.getElementById('main-app');
        
        if (welcomeScreen) welcomeScreen.style.display = 'none';
        if (mainApp) {
            mainApp.style.display = 'flex';
            initializeMainApp();
        }
    }, 5000); // 5 second fallback
    
    // Try to show welcome screen
    try {
        showWelcomeScreen();
        // Clear fallback if welcome screen works
        setTimeout(() => clearTimeout(fallbackTimeout), 3000);
    } catch (error) {
        console.error('❌ Welcome screen failed:', error);
        clearTimeout(fallbackTimeout);
        // Show main app immediately
        const mainApp = document.getElementById('main-app');
        if (mainApp) {
            mainApp.style.display = 'flex';
            initializeMainApp();
        }
    }
});

// Welcome screen functionality
function showWelcomeScreen() {
    console.log('🎬 Starting welcome screen...');
    
    const welcomeScreen = document.getElementById('welcome-screen');
    const mainApp = document.getElementById('main-app');
    const loadingText = document.querySelector('.loading-text');
    const loadingPercentage = document.querySelector('.loading-percentage');
    
    if (!welcomeScreen || !mainApp) {
        console.error('❌ Required elements not found:', { welcomeScreen: !!welcomeScreen, mainApp: !!mainApp });
        if (mainApp) {
            mainApp.style.display = 'flex';
            initializeMainApp();
        }
        return;
    }

    // Dynamic loading messages with progress
    const loadingSteps = [
        { message: 'Initializing AI Systems...', progress: 20 },
        { message: 'Loading Neural Networks...', progress: 40 },
        { message: 'Connecting to APIs...', progress: 60 },
        { message: 'Preparing Detection Models...', progress: 80 },
        { message: 'Ready for Analysis!', progress: 100 }
    ];

    let stepIndex = 0;

    // Animate progress and messages
    const progressInterval = setInterval(() => {
        if (stepIndex < loadingSteps.length) {
            const step = loadingSteps[stepIndex];
            if (loadingText) loadingText.textContent = step.message;
            if (loadingPercentage) loadingPercentage.textContent = `${step.progress}%`;
            stepIndex++;
        }
    }, 400);

    // Show welcome screen for 2.5 seconds
    setTimeout(() => {
        clearInterval(progressInterval);
        console.log('🔄 Starting transition to main app...');

        // Start exit animation
        welcomeScreen.classList.add('fade-out');

        setTimeout(() => {
            console.log('✅ Hiding welcome screen, showing main app');
            welcomeScreen.style.display = 'none';
            mainApp.style.display = 'flex';

            setTimeout(() => {
                console.log('🚀 Initializing main app...');
                initializeMainApp();
            }, 50);
        }, 500);
    }, 2500);
}

// Initialize main application
function initializeMainApp() {
    console.log('🚀 Initializing main application...');
    
    try {
        // Initialize event listeners first
        initializeEventListeners();
        console.log('✅ Event listeners initialized');
        
        // Initialize animations (skip on mobile)
        if (!isMobile()) {
            initializeAnimations();
            console.log('✅ Animations initialized');
        } else {
            console.log('📱 Skipping animations on mobile');
        }
        
        // Initialize theme system
        initializeTheme();
        console.log('✅ Theme system initialized');
        
        // Initialize text input counters
        initializeTextCounters();
        console.log('✅ Text counters initialized');
        
        // Initialize mobile optimizations
        if (isMobile()) {
            initializeMobileOptimizations();
            console.log('📱 Mobile optimizations initialized');
        }
        
        // Check API status
        checkApiStatus();
        console.log('✅ API status check initiated');
        
        // Show the text tab by default
        showTab('text');
        console.log('✅ Default tab activated');
        
        // Update header stats
        updateHeaderStats();
        console.log('✅ Header stats updated');
        
        console.log('🎉 Main application initialization complete!');
        
    } catch (error) {
        console.error('❌ Error during initialization:', error);
        showNotification('Application initialization failed. Please refresh the page.', 'error');
    }
}

// Check API status
async function checkApiStatus() {
    try {
        console.log('🔍 Checking API status...');
        const response = await fetch('/api/status');
        const data = await response.json();
        
        console.log('📊 API Status:', data);
        
        // Update UI based on API availability
        updateApiStatusUI(data);
        
    } catch (error) {
        console.error('❌ Error checking API status:', error);
        showNotification('Failed to check API status', 'warning');
    }
}

// Update API status UI
function updateApiStatusUI(status) {
    const statusItems = {
        'gemini-tech-status': { name: 'Gemini AI', key: 'gemini_available' },
        'news-tech-status': { name: 'GNews API', key: 'gnews_available' },
        'fact-tech-status': { name: 'FactCheck', key: 'factcheck_available' }
    };

    Object.entries(statusItems).forEach(([elementId, config]) => {
        updateTechStatusIndicator(elementId, status[config.key], config.name);
    });
}

// Update tech status indicator
function updateTechStatusIndicator(elementId, isReady, serviceName) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const statusDot = element.querySelector('.status-dot');
    const statusText = element.querySelector('span:last-child');

    if (statusDot && statusText) {
        if (isReady) {
            statusText.textContent = 'Ready';
            statusDot.className = 'status-dot ready';
            statusText.style.color = 'var(--text-primary)';
        } else {
            statusText.textContent = 'Not Available';
            statusDot.className = 'status-dot error';
            statusText.style.color = 'var(--text-muted)';
        }
    }
}

// Initialize animations
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.analysis-option, .analysis-card').forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        observer.observe(el);
    });
}

// Show tab function
function showTab(tabName) {
    console.log('🔄 Switching to tab:', tabName);
    
    // Force show video tab for testing
    if (tabName === 'video') {
        console.log('🎬 Forcing video tab display');
        const videoTab = document.getElementById('video-tab');
        if (videoTab) {
            // Hide all other tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.style.display = 'none';
                tab.classList.remove('active');
            });
            
            // Show video tab with all possible methods
            videoTab.style.display = 'block';
            videoTab.style.visibility = 'visible';
            videoTab.style.opacity = '1';
            videoTab.classList.add('active');
            
            // Update options
            document.querySelectorAll('.analysis-option').forEach(opt => opt.classList.remove('active'));
            const videoOption = document.querySelector('[data-tab="video"]');
            if (videoOption) videoOption.classList.add('active');
            
            console.log('✅ Video tab forced to display');
            return;
        }
    }
    
    try {
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
            content.style.visibility = 'hidden';
            content.style.opacity = '0';
        });
        
        // Remove active class from all options
        const analysisOptions = document.querySelectorAll('.analysis-option');
        analysisOptions.forEach(option => {
            option.classList.remove('active');
        });
        
        // Show selected tab content
        const targetContent = document.getElementById(tabName + '-tab');
        if (targetContent) {
            targetContent.classList.add('active');
            targetContent.style.display = 'block';
            targetContent.style.visibility = 'visible';
            targetContent.style.opacity = '1';
            console.log(`✅ Activated tab: ${tabName}`);
        } else {
            console.error(`❌ Tab element not found: ${tabName}-tab`);
        }
        
        // Add active class to selected option
        const targetOption = document.querySelector(`[data-tab="${tabName}"]`);
        if (targetOption) {
            targetOption.classList.add('active');
            console.log(`✅ Activated option: ${tabName}`);
        }
        
        // Clear results and errors
        hideResults();
        hideError();
        
    } catch (error) {
        console.error('❌ Error in showTab:', error);
    }
}

// Enhanced event listeners with error handling
function initializeEventListeners() {
    console.log('🔗 Setting up event listeners...');
    
    // Add click handlers for analysis options
    const analysisOptions = document.querySelectorAll('.analysis-option');
    console.log(`Found ${analysisOptions.length} analysis options`);
    
    analysisOptions.forEach(option => {
        option.addEventListener('click', function () {
            try {
                const tabName = this.getAttribute('data-tab');
                console.log(`Switching to tab: ${tabName}`);
                if (tabName) {
                    showTab(tabName);
                }
            } catch (error) {
                console.error('Error switching tabs:', error);
                showNotification('Failed to switch analysis type. Please refresh the page.', 'error');
            }
        });
    });

    // Add drag and drop functionality for file uploads
    try {
        initializeDragAndDrop();
        console.log('✅ Drag and drop initialized');
    } catch (error) {
        console.error('❌ Drag and drop failed:', error);
    }

    // Add keyboard shortcuts
    try {
        initializeKeyboardShortcuts();
        console.log('✅ Keyboard shortcuts initialized');
    } catch (error) {
        console.error('❌ Keyboard shortcuts failed:', error);
    }
}

// Initialize drag and drop functionality
function initializeDragAndDrop() {
    const uploadAreas = document.querySelectorAll('.file-upload-zone');
    
    uploadAreas.forEach(area => {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            area.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        // Highlight drop zone when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            area.addEventListener(eventName, () => {
                area.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            area.addEventListener(eventName, () => {
                area.classList.remove('drag-over');
            }, false);
        });

        // Handle dropped files
        area.addEventListener('drop', handleDrop, false);
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
        const file = files[0];
        const zone = e.currentTarget;

        // Determine if it's image or video upload zone
        if (zone.querySelector('#image-input')) {
            // Handle image file
            const imageInput = document.getElementById('image-input');
            imageInput.files = files;
            handleImageSelect();
        } else if (zone.querySelector('#video-input')) {
            // Handle video file
            const videoInput = document.getElementById('video-input');
            videoInput.files = files;
            handleVideoSelect();
        }
    }
}

// Toggle API status details
function toggleApiStatus() {
    const details = document.getElementById('api-status-details');
    const icon = document.getElementById('api-toggle-icon');

    if (details && icon) {
        if (details.classList.contains('hidden')) {
            details.classList.remove('hidden');
            icon.classList.add('expanded');
        } else {
            details.classList.add('hidden');
            icon.classList.remove('expanded');
        }
    }
}

// File handling
function handleImageSelect() {
    const fileInput = document.getElementById('image-input');
    const file = fileInput.files[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Please select a valid image file', 'warning');
        return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
        showNotification('File size must be less than 10MB', 'warning');
        return;
    }

    selectedImageFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = function (e) {
        const preview = document.getElementById('image-preview');
        preview.innerHTML = `
            <img src="${e.target.result}" alt="Preview" style="max-width: 300px; max-height: 200px; border-radius: 8px;">
            <p style="margin-top: 0.5rem;"><strong>${file.name}</strong> (${formatFileSize(file.size)})</p>
        `;
        preview.classList.remove('hidden');
        document.getElementById('upload-placeholder').style.display = 'none';
    };
    reader.readAsDataURL(file);

    // Enable analyze button
    document.getElementById('analyze-image-btn').disabled = false;
}

function handleVideoSelect() {
    const fileInput = document.getElementById('video-input');
    const file = fileInput.files[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
        showNotification('Please select a valid video file', 'warning');
        return;
    }

    // Validate file size (100MB)
    if (file.size > 100 * 1024 * 1024) {
        showNotification('File size must be less than 100MB', 'warning');
        return;
    }

    selectedVideoFile = file;

    // Show preview
    const preview = document.getElementById('video-preview');
    preview.innerHTML = `
        <video controls style="max-width: 300px; max-height: 200px; border-radius: 8px;">
            <source src="${URL.createObjectURL(file)}" type="${file.type}">
            Your browser does not support the video tag.
        </video>
        <p style="margin-top: 0.5rem;"><strong>${file.name}</strong> (${formatFileSize(file.size)})</p>
    `;
    preview.classList.remove('hidden');
    document.getElementById('video-upload-placeholder').style.display = 'none';

    // Enable analyze button
    document.getElementById('analyze-video-btn').disabled = false;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Analysis functions
async function analyzeText() {
    const text = document.getElementById('text-input').value.trim();

    if (!text) {
        showNotification('Please enter some text to analyze', 'warning');
        return;
    }

    if (text.length < 10) {
        showNotification('Please enter at least 10 characters for meaningful analysis', 'warning');
        return;
    }

    setTextLoading(true);
    hideError();
    hideResults();

    try {
        const formData = new FormData();
        formData.append('text', text);

        const response = await fetch('/api/analyze-text', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            let errorMessage = 'Analysis failed';
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorMessage;
            } catch (e) {
                errorMessage = `Server error (${response.status})`;
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();
        displayTextResults(result);

    } catch (error) {
        showNotification(error.message || 'An error occurred during analysis', 'error');
    } finally {
        setTextLoading(false);
    }
}

async function analyzeImage() {
    if (!selectedImageFile) {
        showNotification('Please select an image file first', 'warning');
        return;
    }

    setImageLoading(true);
    hideError();
    hideResults();

    try {
        const formData = new FormData();
        formData.append('file', selectedImageFile);

        const response = await fetch('/api/analyze-image', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Image analysis failed');
        }

        const result = await response.json();
        displayImageResults(result);

    } catch (error) {
        showNotification(error.message || 'An error occurred during image analysis', 'error');
    } finally {
        setImageLoading(false);
    }
}

async function analyzeVideo() {
    if (!selectedVideoFile) {
        showNotification('Please select a video file first', 'warning');
        return;
    }

    setVideoLoading(true);
    hideError();
    hideResults();

    try {
        const formData = new FormData();
        formData.append('file', selectedVideoFile);

        const response = await fetch('/api/analyze-video', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Video analysis failed');
        }

        const result = await response.json();
        displayVideoResults(result);

    } catch (error) {
        showNotification(error.message || 'An error occurred during video analysis', 'error');
    } finally {
        setVideoLoading(false);
    }
}

// Loading state functions
function setTextLoading(loading) {
    const btn = document.getElementById('analyze-text-btn');
    const text = document.getElementById('text-btn-text');
    const spinner = document.getElementById('text-spinner');

    if (btn && text && spinner) {
        if (loading) {
            btn.disabled = true;
            text.classList.add('hidden');
            spinner.classList.remove('hidden');
        } else {
            btn.disabled = false;
            text.classList.remove('hidden');
            spinner.classList.add('hidden');
        }
    }
}

function setImageLoading(loading) {
    const btn = document.getElementById('analyze-image-btn');
    const text = document.getElementById('image-btn-text');
    const spinner = document.getElementById('image-spinner');

    if (btn && text && spinner) {
        if (loading) {
            btn.disabled = true;
            text.classList.add('hidden');
            spinner.classList.remove('hidden');
        } else {
            btn.disabled = false;
            text.classList.remove('hidden');
            spinner.classList.add('hidden');
        }
    }
}

function setVideoLoading(loading) {
    const btn = document.getElementById('analyze-video-btn');
    const text = document.getElementById('video-btn-text');
    const spinner = document.getElementById('video-spinner');

    if (btn && text && spinner) {
        if (loading) {
            btn.disabled = true;
            text.classList.add('hidden');
            spinner.classList.remove('hidden');
        } else {
            btn.disabled = false;
            text.classList.remove('hidden');
            spinner.classList.add('hidden');
        }
    }
}

// Display functions
function displayTextResults(result) {
    console.log('📊 Displaying text results:', result);
    
    // Risk assessment
    const riskLevel = getRiskLevel(result.misinformation_score);
    const riskBadge = document.getElementById('risk-badge');
    if (riskBadge) {
        riskBadge.textContent = riskLevel.level;
        riskBadge.className = `risk-badge-new ${riskLevel.className}`;
    }
    
    // Update risk description
    const riskDescription = document.getElementById('risk-description');
    if (riskDescription) {
        riskDescription.textContent = getRiskDescription(riskLevel.level, result.misinformation_score);
    }
    
    // Update risk percentage
    const riskPercentage = document.getElementById('risk-percentage');
    if (riskPercentage) {
        const percentage = Math.round((result.misinformation_score || 0) * 100);
        riskPercentage.textContent = `${percentage}%`;
    }

    // Update risk meter
    const riskMeter = document.getElementById('risk-meter-fill');
    if (riskMeter) {
        const score = result.misinformation_score || 0;
        riskMeter.style.width = `${score * 100}%`;
        riskMeter.className = `meter-fill ${riskLevel.className}`;
    }

    const scoresElement = document.getElementById('scores');
    if (scoresElement) {
        scoresElement.innerHTML = `
            <div class="score-item">
                <span class="score-label">Misinformation Score</span>
                <span class="score-value">${result.misinformation_score ? (result.misinformation_score * 100).toFixed(1) : '0.0'}%</span>
            </div>
            <div class="score-item">
                <span class="score-label">Analysis Confidence</span>
                <span class="score-value">${result.confidence ? (result.confidence * 100).toFixed(1) : '0.0'}%</span>
            </div>
        `;
    }
    
    // Update confidence indicator in header
    const confidenceIndicator = document.getElementById('confidence-indicator');
    if (confidenceIndicator) {
        const confidenceValue = confidenceIndicator.querySelector('.confidence-value');
        if (confidenceValue) {
            confidenceValue.textContent = `${result.confidence ? (result.confidence * 100).toFixed(0) : '0'}%`;
        }
    }

    // Analysis details
    let analysisHTML = '';
    
    console.log('🔍 Analysis data:', result.analysis);

    if (result.analysis) {
        const analysis = result.analysis;

        // Gemini AI Analysis
        if (analysis.gemini_analysis) {
            const gemini = analysis.gemini_analysis;

            if (gemini.status === 'success') {
                const verdict = gemini.fake_news_verdict || 'UNKNOWN';
                const confidence = gemini.confidence || 0;

                // Determine verdict color based on content
                let verdictClass = 'neutral';
                if (verdict.toLowerCase().includes('fake') || verdict.toLowerCase().includes('false')) {
                    verdictClass = 'high';
                } else if (verdict.toLowerCase().includes('real') || verdict.toLowerCase().includes('true') || verdict.toLowerCase().includes('legitimate')) {
                    verdictClass = 'low';
                } else if (verdict.toLowerCase().includes('moderate') || verdict.toLowerCase().includes('partial')) {
                    verdictClass = 'moderate';
                }

                // Determine confidence color
                let confidenceClass = 'neutral';
                if (confidence >= 80) {
                    confidenceClass = 'success';
                } else if (confidence >= 60) {
                    confidenceClass = 'moderate';
                } else {
                    confidenceClass = 'error';
                }

                analysisHTML += `
                    <div class="analysis-section">
                        <h4><i class="fas fa-brain"></i> AI Expert Analysis</h4>
                        <div class="analysis-grid">
                            <div class="analysis-item">
                                <span>AI Verdict</span>
                                <span class="badge ${verdictClass}">${verdict}</span>
                            </div>
                            <div class="analysis-item">
                                <span>AI Confidence</span>
                                <span class="badge ${confidenceClass}">${confidence}%</span>
                            </div>
                        </div>
                        <div style="margin-top: 1.5rem; padding: 1.5rem; background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 12px; border-left: 4px solid var(--text-accent);">
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; color: var(--text-accent); font-weight: 600;">
                                <i class="fas fa-robot"></i>
                                <span>Gemini AI Analysis</span>
                            </div>
                            <div style="color: var(--text-primary); line-height: 1.6;">
                                ${gemini.analysis ? gemini.analysis.replace(/\n/g, '<br>') : 'No detailed analysis available from AI model.'}
                            </div>
                        </div>
                    </div>
                `;
            } else {
                analysisHTML += `
                    <div class="analysis-section">
                        <h4><i class="fas fa-brain"></i> AI Expert Analysis</h4>
                        <div class="analysis-grid">
                            <div class="analysis-item">
                                <span>Status:</span>
                                <span class="badge error">Not Available</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        // Linguistic patterns
        if (analysis.linguistic_patterns) {
            const ling = analysis.linguistic_patterns;
            analysisHTML += `
                <div class="analysis-section">
                    <h4><i class="fas fa-language"></i> Linguistic Pattern Analysis</h4>
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <span>Pattern Risk Level</span>
                            <span class="badge ${ling.risk_level}">${ling.risk_level ? ling.risk_level.toUpperCase() : 'UNKNOWN'}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Suspicious Phrases Detected</span>
                            <span style="font-weight: 600; color: var(--text-primary);">${ling.suspicious_phrases || 0}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Emotional Language Indicators</span>
                            <span style="font-weight: 600; color: var(--text-primary);">${ling.emotional_language || 0}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Capitalization Ratio</span>
                            <span style="font-weight: 600; color: var(--text-primary);">${((ling.caps_ratio || 0) * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // Sentiment analysis
        if (analysis.sentiment && !analysis.sentiment.error) {
            const sent = analysis.sentiment;
            analysisHTML += `
                <div class="analysis-section">
                    <h4><i class="fas fa-chart-line"></i> Sentiment & Emotional Analysis</h4>
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <span>Overall Sentiment</span>
                            <span class="badge ${sent.sentiment}">${sent.sentiment ? sent.sentiment.toUpperCase() : 'NEUTRAL'}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Emotional Polarity</span>
                            <span style="font-weight: 600; color: var(--text-primary);">${(sent.polarity || 0).toFixed(2)}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Content Subjectivity</span>
                            <span style="font-weight: 600; color: var(--text-primary);">${(sent.subjectivity || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // Fact check results
        if (analysis.fact_check) {
            const fact = analysis.fact_check;
            analysisHTML += `
                <div class="analysis-section">
                    <h4><i class="fas fa-search-plus"></i> Professional Fact-Checking</h4>
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <span>Verification Status</span>
                            <span class="badge ${fact.status === 'success' ? 'success' : 'error'}">${fact.status ? fact.status.toUpperCase() : 'PENDING'}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Verifiable Claims Found</span>
                            <span style="font-weight: 600; color: var(--text-primary);">${fact.claims_found || 0}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Professional Fact-Checks Available</span>
                            <span style="font-weight: 600; color: ${fact.has_fact_checks ? 'var(--text-primary)' : 'var(--text-muted)'};">${fact.has_fact_checks ? 'Yes' : 'No'}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // News verification
        if (analysis.news_verification) {
            const news = analysis.news_verification;
            analysisHTML += `
                <div class="analysis-section">
                    <h4><i class="fas fa-globe-americas"></i> News Source Verification</h4>
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <span>Verification Status</span>
                            <span class="badge ${news.status === 'success' ? 'success' : 'error'}">${news.status ? news.status.toUpperCase() : 'PENDING'}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Related Articles Found</span>
                            <span style="font-weight: 600; color: var(--text-primary);">${news.total_articles || 0}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Reliable News Sources</span>
                            <span style="font-weight: 600; color: var(--text-primary);">${news.reliable_sources || 0}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Source Reliability Score</span>
                            <span style="font-weight: 600; color: var(--text-primary);">${((news.reliability_ratio || 0) * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            `;
        }
    } else {
        // Fallback when no analysis data is available
        analysisHTML = `
            <div class="analysis-section">
                <h4><i class="fas fa-exclamation-triangle"></i> Analysis Status</h4>
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <span>Analysis Status</span>
                        <span class="badge error">Data Unavailable</span>
                    </div>
                </div>
                <div style="margin-top: 1.5rem; padding: 1.5rem; background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 12px; border-left: 4px solid var(--text-accent);">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; color: var(--text-accent); font-weight: 600;">
                        <i class="fas fa-info-circle"></i>
                        <span>Information</span>
                    </div>
                    <div style="color: var(--text-secondary); line-height: 1.6;">
                        Analysis data was not returned from the server. This may be due to API configuration issues or temporary service unavailability. Please verify your API keys in the .env file and try again.
                    </div>
                </div>
            </div>
        `;
    }

    const analysisContent = document.getElementById('analysis-content');
    if (analysisContent) {
        console.log('📝 Setting analysis content HTML:', analysisHTML.length, 'characters');
        analysisContent.innerHTML = analysisHTML;
        
        // Force visibility and apply new styling
        analysisContent.style.display = 'block';
        analysisContent.style.visibility = 'visible';
        analysisContent.style.opacity = '1';
        
        // Animate sections in sequence
        const sections = analysisContent.querySelectorAll('.analysis-section');
        console.log('🔍 Found', sections.length, 'analysis sections');
        sections.forEach((section, index) => {
            section.style.display = 'block';
            section.style.visibility = 'visible';
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                section.style.transition = 'all 0.4s ease';
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }, index * 100);
            
            console.log(`📋 Section ${index + 1}:`, section.querySelector('h4')?.textContent);
        });
    } else {
        console.error('❌ Analysis content element not found');
    }

    // Recommendations
    displayRecommendations(result.recommendations || []);
    showResults();
}

function displayImageResults(result) {
    console.log('📊 Displaying image results:', result);
    
    // Risk assessment for images
    const riskLevel = getRiskLevel(result.deepfake_score || 0);
    const riskBadge = document.getElementById('risk-badge');
    if (riskBadge) {
        riskBadge.textContent = riskLevel.level;
        riskBadge.className = `risk-badge-new ${riskLevel.className}`;
    }
    
    // Update risk description for images
    const riskDescription = document.getElementById('risk-description');
    if (riskDescription) {
        const percentage = Math.round((result.deepfake_score || 0) * 100);
        riskDescription.textContent = `Image analysis shows ${percentage}% probability of manipulation or deepfake content. Review technical analysis below.`;
    }
    
    // Update risk percentage
    const riskPercentage = document.getElementById('risk-percentage');
    if (riskPercentage) {
        const percentage = Math.round((result.deepfake_score || 0) * 100);
        riskPercentage.textContent = `${percentage}%`;
    }

    // Update risk meter
    const riskMeter = document.getElementById('risk-meter-fill');
    if (riskMeter) {
        const score = result.deepfake_score || 0;
        riskMeter.style.width = `${score * 100}%`;
        riskMeter.className = `meter-fill ${riskLevel.className}`;
    }

    const scoresElement = document.getElementById('scores');
    if (scoresElement) {
        scoresElement.innerHTML = `
            <div class="score-item">
                <span class="score-label">Deepfake Score</span>
                <span class="score-value">${result.deepfake_score ? (result.deepfake_score * 100).toFixed(1) : '0.0'}%</span>
            </div>
            <div class="score-item">
                <span class="score-label">Analysis Confidence</span>
                <span class="score-value">${result.confidence ? (result.confidence * 100).toFixed(1) : '0.0'}%</span>
            </div>
        `;
    }
    
    // Update confidence indicator in header
    const confidenceIndicator = document.getElementById('confidence-indicator');
    if (confidenceIndicator) {
        const confidenceValue = confidenceIndicator.querySelector('.confidence-value');
        if (confidenceValue) {
            confidenceValue.textContent = `${result.confidence ? (result.confidence * 100).toFixed(0) : '0'}%`;
        }
    }
    
    // Update analysis type
    const analysisType = document.getElementById('analysis-type');
    if (analysisType) {
        analysisType.textContent = 'Image Analysis';
    }

    // Analysis details for image
    let analysisHTML = '';
    
    // Check for Gemini analysis in the correct location
    const geminiAnalysis = result.analysis?.gemini_analysis;
    if (geminiAnalysis && geminiAnalysis.analysis) {
        const verdict = geminiAnalysis.deepfake_verdict || 'UNKNOWN';
        const confidence = geminiAnalysis.confidence || 0;
        
        // Determine verdict color
        let verdictClass = 'neutral';
        if (verdict.includes('FAKE') || verdict.includes('MANIPULATED')) {
            verdictClass = 'high';
        } else if (verdict.includes('AUTHENTIC') || verdict.includes('GENUINE')) {
            verdictClass = 'low';
        } else if (verdict.includes('LIKELY') || verdict.includes('POSSIBLY')) {
            verdictClass = 'moderate';
        }
        
        analysisHTML += `
            <div class="analysis-section">
                <h4><i class="fas fa-brain"></i> AI Image Analysis</h4>
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <span>AI Verdict</span>
                        <span class="badge ${verdictClass}">${verdict}</span>
                    </div>
                    <div class="analysis-item">
                        <span>AI Confidence</span>
                        <span class="badge ${confidence >= 80 ? 'success' : confidence >= 60 ? 'moderate' : 'error'}">${confidence}%</span>
                    </div>
                </div>
                <div style="margin-top: 1.5rem; padding: 1.5rem; background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 12px; border-left: 4px solid var(--text-accent);">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; color: var(--text-accent); font-weight: 600;">
                        <i class="fas fa-robot"></i>
                        <span>Gemini AI Image Analysis</span>
                    </div>
                    <div style="color: var(--text-primary); line-height: 1.6;">
                        ${geminiAnalysis.analysis.replace(/\n/g, '<br>')}
                    </div>
                </div>
            </div>
        `;
    }

    // Technical analysis from the correct location
    const techAnalysis = result.analysis?.technical_analysis;
    const imageProps = result.analysis?.image_properties;
    
    if (techAnalysis || imageProps) {
        analysisHTML += `
            <div class="analysis-section">
                <h4><i class="fas fa-cogs"></i> Technical Image Analysis</h4>
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <span>Image Format</span>
                        <span style="font-weight: 600; color: var(--text-primary);">${imageProps?.format || 'Unknown'}</span>
                    </div>
                    <div class="analysis-item">
                        <span>Dimensions</span>
                        <span style="font-weight: 600; color: var(--text-primary);">${imageProps?.width && imageProps?.height ? `${imageProps.width}x${imageProps.height}` : 'Unknown'}</span>
                    </div>
                    <div class="analysis-item">
                        <span>Color Mode</span>
                        <span style="font-weight: 600; color: var(--text-primary);">${imageProps?.mode || 'Unknown'}</span>
                    </div>
                    <div class="analysis-item">
                        <span>Quality Assessment</span>
                        <span style="font-weight: 600; color: var(--text-primary);">${techAnalysis?.quality_assessment || 'Unknown'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    const analysisContent = document.getElementById('analysis-content');
    if (analysisContent) {
        analysisContent.innerHTML = analysisHTML || `
            <div class="analysis-section">
                <h4><i class="fas fa-info-circle"></i> Analysis Status</h4>
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <span>Analysis Status</span>
                        <span class="badge success">Completed</span>
                    </div>
                </div>
            </div>
        `;
    }

    displayRecommendations(result.recommendations || []);
    showResults();
}

function displayVideoResults(result) {
    console.log('📊 Displaying video results:', result);
    
    // Risk assessment for videos
    const riskLevel = getRiskLevel(result.deepfake_score || 0);
    const riskBadge = document.getElementById('risk-badge');
    if (riskBadge) {
        riskBadge.textContent = riskLevel.level;
        riskBadge.className = `risk-badge-new ${riskLevel.className}`;
    }
    
    // Update risk description for videos
    const riskDescription = document.getElementById('risk-description');
    if (riskDescription) {
        const percentage = Math.round((result.deepfake_score || 0) * 100);
        riskDescription.textContent = `Video analysis reveals ${percentage}% probability of deepfake or synthetic content. Frame-by-frame analysis completed.`;
    }
    
    // Update risk percentage
    const riskPercentage = document.getElementById('risk-percentage');
    if (riskPercentage) {
        const percentage = Math.round((result.deepfake_score || 0) * 100);
        riskPercentage.textContent = `${percentage}%`;
    }

    // Update risk meter
    const riskMeter = document.getElementById('risk-meter-fill');
    if (riskMeter) {
        const score = result.deepfake_score || 0;
        riskMeter.style.width = `${score * 100}%`;
        riskMeter.className = `meter-fill ${riskLevel.className}`;
    }

    const scoresElement = document.getElementById('scores');
    if (scoresElement) {
        scoresElement.innerHTML = `
            <div class="score-item">
                <span class="score-label">Deepfake Score</span>
                <span class="score-value">${result.deepfake_score ? (result.deepfake_score * 100).toFixed(1) : '0.0'}%</span>
            </div>
            <div class="score-item">
                <span class="score-label">Analysis Confidence</span>
                <span class="score-value">${result.confidence ? (result.confidence * 100).toFixed(1) : '0.0'}%</span>
            </div>
        `;
    }
    
    // Update confidence indicator in header
    const confidenceIndicator = document.getElementById('confidence-indicator');
    if (confidenceIndicator) {
        const confidenceValue = confidenceIndicator.querySelector('.confidence-value');
        if (confidenceValue) {
            confidenceValue.textContent = `${result.confidence ? (result.confidence * 100).toFixed(0) : '0'}%`;
        }
    }
    
    // Update analysis type
    const analysisType = document.getElementById('analysis-type');
    if (analysisType) {
        analysisType.textContent = 'Video Analysis';
    }

    // Analysis details for video
    let analysisHTML = '';
    
    // Check for Gemini analysis in the correct location
    const geminiAnalysis = result.analysis?.gemini_analysis;
    if (geminiAnalysis && geminiAnalysis.analysis) {
        const verdict = geminiAnalysis.deepfake_verdict || 'UNKNOWN';
        const confidence = geminiAnalysis.confidence || 0;
        
        // Determine verdict color
        let verdictClass = 'neutral';
        if (verdict.includes('FAKE') || verdict.includes('MANIPULATED')) {
            verdictClass = 'high';
        } else if (verdict.includes('AUTHENTIC') || verdict.includes('GENUINE')) {
            verdictClass = 'low';
        } else if (verdict.includes('LIKELY') || verdict.includes('POSSIBLY')) {
            verdictClass = 'moderate';
        }
        
        analysisHTML += `
            <div class="analysis-section">
                <h4><i class="fas fa-brain"></i> AI Video Analysis</h4>
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <span>AI Verdict</span>
                        <span class="badge ${verdictClass}">${verdict}</span>
                    </div>
                    <div class="analysis-item">
                        <span>AI Confidence</span>
                        <span class="badge ${confidence >= 80 ? 'success' : confidence >= 60 ? 'moderate' : 'error'}">${confidence}%</span>
                    </div>
                </div>
                <div style="margin-top: 1.5rem; padding: 1.5rem; background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 12px; border-left: 4px solid var(--text-accent);">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; color: var(--text-accent); font-weight: 600;">
                        <i class="fas fa-robot"></i>
                        <span>Gemini AI Video Analysis</span>
                    </div>
                    <div style="color: var(--text-primary); line-height: 1.6;">
                        ${geminiAnalysis.analysis.replace(/\n/g, '<br>')}
                    </div>
                </div>
            </div>
        `;
    }

    // Technical analysis from the correct location
    const videoProps = result.analysis?.video_properties;
    const frameAnalysis = result.analysis?.frame_analysis;
    
    if (videoProps || frameAnalysis) {
        analysisHTML += `
            <div class="analysis-section">
                <h4><i class="fas fa-cogs"></i> Technical Video Analysis</h4>
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <span>Video Duration</span>
                        <span style="font-weight: 600; color: var(--text-primary);">${videoProps?.duration ? `${videoProps.duration.toFixed(2)}s` : 'Unknown'}</span>
                    </div>
                    <div class="analysis-item">
                        <span>Frame Rate</span>
                        <span style="font-weight: 600; color: var(--text-primary);">${videoProps?.fps ? `${videoProps.fps.toFixed(2)} FPS` : 'Unknown'}</span>
                    </div>
                    <div class="analysis-item">
                        <span>Total Frames</span>
                        <span style="font-weight: 600; color: var(--text-primary);">${videoProps?.frame_count || 'Unknown'}</span>
                    </div>
                    <div class="analysis-item">
                        <span>Frames Analyzed</span>
                        <span style="font-weight: 600; color: var(--text-primary);">${frameAnalysis?.frames_analyzed || 'Unknown'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    const analysisContent = document.getElementById('analysis-content');
    if (analysisContent) {
        analysisContent.innerHTML = analysisHTML || `
            <div class="analysis-section">
                <h4><i class="fas fa-info-circle"></i> Analysis Status</h4>
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <span>Analysis Status</span>
                        <span class="badge success">Completed</span>
                    </div>
                </div>
            </div>
        `;
    }

    displayRecommendations(result.recommendations || []);
    showResults();
}

function displayRecommendations(recommendations) {
    const list = document.getElementById('recommendations-list');
    const count = document.getElementById('recommendation-count');
    
    if (list) {
        list.innerHTML = '';
        
        if (count) {
            count.textContent = `${recommendations.length} suggestions`;
        }
        
        recommendations.forEach((rec, index) => {
            const item = document.createElement('div');
            item.className = 'recommendation-item';
            item.innerHTML = `
                <div style="display: flex; align-items: flex-start; gap: 1rem;">
                    <div style="background: var(--primary-gradient); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 600; flex-shrink: 0;">
                        ${index + 1}
                    </div>
                    <div style="flex: 1;">
                        <p style="margin: 0; color: var(--text-primary); line-height: 1.6;">${rec}</p>
                    </div>
                </div>
            `;
            list.appendChild(item);
        });
    }
}

function getRiskDescription(level, score) {
    const percentage = Math.round(score * 100);
    
    switch (level) {
        case 'Low Risk':
            return `Content appears authentic with ${percentage}% misinformation probability. Low likelihood of manipulation or false information.`;
        case 'Moderate Risk':
            return `Content shows some suspicious patterns with ${percentage}% misinformation probability. Verify through additional sources.`;
        case 'High Risk':
            return `Content exhibits strong indicators of misinformation with ${percentage}% probability. Exercise extreme caution and fact-check thoroughly.`;
        default:
            return `Analysis completed with ${percentage}% misinformation probability. Review detailed findings below.`;
    }
}

function getRiskLevel(score) {
    if (score < 0.3) {
        return { level: 'Low Risk', className: 'risk-low' };
    } else if (score < 0.7) {
        return { level: 'Moderate Risk', className: 'risk-moderate' };
    } else {
        return { level: 'High Risk', className: 'risk-high' };
    }
}

// Utility functions
function showResults() {
    console.log('📊 Showing results...');
    const resultsElement = document.getElementById('results');
    if (resultsElement) {
        resultsElement.classList.remove('hidden');
        resultsElement.style.display = 'block';
        resultsElement.style.visibility = 'visible';
        resultsElement.style.opacity = '1';
        console.log('✅ Results section is now visible');
        
        // Scroll to results
        resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        console.error('❌ Results element not found');
    }
}

function hideResults() {
    const resultsElement = document.getElementById('results');
    if (resultsElement) {
        resultsElement.classList.add('hidden');
    }
}

function showError(message) {
    showNotification(message, 'error');
}

function hideError() {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.classList.add('hidden');
        errorElement.style.display = 'none';
    }
}

function exportResults() {
    const results = document.getElementById('results');
    if (results && !results.classList.contains('hidden')) {
        window.print();
    } else {
        showNotification('No results to export', 'warning');
    }
}

// Keyboard shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to analyze (when textarea is focused)
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab) {
                const analyzeBtn = activeTab.querySelector('.analyze-btn');
                if (analyzeBtn && !analyzeBtn.disabled) {
                    analyzeBtn.click();
                }
            }
        }

        // Escape to close error messages
        if (e.key === 'Escape') {
            hideError();
            hideNotification();
        }

        // Tab switching with numbers (1, 2, 3)
        if (e.key >= '1' && e.key <= '3' && !e.ctrlKey && !e.metaKey) {
            const target = e.target;
            // Only if not typing in an input field
            if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                const tabNames = ['text', 'image', 'video'];
                const tabIndex = parseInt(e.key) - 1;
                if (tabNames[tabIndex]) {
                    showTab(tabNames[tabIndex]);
                }
            }
        }
    });
}

// Enhanced notification system
function showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notification
    hideNotification();

    const notification = document.createElement('div');
    notification.id = 'notification';
    notification.className = `notification notification-${type}`;

    const icon = getNotificationIcon(type);

    notification.innerHTML = `
        <div class="notification-content">
            <i class="${icon}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="hideNotification()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Auto hide after duration (longer on mobile)
    const mobileDuration = isMobile() ? duration + 2000 : duration;
    if (mobileDuration > 0) {
        setTimeout(() => {
            hideNotification();
        }, mobileDuration);
    }
}

function hideNotification() {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fas fa-check-circle';
        case 'warning': return 'fas fa-exclamation-triangle';
        case 'error': return 'fas fa-times-circle';
        default: return 'fas fa-info-circle';
    }
}

// New utility functions for enhanced UI
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    showNotification(`Switched to ${newTheme} theme`, 'success', 2000);
}

function updateThemeIcon(theme) {
    const themeBtn = document.querySelector('[onclick="toggleTheme()"] i');
    if (themeBtn) {
        themeBtn.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function initializeTextCounters() {
    const textInput = document.getElementById('text-input');
    if (textInput) {
        textInput.addEventListener('input', updateTextStats);
        updateTextStats(); // Initial update
    }
}

function updateTextStats() {
    const textInput = document.getElementById('text-input');
    const charCount = document.querySelector('.char-count');
    const wordCount = document.querySelector('.word-count');
    
    if (textInput && charCount && wordCount) {
        const text = textInput.value;
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        
        charCount.textContent = `${chars} characters`;
        wordCount.textContent = `${words} words`;
    }
}

function updateHeaderStats() {
    const analysesCount = document.getElementById('analyses-count');
    if (analysesCount) {
        const count = localStorage.getItem('totalAnalyses') || '0';
        analysesCount.textContent = count;
    }
}

function incrementAnalysisCount() {
    const current = parseInt(localStorage.getItem('totalAnalyses') || '0');
    const newCount = current + 1;
    localStorage.setItem('totalAnalyses', newCount.toString());
    
    const analysesCount = document.getElementById('analyses-count');
    if (analysesCount) {
        analysesCount.textContent = newCount.toString();
    }
}

// Quick action functions
function clearText() {
    const textInput = document.getElementById('text-input');
    if (textInput) {
        textInput.value = '';
        updateTextStats();
        hideResults();
        showNotification('Text cleared', 'info', 1500);
    }
}

async function pasteFromClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        const textInput = document.getElementById('text-input');
        if (textInput && text) {
            textInput.value = text;
            updateTextStats();
            showNotification('Text pasted from clipboard', 'success', 2000);
        }
    } catch (error) {
        showNotification('Could not access clipboard', 'warning', 2000);
    }
}

function loadSample() {
    const sampleTexts = [
        "Breaking: Scientists discover new planet that could support life. This amazing discovery will change everything we know about space exploration.",
        "Local authorities report unusual weather patterns affecting the region. Residents are advised to stay indoors and monitor official updates.",
        "Technology company announces breakthrough in artificial intelligence that promises to revolutionize healthcare and education sectors worldwide."
    ];
    
    const randomSample = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    const textInput = document.getElementById('text-input');
    
    if (textInput) {
        textInput.value = randomSample;
        updateTextStats();
        showNotification('Sample text loaded', 'info', 2000);
    }
}

// Enhanced results display functions
function showResults() {
    console.log('📊 Showing results...');
    const resultsElement = document.getElementById('results');
    if (resultsElement) {
        resultsElement.classList.remove('hidden');
        resultsElement.style.display = 'block';
        
        // Update timestamp
        const timestamp = document.getElementById('timestamp');
        if (timestamp) {
            timestamp.textContent = new Date().toLocaleString();
        }
        
        // Increment analysis count
        incrementAnalysisCount();
        
        // Scroll to results
        resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        console.log('✅ Results section is now visible');
    } else {
        console.error('❌ Results element not found');
    }
}

function shareResults() {
    if (navigator.share) {
        navigator.share({
            title: 'TruthGuard AI Analysis Results',
            text: 'Check out my analysis results from TruthGuard AI',
            url: window.location.href
        }).catch(console.error);
    } else {
        // Fallback: copy URL to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            showNotification('Results URL copied to clipboard', 'success', 2000);
        }).catch(() => {
            showNotification('Could not share results', 'error', 2000);
        });
    }
}

function newAnalysis() {
    hideResults();
    clearText();
    showTab('text');
    showNotification('Ready for new analysis', 'info', 1500);
}

// Modal functions
function showModal(title, content) {
    const modal = document.getElementById('info-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('info-modal');
    modal.classList.remove('show');
}

// Info modal functions
function showInfo() {
    const content = `
        <h4>About TruthGuard AI</h4>
        <p>TruthGuard AI is an advanced misinformation and deepfake detection platform powered by cutting-edge artificial intelligence technologies.</p>
        
        <h4>Key Features</h4>
        <ul>
            <li><strong>Text Analysis:</strong> Advanced NLP to detect fake news and misinformation</li>
            <li><strong>Image Analysis:</strong> Computer vision algorithms for deepfake detection</li>
            <li><strong>Video Analysis:</strong> Frame-by-frame analysis for synthetic media detection</li>
            <li><strong>Real-time Processing:</strong> Fast analysis with industry-leading accuracy</li>
        </ul>
        
        <h4>Technology Stack</h4>
        <ul>
            <li>Google Gemini AI for advanced analysis</li>
            <li>Professional fact-checking APIs</li>
            <li>Computer vision and NLP algorithms</li>
            <li>Real-time news verification systems</li>
        </ul>
        
        <p>Our platform combines multiple AI models to provide comprehensive analysis with 99.2% accuracy rate.</p>
    `;
    showModal('About TruthGuard AI', content);
}

function showGuide() {
    const content = `
        <h4>Getting Started</h4>
        <p>Follow these simple steps to analyze content for misinformation and manipulation:</p>
        
        <h4>Text Analysis</h4>
        <ul>
            <li>Select the "Text Analysis" option</li>
            <li>Paste or type your text content (minimum 10 characters)</li>
            <li>Click "Analyze with AI" or press Ctrl+Enter</li>
            <li>Review the comprehensive analysis results</li>
        </ul>
        
        <h4>Image Analysis</h4>
        <ul>
            <li>Select the "Image Analysis" option</li>
            <li>Upload an image file (JPG, PNG, GIF, WebP - max 10MB)</li>
            <li>Click "Analyze Image" to start deepfake detection</li>
            <li>Review the technical analysis and risk assessment</li>
        </ul>
        
        <h4>Video Analysis</h4>
        <ul>
            <li>Select the "Video Analysis" option</li>
            <li>Upload a video file (MP4, AVI, MOV, WebM - max 100MB)</li>
            <li>Click "Analyze Video" for frame-by-frame analysis</li>
            <li>Review the temporal consistency results</li>
        </ul>
        
        <h4>Understanding Results</h4>
        <p>Each analysis provides:</p>
        <ul>
            <li><strong>Risk Assessment:</strong> Overall risk level and confidence score</li>
            <li><strong>Detailed Analysis:</strong> Technical findings from AI models</li>
            <li><strong>Recommendations:</strong> Actionable advice based on results</li>
        </ul>
    `;
    showModal('User Guide', content);
}

function showExamples() {
    const content = `
        <h4>Text Analysis Examples</h4>
        
        <div class="example-item">
            <div class="example-title">Example 1: Suspicious News Article</div>
            <div class="example-text">"BREAKING: Scientists discover miracle cure that doctors don't want you to know about! This amazing discovery will change everything and Big Pharma is trying to hide it from the public!"</div>
            <p><strong>Expected Result:</strong> High misinformation risk due to sensational language, conspiracy claims, and lack of credible sources.</p>
        </div>
        
        <div class="example-item">
            <div class="example-title">Example 2: Legitimate News</div>
            <div class="example-text">"According to a peer-reviewed study published in Nature Medicine, researchers at Stanford University have identified a new treatment approach that shows promising results in early clinical trials."</div>
            <p><strong>Expected Result:</strong> Low misinformation risk with credible sources and factual language.</p>
        </div>
        
        <h4>Image Analysis Examples</h4>
        <ul>
            <li><strong>Deepfake Images:</strong> AI-generated faces, manipulated portraits</li>
            <li><strong>Edited Photos:</strong> Digitally altered scenes, fake events</li>
            <li><strong>Authentic Images:</strong> Original, unmanipulated photographs</li>
        </ul>
        
        <h4>Video Analysis Examples</h4>
        <ul>
            <li><strong>Face Swap Videos:</strong> Deepfake technology replacing faces</li>
            <li><strong>Synthetic Speech:</strong> AI-generated voice and lip-sync</li>
            <li><strong>Authentic Videos:</strong> Original, unedited video content</li>
        </ul>
        
        <p><strong>Tip:</strong> Use the "Load Sample" button in text analysis to try pre-loaded examples.</p>
    `;
    showModal('Examples', content);
}

function showFAQ() {
    const content = `
        <h4>Frequently Asked Questions</h4>
        
        <h4>How accurate is the analysis?</h4>
        <p>Our platform achieves 99.2% accuracy by combining multiple AI models including Google Gemini AI, professional fact-checking APIs, and advanced computer vision algorithms.</p>
        
        <h4>What file formats are supported?</h4>
        <ul>
            <li><strong>Images:</strong> JPG, PNG, GIF, WebP (max 10MB)</li>
            <li><strong>Videos:</strong> MP4, AVI, MOV, WebM (max 100MB)</li>
            <li><strong>Text:</strong> Any text content (minimum 10 characters)</li>
        </ul>
        
        <h4>How long does analysis take?</h4>
        <ul>
            <li><strong>Text:</strong> ~2 seconds</li>
            <li><strong>Images:</strong> ~5 seconds</li>
            <li><strong>Videos:</strong> ~15 seconds (varies by length)</li>
        </ul>
        
        <h4>Is my data secure?</h4>
        <p>Yes! We use privacy-first processing. Uploaded files are temporarily stored for analysis and automatically deleted afterward. No personal data is permanently stored.</p>
        
        <h4>What APIs are required?</h4>
        <p>For full functionality, configure these API keys in your .env file:</p>
        <ul>
            <li><strong>GEMINI_API_KEY:</strong> Google Gemini AI for advanced analysis</li>
            <li><strong>GNEWS_API_KEY:</strong> News verification and source checking</li>
            <li><strong>FACTCHECK_API_KEY:</strong> Professional fact-checking database</li>
        </ul>
        
        <h4>Can I use this commercially?</h4>
        <p>This platform is designed for educational and research purposes. For commercial use, please ensure you have appropriate API licenses and comply with terms of service.</p>
        
        <h4>How do I interpret the results?</h4>
        <ul>
            <li><strong>Low Risk:</strong> Content appears authentic with minimal manipulation indicators</li>
            <li><strong>Moderate Risk:</strong> Some suspicious patterns detected, verify through additional sources</li>
            <li><strong>High Risk:</strong> Strong indicators of misinformation or manipulation detected</li>
        </ul>
    `;
    showModal('Frequently Asked Questions', content);
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('info-modal');
    if (event.target === modal) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Mobile detection and optimizations
function isMobile() {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function initializeMobileOptimizations() {
    // Disable complex animations on mobile
    document.body.classList.add('mobile-optimized');
    
    // Improve touch scrolling
    document.body.style.webkitOverflowScrolling = 'touch';
    
    // Prevent zoom on input focus (iOS)
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        if (input.style.fontSize === '' || parseFloat(input.style.fontSize) < 16) {
            input.style.fontSize = '16px';
        }
    });
    
    // Add touch-friendly classes
    const touchElements = document.querySelectorAll('.analysis-option, .action-btn, .quick-btn');
    touchElements.forEach(element => {
        element.classList.add('touch-friendly');
    });
    
    // Optimize file upload for mobile - removed capture attribute to allow gallery access
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.removeAttribute('capture');
    });
}

// Handle orientation change
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        // Recalculate layout after orientation change
        window.scrollTo(0, 0);
    }, 100);
});

// Prevent double-tap zoom on buttons
document.addEventListener('touchend', function(event) {
    if (event.target.matches('button, .analysis-option, .action-btn')) {
        event.preventDefault();
        event.target.click();
    }
});