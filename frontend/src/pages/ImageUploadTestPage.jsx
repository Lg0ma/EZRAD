import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Image, 
  FileImage, 
  CheckCircle, 
  AlertCircle, 
  X,
  Loader,
  Camera,
  File,
  ArrowLeft
} from 'lucide-react';

const ImageUploadTestPage = ({ onNavigate }) => {
  const [examId, setExamId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null); // null, 'uploading', 'success', 'error'
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadedImageInfo, setUploadedImageInfo] = useState(null);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/dicom'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (!validTypes.includes(file.type) && !['dcm', 'dicom'].includes(fileExtension)) {
        setUploadStatus('error');
        setUploadMessage('Please select a valid image file (JPEG, PNG, GIF, BMP, or DICOM)');
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        setUploadStatus('error');
        setUploadMessage('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setUploadStatus(null);
      setUploadMessage('');

      // Create preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const event = { target: { files: [files[0]] } };
      handleFileSelect(event);
    }
  };

  // Clear selected file
  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadStatus(null);
    setUploadMessage('');
    setUploadedImageInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle upload
  const handleUpload = async () => {
    // Validate inputs
    if (!examId.trim()) {
      setUploadStatus('error');
      setUploadMessage('Please enter an Exam ID');
      return;
    }

    if (!selectedFile) {
      setUploadStatus('error');
      setUploadMessage('Please select an image file');
      return;
    }

    // Create FormData
    const formData = new FormData();
    formData.append('exam_id', examId.trim());
    formData.append('file', selectedFile);

    setUploadStatus('uploading');
    setUploadMessage('Uploading image...');

    try {
      const response = await fetch('http://localhost:8000/api/v1/images/', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setUploadStatus('success');
        setUploadMessage('Image uploaded successfully!');
        setUploadedImageInfo(data);
        
        // Clear form after successful upload
        setTimeout(() => {
          clearFile();
          setExamId('');
        }, 3000);
      } else {
        setUploadStatus('error');
        setUploadMessage(data.detail || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadMessage('Network error: ' + error.message);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-3 rounded-lg">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Image Upload Test</h1>
              <p className="text-slate-300">Upload medical images to exam records</p>
            </div>
          </div>
        </div>

        {/* Main Upload Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
          {/* Exam ID Input */}
          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-2">
              Exam ID *
            </label>
            <input
              type="text"
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              placeholder="Enter exam ID (e.g., 550e8400-e29b-41d4-a716-446655440000)"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-400 mt-1">
              Enter the UUID of the exam to attach this image to
            </p>
          </div>

          {/* File Upload Area */}
          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-2">
              Select Image *
            </label>
            
            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
              >
                <Upload className="w-12 h-12 text-white/50 mx-auto mb-3" />
                <p className="text-white mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-slate-400">
                  JPEG, PNG, GIF, BMP, or DICOM (Max 10MB)
                </p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/20 rounded-lg p-4">
                <div className="flex items-start space-x-4">
                  {previewUrl ? (
                    <div className="flex-shrink-0">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-24 h-24 object-cover rounded-lg border border-white/20"
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-24 h-24 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                      <FileImage className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <p className="text-white font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-slate-400">
                      {formatFileSize(selectedFile.size)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Type: {selectedFile.type || 'Unknown'}
                    </p>
                    <button
                      onClick={clearFile}
                      className="mt-2 text-red-400 hover:text-red-300 text-sm flex items-center"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove file
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept="image/*,.dcm,.dicom"
              className="hidden"
            />
          </div>

          {/* Status Messages */}
          {uploadStatus && (
            <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
              uploadStatus === 'success' ? 'bg-green-500/20 border border-green-500/30' :
              uploadStatus === 'error' ? 'bg-red-500/20 border border-red-500/30' :
              'bg-blue-500/20 border border-blue-500/30'
            }`}>
              {uploadStatus === 'uploading' && (
                <Loader className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0 mt-0.5" />
              )}
              {uploadStatus === 'success' && (
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              )}
              {uploadStatus === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  uploadStatus === 'success' ? 'text-green-300' :
                  uploadStatus === 'error' ? 'text-red-300' :
                  'text-blue-300'
                }`}>
                  {uploadMessage}
                </p>
                
                {uploadedImageInfo && uploadStatus === 'success' && (
                  <div className="mt-2 text-sm text-slate-300">
                    <p>Image ID: {uploadedImageInfo.id}</p>
                    <p>Exam ID: {uploadedImageInfo.exam_id}</p>
                    <p>File Path: {uploadedImageInfo.file_path}</p>
                    <p>Created: {new Date(uploadedImageInfo.created_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={clearFile}
              className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              Clear
            </button>
            <button
              onClick={handleUpload}
              disabled={!examId || !selectedFile || uploadStatus === 'uploading'}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {uploadStatus === 'uploading' ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload Image</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Instructions Card */}
        <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-blue-400" />
            Instructions
          </h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">1.</span>
              Enter the UUID of an existing exam in the Exam ID field
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">2.</span>
              Select an image file by clicking the upload area or dragging a file
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">3.</span>
              Supported formats: JPEG, PNG, GIF, BMP, DICOM (Max 10MB)
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">4.</span>
              Click "Upload Image" to attach the image to the exam record
            </li>
          </ul>
          
          <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <p className="text-xs text-yellow-300">
              <strong>Note:</strong> This is a test page. In production, image uploads would typically be integrated into the exam workflow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadTestPage;