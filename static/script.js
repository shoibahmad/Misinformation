// Global variables
let selectedImageFile = null;
let selectedVideoFile = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    showWelcomeScreen();
});

// Welcome screen functionality
function showWelcomeScreen() {
    console.log('🎬 Starting welcome screen...');
    
    const welcomeScreen = document.getElementById('welcome-screen');
    const mainApp = document.getElementById('main-app');
    const loadingText = document.querySelector('.loading-text');
    
    if (!welcomeScreen || !mainApp) {
        console.error('❌ Required elements not found:', { welcomeScreen: !!welcomeScreen, mainApp: !!mainApp });
        return;
    }

    // Dynamic loading messages
    const loadingMessages = [
        'Initializing AI Systems...',
        'Loading Detection Models...',
        'Preparing Analysis Tools...',
        'Ready to Detect Misinformation!'
    ];

    let messageIndex = 0;

    // Change loading text every 750ms
    const messageInterval = setInterval(() => {
        if (messageIndex < loadingMessages.length - 1) {
            messageIndex++;
            if (loadingText) {
                loadingText.textContent = loadingMessages[messageIndex];
            }
        }
    }, 750);

    // Show welcome screen for 2 seconds
    setTimeout(() => {
        clearInterval(messageInterval);

        // Start exit animation
        welcomeScreen.classList.add('fade-out');

        // After exit animation completes, hide welcome and show main app
        setTimeout(() => {
            welcomeScreen.style.display = 'none';
            mainApp.style.display = 'flex';

            // Small delay to ensure DOM is ready
            setTimeout(() => {
                // Initialize main app functionality
                initializeMainApp();
            }, 100);
        }, 500);
    }, 2000);
}

// Initialize main application
function initializeMainApp() {
    console.log('🚀 Initializing main application...');
    
    try {
        checkApiStatus();
        console.log('✅ API status check initiated');
        
        initializeEventListeners();
        console.log('✅ Event listeners initialized');
        
        initializeAnimations();
        console.log('✅ Animations initialized');
        
        // Initialize history filters if elements exist
        if (document.getElementById('history-type-filter')) {
            initializeHistoryFilters();
            console.log('✅ History filters initialized');
        }
        
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
    // You can add visual indicators here if needed
    console.log('✅ API status updated:', status);
}

// Initialize animations
function initializeAnimations() {
    // Add any animation initialization here
    console.log('🎨 Animations initialized');
}

// Initialize drag and drop functionality
function initializeDragAndDrop() {
    console.log('📁 Drag and drop initialized');
    
    // Add drag and drop handlers for file upload areas
    const uploadAreas = document.querySelectorAll('.file-upload-zone');
    
    uploadAreas.forEach(area => {
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.classList.add('drag-over');
        });
        
        area.addEventListener('dragleave', (e) => {
            e.preventDefault();
            area.classList.remove('drag-over');
        });
        
        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload(files[0], area);
            }
        });
    });
}

// Handle file upload
function handleFileUpload(file, uploadArea) {
    console.log('📎 File uploaded:', file.name);
    // Add file handling logic here
}

// Show tab function
function showTab(tabName) {
    console.log('🔄 Switching to tab:', tabName);
    
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all options
    document.querySelectorAll('.analysis-option').forEach(option => {
        option.classList.remove('active');
    });
    
    // Show selected tab content
    const targetContent = document.getElementById(tabName + '-content');
    if (targetContent) {
        targetContent.classList.add('active');
    }
    
    // Add active class to selected option
    const targetOption = document.querySelector(`[data-tab="${tabName}"]`);
    if (targetOption) {
        targetOption.classList.add('active');
    }
}

// Show notification function
function showNotification(message, type = 'info', duration = 5000) {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after duration
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, duration);
}

