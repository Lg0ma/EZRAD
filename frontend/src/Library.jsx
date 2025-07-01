import Modal from "react-modal";
import React, { useState, useMemo } from "react";
import { 
  Image, 
  Trees, 
  Building2, 
  Monitor, 
  Users, 
  Cat, 
  Utensils, 
  Search,
  X,
  Minus,
  Plus,
  RotateCcw,
  ImageOff
} from "lucide-react";
import "./Library.css";

function ImageItem({ id, src, alt, thumbnail }) {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPosition, setStartDragPosition] = useState({ x: 0, y: 0 });

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => {
    setModalIsOpen(false);
    resetZoom();
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

  return (
    <>
      <div className="image-card" onClick={openModal}>
        <img src={thumbnail} alt={alt} />
        <div className="hover-overlay">
          <span className="image-id-badge">ID: {id}</span>
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
          },
        }}
      >
        <button onClick={closeModal} className="modal-close-button">
          <X size={20} />
        </button>

        <div className="modal-zoom-controls">
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
      </Modal>
    </>
  );
}

function Library() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fixed list of 30 stock images with IDs
  const allImages = [
    { id: "IMG001", src: "https://picsum.photos/id/10/800/800", thumbnail: "https://picsum.photos/id/10/400/400", alt: "Forest Road", category: "nature" },
    { id: "IMG002", src: "https://picsum.photos/id/20/800/800", thumbnail: "https://picsum.photos/id/20/400/400", alt: "Laptop Work", category: "technology" },
    { id: "IMG003", src: "https://picsum.photos/id/30/800/800", thumbnail: "https://picsum.photos/id/30/400/400", alt: "Coffee Cup", category: "food" },
    { id: "IMG004", src: "https://picsum.photos/id/40/800/800", thumbnail: "https://picsum.photos/id/40/400/400", alt: "City Night", category: "urban" },
    { id: "IMG005", src: "https://picsum.photos/id/50/800/800", thumbnail: "https://picsum.photos/id/50/400/400", alt: "Beach Sunset", category: "nature" },
    { id: "IMG006", src: "https://picsum.photos/id/60/800/800", thumbnail: "https://picsum.photos/id/60/400/400", alt: "Office Desk", category: "technology" },
    { id: "IMG007", src: "https://picsum.photos/id/70/800/800", thumbnail: "https://picsum.photos/id/70/400/400", alt: "Mountain Lake", category: "nature" },
    { id: "IMG008", src: "https://picsum.photos/id/80/800/800", thumbnail: "https://picsum.photos/id/80/400/400", alt: "Portrait", category: "people" },
    { id: "IMG009", src: "https://picsum.photos/id/90/800/800", thumbnail: "https://picsum.photos/id/90/400/400", alt: "Strawberries", category: "food" },
    { id: "IMG010", src: "https://picsum.photos/id/100/800/800", thumbnail: "https://picsum.photos/id/100/400/400", alt: "Beach View", category: "nature" },
    { id: "IMG011", src: "https://picsum.photos/id/110/800/800", thumbnail: "https://picsum.photos/id/110/400/400", alt: "Car Interior", category: "technology" },
    { id: "IMG012", src: "https://picsum.photos/id/120/800/800", thumbnail: "https://picsum.photos/id/120/400/400", alt: "Green Valley", category: "nature" },
    { id: "IMG013", src: "https://picsum.photos/id/130/800/800", thumbnail: "https://picsum.photos/id/130/400/400", alt: "City Park", category: "urban" },
    { id: "IMG014", src: "https://picsum.photos/id/140/800/800", thumbnail: "https://picsum.photos/id/140/400/400", alt: "Train Tracks", category: "urban" },
    { id: "IMG015", src: "https://picsum.photos/id/145/800/800", thumbnail: "https://picsum.photos/id/145/400/400", alt: "Dog Portrait", category: "animals" },
    { id: "IMG016", src: "https://picsum.photos/id/160/800/800", thumbnail: "https://picsum.photos/id/160/400/400", alt: "Railway", category: "urban" },
    { id: "IMG017", src: "https://picsum.photos/id/170/800/800", thumbnail: "https://picsum.photos/id/170/400/400", alt: "Forest Path", category: "nature" },
    { id: "IMG018", src: "https://picsum.photos/id/180/800/800", thumbnail: "https://picsum.photos/id/180/400/400", alt: "Laptop Code", category: "technology" },
    { id: "IMG019", src: "https://picsum.photos/id/190/800/800", thumbnail: "https://picsum.photos/id/190/400/400", alt: "City Skyline", category: "urban" },
    { id: "IMG020", src: "https://picsum.photos/id/200/800/800", thumbnail: "https://picsum.photos/id/200/400/400", alt: "Bison", category: "animals" },
    { id: "IMG021", src: "https://picsum.photos/id/210/800/800", thumbnail: "https://picsum.photos/id/210/400/400", alt: "Brick Building", category: "urban" },
    { id: "IMG022", src: "https://picsum.photos/id/220/800/800", thumbnail: "https://picsum.photos/id/220/400/400", alt: "Night Stars", category: "nature" },
    { id: "IMG023", src: "https://picsum.photos/id/230/800/800", thumbnail: "https://picsum.photos/id/230/400/400", alt: "Milky Way", category: "nature" },
    { id: "IMG024", src: "https://picsum.photos/id/240/800/800", thumbnail: "https://picsum.photos/id/240/400/400", alt: "Stairs", category: "urban" },
    { id: "IMG025", src: "https://picsum.photos/id/250/800/800", thumbnail: "https://picsum.photos/id/250/400/400", alt: "Camera Lens", category: "technology" },
    { id: "IMG026", src: "https://picsum.photos/id/260/800/800", thumbnail: "https://picsum.photos/id/260/400/400", alt: "Food Plate", category: "food" },
    { id: "IMG027", src: "https://picsum.photos/id/270/800/800", thumbnail: "https://picsum.photos/id/270/400/400", alt: "Cliff Ocean", category: "nature" },
    { id: "IMG028", src: "https://picsum.photos/id/280/800/800", thumbnail: "https://picsum.photos/id/280/400/400", alt: "Road Trip", category: "urban" },
    { id: "IMG029", src: "https://picsum.photos/id/290/800/800", thumbnail: "https://picsum.photos/id/290/400/400", alt: "Cat Portrait", category: "animals" },
    { id: "IMG030", src: "https://picsum.photos/id/300/800/800", thumbnail: "https://picsum.photos/id/300/400/400", alt: "Bridge View", category: "urban" },
  ];

  // Filter images based on search and category
  const filteredImages = useMemo(() => {
    return allImages.filter(image => {
      const matchesSearch = image.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          image.alt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || image.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const categories = [
    { id: "all", label: "All Images", icon: Image },
    { id: "nature", label: "Nature", icon: Trees },
    { id: "urban", label: "Urban", icon: Building2 },
    { id: "technology", label: "Technology", icon: Monitor },
    { id: "people", label: "People", icon: Users },
    { id: "animals", label: "Animals", icon: Cat },
    { id: "food", label: "Food", icon: Utensils },
  ];

  return (
    <div className="gallery-container">
      {/* Sidebar */}
      <div className="gallery-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">
            <Image className="sidebar-title-icon" /> Gallery
          </h1>
        </div>

        {/* Categories */}
        <nav className="categories-nav">
          {categories.map(category => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
              >
                <Icon className="category-icon" />
                {category.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Search Bar */}
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

        {/* Results Header */}
        <div className="results-header">
          {filteredImages.length} images found
        </div>

        {/* Image Grid */}
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
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <ImageOff className="empty-state-icon" />
              <div className="empty-state-text">No images found</div>
              <div className="empty-state-subtext">Try adjusting your search or filters</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Library;