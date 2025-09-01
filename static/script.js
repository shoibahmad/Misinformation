// Global variables
let selectedImageFile = null;
let selectedVideoFile = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    checkApiStatus();
    initializeEventListeners();
});

// Initialize event listeners
function initializeEventListeners() {
    // Add click handlers for analysis options
    document.querySelectorAll('.analysis-option').forEach(option => {
        option.addEventListener('click', function () {
            const tabName = this.getAttribute('data-tab');
            showTab(tabName);
        });
    });
}

// Tab switching for new layout
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.analysis-option').forEach(option => {
        option.classList.remove('active');
    });

    // Show selected tab
    const targetTab = document.getElementById(tabName + '-tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Find and activate the corresponding analysis option
    const targetOption = document.querySelector(`[data-tab="${tabName}"]`);
    if (targetOption) {
        targetOption.classList.add('active');
    }

    // Clear results
    hideResults();
    hideError();
}

// Check API status
async function checkApiStatus() {
    const statusItems = {
        'gemini-status': { name: 'Gemini AI', key: 'gemini_available' },
        'newsapi-status': { name: 'NewsAPI', key: 'newsapi_available' },
        'factcheck-status': { name: 'FactCheck', key: 'factcheck_available' }
    };

    try {
        const response = await fetch('/api/status');
        const status = await response.json();

        Object.entries(statusItems).forEach(([elementId, config]) => {
            updateStatusIndicator(elementId, status[config.key], config.name);
        });

    } catch (error) {
        console.error('Failed to check API status:', error);
        // Set all to error state
        Object.keys(statusItems).forEach(elementId => {
            updateStatusIndicator(elementId, false, 'Error');
        });
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

// Mobile sidebar functions
function toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
}

function closeMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
}

// Show/hide mobile toggle button based on screen size
function handleResize() {
    const toggleBtn = document.querySelector('.sidebar-toggle-btn');
    if (window.innerWidth <= 1024) {
        toggleBtn.style.display = 'flex';
    } else {
        toggleBtn.style.display = 'none';
        closeMobileSidebar(); // Close sidebar when switching to desktop
    }
}

// Initialize resize handler
window.addEventListener('resize', handleResize);
document.addEventListener('DOMContentLoaded', handleResize);

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

// File handling
function handleImageSelect() {
    const fileInput = document.getElementById('image-input');
    const file = fileInput.files[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file');
        return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
        showError('File size must be less than 10MB');
        return;
    }

    selectedImageFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = function (e) {
        const preview = document.getElementById('image-preview');
        preview.innerHTML = `
            <img src="${e.target.result}" alt="Preview" style="max-width: 300px; max-height: 200px;">
            <p><strong>${file.name}</strong> (${formatFileSize(file.size)})</p>
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
        showError('Please select a valid video file');
        return;
    }

    // Validate file size (100MB)
    if (file.size > 100 * 1024 * 1024) {
        showError('File size must be less than 100MB');
        return;
    }

    selectedVideoFile = file;

    // Show preview
    const preview = document.getElementById('video-preview');
    preview.innerHTML = `
        <video controls style="max-width: 300px; max-height: 200px;">
            <source src="${URL.createObjectURL(file)}" type="${file.type}">
            Your browser does not support the video tag.
        </video>
        <p><strong>${file.name}</strong> (${formatFileSize(file.size)})</p>
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
        showError('Please enter some text to analyze');
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
        showError(error.message || 'An error occurred during analysis');
    } finally {
        setTextLoading(false);
    }
}

async function analyzeImage() {
    if (!selectedImageFile) {
        showError('Please select an image file');
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
        showError(error.message || 'An error occurred during image analysis');
    } finally {
        setImageLoading(false);
    }
}

