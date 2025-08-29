// Global variables
let selectedImageFile = null;
let selectedVideoFi

// Tab switching
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');
    
    // Clear results
    hideResults();
    hideError();
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
    reader.onload = function(e) {
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
        
        // Gemini AI Analysis - Dedicated Section
        if (analysis.gemini_analysis && analysis.gemini_analysis.status === 'success') {
            const gemini = analysis.gemini_analysis;
            const verdictClass = getVerdictClass(gemini.fake_news_verdict);
            
            analysisHTML += `
                <div class="analysis-section gemini-section">
                    <h4><i class="fas fa-brain"></i> Gemini AI Expert Analysis</h4>
                    
                    <div class="verdict-card">
                        <div class="verdict-header">
                            <h5><i class="fas fa-gavel"></i> AI Verdict</h5>
                        </div>
                        <div class="verdict-content">
                            <div class="verdict-badge ${verdictClass}">
                                ${gemini.fake_news_verdict || 'UNKNOWN'}
                            </div>
                            <div class="confidence-meter">
                                <span class="confidence-label">Confidence: ${gemini.confidence || 0}%</span>
                                <div class="confidence-bar">
                                    <div class="confidence-fill" style="width: ${gemini.confidence || 0}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <span>AI Risk Level:</span>
                            <span class="badge ${gemini.risk_level}">${gemini.risk_level}</span>
                        </div>
                        <div class="analysis-item">
                            <span>Analysis Status:</span>
                            <span class="badge success">Complete</span>
                        </div>
                    </div>
                    
                    <div class="ai-detailed-analysis">
                        <h6><i class="fas fa-microscope"></i> Detailed Analysis</h6>
                        <div class="ai-analysis-text">
                            ${gemini.analysis.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                </div>
            `;
        } else if (analysis.gemini_analysis && analysis.gemini_analysis.status === 'not_available') {
            analysisHTML += `
                <div class="analysis-section gemini-section">
                    <h4><i class="fas fa-brain"></i> Gemini AI Expert Analysis</h4>
                    <div class="info-message">
                        <i class="fas fa-cog"></i> <strong>Configuration Required</strong><br>
                        Configure GEMINI_API_KEY to enable advanced AI-powered fake news detection with expert-level analysis and definitive verdicts.
                    </div>
                </div>
            `;
        } else if (analysis.gemini_analysis && analysis.gemini_analysis.status === 'error') {
            analysisHTML += `
                <div class="analysis-section gemini-section">
                    <h4><i class="fas fa-brain"></i> Gemini AI Expert Analysis</h4>
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i> <strong>Analysis Failed</strong><br>
                        ${analysis.gemini_analysis.analysis}
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
    
    // Gemini AI Analysis - Prominent Display (same as text analysis)
    if (result.ai_analysis) {
        const riskClass = getVerdictClass(result.deepfake_risk);
        
        analysisHTML += `
            <div class="analysis-section gemini-section">
                <h4><i class="fas fa-brain"></i> Gemini AI Expert Analysis</h4>
                
                <div class="verdict-card">
                    <div class="verdict-header">
                        <h5><i class="fas fa-gavel"></i> AI Verdict</h5>
                    </div>
                    <div class="verdict-content">
                        <div class="verdict-badge ${riskClass}">
                            ${result.deepfake_risk ? result.deepfake_risk.toUpperCase() + ' RISK' : 'UNKNOWN'}
                        </div>
                        <div class="confidence-meter">
                            <span class="confidence-label">Analysis: Complete</span>
                            <div class="confidence-bar">
                                <div class="confidence-fill" style="width: 90%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <span>AI Risk Level:</span>
                        <span class="badge ${result.deepfake_risk}">${result.deepfake_risk}</span>
                    </div>
                    <div class="analysis-item">
                        <span>Analysis Status:</span>
                        <span class="badge success">Complete</span>
                    </div>
                </div>
                
                <div class="ai-detailed-analysis">
                    <h6><i class="fas fa-microscope"></i> Detailed Analysis</h6>
                    <div class="ai-analysis-text">
                        ${result.ai_analysis.replace(/\n/g, '<br>')}
                    </div>
                </div>
            </div>
        `;
    } else if (result.status === 'basic_analysis') {
        analysisHTML += `
            <div class="analysis-section gemini-section">
                <h4><i class="fas fa-brain"></i> Gemini AI Expert Analysis</h4>
                <div class="info-message">
                    <i class="fas fa-cog"></i> <strong>Configuration Required</strong><br>
                    Configure GEMINI_API_KEY to enable advanced AI-powered deepfake detection using Google Gemini Pro Vision with expert-level analysis and definitive verdicts.
                </div>
            </div>
        `;
    } else if (result.status === 'error') {
        analysisHTML += `
            <div class="analysis-section gemini-section">
                <h4><i class="fas fa-brain"></i> Gemini AI Expert Analysis</h4>
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i> <strong>Analysis Failed</strong><br>
                    ${result.message || 'Unknown error occurred'}
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
    console.log('Video analysis result:', result); // Debug logging
    
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
    
    // Show status message if there's an error
    if (result.status === 'error') {
        analysisHTML += `
            <div class="analysis-section">
                <h4><i class="fas fa-exclamation-triangle"></i> Analysis Status</h4>
                <div class="error-message">
                    <p><strong>Error:</strong> ${result.message || 'Unknown error occurred'}</p>
                </div>
            </div>
        `;
    }
    
    // Gemini AI Analysis for Video - Prominent Display
    if (result.gemini_analysis && result.gemini_analysis.status === 'success') {
        const gemini = result.gemini_analysis;
        const verdictClass = getVerdictClass(gemini.risk_level);
        
        analysisHTML += `
            <div class="analysis-section gemini-section">
                <h4><i class="fas fa-brain"></i> Gemini AI Expert Analysis</h4>
                
                <div class="verdict-card">
                    <div class="verdict-header">
                        <h5><i class="fas fa-gavel"></i> AI Verdict</h5>
                    </div>
                    <div class="verdict-content">
                        <div class="verdict-badge ${verdictClass}">
                            ${gemini.risk_level ? gemini.risk_level.toUpperCase() + ' RISK' : 'UNKNOWN'}
                        </div>
                        <div class="confidence-meter">
                            <span class="confidence-label">Video Analysis: Complete</span>
                            <div class="confidence-bar">
                                <div class="confidence-fill" style="width: 85%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <span>AI Risk Assessment:</span>
                        <span class="badge ${gemini.risk_level}">${gemini.risk_level}</span>
                    </div>
                    <div class="analysis-item">
                        <span>Analysis Status:</span>
                        <span class="badge success">Complete</span>
                    </div>
                </div>
                
                <div class="ai-detailed-analysis">
                    <h6><i class="fas fa-microscope"></i> Detailed Analysis</h6>
                    <div class="ai-analysis-text">
                        ${gemini.analysis.replace(/\n/g, '<br>')}
                    </div>
                </div>
            </div>
        `;
    } else if (result.gemini_analysis && result.gemini_analysis.status === 'not_available') {
        analysisHTML += `
            <div class="analysis-section gemini-section">
                <h4><i class="fas fa-brain"></i> Gemini AI Expert Analysis</h4>
                <div class="info-message">
                    <i class="fas fa-cog"></i> <strong>Configuration Required</strong><br>
                    Configure GEMINI_API_KEY to enable advanced AI-powered deepfake detection with expert-level video analysis and definitive verdicts.
                </div>
            </div>
        `;
    } else if (result.gemini_analysis && result.gemini_analysis.status === 'error') {
        analysisHTML += `
            <div class="analysis-section gemini-section">
                <h4><i class="fas fa-brain"></i> Gemini AI Expert Analysis</h4>
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i> <strong>Analysis Failed</strong><br>
                    ${result.gemini_analysis.analysis}
                </div>
            </div>
        `;
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
    
    // Frame analysis breakdown
    if (result.frames_analyzed > 0) {
        analysisHTML += `
            <div class="analysis-section">
                <h4><i class="fas fa-images"></i> Frame Analysis Summary</h4>
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <span>Total Frames Analyzed:</span>
                        <span>${result.frames_analyzed}</span>
                    </div>
                    <div class="analysis-item">
                        <span>High Risk Frames:</span>
                        <span class="badge high">${result.high_risk_frames || 0}</span>
                    </div>
                    <div class="analysis-item">
                        <span>Medium Risk Frames:</span>
                        <span class="badge medium">${result.medium_risk_frames || 0}</span>
                    </div>
                    <div class="analysis-item">
                        <span>Low Risk Frames:</span>
                        <span class="badge low">${result.low_risk_frames || 0}</span>
                    </div>
                </div>
                <p>Analyzed ${result.frames_analyzed} sample frames for deepfake indicators.</p>
            </div>
        `;
    }
    
    // Show individual frame analyses if available
    if (result.frame_analyses && result.frame_analyses.length > 0) {
        analysisHTML += `
            <div class="analysis-section">
                <h4><i class="fas fa-microscope"></i> Sample Frame Details</h4>
        `;
        
        result.frame_analyses.forEach((frameAnalysis, index) => {
            analysisHTML += `
                <div class="frame-analysis">
                    <h5>Frame ${index + 1}</h5>
                    <div class="analysis-item">
                        <span>Risk Level:</span>
                        <span class="badge ${frameAnalysis.deepfake_risk}">${frameAnalysis.deepfake_risk}</span>
                    </div>
                    <div class="analysis-item">
                        <span>Status:</span>
                        <span>${frameAnalysis.status}</span>
                    </div>
                </div>
            `;
        });
        
        analysisHTML += `</div>`;
    }
    
    // If no analysis content, show a message
    if (!analysisHTML) {
        analysisHTML = `
            <div class="analysis-section">
                <h4><i class="fas fa-info-circle"></i> Analysis Information</h4>
                <p>No detailed analysis data available. This may be due to video processing limitations or API configuration.</p>
            </div>
        `;
    }
    
    document.getElementById('analysis-content').innerHTML = analysisHTML;
    
    // Recommendations
    displayRecommendations(result.recommendations || ['No recommendations available']);
    showResults();
}

function displayRecommendations(recommendations) {
    const list = document.getElementById('recommendations-list');
    list.innerHTML = '';
    
    recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.innerHTML = rec; // Use innerHTML to support emojis and formatting
        list.appendChild(li);
    });
}

