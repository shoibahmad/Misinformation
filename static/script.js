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
    
    if (!welcomeScreen || !mainApp) {
        console.error('❌ Required elements not found:', { welcomeScreen: !!welcomeScreen, mainApp: !!mainApp });
        // If elements not found, show main app immediately
        if (mainApp) {
            mainApp.style.display = 'flex';
            initializeMainApp();
        }
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

    // Change loading text every 500ms (faster)
    const messageInterval = setInterval(() => {
        if (messageIndex < loadingMessages.length - 1) {
            messageIndex++;
            if (loadingText) {
                loadingText.textContent = loadingMessages[messageIndex];
            }
        }
    }, 500);

    // Show welcome screen for 1.5 seconds (shorter)
    setTimeout(() => {
        clearInterval(messageInterval);
        console.log('🔄 Starting transition to main app...');

        // Start exit animation
        welcomeScreen.classList.add('fade-out');

        // After exit animation completes, hide welcome and show main app
        setTimeout(() => {
            console.log('✅ Hiding welcome screen, showing main app');
            welcomeScreen.style.display = 'none';
            mainApp.style.display = 'flex';

            // Small delay to ensure DOM is ready
            setTimeout(() => {
                // Initialize main app functionality
                console.log('🚀 Initializing main app...');
                initializeMainApp();
            }, 50);
        }, 300); // Shorter animation time
    }, 1500); // Shorter welcome time
}

// Initialize main application
function initializeMainApp() {
    console.log('🚀 Initializing main application...');
    
    try {
        // Initialize event listeners first
        initializeEventListeners();
        console.log('✅ Event listeners initialized');
        
        // Initialize animations
        initializeAnimations();
        console.log('✅ Animations initialized');
        
        // Check API status
        checkApiStatus();
        console.log('✅ API status check initiated');
        
        // Show the text tab by default
        showTab('text');
        console.log('✅ Default tab activated');
        
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
        'gemini-status': { name: 'Gemini AI', key: 'gemini_available' },
        'newsapi-status': { name: 'NewsAPI', key: 'newsdata_available' },
        'factcheck-status': { name: 'FactCheck', key: 'factcheck_available' }
    };

    Object.entries(statusItems).forEach(([elementId, config]) => {
        updateStatusIndicator(elementId, status[config.key], config.name);
    });
}

// Update individual status indicator
function updateStatusIndicator(elementId, isReady, serviceName) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const statusText = element.querySelector('.status-text');
    const statusIndicator = element.querySelector('.status-indicator');

    if (statusText && statusIndicator) {
        if (isReady) {
            statusText.textContent = 'Ready';
            statusIndicator.className = 'status-indicator ready';
        } else {
            statusText.textContent = 'Not configured';
            statusIndicator.className = 'status-indicator error';
        }
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
    
    try {
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        console.log(`Found ${tabContents.length} tab contents`);
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        // Remove active class from all options
        const analysisOptions = document.querySelectorAll('.analysis-option');
        console.log(`Found ${analysisOptions.length} analysis options`);
        analysisOptions.forEach(option => {
            option.classList.remove('active');
        });
        
        // Show selected tab content
        const targetContent = document.getElementById(tabName + '-tab');
        console.log(`Target tab element:`, targetContent);
        if (targetContent) {
            targetContent.classList.add('active');
            console.log(`✅ Activated tab: ${tabName}`);
        } else {
            console.error(`❌ Tab element not found: ${tabName}-tab`);
        }
        
        // Add active class to selected option
        const targetOption = document.querySelector(`[data-tab="${tabName}"]`);
        console.log(`Target option element:`, targetOption);
        if (targetOption) {
            targetOption.classList.add('active');
            console.log(`✅ Activated option: ${tabName}`);
        } else {
            console.error(`❌ Option element not found: [data-tab="${tabName}"]`);
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
        riskBadge.className = `risk-badge ${riskLevel.className}`;
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
                <span class="score-label">Misinformation Score:</span>
                <span class="score-value">${result.misinformation_score ? (result.misinformation_score * 100).toFixed(1) : '0.0'}%</span>
            </div>
            <div class="score-item">
                <span class="score-label">Confidence:</span>
                <span class="score-value">${result.confidence ? (result.confidence * 100).toFixed(1) : '0.0'}%</span>
            </div>
        `;
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
    } else {
        // Fallback when no analysis data is available
        analysisHTML = `
            <div class="analysis-section">
                <h4><i class="fas fa-exclamation-triangle"></i> Analysis Status</h4>
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <span>Status:</span>
                        <span class="badge error">No Analysis Data Available</span>
                    </div>
                </div>
                <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-primary); border-radius: 6px;">
                    <strong>Note:</strong> Analysis data was not returned from the server. Please try again or check your API configuration.
                </div>
            </div>
        `;
    }

    const analysisContent = document.getElementById('analysis-content');
    if (analysisContent) {
        console.log('📝 Setting analysis content HTML:', analysisHTML.length, 'characters');
        console.log('📝 HTML Preview:', analysisHTML.substring(0, 200) + '...');
        analysisContent.innerHTML = analysisHTML;
        
        // Force visibility
        analysisContent.style.display = 'block';
        analysisContent.style.visibility = 'visible';
        analysisContent.style.opacity = '1';
        
        // Ensure all analysis sections are visible
        const sections = analysisContent.querySelectorAll('.analysis-section');
        console.log('🔍 Found', sections.length, 'analysis sections');
        sections.forEach((section, index) => {
            section.style.display = 'block';
            section.style.visibility = 'visible';
            section.style.opacity = '1';
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
    // Similar implementation for image results
    const riskLevel = getRiskLevel(result.deepfake_score);
    const riskBadge = document.getElementById('risk-badge');
    if (riskBadge) {
        riskBadge.textContent = riskLevel.level;
        riskBadge.className = `risk-badge ${riskLevel.className}`;
    }

    displayRecommendations(result.recommendations || []);
    showResults();
}

function displayVideoResults(result) {
    // Similar implementation for video results
    const riskLevel = getRiskLevel(result.deepfake_score);
    const riskBadge = document.getElementById('risk-badge');
    if (riskBadge) {
        riskBadge.textContent = riskLevel.level;
        riskBadge.className = `risk-badge ${riskLevel.className}`;
    }

    displayRecommendations(result.recommendations || []);
    showResults();
}

function displayRecommendations(recommendations) {
    const list = document.getElementById('recommendations-list');
    if (list) {
        list.innerHTML = '';
        recommendations.forEach(rec => {
            const li = document.createElement('li');
            li.textContent = rec;
            list.appendChild(li);
        });
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