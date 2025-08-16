"use client"

import { useState, useRef, useEffect } from "react"
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Type,
  FileImage,
  Clock,
  User,
  Calendar,
  Camera,
  X,
  ArrowRight,
  ZoomIn,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react"

// Zoomable Image Modal Component
const ZoomModal = ({ src, alt, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPosition, setStartDragPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  const zoomIn = () => setScale((s) => Math.min(s + 0.2, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setStartDragPosition({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({ x: e.clientX - startDragPosition.x, y: e.clientY - startDragPosition.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onMouseUp={handleMouseUp}>
      <div
        className="w-full h-full flex items-center justify-center overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className="max-w-[90vw] max-h-[90vh] transition-transform duration-200"
          style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          draggable="false"
        />
      </div>
      <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/80 transition-colors">
        <X size={24} />
      </button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 p-2 rounded-lg">
        <button onClick={zoomOut} className="p-2 text-white hover:bg-white/20 rounded-md"><Minus size={20} /></button>
        <button onClick={resetZoom} className="p-2 text-white hover:bg-white/20 rounded-md"><RotateCcw size={20} /></button>
        <button onClick={zoomIn} className="p-2 text-white hover:bg-white/20 rounded-md"><Plus size={20} /></button>
      </div>
    </div>
  );
};


export default function ImageInfoModal({
  isOpen = false,
  onClose = () => {},
  imageUrl,
  title,
  patientName,
  studyId,
  studyDate,
  studyTime,
  modality,
  bodyPart,
  technologist,
  status,
}) {
  const [activeTab, setActiveTab] = useState("text")
  const [textInput, setTextInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [transcript, setTranscript] = useState("")
  const [pendingTranscript, setPendingTranscript] = useState("")
  const [examImages, setExamImages] = useState([])
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' or 'error'


  const mediaRecorderRef = useRef(null)
  const audioRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }

        if (finalTranscript) {
          const newTranscript = finalTranscript.trim() + " "
          setTranscript((prev) => prev + newTranscript)
          setTextInput((prev) => (prev.trim() ? prev + " " : "") + newTranscript)
          setPendingTranscript("")
        } else if (interimTranscript) {
          setPendingTranscript(interimTranscript)
        }
      }

      recognitionRef.current.onend = () => {
        setPendingTranscript("")
      }
    }
  }, [])

  useEffect(() => {
    const fetchExamImages = async () => {
      if (isOpen && studyId) {
        setIsLoadingImages(true);
        try {
          const response = await fetch(`http://localhost:8000/api/v1/images/exams/${studyId}/images`);
          if (response.ok) {
            const data = await response.json();
            setExamImages(data.images || []);
            setSelectedImage(data.images?.[0] || { url: imageUrl, description: '' });
            setTextInput(data.images?.[0]?.description || '');
          } else {
            console.error("Failed to fetch exam images");
            setExamImages([]);
            setSelectedImage({ url: imageUrl, description: '' });
          }
        } catch (error) {
          console.error("Error fetching exam images:", error);
          setExamImages([]);
           setSelectedImage({ url: imageUrl, description: '' });
        } finally {
          setIsLoadingImages(false);
        }
      }
    };

    fetchExamImages();
  }, [isOpen, studyId, imageUrl]);


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      const chunks = []
      mediaRecorder.ondataavailable = (event) => chunks.push(event.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
      }
      mediaRecorder.start()
      setIsRecording(true)
      if (recognitionRef.current) recognitionRef.current.start()
    } catch (error) {
      console.error("Error starting recording:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recognitionRef.current) recognitionRef.current.stop()
      setTimeout(() => setActiveTab("text"), 500)
    }
  }

  const playAudio = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const clearRecording = () => {
    setAudioUrl(null)
    setTranscript("")
    setPendingTranscript("")
    setIsPlaying(false)
  }

  const transferTranscriptToText = () => {
    if (transcript) {
      setTextInput((prev) => (prev.trim() ? prev + " " : "") + transcript)
      setActiveTab("text")
    }
  }

  const getStatusColor = (status = "") => {
    switch (status.toLowerCase()) {
      case "complete": return "bg-green-500/20 text-green-300 border border-green-500/30";
      case "in progress": return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
      case "scheduled": return "bg-blue-500/20 text-blue-300 border border-blue-500/30";
      default: return "bg-gray-500/20 text-gray-300 border border-gray-500/30";
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])
  
  const getImagePathFromUrl = (url) => {
    if (!url) return null;
    try {
      const urlObject = new URL(url);
      const pathParts = urlObject.pathname.split('/exam-images/');
      if (pathParts.length > 1) {
        return pathParts[1];
      }
      return null;
    } catch (error) {
      console.error("Could not parse URL:", url, error);
      return null;
    }
  };

  const handleSaveReport = async () => {
    if (!textInput.trim() || !selectedImage) {
        alert("Please enter a description before saving.");
        return;
    }
    const imagePath = getImagePathFromUrl(selectedImage.url);
    if (!imagePath) {
        setSaveStatus('error');
        alert("Could not identify the image path to save the description.");
        return;
    }
    setIsSaving(true);
    setSaveStatus(null);
    try {
        const response = await fetch('http://localhost:8000/api/v1/images/description', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image_path: imagePath,
                description: textInput,
            }),
        });
        if (response.ok) {
            setSaveStatus('success');
            setTimeout(() => {
                onClose(); 
            }, 1500);
        } else {
            const errorData = await response.json();
            console.error("Save failed:", errorData);
            setSaveStatus('error');
        }
    } catch (error) {
        console.error("Error saving report:", error);
        setSaveStatus('error');
    } finally {
        setIsSaving(false);
        if (saveStatus === 'error') {
            setTimeout(() => setSaveStatus(null), 3000);
        }
    }
  };


  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
        <div className="relative z-10 w-full max-w-7xl h-[95vh] bg-slate-800/80 backdrop-blur-xl text-gray-100 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
          <div className="bg-white/5 border-b border-white/20 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileImage className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Image Analysis Report</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-md transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex h-[calc(100%-65px)]">
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              <div className="bg-black/20 border border-white/20 rounded-xl overflow-hidden">
                <div className="px-6 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <span className="text-sm text-gray-400">Study ID: {studyId}</span>
                  </div>
                </div>
                <div className="relative aspect-video w-full bg-black flex items-center justify-center cursor-pointer group" onClick={() => selectedImage && setIsZoomModalOpen(true)}>
                  {isLoadingImages ? (
                    <p className="text-gray-400">Loading images...</p>
                  ) : selectedImage ? (
                    <>
                      <img src={selectedImage.url} alt={title || 'Selected study image'} className="object-contain w-full h-full" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="w-12 h-12 text-white" />
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-400">No image available</p>
                  )}
                </div>
                {examImages.length > 1 && (
                  <div className="p-2 bg-black/30 overflow-x-auto">
                    <div className="flex gap-2">
                      {examImages.map((image, index) => (
                        <img
                          key={index}
                          src={image.url}
                          alt={`Thumbnail ${index + 1}`}
                          className={`w-20 h-20 object-cover rounded-md cursor-pointer border-2 ${selectedImage.url === image.url ? 'border-blue-500' : 'border-transparent'}`}
                          onClick={() => {
                            setSelectedImage(image);
                            setTextInput(image.description || '');
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: User, label: "Patient", value: patientName, color: "text-blue-400" },
                  { icon: Calendar, label: "Study Date", value: studyDate, color: "text-green-400" },
                  { icon: Camera, label: "Modality", value: modality, color: "text-purple-400" },
                ].map(item => (
                  <div key={item.label} className="flex-1 min-w-[180px] bg-white/5 border border-white/20 rounded-xl p-3 flex items-center space-x-3">
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <div>
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className="text-base font-semibold text-white truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
                 <div className="flex-1 min-w-[180px] bg-white/5 border border-white/20 rounded-xl p-3 flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-xs text-gray-400">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>
                  </div>
              </div>
              <div className="bg-white/5 border border-white/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Study Information</h3>
                <div className="flex flex-wrap gap-x-6 gap-y-4">
                  {[
                    { label: "Body Part", value: bodyPart },
                    { label: "Study ID", value: studyId },
                    { label: "Technologist", value: technologist },
                    { label: "Study Time", value: studyTime },
                    { label: "Study Date", value: studyDate },
                    { label: "Image Count", value: examImages.length },
                  ].map(item => (
                    <div key={item.label} className="min-w-[180px]">
                      <p className="text-sm text-gray-400">{item.label}</p>
                      <p className="text-white font-medium truncate">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="w-96 bg-black/20 border-l border-white/20 flex flex-col">
              <div className="p-6 pb-4 border-b border-white/20">
                <h3 className="text-lg font-semibold text-white">Clinical Notes</h3>
              </div>
              <div className="flex-1 flex flex-col p-6 pt-4 overflow-y-auto">
                <div className="flex-1 flex flex-col">
                  <div className="grid grid-cols-2 bg-black/20 p-1 rounded-lg mb-4 border border-white/10">
                    <button onClick={() => setActiveTab("text")} className={`flex items-center justify-center py-2.5 px-4 rounded-md font-medium transition-all duration-200 ${activeTab === "text" ? "bg-blue-600 text-white shadow-sm" : "text-gray-300 hover:text-white hover:bg-white/10"}`}>
                      <Type className="w-4 h-4 mr-2" /> Text
                    </button>
                    <button onClick={() => setActiveTab("voice")} className={`flex items-center justify-center py-2.5 px-4 rounded-md font-medium transition-all duration-200 ${activeTab === "voice" ? "bg-blue-600 text-white shadow-sm" : "text-gray-300 hover:text-white hover:bg-white/10"}`}>
                      <Mic className="w-4 h-4 mr-2" /> Voice
                    </button>
                  </div>
                  {activeTab === "text" && (
                    <div className="flex-1 flex flex-col space-y-3">
                      <textarea placeholder="Enter clinical observations..." value={textInput} onChange={(e) => setTextInput(e.target.value)} className="flex-1 bg-black/20 border border-white/20 text-white placeholder-gray-400 resize-none text-sm p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-400">{textInput.length} characters</p>
                        <button onClick={() => setTextInput("")} disabled={!textInput} className="bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20 h-8 px-3 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Clear</button>
                      </div>
                    </div>
                  )}
                  {activeTab === "voice" && (
                    <div className="flex-1 flex flex-col space-y-3">
                      <div className="flex gap-2">
                        {!isRecording ? (
                          <button onClick={startRecording} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 rounded-lg font-medium transition-colors flex items-center justify-center">
                            <Mic className="w-4 h-4 mr-2" /> Record
                          </button>
                        ) : (
                          <button onClick={stopRecording} className="flex-1 bg-red-600 hover:bg-red-700 text-white h-10 px-4 rounded-lg font-medium transition-colors flex items-center justify-center">
                            <MicOff className="w-4 h-4 mr-2" /> Stop
                          </button>
                        )}
                        {audioUrl && (
                          <>
                            <button onClick={!isPlaying ? playAudio : pauseAudio} className="bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20 h-10 px-3 rounded-lg transition-colors flex items-center justify-center">
                              {!isPlaying ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                            </button>
                            <button onClick={clearRecording} className="bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20 h-10 px-3 rounded-lg transition-colors flex items-center justify-center">
                              <Square className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                      {isRecording && (
                        <div className="flex items-center justify-center gap-2 text-red-400 py-2">
                          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                          <span className="text-sm">Recording...</span>
                        </div>
                      )}
                      {(transcript || pendingTranscript || isRecording) && (
                        <div className="flex-1 flex flex-col space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-300">Live Transcript:</p>
                            {transcript && (
                              <button onClick={transferTranscriptToText} className="bg-blue-600 border border-blue-500 text-white hover:bg-blue-700 text-xs h-7 px-2 rounded-md transition-colors flex items-center">
                                <ArrowRight className="w-3 h-3 mr-1" /> To Text
                              </button>
                            )}
                          </div>
                          <div className="flex-1 p-3 bg-black/20 rounded-lg border border-white/20 overflow-y-auto min-h-[150px]">
                            <p className="text-sm text-gray-200 whitespace-pre-wrap">{transcript}<span className="text-gray-400 italic">{pendingTranscript}</span></p>
                          </div>
                          {transcript && (<p className="text-xs text-blue-400">✓ Transcript automatically added to text field</p>)}
                        </div>
                      )}
                      {!transcript && !pendingTranscript && !isRecording && (
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/30 rounded-lg">
                          <div className="text-center text-gray-400">
                            <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Click Record to start voice transcription</p>
                          </div>
                        </div>
                      )}
                      {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 pt-4 border-t border-white/20">
                <div className="flex gap-3">
                  <button onClick={onClose} className="flex-1 bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20 h-10 px-4 rounded-lg font-medium transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveReport}
                    disabled={isSaving || saveStatus === 'success'}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white h-10 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Retry Save' : 'Save Report'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isZoomModalOpen && <ZoomModal src={selectedImage.url} alt="Zoomed in study image" onClose={() => setIsZoomModalOpen(false)} />}
    </>
  )
}