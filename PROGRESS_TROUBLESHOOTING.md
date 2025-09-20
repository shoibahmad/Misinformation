# Progress Indicator Troubleshooting Guide

## 🔧 **Port Change & Setup**

### **New Port Configuration**
- **Changed from**: Port 8003
- **Changed to**: Port 8005
- **Reason**: Avoid potential port conflicts

### **How to Start Server**
```bash
# Method 1: Direct Python
python main.py

# Method 2: Enhanced startup script
python start_server.py

# Method 3: Manual uvicorn
uvicorn main:app --host 0.0.0.0 --port 8005 --reload
```

## 🧪 **Testing Methods**

### **1. Browser Console Tests**
Open browser console (F12) and run:
```javascript
// Test individual progress indicators
testTextProgress()
testImageProgress() 
testVideoProgress()

// Check if elements exist
document.getElementById('text-progress')
document.getElementById('image-progress')
document.getElementById('video-progress')
```

### **2. Dedicated Test Page**
Navigate to: `http://localhost:8005/test_progress.html`
- Isolated testing environment
- Individual test buttons
- No interference from main app

### **3. Main App Testing**
1. Go to `http://localhost:8005`
2. Click the blue play button (🎯) in text analysis quick actions
3. Watch browser console for debug messages
4. Progress indicator should appear below the button

## 🔍 **Debugging Steps**

### **Step 1: Check Server Status**
```bash
# Verify server is running on correct port
curl http://localhost:8005/health

# Check debug info
curl http://localhost:8005/debug
```

### **Step 2: Browser Console Debugging**
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for these messages:
   - `🔧 Progress indicator test functions loaded`
   - `🚀 Running automatic progress indicator test...`
   - `✅ Auto-test completed - progress indicators should work`

### **Step 3: Element Inspection**
1. Right-click on the area below analyze button
2. Select "Inspect Element"
3. Look for `<div id="text-progress" class="progress-indicator hidden">`
4. Check if element exists and has correct classes

### **Step 4: CSS Verification**
In browser console, run:
```javascript
const progress = document.getElementById('text-progress');
console.log('Element found:', !!progress);
console.log('Classes:', progress?.className);
console.log('Computed styles:', getComputedStyle(progress));
```

## 🎯 **Expected Behavior**

### **When Working Correctly**
1. **Page Load**: Auto-test runs after 2 seconds
2. **Test Button**: Blue play button shows progress immediately
3. **Console**: Debug messages appear
4. **Visual**: Progress steps animate with colors and icons

### **Progress Indicator Structure**
```html
<div id="text-progress" class="progress-indicator">
  <div class="progress-steps">
    <div class="progress-step active">📄 Processing text...</div>
    <div class="progress-step">🧠 AI analysis...</div>
    <div class="progress-step">🔍 Fact checking...</div>
    <div class="progress-step">✅ Finalizing...</div>
  </div>
  <div class="progress-message">Starting analysis...</div>
</div>
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: Progress Indicator Not Visible**
**Symptoms**: Button works but no progress shown
**Solutions**:
1. Check browser console for errors
2. Verify CSS is loaded: `getComputedStyle(document.body)`
3. Force visibility: `testTextProgress()` in console
4. Clear browser cache (Ctrl+F5)

### **Issue 2: JavaScript Errors**
**Symptoms**: Console shows errors
**Solutions**:
1. Check if all files are loaded
2. Verify script.js is not corrupted
3. Restart server with `python main.py`

### **Issue 3: Port Conflicts**
**Symptoms**: Server won't start
**Solutions**:
1. Kill existing processes: `netstat -ano | findstr :8005`
2. Use different port: Change PORT in main.py
3. Restart computer if needed

### **Issue 4: CSS Not Applied**
**Symptoms**: Elements exist but no styling
**Solutions**:
1. Check if style.css loads: Network tab in DevTools
2. Verify CSS variables are defined
3. Force reload: Ctrl+Shift+R

## 🔧 **Manual Override**

If progress indicators still don't work, use this manual override in browser console:

```javascript
// Force show text progress indicator
const progress = document.getElementById('text-progress');
if (progress) {
    progress.style.display = 'flex';
    progress.style.flexDirection = 'column';
    progress.style.gap = '1rem';
    progress.style.padding = '1rem';
    progress.style.background = '#1e2347';
    progress.style.border = '2px solid #667eea';
    progress.style.borderRadius = '12px';
    progress.style.marginTop = '1rem';
    progress.classList.remove('hidden');
    console.log('✅ Progress indicator manually activated');
}
```

## 📊 **Success Indicators**

### **Visual Confirmation**
- ✅ Progress card appears below button
- ✅ Steps animate with icons and colors
- ✅ Message updates dynamically
- ✅ Completion animation shows

### **Console Confirmation**
- ✅ No JavaScript errors
- ✅ Debug messages appear
- ✅ Element queries return objects
- ✅ CSS styles are applied

## 🆘 **If Nothing Works**

1. **Clear Everything**:
   - Clear browser cache
   - Close all browser tabs
   - Restart browser

2. **Fresh Start**:
   - Stop server (Ctrl+C)
   - Restart with `python main.py`
   - Open new browser tab

3. **Alternative Testing**:
   - Try different browser (Chrome, Firefox, Edge)
   - Test on `http://localhost:8005/test_progress.html`
   - Use browser's incognito/private mode

4. **Last Resort**:
   - Check if antivirus is blocking
   - Try running as administrator
   - Verify Python and dependencies are installed

---

**Remember**: The server is now on **port 8005** instead of 8003!