function getRiskLevel(score) {
    if (score > 0.7) {
        return { level: 'High Risk', className: 'risk-high', score: score };
    } else if (score > 0.4) {
        return { level: 'Moderate Risk', className: 'risk-moderate', score: score };
    } else {
        return { level: 'Low Risk', className: 'risk-low', score: score };
    }
}

function getDeepfakeRiskLevel(risk) {
    switch (risk.toLowerCase()) {
        case 'high':
            return { level: 'High Risk', className: 'risk-high', score: 0.8 };
        case 'medium':
            return { level: 'Moderate Risk', className: 'risk-moderate', score: 0.5 };
        case 'low':
            return { level: 'Low Risk', className: 'risk-low', score: 0.2 };
        default:
            return { level: 'Unknown', className: 'risk-unknown', score: 0.5 };
    }
}

function getVerdictClass(verdict) {
    if (!verdict) return 'verdict-unknown';
    
    const verdictUpper = verdict.toUpperCase();
    
    // Handle fake news verdicts
    if (verdictUpper === 'FAKE NEWS') return 'verdict-fake';
    if (verdictUpper === 'MODERATELY FAKE') return 'verdict-moderate';
    if (verdictUpper === 'LEGITIMATE') return 'verdict-legitimate';
    
    // Handle risk levels for images/videos
    if (verdictUpper === 'HIGH' || verdictUpper === 'HIGH RISK') return 'verdict-fake';
    if (verdictUpper === 'MEDIUM' || verdictUpper === 'MODERATE' || verdictUpper === 'MEDIUM RISK') return 'verdict-moderate';
    if (verdictUpper === 'LOW' || verdictUpper === 'LOW RISK') return 'verdict-legitimate';
    
    return 'verdict-unknown';
}

