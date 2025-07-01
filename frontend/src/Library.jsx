import Modal from "react-modal";
import React, { useState, useMemo, useRef } from "react";
import {
  Image,
  Search,
  X,
  Minus,
  Plus,
  RotateCcw,
  ImageOff,
  Edit, // For the sketch button
  Trash2, // For the clear button
  Undo, // For the undo button
  Eye, // To go back to view mode
} from "lucide-react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import "./Library.css";

// Helper function to generate a random date within the past two years
function getRandomDatePastTwoYears() {
  const today = new Date();
  const pastDate = new Date();
  const randomDays = Math.floor(Math.random() * 731);
  pastDate.setDate(today.getDate() - randomDays);
  return pastDate;
}

// Base image data
const baseImages = [

    { id: "IMG001", src: "https://health.osu.edu/-/media/health/images/stories/2023/02/x-ray.jpg", thumbnail: "https://health.osu.edu/-/media/health/images/stories/2023/02/x-ray.jpg", alt: "Forest Road" },

    { id: "IMG002", src: "https://picsum.photos/id/20/800/800", thumbnail: "https://picsum.photos/id/20/400/400", alt: "Laptop Work" },

    { id: "IMG003", src: "https://picsum.photos/id/30/800/800", thumbnail: "https://picsum.photos/id/30/400/400", alt: "Coffee Cup" },

    { id: "IMG004", src: "https://picsum.photos/id/40/800/800", thumbnail: "https://picsum.photos/id/40/400/400", alt: "City Night" },

    { id: "IMG005", src: "https://picsum.photos/id/50/800/800", thumbnail: "https://picsum.photos/id/50/400/400", alt: "Beach Sunset" },

    { id: "IMG006", src: "https://picsum.photos/id/60/800/800", thumbnail: "https://picsum.photos/id/60/400/400", alt: "Office Desk" },

    { id: "IMG007", src: "https://picsum.photos/id/70/800/800", thumbnail: "https://picsum.photos/id/70/400/400", alt: "Mountain Lake" },

    { id: "IMG008", src: "https://picsum.photos/id/80/800/800", thumbnail: "https://picsum.photos/id/80/400/400", alt: "Portrait" },

    { id: "IMG009", src: "https://picsum.photos/id/90/800/800", thumbnail: "https://picsum.photos/id/90/400/400", alt: "Strawberries" },

    { id: "IMG010", src: "https://picsum.photos/id/100/800/800", thumbnail: "https://picsum.photos/id/100/400/400", alt: "Beach View" },

    { id: "IMG011", src: "https://picsum.photos/id/110/800/800", thumbnail: "https://picsum.photos/id/110/400/400", alt: "Car Interior" },

    { id: "IMG012", src: "https://picsum.photos/id/120/800/800", thumbnail: "https://picsum.photos/id/120/400/400", alt: "Green Valley" },

    { id: "IMG013", src: "https://picsum.photos/id/130/800/800", thumbnail: "https://picsum.photos/id/130/400/400", alt: "City Park" },

    { id: "IMG014", src: "https://picsum.photos/id/140/800/800", thumbnail: "https://picsum.photos/id/140/400/400", alt: "Train Tracks" },

    { id: "IMG015", src: "https://picsum.photos/id/145/800/800", thumbnail: "https://picsum.photos/id/145/400/400", alt: "Dog Portrait" },

    { id: "IMG016", src: "https://picsum.photos/id/160/800/800", thumbnail: "https://picsum.photos/id/160/400/400", alt: "Railway" },

    { id: "IMG017", src: "https://picsum.photos/id/170/800/800", thumbnail: "https://picsum.photos/id/170/400/400", alt: "Forest Path" },

    { id: "IMG018", src: "https://picsum.photos/id/180/800/800", thumbnail: "https://picsum.photos/id/180/400/400", alt: "Laptop Code" },

    { id: "IMG019", src: "https://picsum.photos/id/190/800/800", thumbnail: "https://picsum.photos/id/190/400/400", alt: "City Skyline" },

    { id: "IMG020", src: "https://picsum.photos/id/200/800/800", thumbnail: "https://picsum.photos/id/200/400/400", alt: "Bison" },

    { id: "IMG021", src: "https://picsum.photos/id/210/800/800", thumbnail: "https://picsum.photos/id/210/400/400", alt: "Brick Building" },

    { id: "IMG022", src: "https://picsum.photos/id/220/800/800", thumbnail: "https://picsum.photos/id/220/400/400", alt: "Night Stars" },

    { id: "IMG023", src: "https://picsum.photos/id/230/800/800", thumbnail: "https://picsum.photos/id/230/400/400", alt: "Milky Way" },

    { id: "IMG024", src: "https://picsum.photos/id/240/800/800", thumbnail: "https://picsum.photos/id/240/400/400", alt: "Stairs" },

    { id: "IMG025", src: "https://picsum.photos/id/250/800/800", thumbnail: "https://picsum.photos/id/250/400/400", alt: "Camera Lens" },

    { id: "IMG026", src: "https://picsum.photos/id/260/800/800", thumbnail: "https://picsum.photos/id/260/400/400", alt: "Food Plate" },

    { id: "IMG027", src: "https://picsum.photos/id/270/800/800", thumbnail: "https://picsum.photos/id/270/400/400", alt: "Cliff Ocean" },

    { id: "IMG028", src: "https://picsum.photos/id/280/800/800", thumbnail: "https://picsum.photos/id/280/400/400", alt: "Road Trip" },

    { id: "IMG029", src: "https://picsum.photos/id/290/800/800", thumbnail: "https://picsum.photos/id/290/400/400", alt: "Cat Portrait" },

    { id: "IMG030", src: "https://picsum.photos/id/300/800/800", thumbnail: "https://picsum.photos/id/300/400/400", alt: "Bridge View" },

];