async function analyzeVideo() {
    if (!selectedVideoFile) {
        showError('Please select a video file');
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
        showError(error.message || 'An error occurred during video analysis');
    } finally {
        setVideoLoading(false);
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
    riskMeter.style.width = `${result.misinformation_score * 100}%`;
    riskMeter.className = `meter-fill ${riskLevel.className}`;

    document.getElementById('scores').innerHTML = `
        <div class="score-item">
            <span class="score-label">Misinformation Score:</span>
            <span class="score-value">${(result.misinformation_score * 100).toFixed(1)}%</span>
        </div>
        <div class="score-item">
            <span class="score-label">Confidence:</span>
            <span class="score-value">${(result.confidence * 100).toFixed(1)}%</span>
        </div>
    `;

    // Analysis details
    let analysisHTML = '';

    if (result.analysis) {
        const analysis = result.analysis;

        // Gemini AI Analysis - Show first if available
        if (analysis.gemini_analysis && analysis.gemini_analysis.status === 'success') {
            const gemini = analysis.gemini_analysis;
            const verdict = gemini.fake_news_verdict || 'UNKNOWN';
            const confidence = gemini.confidence || 0;

            analysisHTML += `
                <div class="analysis-section gemini-section">
                    <h4><i class="fas fa-brain"></i> AI Expert Analysis</h4>
                    <div class="verdict-card">
                        <div class="verdict-header">
                            <h5><i class="fas fa-gavel"></i> Expert Verdict</h5>
                        </div>
                        <div class="verdict-content">
                            <div class="verdict-badge verdict-${verdict.toLowerCase().replace(' ', '-')}">
                                ${verdict}
                            </div>
                            <div class="confidence-meter">
                                <div class="confidence-label">Confidence: ${confidence}%</div>
                                <div class="confidence-bar">
                                    <div class="confidence-fill" style="width: ${confidence}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="ai-detailed-analysis">
                        <h6><i class="fas fa-microscope"></i> Detailed Analysis</h6>
                        <div class="ai-analysis-text">${gemini.analysis.replace(/\n/g, '<br>')}</div>
                    </div>
                </div>
            `;
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
                            <span class="badge ${ling.risk_level}">${ling.risk_level}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Suspicious Phrases:</span>
                            <span>${ling.suspicious_phrases}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Emotional Language:</span>
                            <span>${ling.emotional_language}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Caps Ratio:</span>
                            <span>${(ling.caps_ratio * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // Sentiment analysis
        if (analysis.sentiment) {
            const sent = analysis.sentiment;
            analysisHTML += `
                <div class="analysis-section">
                    <h4><i class="fas fa-heart"></i> Sentiment Analysis</h4>
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <span>Sentiment:</span>
                            <span class="badge ${sent.sentiment}">${sent.sentiment}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Polarity:</span>
                            <span>${sent.polarity.toFixed(2)}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Subjectivity:</span>
                            <span>${sent.subjectivity.toFixed(2)}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Objectivity:</span>
                            <span>${sent.objectivity}</span>
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
                            <span class="badge ${fact.status}">${fact.status}</span>
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
                            <span class="badge ${news.status}">${news.status}</span>
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
    const deepfakeRisk = result.deepfake_risk || 'unknown';
    const riskLevel = getDeepfakeRiskLevel(deepfakeRisk);

    document.getElementById('risk-badge').textContent = riskLevel.level;
    document.getElementById('risk-badge').className = `risk-badge ${riskLevel.className}`;

    // Update risk meter
    const riskScore = riskLevel.score;
    const riskMeter = document.getElementById('risk-meter-fill');
    riskMeter.style.width = `${riskScore * 100}%`;
    riskMeter.className = `meter-fill ${riskLevel.className}`;

    document.getElementById('scores').innerHTML = `
        <div class="score-item">
            <span class="score-label">Deepfake Risk:</span>
            <span class="score-value">${deepfakeRisk}</span>
        </div>
        <div class="score-item">
            <span class="score-label">Analysis Status:</span>
            <span class="score-value">${result.status}</span>
        </div>
    `;

    // Analysis details
    let analysisHTML = '';

    if (result.ai_analysis) {
        // Show AI analysis with proper formatting
        const analysisStatus = result.status || 'unknown';
        const riskBadgeClass = deepfakeRisk === 'high' ? 'verdict-high' :
            deepfakeRisk === 'medium' ? 'verdict-moderate' :
                deepfakeRisk === 'low' ? 'verdict-legitimate' : 'verdict-unknown';

        analysisHTML += `
            <div class="analysis-section gemini-section">
                <h4><i class="fas fa-brain"></i> AI Expert Analysis</h4>
                <div class="verdict-card">
                    <div class="verdict-header">
                        <h5><i class="fas fa-gavel"></i> Authenticity Assessment</h5>
                    </div>
                    <div class="verdict-content">
                        <div class="verdict-badge ${riskBadgeClass}">
                            ${deepfakeRisk.toUpperCase()} RISK
                        </div>
                        <div class="analysis-status">
                            <span class="badge ${analysisStatus === 'success' ? 'success' : analysisStatus === 'basic_analysis' ? 'medium' : 'error'}">
                                ${analysisStatus === 'success' ? 'Full AI Analysis' :
                analysisStatus === 'basic_analysis' ? 'Basic Analysis' : 'Analysis Error'}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="ai-detailed-analysis">
                    <h6><i class="fas fa-microscope"></i> Detailed Analysis</h6>
                    <div class="ai-analysis-text">${result.ai_analysis.replace(/\n/g, '<br>')}</div>
                </div>
            </div>
        `;
    }

    if (result.technical_analysis) {
        const tech = result.technical_analysis;
        analysisHTML += `
            <div class="analysis-section">
                <h4><i class="fas fa-cogs"></i> Technical Analysis</h4>
                <div class="analysis-grid">
        `;

        if (tech.pil_analysis) {
            const pil = tech.pil_analysis;
            analysisHTML += `
                <div class="analysis-item">
                    <span>Format:</span>
                    <span>${pil.format || 'Unknown'}</span>
                </div>
                <div class="analysis-item">
                    <span>Size:</span>
                    <span>${pil.size ? pil.size.join('x') : 'Unknown'}</span>
                </div>
                <div class="analysis-item">
                    <span>Mode:</span>
                    <span>${pil.mode || 'Unknown'}</span>
                </div>
                <div class="analysis-item">
                    <span>Has EXIF:</span>
                    <span>${pil.has_exif ? 'Yes' : 'No'}</span>
                </div>
            `;
        }

        if (tech.opencv_analysis && !tech.opencv_analysis.error) {
            const cv = tech.opencv_analysis;
            analysisHTML += `
                <div class="analysis-item">
                    <span>Sharpness:</span>
                    <span>${cv.sharpness ? cv.sharpness.toFixed(2) : 'N/A'}</span>
                </div>
                <div class="analysis-item">
                    <span>Brightness:</span>
                    <span>${cv.brightness ? cv.brightness.toFixed(2) : 'N/A'}</span>
                </div>
                <div class="analysis-item">
                    <span>Contrast:</span>
                    <span>${cv.contrast ? cv.contrast.toFixed(2) : 'N/A'}</span>
                </div>
            `;
        }

        analysisHTML += `
                <div class="analysis-item">
                    <span>Quality Assessment:</span>
                    <span class="badge ${tech.quality_assessment}">${tech.quality_assessment}</span>
                </div>
            </div>
        </div>
        `;
    }

    if (result.error) {
        analysisHTML += `
            <div class="analysis-section">
                <h4><i class="fas fa-exclamation-triangle"></i> Note</h4>
                <p>${result.message || result.error}</p>
            </div>
        `;
    }

    document.getElementById('analysis-content').innerHTML = analysisHTML;

    // Recommendations
    displayRecommendations(result.recommendations || []);
    showResults();
}

function displayVideoResults(result) {
    // Risk assessment
    const deepfakeRisk = result.overall_deepfake_risk || 'unknown';
    const riskLevel = getDeepfakeRiskLevel(deepfakeRisk);

    document.getElementById('risk-badge').textContent = riskLevel.level;
    document.getElementById('risk-badge').className = `risk-badge ${riskLevel.className}`;

    // Update risk meter
    const riskScore = riskLevel.score;
    const riskMeter = document.getElementById('risk-meter-fill');
    riskMeter.style.width = `${riskScore * 100}%`;
    riskMeter.className = `meter-fill ${riskLevel.className}`;

    document.getElementById('scores').innerHTML = `
        <div class="score-item">
            <span class="score-label">Overall Risk:</span>
            <span class="score-value">${deepfakeRisk}</span>
        </div>
        <div class="score-item">
            <span class="score-label">Frames Analyzed:</span>
            <span class="score-value">${result.frames_analyzed || 0}</span>
        </div>
        <div class="score-item">
            <span class="score-label">High Risk Frames:</span>
            <span class="score-value">${result.high_risk_frames || 0}</span>
        </div>
        <div class="score-item">
            <span class="score-label">Status:</span>
            <span class="score-value">${result.status || 'unknown'}</span>
        </div>
    `;

    // Analysis details
    let analysisHTML = '';

    // Show Gemini analysis if available
    if (result.gemini_analysis && result.gemini_analysis.status === 'success') {
        const gemini = result.gemini_analysis;
        const riskLevel = gemini.risk_level || 'unknown';

        analysisHTML += `
            <div class="analysis-section gemini-section">
                <h4><i class="fas fa-brain"></i> AI Expert Analysis</h4>
                <div class="verdict-card">
                    <div class="verdict-header">
                        <h5><i class="fas fa-gavel"></i> Deepfake Assessment</h5>
                    </div>
                    <div class="verdict-content">
                        <div class="verdict-badge verdict-${riskLevel.toLowerCase().replace(/\s+/g, '-')}">
                            ${riskLevel.toUpperCase()} RISK
                        </div>
                    </div>
                </div>
                <div class="ai-detailed-analysis">
                    <h6><i class="fas fa-microscope"></i> AI Analysis</h6>
                    <div class="ai-analysis-text">${gemini.analysis.replace(/\n/g, '<br>')}</div>
                </div>
            </div>
        `;
    }

    // Frame Analysis Summary
    if (result.frame_analyses && result.frame_analyses.length > 0) {
        analysisHTML += `
            <div class="analysis-section">
                <h4><i class="fas fa-film"></i> Frame Analysis Summary</h4>
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <span>High Risk Frames:</span>
                        <span class="badge ${result.high_risk_frames > 0 ? 'high' : 'low'}">${result.high_risk_frames || 0}</span>
                    </div>
                    <div class="analysis-item">
                        <span>Medium Risk Frames:</span>
                        <span class="badge ${result.medium_risk_frames > 0 ? 'medium' : 'low'}">${result.medium_risk_frames || 0}</span>
                    </div>
                    <div class="analysis-item">
                        <span>Low Risk Frames:</span>
                        <span class="badge low">${result.low_risk_frames || 0}</span>
                    </div>
                    <div class="analysis-item">
                        <span>Total Analyzed:</span>
                        <span>${result.frames_analyzed || 0}</span>
                    </div>
                </div>
            </div>
        `;

        // Show individual frame analyses
        result.frame_analyses.slice(0, 3).forEach((frame, index) => {
            const frameRisk = frame.deepfake_risk || 'unknown';
            analysisHTML += `
                <div class="analysis-section">
                    <h4><i class="fas fa-image"></i> Frame ${index + 1} Analysis</h4>
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <span>Risk Level:</span>
                            <span class="badge ${frameRisk}">${frameRisk}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Timestamp:</span>
                            <span>${frame.timestamp ? frame.timestamp.toFixed(2) + 's' : 'N/A'}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Status:</span>
                            <span class="badge ${frame.status === 'success' ? 'success' : 'error'}">${frame.status || 'unknown'}</span>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    if (result.video_properties) {
        const props = result.video_properties;
        analysisHTML += `
            <div class="analysis-section">
                <h4><i class="fas fa-video"></i> Video Properties</h4>
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <span>Duration:</span>
                        <span>${props.duration ? props.duration.toFixed(2) + 's' : 'Unknown'}</span>
                    </div>
                    <div class="analysis-item">
                        <span>FPS:</span>
                        <span>${props.fps ? props.fps.toFixed(2) : 'Unknown'}</span>
                    </div>
                    <div class="analysis-item">
                        <span>Frame Count:</span>
                        <span>${props.frame_count || 'Unknown'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    if (result.error) {
        analysisHTML += `
            <div class="analysis-section">
                <h4><i class="fas fa-exclamation-triangle"></i> Note</h4>
                <p>${result.message || result.error}</p>
            </div>
        `;
    }

    document.getElementById('analysis-content').innerHTML = analysisHTML;

    // Recommendations
    displayRecommendations(result.recommendations || []);
    showResults();
}

// Helper functions
function getRiskLevel(score) {
    if (score < 0.3) {
        return { level: 'Low Risk', className: 'risk-low', score: score };
    } else if (score < 0.7) {
        return { level: 'Moderate Risk', className: 'risk-moderate', score: score };
    } else {
        return { level: 'High Risk', className: 'risk-high', score: score };
    }
}

function getDeepfakeRiskLevel(risk) {
    switch (risk.toLowerCase()) {
        case 'low':
            return { level: 'Low Risk', className: 'risk-low', score: 0.2 };
        case 'medium':
        case 'moderate':
            return { level: 'Medium Risk', className: 'risk-moderate', score: 0.5 };
        case 'high':
            return { level: 'High Risk', className: 'risk-high', score: 0.8 };
        default:
            return { level: 'Unknown', className: 'risk-unknown', score: 0.0 };
    }
}

function displayRecommendations(recommendations) {
    const list = document.getElementById('recommendations-list');
    list.innerHTML = '';

    if (recommendations.length === 0) {
        list.innerHTML = '<li>No specific recommendations available.</li>';
        return;
    }

    recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec;
        list.appendChild(li);
    });
}

// Loading states
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
        btn.disabled = !selectedImageFile;
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
        btn.disabled = !selectedVideoFile;
        text.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
}

// Error handling
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error-message').classList.add('hidden');
}

// Results display
function showResults() {
    document.getElementById('results').classList.remove('hidden');
}

function hideResults() {
    document.getElementById('results').classList.add('hidden');
}

// Export functionality
function exportResults() {
    // Get current results
    const results = {
        timestamp: new Date().toISOString(),
        risk_assessment: {
            level: document.getElementById('risk-badge').textContent,
            scores: Array.from(document.querySelectorAll('.score-item')).map(item => ({
                label: item.querySelector('.score-label').textContent,
                value: item.querySelector('.score-value').textContent
            }))
        },
        analysis_details: document.getElementById('analysis-content').innerText,
        recommendations: Array.from(document.querySelectorAll('#recommendations-list li')).map(li => li.textContent)
    };

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `misinformation-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}