// UI state management
function setTextLoading(loading) {
    const btn = document.getElementById('analyze-text-btn');
    const text = document.getElementById('text-btn-text');
    const spinner = document.getElementById('text-spinner');
    
    btn.disabled = loading;
    if (loading) {
        text.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        spinner.classList.remove('hidden');
    } else {
        text.innerHTML = '<i class="fas fa-search"></i> Analyze for Misinformation';
        spinner.classList.add('hidden');
    }
}

function setImageLoading(loading) {
    const btn = document.getElementById('analyze-image-btn');
    const text = document.getElementById('image-btn-text');
    const spinner = document.getElementById('image-spinner');
    
    btn.disabled = loading || !selectedImageFile;
    if (loading) {
        text.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        spinner.classList.remove('hidden');
    } else {
        text.innerHTML = '<i class="fas fa-search"></i> Analyze for Deepfakes';
        spinner.classList.add('hidden');
    }
}

function setVideoLoading(loading) {
    const btn = document.getElementById('analyze-video-btn');
    const text = document.getElementById('video-btn-text');
    const spinner = document.getElementById('video-spinner');
    
    btn.disabled = loading || !selectedVideoFile;
    if (loading) {
        text.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        spinner.classList.remove('hidden');
    } else {
        text.innerHTML = '<i class="fas fa-search"></i> Analyze for Deepfakes';
        spinner.classList.add('hidden');
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error-message').classList.add('hidden');
}

function showResults() {
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

function hideResults() {
    document.getElementById('results').classList.add('hidden');
}

// Export results
function exportResults() {
    const results = document.getElementById('results');
    const data = {
        timestamp: new Date().toISOString(),
        risk_assessment: document.getElementById('risk-badge').textContent,
        analysis: document.getElementById('analysis-content').textContent,
        recommendations: Array.from(document.getElementById('recommendations-list').children).map(li => li.textContent)
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `misinformation-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab.id === 'text-tab') {
            analyzeText();
        } else if (activeTab.id === 'image-tab' && selectedImageFile) {
            analyzeImage();
        } else if (activeTab.id === 'video-tab' && selectedVideoFile) {
            analyzeVideo();
        }
    }
});

// Test API connection
async function testAPI() {
    try {
        const response = await fetch('/health');
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API connection successful:', data);
            document.getElementById('api-status').innerHTML = '✅ API Ready';
        } else {
            console.log('⚠️ API connection failed');
            document.getElementById('api-status').innerHTML = '⚠️ API Connection Issues';
        }
    } catch (e) {
        console.log('❌ API test error:', e);
        document.getElementById('api-status').innerHTML = '❌ API Unavailable';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('text-input').focus();
    testAPI(); 
})