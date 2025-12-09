// Global Variables
let originalImage = null;
let processedImage = null;
let currentFile = null;
let originalWidth = 0;
let originalHeight = 0;
let aspectRatioValue = 1;

// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const imageInfo = document.getElementById('imageInfo');
const dimensionControls = document.getElementById('dimensionControls');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const aspectRatioCheckbox = document.getElementById('aspectRatio');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const formatSelect = document.getElementById('formatSelect');
const applyBtn = document.getElementById('applyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const originalCanvas = document.getElementById('originalCanvas');
const processedCanvas = document.getElementById('processedCanvas');
const previewPlaceholder = document.getElementById('previewPlaceholder');
const originalToggle = document.getElementById('originalToggle');
const processedToggle = document.getElementById('processedToggle');
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const nav = document.querySelector('.nav');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    // Upload Area Click
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // File Input Change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and Drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#00A79D';
        uploadArea.style.backgroundColor = 'rgba(0, 167, 157, 0.1)';
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.backgroundColor = 'transparent';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.backgroundColor = 'transparent';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    // Dimension Inputs
    widthInput.addEventListener('input', () => {
        if (aspectRatioCheckbox.checked && originalWidth > 0) {
            heightInput.value = Math.round(widthInput.value / aspectRatioValue);
        }
        updateEstimatedSize();
    });
    
    heightInput.addEventListener('input', () => {
        if (aspectRatioCheckbox.checked && originalHeight > 0) {
            widthInput.value = Math.round(heightInput.value * aspectRatioValue);
        }
        updateEstimatedSize();
    });
    
    // Quality Slider
    qualitySlider.addEventListener('input', () => {
        qualityValue.textContent = qualitySlider.value;
        updateEstimatedSize();
    });
    
    // Format Select
    formatSelect.addEventListener('change', updateEstimatedSize);
    
    // Preset Buttons
    document.querySelectorAll('.btn-preset').forEach(btn => {
        btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
    });
    
    // Apply Button
    applyBtn.addEventListener('click', applyResize);
    
    // Download Button
    downloadBtn.addEventListener('click', downloadImage);
    
    // Reset Button
    resetBtn.addEventListener('click', resetTool);
    
    // Preview Toggle
    originalToggle.addEventListener('click', () => showPreview('original'));
    processedToggle.addEventListener('click', () => showPreview('processed'));
    
    // Mobile Menu Toggle
    mobileMenuToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
    });
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    if (!file.type.match('image.*')) {
        alert('Please upload a valid image file (JPG, PNG, WEBP, BMP, TIFF)');
        return;
    }
    
    currentFile = file;
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            originalWidth = img.width;
            originalHeight = img.height;
            aspectRatioValue = originalWidth / originalHeight;
            
            // Display original image on canvas
            displayOriginalImage(img);
            
            // Update UI
            showImageInfo();
            
            // Set initial dimensions
            widthInput.value = originalWidth;
            heightInput.value = originalHeight;
            
            // Show controls
            imageInfo.style.display = 'block';
            dimensionControls.style.display = 'block';
            
            // Update file info
            document.getElementById('originalSize').textContent = formatFileSize(file.size);
            document.getElementById('originalDimensions').textContent = `${originalWidth} × ${originalHeight}px`;
            updateEstimatedSize();
        };
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

function displayOriginalImage(img) {
    const maxWidth = 600;
    const maxHeight = 600;
    let displayWidth = img.width;
    let displayHeight = img.height;
    
    // Scale down for display if needed
    if (displayWidth > maxWidth || displayHeight > maxHeight) {
        const ratio = Math.min(maxWidth / displayWidth, maxHeight / displayHeight);
        displayWidth *= ratio;
        displayHeight *= ratio;
    }
    
    originalCanvas.width = displayWidth;
    originalCanvas.height = displayHeight;
    
    const ctx = originalCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
    
    previewPlaceholder.style.display = 'none';
    originalCanvas.style.display = 'block';
    processedCanvas.style.display = 'none';
}

function showImageInfo() {
    imageInfo.style.display = 'block';
}

function applyPreset(preset) {
    if (!originalImage) return;
    
    let newWidth, newHeight;
    
    switch(preset) {
        case '1x':
            newWidth = originalWidth;
            newHeight = originalHeight;
            break;
        case '2x':
            newWidth = originalWidth * 2;
            newHeight = originalHeight * 2;
            break;
        case '4x':
            newWidth = originalWidth * 4;
            newHeight = originalHeight * 4;
            break;
        case '1080p':
            newWidth = 1920;
            newHeight = 1080;
            break;
        case '4k':
            newWidth = 3840;
            newHeight = 2160;
            break;
    }
    
    widthInput.value = newWidth;
    heightInput.value = newHeight;
    updateEstimatedSize();
}