// Enhanced event listeners with error handling
function initializeEventListeners() {
    // Add click handlers for analysis options
    document.querySelectorAll('.analysis-option').forEach(option => {
        option.addEventListener('click', function () {
            try {
                const tabName = this.getAttribute('data-tab');
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
    initializeDragAndDrop();

    // Add keyboard shortcuts
    initializeKeyboardShortcuts();
}

// Simple animations
function initializeAnimations() {
    // Simple fade-in animation for elements
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

// Simple tab switching
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active state from all options
    document.querySelectorAll('.analysis-option').forEach(option => {
        option.classList.remove('active');
    });

    // Show selected tab
    const targetTab = document.getElementById(tabName + '-tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Activate the corresponding analysis option
    const targetOption = document.querySelector(`[data-tab="${tabName}"]`);
    if (targetOption) {
        targetOption.classList.add('active');
    }

    // Clear results
    hideResults();
    hideError();
}

// Check API status with better error handling
async function checkApiStatus() {
    const statusItems = {
        'gemini-status': { name: 'Gemini AI', key: 'gemini_available' },
        'newsapi-status': { name: 'NewsAPI', key: 'newsdata_available' },
        'factcheck-status': { name: 'FactCheck', key: 'factcheck_available' }
    };

    try {
        const response = await fetch('/api/status');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const status = await response.json();

        Object.entries(statusItems).forEach(([elementId, config]) => {
            updateStatusIndicator(elementId, status[config.key], config.name);
        });

    } catch (error) {
        console.error('Failed to check API status:', error);
        // Set all to error state
        Object.keys(statusItems).forEach(elementId => {
            updateStatusIndicator(elementId, false, 'Connection Error');
        });

        // Show a subtle notification about API status check failure
        console.log('API status check failed, but continuing silently');
    }
}

// Update individual status indicator
function updateStatusIndicator(elementId, isReady, serviceName) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const statusText = element.querySelector('.status-text');
    const statusIndicator = element.querySelector('.status-indicator');

    if (isReady) {
        statusText.textContent = 'Ready';
        statusIndicator.className = 'status-indicator ready';
    } else {
        statusText.textContent = 'Not configured';
        statusIndicator.className = 'status-indicator error';
    }

    // Update summary indicator
    const summaryId = 'summary-' + elementId.split('-')[0];
    const summaryIndicator = document.getElementById(summaryId);
    if (summaryIndicator) {
        if (isReady) {
            summaryIndicator.className = 'summary-indicator ready';
        } else {
            summaryIndicator.className = 'summary-indicator error';
        }
    }
}

// Toggle API status details
function toggleApiStatus() {
    const details = document.getElementById('api-status-details');
    const icon = document.getElementById('api-toggle-icon');

    if (details.classList.contains('hidden')) {
        details.classList.remove('hidden');
        icon.classList.add('expanded');
    } else {
        details.classList.add('hidden');
        icon.classList.remove('expanded');
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

function setImageLoading(loading) {
    const btn = document.getElementById('analyze-image-btn');
    const text = document.getElementById('image-btn-text');
    const spinner = document.getElementById('image-spinner');

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

function setVideoLoading(loading) {
    const btn = document.getElementById('analyze-video-btn');
    const text = document.getElementById('video-btn-text');
    const spinner = document.getElementById('video-spinner');

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

// Display functions
function displayTextResults(result) {
    // Risk assessment
    const riskLevel = getRiskLevel(result.misinformation_score);
    document.getElementById('risk-badge').textContent = riskLevel.level;
    document.getElementById('risk-badge').className = `risk-badge ${riskLevel.className}`;

    // Update risk meter
    const riskMeter = document.getElementById('risk-meter-fill');
    const score = result.misinformation_score || 0;
    riskMeter.style.width = `${score * 100}%`;
    riskMeter.className = `meter-fill ${riskLevel.className}`;

    document.getElementById('scores').innerHTML = `
        <div class="score-item">
            <span class="score-label">Misinformation Score:</span>
            <span class="score-value">${result.misinformation_score ? (result.misinformation_score * 100).toFixed(1) : '0.0'}%</span>
        </div>
        <div class="score-item">
            <span class="score-label">Confidence:</span>
            <span class="score-value">${result.confidence ? (result.confidence * 100).toFixed(1) : '0.0'}%</span>
        </div>
    `;

    // Analysis details
    let analysisHTML = '';

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
                                <span>Verdict:</span>
                                <span class="badge ${verdictClass}">${verdict}</span>
                            </div>
                            <div class="analysis-item">
                                <span>Confidence:</span>
                                <span class="badge ${confidenceClass}">${confidence}%</span>
                            </div>
                        </div>
                        <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 6px;">
                            <strong>Analysis:</strong><br>
                            ${gemini.analysis ? gemini.analysis.replace(/\n/g, '<br>') : 'No analysis available'}
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
                    <h4><i class="fas fa-language"></i> Linguistic Analysis</h4>
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <span>Risk Level:</span>
                            <span class="badge ${ling.risk_level}">${ling.risk_level ? ling.risk_level.toUpperCase() : 'UNKNOWN'}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Suspicious Phrases:</span>
                            <span>${ling.suspicious_phrases || 0}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Emotional Language:</span>
                            <span>${ling.emotional_language || 0}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Caps Ratio:</span>
                            <span>${((ling.caps_ratio || 0) * 100).toFixed(1)}%</span>
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
                    <h4><i class="fas fa-heart"></i> Sentiment Analysis</h4>
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <span>Sentiment:</span>
                            <span class="badge ${sent.sentiment}">${sent.sentiment ? sent.sentiment.toUpperCase() : 'UNKNOWN'}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Polarity:</span>
                            <span>${(sent.polarity || 0).toFixed(2)}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Subjectivity:</span>
                            <span>${(sent.subjectivity || 0).toFixed(2)}</span>
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
                    <h4><i class="fas fa-check-circle"></i> Fact Check Results</h4>
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <span>Status:</span>
                            <span class="badge ${fact.status === 'success' ? 'success' : 'error'}">${fact.status ? fact.status.toUpperCase() : 'UNKNOWN'}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Claims Found:</span>
                            <span>${fact.claims_found || 0}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Has Fact Checks:</span>
                            <span>${fact.has_fact_checks ? 'Yes' : 'No'}</span>
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
                    <h4><i class="fas fa-newspaper"></i> News Verification</h4>
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <span>Status:</span>
                            <span class="badge ${news.status === 'success' ? 'success' : 'error'}">${news.status ? news.status.toUpperCase() : 'UNKNOWN'}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Articles Found:</span>
                            <span>${news.total_articles || 0}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Reliable Sources:</span>
                            <span>${news.reliable_sources || 0}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Reliability Ratio:</span>
                            <span>${((news.reliability_ratio || 0) * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    document.getElementById('analysis-content').innerHTML = analysisHTML;

    // Recommendations
    displayRecommendations(result.recommendations || []);
    showResults();
}

function displayImageResults(result) {
    // Risk assessment
    const riskLevel = getRiskLevel(result.deepfake_score);
    document.getElementById('risk-badge').textContent = riskLevel.level;
    document.getElementById('risk-badge').className = `risk-badge ${riskLevel.className}`;

    // Update risk meter
    const riskMeter = document.getElementById('risk-meter-fill');
    const score = result.deepfake_score || 0;
    riskMeter.style.width = `${score * 100}%`;
    riskMeter.className = `meter-fill ${riskLevel.className}`;

    document.getElementById('scores').innerHTML = `
        <div class="score-item">
            <span class="score-label">Deepfake Score:</span>
            <span class="score-value">${result.deepfake_score ? (result.deepfake_score * 100).toFixed(1) : '0.0'}%</span>
        </div>
        <div class="score-item">
            <span class="score-label">Confidence:</span>
            <span class="score-value">${result.confidence ? (result.confidence * 100).toFixed(1) : '0.0'}%</span>
        </div>
    `;

    // Analysis details
    let analysisHTML = '';
    if (result.analysis) {
        const analysis = result.analysis;

        // Gemini AI Analysis
        if (analysis.gemini_analysis) {
            const gemini = analysis.gemini_analysis;

            if (gemini.status === 'success') {
                const verdict = gemini.deepfake_verdict || 'UNKNOWN';
                const confidence = gemini.confidence || 0;

                // Determine verdict color based on content
                let verdictClass = 'neutral';
                if (verdict.toLowerCase().includes('fake') || verdict.toLowerCase().includes('manipulated')) {
                    verdictClass = 'high';
                } else if (verdict.toLowerCase().includes('authentic') || verdict.toLowerCase().includes('genuine')) {
                    verdictClass = 'low';
                } else if (verdict.toLowerCase().includes('possibly')) {
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
                                <span>Verdict:</span>
                                <span class="badge ${verdictClass}">${verdict}</span>
                            </div>
                            <div class="analysis-item">
                                <span>Confidence:</span>
                                <span class="badge ${confidenceClass}">${confidence}%</span>
                            </div>
                        </div>
                        <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 6px;">
                            <strong>Analysis:</strong><br>
                            ${gemini.analysis ? gemini.analysis.replace(/\n/g, '<br>') : 'No analysis available'}
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
                        <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 6px;">
                            ${gemini.analysis || 'AI analysis unavailable'}
                        </div>
                    </div>
                `;
            }
        }

        // Technical Analysis
        if (analysis.technical_analysis) {
            const tech = analysis.technical_analysis;
            analysisHTML += `
                <div class="analysis-section">
                    <h4><i class="fas fa-cogs"></i> Technical Analysis</h4>
                    <div class="analysis-grid">
            `;

            if (tech.opencv_analysis) {
                const opencv = tech.opencv_analysis;
                analysisHTML += `
                    <div class="analysis-item">
                        <span>Image Sharpness:</span>
                        <span>${opencv.sharpness ? opencv.sharpness.toFixed(1) : 'N/A'}</span>
                    </div>
                `;
            }

            analysisHTML += `
                    </div>
                </div>
            `;
        }

        // Image Properties
        if (analysis.image_properties && typeof analysis.image_properties === 'object') {
            const props = analysis.image_properties;
            analysisHTML += `
                <div class="analysis-section">
                    <h4><i class="fas fa-info-circle"></i> Image Properties</h4>
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <span>Format:</span>
                            <span>${props && props.format ? props.format : 'Unknown'}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Dimensions:</span>
                            <span>${props && props.width && props.height ? props.width + 'x' + props.height : 'Unknown'}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Color Mode:</span>
                            <span>${props && props.mode ? props.mode : 'Unknown'}</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    document.getElementById('analysis-content').innerHTML = analysisHTML;

    // Recommendations
    displayRecommendations(result.recommendations || []);
    showResults();
}

function displayVideoResults(result) {
    // Risk assessment
    const riskLevel = getRiskLevel(result.deepfake_score);
    document.getElementById('risk-badge').textContent = riskLevel.level;
    document.getElementById('risk-badge').className = `risk-badge ${riskLevel.className}`;

    // Update risk meter
    const riskMeter = document.getElementById('risk-meter-fill');
    const score = result.deepfake_score || 0;
    riskMeter.style.width = `${score * 100}%`;
    riskMeter.className = `meter-fill ${riskLevel.className}`;

    document.getElementById('scores').innerHTML = `
        <div class="score-item">
            <span class="score-label">Deepfake Score:</span>
            <span class="score-value">${result.deepfake_score ? (result.deepfake_score * 100).toFixed(1) : '0.0'}%</span>
        </div>
        <div class="score-item">
            <span class="score-label">Confidence:</span>
            <span class="score-value">${result.confidence ? (result.confidence * 100).toFixed(1) : '0.0'}%</span>
        </div>
        <div class="score-item">
            <span class="score-label">Frames Analyzed:</span>
            <span class="score-value">${result.frames_analyzed || 0}</span>
        </div>
    `;

    // Analysis details
    let analysisHTML = '';
    if (result.analysis) {
        const analysis = result.analysis;

        // Gemini AI Analysis
        if (analysis.gemini_analysis) {
            const gemini = analysis.gemini_analysis;

            if (gemini.status === 'success') {
                const verdict = gemini.deepfake_verdict || 'UNKNOWN';
                const confidence = gemini.confidence || 0;

                // Determine verdict color based on content
                let verdictClass = 'neutral';
                if (verdict.toLowerCase().includes('fake') || verdict.toLowerCase().includes('manipulated')) {
                    verdictClass = 'high';
                } else if (verdict.toLowerCase().includes('authentic') || verdict.toLowerCase().includes('genuine')) {
                    verdictClass = 'low';
                } else if (verdict.toLowerCase().includes('possibly')) {
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
                                <span>Verdict:</span>
                                <span class="badge ${verdictClass}">${verdict}</span>
                            </div>
                            <div class="analysis-item">
                                <span>Confidence:</span>
                                <span class="badge ${confidenceClass}">${confidence}%</span>
                            </div>
                        </div>
                        <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 6px;">
                            <strong>Analysis:</strong><br>
                            ${gemini.analysis ? gemini.analysis.replace(/\n/g, '<br>') : 'No analysis available'}
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
                        <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 6px;">
                            ${gemini.analysis || 'AI analysis unavailable'}
                        </div>
                    </div>
                `;
            }
        }

        // Frame Analysis
        if (analysis.frame_analysis) {
            const frame = analysis.frame_analysis;
            analysisHTML += `
                <div class="analysis-section">
                    <h4><i class="fas fa-film"></i> Frame Analysis</h4>
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <span>Frames Analyzed:</span>
                            <span>${frame.frames_analyzed}/${frame.total_frames}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Average Score:</span>
                            <span>${(frame.average_score * 100).toFixed(1)}%</span>
                        </div>
            `;

            if (frame.score_distribution) {
                const dist = frame.score_distribution;
                analysisHTML += `
                        <div class="analysis-item">
                            <span>Risk Distribution:</span>
                            <span>Low: ${dist.low}, Med: ${dist.medium}, High: ${dist.high}</span>
                        </div>
                `;
            }

            analysisHTML += `
                    </div>
                </div>
            `;
        }

        // Video Properties
        if (analysis.video_properties && typeof analysis.video_properties === 'object') {
            const props = analysis.video_properties;
            analysisHTML += `
                <div class="analysis-section">
                    <h4><i class="fas fa-info-circle"></i> Video Properties</h4>
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <span>Duration:</span>
                            <span>${props && props.duration ? props.duration.toFixed(1) + 's' : 'Unknown'}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Frame Rate:</span>
                            <span>${props && props.fps ? props.fps.toFixed(1) + ' FPS' : 'Unknown'}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Total Frames:</span>
                            <span>${props && props.frame_count ? props.frame_count : 'Unknown'}</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    document.getElementById('analysis-content').innerHTML = analysisHTML;

    // Recommendations
    displayRecommendations(result.recommendations || []);
    showResults();
}

function displayRecommendations(recommendations) {
    const list = document.getElementById('recommendations-list');
    list.innerHTML = '';

    recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec;
        list.appendChild(li);
    });
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
    document.getElementById('results').classList.remove('hidden');
}

function hideResults() {
    document.getElementById('results').classList.add('hidden');
}

function showError(message) {
    // Use notification system instead of red error bar
    showNotification(message, 'error');
}

function hideError() {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.classList.add('hidden');
        errorElement.style.display = 'none';
    }
}



function hideNotification() {
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(notification => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    });
}

function exportResults() {
    // Simple export functionality
    const results = document.getElementById('results');
    if (results && !results.classList.contains('hidden')) {
        window.print();
    }
}

//enhanced drag and drop functionality
function initializeDragAndDrop() {
    const uploadZones = document.querySelectorAll('.file-upload-zone');

    uploadZones.forEach(zone => {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            zone.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        // Highlight drop zone when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            zone.addEventListener(eventName, () => {
                zone.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            zone.addEventListener(eventName, () => {
                zone.classList.remove('drag-over');
            }, false);
        });

        // Handle dropped files
        zone.addEventListener('drop', handleDrop, false);
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

    // Auto hide after duration
    if (duration > 0) {
        setTimeout(() => {
            hideNotification();
        }, duration);
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

// Enhanced file validation
function validateFile(file, type, maxSize) {
    const errors = [];

    // Check file type
    if (type === 'image' && !file.type.startsWith('image/')) {
        errors.push('Please select a valid image file');
    } else if (type === 'video' && !file.type.startsWith('video/')) {
        errors.push('Please select a valid video file');
    }

    // Check file size
    if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        errors.push(`File size must be less than ${maxSizeMB}MB`);
    }

    // Check for potentially dangerous file types
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    const fileName = file.name.toLowerCase();
    if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
        errors.push('This file type is not allowed for security reasons');
    }

    return errors;
}

// Enhanced error handling for analysis functions
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

    showNotification('Starting text analysis...', 'info', 0);

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
        hideNotification();
        showNotification('Text analysis completed successfully!', 'success');
        displayTextResults(result);

    } catch (error) {
        console.error('Text analysis error:', error);
        hideNotification();
        showNotification(error.message || 'An error occurred during analysis', 'error');
    } finally {
        setTextLoading(false);
    }
}

// Enhanced image analysis with better validation
async function analyzeImage() {
    if (!selectedImageFile) {
        showNotification('Please select an image file first', 'warning');
        return;
    }

    // Validate file
    const errors = validateFile(selectedImageFile, 'image', 10 * 1024 * 1024);
    if (errors.length > 0) {
        showNotification(errors[0], 'warning');
        return;
    }

    setImageLoading(true);
    hideError();
    hideResults();

    showNotification('Analyzing image for deepfakes...', 'info', 0);

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
        hideNotification();
        showNotification('Image analysis completed successfully!', 'success');
        displayImageResults(result);

    } catch (error) {
        console.error('Image analysis error:', error);
        hideNotification();
        showNotification(error.message || 'An error occurred during image analysis', 'error');
    } finally {
        setImageLoading(false);
    }
}

// Enhanced video analysis with better validation
async function analyzeVideo() {
    if (!selectedVideoFile) {
        showNotification('Please select a video file first', 'warning');
        return;
    }

    // Validate file
    const errors = validateFile(selectedVideoFile, 'video', 100 * 1024 * 1024);
    if (errors.length > 0) {
        showNotification(errors[0], 'warning');
        return;
    }

    setVideoLoading(true);
    hideError();
    hideResults();

    showNotification('Analyzing video for deepfakes... This may take a while.', 'info', 0);

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
        hideNotification();
        showNotification('Video analysis completed successfully!', 'success');
        displayVideoResults(result);

    } catch (error) {
        console.error('Video analysis error:', error);
        hideNotification();
        showNotification(error.message || 'An error occurred during video analysis', 'error');
    } finally {
        setVideoLoading(false);
    }
}

// Enhanced progress tracking
function createProgressBar(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.innerHTML = `
        <div class="progress-track">
            <div class="progress-fill"></div>
        </div>
        <div class="progress-text">Processing...</div>
    `;

    container.appendChild(progressBar);
    return progressBar;
}

function updateProgress(progressBar, percent, text) {
    if (!progressBar) return;

    const fill = progressBar.querySelector('.progress-fill');
    const textEl = progressBar.querySelector('.progress-text');

    if (fill) fill.style.width = `${percent}%`;
    if (textEl && text) textEl.textContent = text;
}

function removeProgressBar(progressBar) {
    if (progressBar && progressBar.parentNode) {
        progressBar.parentNode.removeChild(progressBar);
    }
}

// Enhanced copy to clipboard functionality
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Copied to clipboard!', 'success', 2000);
        }).catch(() => {
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        showNotification('Copied to clipboard!', 'success', 2000);
    } catch (err) {
        showNotification('Failed to copy to clipboard', 'error', 3000);
    }

    document.body.removeChild(textArea);
}

// Enhanced export functionality
function exportResults() {
    const results = document.getElementById('results');
    if (!results || results.classList.contains('hidden')) {
        showNotification('No results to export', 'warning');
        return;
    }

    try {
        // Create a clean version for export
        const exportData = {
            timestamp: new Date().toISOString(),
            analysis: extractAnalysisData()
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `analysis-results-${Date.now()}.json`;
        link.click();

        showNotification('Results exported successfully!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Failed to export results', 'error');
    }
}

function extractAnalysisData() {
    const riskBadge = document.getElementById('risk-badge');
    const analysisContent = document.getElementById('analysis-content');
    const recommendationsList = document.getElementById('recommendations-list');

    return {
        riskLevel: riskBadge ? riskBadge.textContent : null,
        analysis: analysisContent ? analysisContent.textContent : null,
        recommendations: recommendationsList ?
            Array.from(recommendationsList.children).map(li => li.textContent) : []
    };
}
let historyDrawer = null;
let searchDetailsModal = null;
let currentHistoryData = [];

function toggleHistoryDrawer() {
    if (!historyDrawer) {
        historyDrawer = document.getElementById('history-drawer');
        searchDetailsModal = document.getElementById('search-details-modal');
    }
    
    if (historyDrawer.classList.contains('open')) {
        closeHistoryDrawer();
    } else {
        openHistoryDrawer();
    }
}

function openHistoryDrawer() {
    historyDrawer.classList.add('open');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    loadHistory();
    loadHistoryStatistics();
}

function closeHistoryDrawer() {
    historyDrawer.classList.remove('open');
    document.body.style.overflow = ''; // Restore scrolling
}

function closeSearchDetails() {
    searchDetailsModal.classList.remove('show');
    setTimeout(() => {
        searchDetailsModal.classList.add('hidden');
    }, 300);
}

async function loadHistory() {
    const loadingElement = document.getElementById('history-loading');
    const itemsElement = document.getElementById('history-items');
    const noHistoryElement = document.getElementById('no-history');
    
    // Show loading
    loadingElement.classList.remove('hidden');
    itemsElement.innerHTML = '';
    noHistoryElement.classList.add('hidden');
    
    try {
        // Get filter values
        const typeFilter = document.getElementById('history-type-filter').value;
        const riskFilter = document.getElementById('history-risk-filter').value;
        const favoritesOnly = document.getElementById('favorites-only').checked;
        
        // Build query parameters
        const params = new URLSearchParams();
        if (typeFilter) params.append('type', typeFilter);
        if (riskFilter) {
            if (riskFilter === 'low') {
                params.append('max_risk', '0.3');
            } else if (riskFilter === 'medium') {
                params.append('min_risk', '0.3');
                params.append('max_risk', '0.7');
            } else if (riskFilter === 'high') {
                params.append('min_risk', '0.7');
            }
        }
        if (favoritesOnly) params.append('favorites', 'true');
        
        const response = await fetch(`/history?${params.toString()}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            currentHistoryData = data.history;
            displayHistoryItems(data.history);
        } else {
            throw new Error(data.error || 'Failed to load history');
        }
        
    } catch (error) {
        console.error('Error loading history:', error);
        showNotification('Failed to load search history', 'error');
        noHistoryElement.classList.remove('hidden');
    } finally {
        loadingElement.classList.add('hidden');
    }
}

function displayHistoryItems(history) {
    const itemsElement = document.getElementById('history-items');
    const noHistoryElement = document.getElementById('no-history');
    
    if (history.length === 0) {
        noHistoryElement.classList.remove('hidden');
        return;
    }
    
    itemsElement.innerHTML = history.map(item => {
        const date = new Date(item.timestamp).toLocaleDateString();
        const time = new Date(item.timestamp).toLocaleTimeString();
        const riskLevel = getRiskLevelFromScore(item.risk_score);
        const riskPercentage = Math.round(item.risk_score * 100);
        
        let iconClass = 'fas fa-file-text';
        if (item.analysis_type === 'image') iconClass = 'fas fa-image';
        else if (item.analysis_type === 'video') iconClass = 'fas fa-video';
        
        return `
            <div class="history-item" onclick="viewSearchDetails(${item.id})">
                <div class="history-item-header">
                    <div class="history-item-icon ${item.analysis_type}">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="history-item-title">${item.content_preview}</div>
                </div>
                <div class="history-item-meta">
                    <span><i class="fas fa-calendar"></i> ${date} ${time}</span>
                    <span><i class="fas fa-chart-line"></i> ${riskPercentage}% risk</span>
                    <span class="history-risk-badge ${riskLevel}">${riskLevel}</span>
                    ${item.file_size ? `<span><i class="fas fa-file"></i> ${formatFileSize(item.file_size)}</span>` : ''}
                </div>
                <div class="history-item-actions" onclick="event.stopPropagation()">
                    <button class="history-action-btn favorite ${item.is_favorite ? 'active' : ''}" 
                            onclick="toggleFavorite(${item.id})" title="Toggle Favorite">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="history-action-btn delete" 
                            onclick="deleteSearch(${item.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function getRiskLevelFromScore(score) {
    if (score < 0.3) return 'low';
    if (score < 0.7) return 'medium';
    return 'high';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function viewSearchDetails(searchId) {
    try {
        const response = await fetch(`/history/${searchId}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            displaySearchDetails(data.search);
        } else {
            throw new Error(data.error || 'Failed to load search details');
        }
        
    } catch (error) {
        console.error('Error loading search details:', error);
        showNotification('Failed to load search details', 'error');
    }
}

function displaySearchDetails(search) {
    const contentElement = document.getElementById('search-details-content');
    
    // Display the full analysis results
    const results = search.results;
    let detailsHTML = `
        <div class="search-details">
            <div class="search-meta">
                <h4>${search.analysis_type ? search.analysis_type.toUpperCase() : 'UNKNOWN'} Analysis</h4>
                <p><strong>Date:</strong> ${new Date(search.timestamp).toLocaleString()}</p>
                ${search.file_name ? `<p><strong>File:</strong> ${search.file_name}</p>` : ''}
                ${search.file_size ? `<p><strong>Size:</strong> ${formatFileSize(search.file_size)}</p>` : ''}
            </div>
            
            <div class="search-content">
                <h5>Content:</h5>
                <div class="content-preview">${search.content_preview}</div>
            </div>
            
            <div class="analysis-results">
                <h5>Analysis Results:</h5>
                <pre>${JSON.stringify(results, null, 2)}</pre>
            </div>
        </div>
    `;
    
    contentElement.innerHTML = detailsHTML;
    
    // Show the modal
    searchDetailsModal.classList.remove('hidden');
    setTimeout(() => {
        searchDetailsModal.classList.add('show');
    }, 10);
}

async function toggleFavorite(searchId) {
    try {
        const response = await fetch(`/history/${searchId}/favorite`, {
            method: 'POST'
        });
        
        const data = await response.json();
        if (data.status === 'success') {
            showNotification('Favorite status updated', 'success', 2000);
            loadHistory(); // Refresh the list
        } else {
            throw new Error(data.error || 'Failed to update favorite');
        }
        
    } catch (error) {
        console.error('Error toggling favorite:', error);
        showNotification('Failed to update favorite', 'error');
    }
}

async function deleteSearch(searchId) {
    if (!confirm('Are you sure you want to delete this search from history?')) {
        return;
    }
    
    try {
        const response = await fetch(`/history/${searchId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        if (data.status === 'success') {
            showNotification('Search deleted successfully', 'success', 2000);
            loadHistory(); // Refresh the list
            loadHistoryStatistics(); // Refresh stats
        } else {
            throw new Error(data.error || 'Failed to delete search');
        }
        
    } catch (error) {
        console.error('Error deleting search:', error);
        showNotification('Failed to delete search', 'error');
    }
}

async function loadHistoryStatistics() {
    try {
        const response = await fetch('/history/statistics');
        const data = await response.json();
        
        if (data.status === 'success') {
            const stats = data.statistics;
            document.getElementById('total-searches').textContent = stats.total_searches;
            document.getElementById('recent-activity').textContent = stats.recent_activity;
            document.getElementById('high-risk-count').textContent = stats.risk_distribution.high;
        }
        
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

function toggleHistoryStats() {
    const statsElement = document.getElementById('history-stats');
    statsElement.classList.toggle('hidden');
}

function clearHistoryFilters() {
    document.getElementById('history-type-filter').value = '';
    document.getElementById('history-risk-filter').value = '';
    document.getElementById('favorites-only').checked = false;
    loadHistory();
}

function confirmClearHistory() {
    if (confirm('Are you sure you want to clear all search history? This action cannot be undone.')) {
        clearAllHistory();
    }
}

async function clearAllHistory() {
    try {
        const response = await fetch('/history/clear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        
        const data = await response.json();
        if (data.status === 'success') {
            showNotification(data.message, 'success');
            loadHistory();
            loadHistoryStatistics();
        } else {
            throw new Error(data.error || 'Failed to clear history');
        }
        
    } catch (error) {
        console.error('Error clearing history:', error);
        showNotification('Failed to clear history', 'error');
    }
}

// Initialize history filter event listeners
function initializeHistoryFilters() {
    // Add event listeners for history filters
    const typeFilter = document.getElementById('history-type-filter');
    const riskFilter = document.getElementById('history-risk-filter');
    const favoritesCheckbox = document.getElementById('favorites-only');
    
    if (typeFilter) {
        typeFilter.addEventListener('change', loadHistory);
    }
    
    if (riskFilter) {
        riskFilter.addEventListener('change', loadHistory);
    }
    
    if (favoritesCheckbox) {
        favoritesCheckbox.addEventListener('change', loadHistory);
    }
}

// Initialize keyboard shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Escape key - close modals and drawers
        if (e.key === 'Escape') {
            if (historyDrawer && historyDrawer.classList.contains('open')) {
                closeHistoryDrawer();
                return;
            }
            if (searchDetailsModal && searchDetailsModal.classList.contains('show')) {
                closeSearchDetails();
                return;
            }
        }
        
        // Number keys for tab switching (when not in input fields)
        if (!e.target.matches('input, textarea, select')) {
            if (e.key === '1') {
                showTab('text');
                e.preventDefault();
            } else if (e.key === '2') {
                showTab('image');
                e.preventDefault();
            } else if (e.key === '3') {
                showTab('video');
                e.preventDefault();
            }
        }
        
        // Ctrl/Cmd + H for history
        if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
            toggleHistoryDrawer();
            e.preventDefault();
        }
        
        // Ctrl/Cmd + E for export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            exportResults();
            e.preventDefault();
        }
    });
}
// 
//History Drawer Functions
function toggleHistoryDrawer() {
    const drawer = document.getElementById('history-drawer');
    if (drawer.classList.contains('open')) {
        closeHistoryDrawer();
    } else {
        openHistoryDrawer();
    }
}

function openHistoryDrawer() {
    const drawer = document.getElementById('history-drawer');
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
    loadHistory();
}

function closeHistoryDrawer() {
    const drawer = document.getElementById('history-drawer');
    drawer.classList.remove('open');
    document.body.style.overflow = '';
}

// History Loading and Management
async function loadHistory() {
    const loadingSpinner = document.getElementById('history-loading');
    const historyItems = document.getElementById('history-items');
    const noHistory = document.getElementById('no-history');
    
    // Show loading
    loadingSpinner.classList.remove('hidden');
    historyItems.innerHTML = '';
    noHistory.classList.add('hidden');
    
    try {
        // Get filter values
        const typeFilter = document.getElementById('history-type-filter')?.value || '';
        const riskFilter = document.getElementById('history-risk-filter')?.value || '';
        const favoritesOnly = document.getElementById('favorites-only')?.checked || false;
        
        // Build query parameters
        const params = new URLSearchParams();
        if (typeFilter) params.append('type', typeFilter);
        if (riskFilter) {
            if (riskFilter === 'low') {
                params.append('min_risk', '0');
                params.append('max_risk', '0.3');
            } else if (riskFilter === 'medium') {
                params.append('min_risk', '0.3');
                params.append('max_risk', '0.7');
            } else if (riskFilter === 'high') {
                params.append('min_risk', '0.7');
                params.append('max_risk', '1');
            }
        }
        if (favoritesOnly) params.append('favorites', 'true');
        
        const response = await fetch(`/history?${params.toString()}`);
        const data = await response.json();
        
        if (data.status === 'success' && data.history.length > 0) {
            displayHistoryItems(data.history);
        } else {
            noHistory.classList.remove('hidden');
        }
        
    } catch (error) {
        console.error('Error loading history:', error);
        showNotification('Failed to load search history', 'error');
        noHistory.classList.remove('hidden');
    } finally {
        loadingSpinner.classList.add('hidden');
    }
}

function displayHistoryItems(items) {
    const container = document.getElementById('history-items');
    container.innerHTML = '';
    
    items.forEach(item => {
        const historyItem = createHistoryItemElement(item);
        container.appendChild(historyItem);
    });
}

function createHistoryItemElement(item) {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.onclick = () => showSearchDetails(item.id);
    
    const riskLevel = getRiskLevelFromScore(item.risk_score);
    const iconClass = getIconForType(item.analysis_type);
    
    div.innerHTML = `
        <div class="history-item-header">
            <i class="history-item-icon ${item.analysis_type} ${iconClass}"></i>
            <div class="history-item-title">${item.content_preview}</div>
        </div>
        <div class="history-item-meta">
            <div>
                <span class="history-risk-badge ${riskLevel.className}">${riskLevel.level}</span>
                <span>${(item.risk_score * 100).toFixed(1)}% risk</span>
                <span>•</span>
                <span>${item.confidence ? (item.confidence * 100).toFixed(1) + '% confidence' : 'N/A'}</span>
            </div>
            <div>${formatDate(item.timestamp)}</div>
            ${item.file_name ? `<div>📁 ${item.file_name} (${formatFileSize(item.file_size || 0)})</div>` : ''}
        </div>
        <div class="history-item-actions">
            <button class="history-action-btn favorite ${item.is_favorite ? 'active' : ''}" 
                    onclick="event.stopPropagation(); toggleFavorite(${item.id})" 
                    title="${item.is_favorite ? 'Remove from favorites' : 'Add to favorites'}">
                <i class="fas fa-star"></i>
            </button>
            <button class="history-action-btn delete" 
                    onclick="event.stopPropagation(); deleteHistoryItem(${item.id})" 
                    title="Delete this search">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return div;
}

function getRiskLevelFromScore(score) {
    if (score < 0.3) return { level: 'LOW', className: 'low' };
    if (score < 0.7) return { level: 'MED', className: 'medium' };
    return { level: 'HIGH', className: 'high' };
}

function getIconForType(type) {
    switch (type) {
        case 'text': return 'fas fa-newspaper';
        case 'image': return 'fas fa-image';
        case 'video': return 'fas fa-video';
        default: return 'fas fa-file';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// History Filter Functions
function clearHistoryFilters() {
    const typeFilter = document.getElementById('history-type-filter');
    const riskFilter = document.getElementById('history-risk-filter');
    const favoritesOnly = document.getElementById('favorites-only');
    
    if (typeFilter) typeFilter.value = '';
    if (riskFilter) riskFilter.value = '';
    if (favoritesOnly) favoritesOnly.checked = false;
    
    // Add visual feedback
    const clearBtn = document.querySelector('.btn-secondary');
    if (clearBtn) {
        clearBtn.classList.add('success');
        clearBtn.innerHTML = '<i class="fas fa-check"></i> Cleared';
        
        setTimeout(() => {
            clearBtn.classList.remove('success');
            clearBtn.innerHTML = '<i class="fas fa-times"></i> Clear';
        }, 1500);
    }
    
    loadHistory();
}

// History Statistics Functions
async function toggleHistoryStats() {
    const statsContainer = document.getElementById('history-stats');
    const statsBtn = document.querySelector('.btn-info');
    
    if (statsContainer.classList.contains('hidden')) {
        // Show stats
        statsBtn.classList.add('loading');
        statsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        
        try {
            await loadHistoryStats();
            statsContainer.classList.remove('hidden');
            statsBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Hide Stats';
        } catch (error) {
            console.error('Error loading stats:', error);
            showNotification('Failed to load statistics', 'error');
        } finally {
            statsBtn.classList.remove('loading');
        }
    } else {
        // Hide stats
        statsContainer.classList.add('hidden');
        statsBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Stats';
    }
}

async function loadHistoryStats() {
    try {
        const response = await fetch('/history/statistics');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success' && data.statistics) {
            displayHistoryStats(data.statistics);
        } else {
            throw new Error(data.error || 'Failed to load statistics');
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
        throw error;
    }
}

function displayHistoryStats(stats) {
    try {
        if (!stats || typeof stats !== 'object') {
            console.warn('Invalid statistics data:', stats);
            return;
        }
        
        const totalElement = document.getElementById('total-searches');
        const recentElement = document.getElementById('recent-activity');
        const highRiskElement = document.getElementById('high-risk-count');
        
        if (totalElement) totalElement.textContent = stats.total_searches || 0;
        if (recentElement) recentElement.textContent = stats.recent_activity || 0;
        if (highRiskElement) highRiskElement.textContent = stats.risk_distribution?.high || 0;
    } catch (error) {
        console.error('Error displaying statistics:', error);
    }
}

// History Item Actions
async function toggleFavorite(searchId) {
    try {
        const response = await fetch(`/history/${searchId}/favorite`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            // Reload history to reflect changes
            loadHistory();
            showNotification('Favorite status updated', 'success');
        } else {
            throw new Error(data.error || 'Failed to update favorite');
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        showNotification('Failed to update favorite status', 'error');
    }
}

async function deleteHistoryItem(searchId) {
    if (!confirm('Are you sure you want to delete this search from history?')) {
        return;
    }
    
    try {
        const response = await fetch(`/history/${searchId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            loadHistory();
            showNotification('Search deleted successfully', 'success');
        } else {
            throw new Error(data.error || 'Failed to delete search');
        }
    } catch (error) {
        console.error('Error deleting search:', error);
        showNotification('Failed to delete search', 'error');
    }
}

async function showSearchDetails(searchId) {
    try {
        const response = await fetch(`/history/${searchId}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            displaySearchDetailsModal(data.search);
        } else {
            throw new Error(data.error || 'Failed to load search details');
        }
    } catch (error) {
        console.error('Error loading search details:', error);
        showNotification('Failed to load search details', 'error');
    }
}

function displaySearchDetailsModal(search) {
    const modal = document.getElementById('search-details-modal');
    const content = document.getElementById('search-details-content');
    
    // Create detailed view of the search results
    content.innerHTML = `
        <div class="search-detail-header">
            <h4>${search.content_preview}</h4>
            <p>Analyzed on ${formatDate(search.timestamp)}</p>
        </div>
        <div class="search-detail-results">
            ${JSON.stringify(search.results, null, 2)}
        </div>
    `;
    
    modal.classList.add('show');
    modal.classList.remove('hidden');
}

function closeSearchDetails() {
    const modal = document.getElementById('search-details-modal');
    modal.classList.remove('show');
    modal.classList.add('hidden');
}

// Clear All History
async function confirmClearHistory() {
    if (!confirm('Are you sure you want to clear ALL search history? This action cannot be undone.')) {
        return;
    }
    
    const clearBtn = document.querySelector('.btn-danger');
    clearBtn.classList.add('loading');
    clearBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Clearing...';
    
    try {
        const response = await fetch('/history/clear', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            loadHistory();
            showNotification(`Cleared ${data.message}`, 'success');
        } else {
            throw new Error(data.error || 'Failed to clear history');
        }
    } catch (error) {
        console.error('Error clearing history:', error);
        showNotification('Failed to clear history', 'error');
    } finally {
        clearBtn.classList.remove('loading');
        clearBtn.innerHTML = '<i class="fas fa-trash"></i> Clear All History';
    }
}

// Initialize History Filters
function initializeHistoryFilters() {
    const typeFilter = document.getElementById('history-type-filter');
    const riskFilter = document.getElementById('history-risk-filter');
    const favoritesOnly = document.getElementById('favorites-only');
    
    if (typeFilter) {
        typeFilter.addEventListener('change', loadHistory);
    }
    
    if (riskFilter) {
        riskFilter.addEventListener('change', loadHistory);
    }
    
    if (favoritesOnly) {
        favoritesOnly.addEventListener('change', loadHistory);
    }
}

// Export Results Function
function exportResults() {
    const resultsSection = document.getElementById('results');
    if (!resultsSection || resultsSection.classList.contains('hidden')) {
        showNotification('No results to export', 'warning');
        return;
    }
    
    // Simple export functionality - you can enhance this
    const exportData = {
        timestamp: new Date().toISOString(),
        results: 'Current analysis results would be exported here'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Results exported successfully', 'success');
}

// Keyboard Shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+H to toggle history drawer
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            toggleHistoryDrawer();
        }
        
        // Escape to close modals/drawers
        if (e.key === 'Escape') {
            closeHistoryDrawer();
            closeSearchDetails();
        }
        
        // Ctrl+Enter to analyze text
        if (e.ctrlKey && e.key === 'Enter') {
            const textInput = document.getElementById('text-input');
            if (textInput && document.activeElement === textInput) {
                e.preventDefault();
                analyzeText();
            }
        }
    });
}