const allImages = baseImages.map(image => ({
  ...image,
  date: getRandomDatePastTwoYears(),
}));

function ImageItem({ id, src, alt, thumbnail, size, date }) {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPosition, setStartDragPosition] = useState({ x: 0, y: 0 });
  
  // ** NEW: State to toggle between viewing and sketching **
  const [isSketchMode, setIsSketchMode] = useState(false);
  // ** NEW: Ref for the sketch canvas **
  const sketchCanvasRef = useRef(null);

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => {
    setModalIsOpen(false);
    resetZoom();
    // ** NEW: Reset sketch mode on close **
    setIsSketchMode(false); 
  };
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.1, 5));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.5));
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
  const handleMouseLeave = () => setIsDragging(false);

  const formattedDate = date.toLocaleDateString("en-US", {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // ** NEW: Canvas control functions **
  const handleUndo = () => sketchCanvasRef.current?.undo();
  const handleClear = () => sketchCanvasRef.current?.clearCanvas();

  return (
    <>
      <div 
        className="image-card" 
        onClick={openModal}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <img src={thumbnail} alt={alt} />
        <div className="hover-overlay">
          <div className="image-info">
            <div className="image-name">{alt}</div>
            <div className="image-date">{formattedDate}</div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
          content: {
            position: "relative",
            background: "transparent",
            border: "none",
            padding: "0",
            inset: "0px",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "80vw", // Set a max width for the content
            height: "80vh", // Set a max height for the content
          },
        }}
      >
        <button onClick={closeModal} className="modal-close-button">
          <X size={20} />
        </button>

        {/* ** NEW: Conditional controls based on mode ** */}
        {isSketchMode ? (
          <div className="modal-zoom-controls">
            <button onClick={() => setIsSketchMode(false)} className="zoom-button" title="Back to View">
              <Eye size={16} />
            </button>
            <button onClick={handleUndo} className="zoom-button" title="Undo Sketch">
              <Undo size={16} />
            </button>
            <button onClick={handleClear} className="zoom-button" title="Clear Sketch">
              <Trash2 size={16} />
            </button>
          </div>
        ) : (
          <div className="modal-zoom-controls">
            <button onClick={() => setIsSketchMode(true)} className="zoom-button" title="Sketch on Image">
              <Edit size={16} />
            </button>
            <button onClick={zoomOut} className="zoom-button" title="Zoom Out">
              <Minus size={16} />
            </button>
            <button onClick={resetZoom} className="zoom-button" title="Reset Zoom">
              <RotateCcw size={16} />
            </button>
            <button onClick={zoomIn} className="zoom-button" title="Zoom In">
              <Plus size={16} />
            </button>
          </div>
        )}

        {/* ** NEW: Conditional rendering for image view or sketch canvas ** */}
        {isSketchMode ? (
          <ReactSketchCanvas
            ref={sketchCanvasRef}
            style={{ 
                border: "1px solid #ccc",
                borderRadius: "0.25rem",
            }}
            width="100%"
            height="100%"
            backgroundImage={src}
            preserveBackgroundImageAspectRatio="xMidYMid meet"
            strokeWidth={4}
            strokeColor="red"
          />
        ) : (
          <div 
            className="modal-image-container"
            onMouseDown={handleMouseDown} 
            onMouseMove={handleMouseMove} 
            onMouseUp={handleMouseUp} 
            onMouseLeave={handleMouseLeave}
          >
            <img
              src={src}
              alt={alt}
              className="modal-image"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? "none" : "transform 0.2s",
                cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
              }}
              draggable={false}
            />
          </div>
        )}
      </Modal>
    </>
  );
}

// The rest of your Library component remains the same.
// Make sure to export it correctly.
function Library() {
    // ... (rest of your component code)
    const [searchQuery, setSearchQuery] = useState("");
    const [imageSize, setImageSize] = useState(160);
  
    const filteredImages = useMemo(() => {
      return allImages.filter(image => {
        return image.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
               image.alt.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }, [searchQuery]);
  
    return (
      <div className="gallery-container">
        <div className="gallery-sidebar">
          <div className="sidebar-header">
            <h1 className="sidebar-title">
              <Image className="sidebar-title-icon" /> Gallery
            </h1>
          </div>
          
          <div className="size-control-container">
              <label htmlFor="image-size-slider">Image Size: {imageSize}px</label>
              <input 
                id="image-size-slider"
                type="range" 
                min="80" 
                max="300" 
                value={imageSize} 
                onChange={(e) => setImageSize(e.target.value)}
                className="image-size-slider"
              />
          </div>
        </div>
  
        <div className="main-content">
          <div className="search-bar-container">
            <div className="search-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search by ID or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
  
          <div className="results-header">
            {filteredImages.length} images found
          </div>
  
          <div className="grid-container">
            {filteredImages.length > 0 ? (
              <div className="image-grid">
                {filteredImages.map((image) => (
                  <ImageItem 
                    key={image.id}
                    id={image.id}
                    src={image.src} 
                    thumbnail={image.thumbnail} 
                    alt={image.alt}
                    size={imageSize}
                    date={image.date}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <ImageOff className="empty-state-icon" />
                <div className="empty-state-text">No images found</div>
                <div className="empty-state-subtext">Try adjusting your search terms</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  export default Library;