function applyResize() {
    if (!originalImage) {
        alert('Please upload an image first');
        return;
    }
    
    const newWidth = parseInt(widthInput.value) || originalWidth;
    const newHeight = parseInt(heightInput.value) || originalHeight;
    
    if (newWidth <= 0 || newHeight <= 0) {
        alert('Please enter valid dimensions');
        return;
    }
    
    // Create processed canvas with new dimensions
    processedCanvas.width = newWidth;
    processedCanvas.height = newHeight;
    
    const ctx = processedCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Clear canvas
    ctx.clearRect(0, 0, newWidth, newHeight);
    
    // Draw resized image
    ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);
    
    // Update display dimensions for preview
    const maxWidth = 600;
    const maxHeight = 600;
    let displayWidth = newWidth;
    let displayHeight = newHeight;
    
    if (displayWidth > maxWidth || displayHeight > maxHeight) {
        const ratio = Math.min(maxWidth / displayWidth, maxHeight / displayHeight);
        displayWidth *= ratio;
        displayHeight *= ratio;
    }
    
    // Create a temporary canvas for display
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = displayWidth;
    tempCanvas.height = displayHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';
    tempCtx.drawImage(processedCanvas, 0, 0, displayWidth, displayHeight);
    
    // Copy to display canvas
    processedCanvas.width = displayWidth;
    processedCanvas.height = displayHeight;
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.drawImage(tempCanvas, 0, 0);
    
    // Show processed preview
    showPreview('processed');
    
    // Show download button
    downloadBtn.style.display = 'inline-block';
    
    // Update dimensions display
    document.getElementById('newDimensions').textContent = `${newWidth} × ${newHeight}px`;
}

function downloadImage() {
    if (!originalImage) {
        alert('No image to download');
        return;
    }
    
    const newWidth = parseInt(widthInput.value) || originalWidth;
    const newHeight = parseInt(heightInput.value) || originalHeight;
    const quality = qualitySlider.value / 100;
    const format = formatSelect.value;
    
    // Create final canvas with exact dimensions
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = newWidth;
    finalCanvas.height = newHeight;
    
    const ctx = finalCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);
    
    // Convert to blob and download
    finalCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const extension = format.split('/')[1];
        a.download = `resized-image-${newWidth}x${newHeight}.${extension}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, format, quality);
}

function resetTool() {
    // Reset all variables
    originalImage = null;
    processedImage = null;
    currentFile = null;
    originalWidth = 0;
    originalHeight = 0;
    
    // Reset UI
    fileInput.value = '';
    widthInput.value = '';
    heightInput.value = '';
    qualitySlider.value = 92;
    qualityValue.textContent = '92';
    formatSelect.value = 'image/jpeg';
    
    // Hide controls
    imageInfo.style.display = 'none';
    dimensionControls.style.display = 'none';
    downloadBtn.style.display = 'none';
    
    // Clear canvases
    const ctx1 = originalCanvas.getContext('2d');
    const ctx2 = processedCanvas.getContext('2d');
    ctx1.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
    ctx2.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
    
    // Show placeholder
    previewPlaceholder.style.display = 'flex';
    originalCanvas.style.display = 'none';
    processedCanvas.style.display = 'none';
    
    // Reset toggle
    originalToggle.classList.add('active');
    processedToggle.classList.remove('active');
}

function showPreview(type) {
    if (type === 'original') {
        originalCanvas.style.display = 'block';
        processedCanvas.style.display = 'none';
        originalToggle.classList.add('active');
        processedToggle.classList.remove('active');
    } else {
        originalCanvas.style.display = 'none';
        processedCanvas.style.display = 'block';
        originalToggle.classList.remove('active');
        processedToggle.classList.add('active');
    }
    previewPlaceholder.style.display = 'none';
}

function updateEstimatedSize() {
    if (!originalImage || !currentFile) return;
    
    const newWidth = parseInt(widthInput.value) || originalWidth;
    const newHeight = parseInt(heightInput.value) || originalHeight;
    const quality = qualitySlider.value / 100;
    
    // Rough estimation based on dimensions and quality
    const pixelRatio = (newWidth * newHeight) / (originalWidth * originalHeight);
    const estimatedSize = currentFile.size * pixelRatio * quality;
    
    document.getElementById('estimatedSize').textContent = formatFileSize(estimatedSize);
    document.getElementById('newDimensions').textContent = `${newWidth} × ${newHeight}px`;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
