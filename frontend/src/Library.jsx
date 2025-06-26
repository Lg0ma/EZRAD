import Modal from "react-modal";
import React, { useState } from "react";
import Img1 from './assets/Img1.jpeg';
import Img2 from './assets/img2.jpeg';
import Img3 from './assets/img3.jpeg';

function ImageItem({ src, alt = "Image", thumbnail }) {
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
      <div className="image-container" onClick={openModal} style={{ cursor: "pointer", display: "inline-block", margin: "10px" }}>
        <img src={thumbnail || src} alt={alt} style={{ width: "200px", height: "200px", objectFit: "cover", borderRadius: "8px", transition: "transform 0.2s" }}
          onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")} />
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
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
        contentLabel="Image Modal"
      >

        {/* Close Button */}
        <button
          onClick={closeModal}
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "white",
            border: "2px solid black",
            color: "black",
            fontSize: "26px",
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            cursor: "pointer",
            zIndex: 1001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>

        {/* Zoom Buttons */}
        <div style={{ position: "absolute", top: "20px", left: "50%", transform: "translateX(-50%) translateY(60px)", display: "flex", gap: "15px", zIndex: 1001 }}>
          {[{ label: "Zoom Out", action: zoomOut }, { label: "Reset", action: resetZoom }, { label: "Zoom In", action: zoomIn }].map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              style={{
                background: "white",
                border: "2px solid black",
                color: "black",
                padding: "10px 20px",
                fontSize: "18px",
                cursor: "pointer",
                borderRadius: "8px",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Image Container */}
        <div style={{ width: "100%", height: "100%" }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave}>
          <img
            src={src}
            alt={alt}
            style={{
              width: "auto",
              height: "auto",
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: "transform 0.1s linear",
              cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
            }}
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>
      </Modal>
    </>
  );
}

function Library() {
  const images = [
    { src: Img1, thumbnail: Img1, alt: "Image 1" },
    { src: Img2, thumbnail: Img2, alt: "Image 2" },
    { src: Img3, thumbnail: Img3, alt: "Image 3" },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h1>Image Gallery</h1>
      <p>Click an image to open it in a modal. Use zoom and pan controls.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {images.map((image, index) => (
          <ImageItem key={index} src={image.src} thumbnail={image.thumbnail} alt={image.alt} />
        ))}
      </div>
    </div>
  );
}

export default Library;
