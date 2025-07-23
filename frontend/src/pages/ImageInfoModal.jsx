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
} from "lucide-react"
import Image from "/Img1.jpeg"

export default function ImageInfoModal({
  isOpen = false,
  onClose = () => {},
  imageUrl = "/placeholder.svg?height=400&width=600",
  title = "Chest X-Ray Study",
  patientName = "Smith, John",
  studyId = "XR-2024-001",
  studyDate = "7/7/2025",
  studyTime = "14:30",
  modality = "X-Ray",
  bodyPart = "Chest",
  technologist = "Sarah Johnson, RT(R)",
  status = "Complete",
}) {
  const [activeTab, setActiveTab] = useState("text")
  const [textInput, setTextInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [transcript, setTranscript] = useState("")
  const [pendingTranscript, setPendingTranscript] = useState("")

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
          // Add final transcript to both transcript state and text input
          const newTranscript = finalTranscript.trim() + " "
          setTranscript((prev) => prev + newTranscript)

          // Add to text input (append if there's existing text)
          setTextInput((prev) => {
            const separator = prev.trim() ? " " : ""
            return prev + separator + newTranscript
          })

          // Clear pending transcript since it's now final
          setPendingTranscript("")
        } else if (interimTranscript) {
          // Show interim results
          setPendingTranscript(interimTranscript)
        }
      }

      recognitionRef.current.onend = () => {
        // Clear pending transcript when recognition ends
        setPendingTranscript("")
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const chunks = []
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)

      if (recognitionRef.current) {
        recognitionRef.current.start()
      }
    } catch (error) {
      console.error("Error starting recording:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }

      // Switch to text tab to show the transcribed content
      setTimeout(() => {
        setActiveTab("text")
      }, 500)
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
      const separator = textInput.trim() ? " " : ""
      setTextInput(textInput + separator + transcript)
      setActiveTab("text")
    }
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "complete":
        return "bg-green-600 hover:bg-green-700"
      case "in progress":
        return "bg-yellow-600 hover:bg-yellow-700"
      case "scheduled":
        return "bg-blue-600 hover:bg-blue-700"
      default:
        return "bg-gray-600 hover:bg-gray-700"
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} style={{ backgroundColor: "transparent" }} />

      {/* Modal Content */}
      <div className="relative w-full max-w-7xl h-[95vh] bg-gray-900 text-gray-100 rounded-lg shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileImage className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Image Analysis Report</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex h-full">
          {/* Main Content */}
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {/* Image Display */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg">
              <div className="px-6 py-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileImage className="w-5 h-5" />
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <span>Study ID: {studyId}</span>
                    <span>•</span>
                    <span>{studyTime}</span>
                  </div>
                </div>
              </div>
              <div className="p-0">
                <div className="relative aspect-video w-full overflow-hidden">
                  <img
                    src={Image}
                    alt={title}
                    className="object-contain bg-black"
                  />
                </div>
              </div>
            </div>

            {/* Study Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-400">Patient</p>
                    <p className="text-base font-semibold text-white">{patientName}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-xs text-gray-400">Study Date</p>
                    <p className="text-base font-semibold text-white">{studyDate}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <Camera className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-xs text-gray-400">Modality</p>
                    <p className="text-base font-semibold text-white">{modality}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(status)}`}
                    >
                      {status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Study Details */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg">
              <div className="px-6 py-3">
                <h3 className="text-lg font-semibold text-white">Study Information</h3>
              </div>
              <div className="px-6 pb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Body Part</p>
                    <p className="text-white font-medium">{bodyPart}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Study ID</p>
                    <p className="text-white font-medium">{studyId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Technologist</p>
                    <p className="text-white font-medium">{technologist}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Acquisition Time</p>
                    <p className="text-white font-medium">{studyTime}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            {/* Notes Section Header */}
            <div className="p-6 pb-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Clinical Notes</h3>
            </div>

            {/* Notes Content */}
            <div className="flex-1 flex flex-col p-6 pt-4">
              <div className="flex-1 flex flex-col">
                {/* Custom Tab List */}
                <div className="grid grid-cols-2 bg-gray-700/50 p-1 rounded-lg mb-4 border border-gray-600">
                  <button
                    onClick={() => setActiveTab("text")}
                    className={`flex items-center justify-center py-2.5 px-4 rounded-md font-medium transition-all duration-200 ${
                      activeTab === "text"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-300 hover:text-white hover:bg-gray-600/50"
                    }`}
                  >
                    <Type className="w-4 h-4 mr-2" />
                    Text
                  </button>
                  <button
                    onClick={() => setActiveTab("voice")}
                    className={`flex items-center justify-center py-2.5 px-4 rounded-md font-medium transition-all duration-200 ${
                      activeTab === "voice"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-300 hover:text-white hover:bg-gray-600/50"
                    }`}
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Voice
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === "text" && (
                  <div className="flex-1 flex flex-col space-y-3">
                    <textarea
                      placeholder="Enter clinical observations..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      className="flex-1 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 resize-none text-sm p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-400">{textInput.length} characters</p>
                      <button
                        onClick={() => setTextInput("")}
                        disabled={!textInput}
                        className="bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 h-8 px-3 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "voice" && (
                  <div className="flex-1 flex flex-col space-y-3">
                    {/* Recording Controls */}
                    <div className="flex gap-2">
                      {!isRecording ? (
                        <button
                          onClick={startRecording}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 rounded-md font-medium transition-colors flex items-center justify-center"
                        >
                          <Mic className="w-4 h-4 mr-2" />
                          Record
                        </button>
                      ) : (
                        <button
                          onClick={stopRecording}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white h-10 px-4 rounded-md font-medium transition-colors flex items-center justify-center"
                        >
                          <MicOff className="w-4 h-4 mr-2" />
                          Stop
                        </button>
                      )}

                      {audioUrl && (
                        <>
                          <button
                            onClick={!isPlaying ? playAudio : pauseAudio}
                            className="bg-gray-600 border border-gray-500 text-gray-300 hover:bg-gray-500 h-10 px-3 rounded-md transition-colors flex items-center justify-center"
                          >
                            {!isPlaying ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={clearRecording}
                            className="bg-gray-600 border border-gray-500 text-gray-300 hover:bg-gray-500 h-10 px-3 rounded-md transition-colors flex items-center justify-center"
                          >
                            <Square className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Recording Status */}
                    {isRecording && (
                      <div className="flex items-center justify-center gap-2 text-red-400 py-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                        <span className="text-sm">Recording...</span>
                      </div>
                    )}

                    {/* Transcript Area */}
                    {(transcript || pendingTranscript || isRecording) && (
                      <div className="flex-1 flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-300">Live Transcript:</p>
                          {transcript && (
                            <button
                              onClick={transferTranscriptToText}
                              className="bg-blue-600 border border-blue-500 text-white hover:bg-blue-700 text-xs h-7 px-2 rounded-md transition-colors flex items-center"
                            >
                              <ArrowRight className="w-3 h-3 mr-1" />
                              To Text
                            </button>
                          )}
                        </div>
                        <div className="flex-1 p-3 bg-gray-700 rounded-lg border border-gray-600 overflow-y-auto min-h-[200px]">
                          <p className="text-sm text-gray-200 whitespace-pre-wrap">
                            {transcript}
                            {pendingTranscript && <span className="text-gray-400 italic">{pendingTranscript}</span>}
                          </p>
                        </div>
                        {transcript && (
                          <p className="text-xs text-blue-400">✓ Transcript automatically added to text field</p>
                        )}
                      </div>
                    )}

                    {/* Placeholder when no recording */}
                    {!transcript && !pendingTranscript && !isRecording && (
                      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-600 rounded-lg">
                        <div className="text-center text-gray-400">
                          <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Click Record to start voice transcription</p>
                        </div>
                      </div>
                    )}

                    {audioUrl && (
                      <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 pt-4 border-t border-gray-700">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 h-10 px-4 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 rounded-md font-medium transition-colors">
                  Save Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
