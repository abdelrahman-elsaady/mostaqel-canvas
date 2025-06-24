'use client'
import { useState, useRef, useEffect } from 'react'
import '../App.css'
import { FaSearchPlus, FaSearchMinus, FaCamera, FaDownload, FaMousePointer, FaHandPaper, FaUndo, FaCheckCircle, FaTimes, FaArrowsAlt, FaSyncAlt } from 'react-icons/fa';
import { IoCameraReverseOutline } from "react-icons/io5";
import { TbJacket } from "react-icons/tb";
import { PiPantsLight, PiHoodieThin, PiTShirtLight } from "react-icons/pi";

function App() {
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const [designs, setDesigns] = useState([])
  const [selectedDesignId, setSelectedDesignId] = useState(null)
  const [tshirtColor, setTshirtColor] = useState('#ffffff') // Default to white
  const tshirtImgRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const [isPinching, setIsPinching] = useState(false)
  const pinchStartDist = useRef(0)
  const pinchStartScale = useRef(1)
  const pinchStartAngle = useRef(0)
  const pinchStartRotation = useRef(0)
  const [selectedCloth, setSelectedCloth] = useState('hoodie');
  const [selectedSize, setSelectedSize] = useState('M');
  const [showAdBanner, setShowAdBanner] = useState(true);
  const [handleDrag, setHandleDrag] = useState(null); // 'resize' or 'rotate' or null
  const handleRef = useRef(null);
  const rotateHandleRef = useRef(null);

  // Load the t-shirt image once
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "Anonymous"
    img.onload = () => {
      tshirtImgRef.current = img
      redrawCanvas()
    }
    img.onerror = () => {
      console.error("Failed to load t-shirt image from /tshirt.png")
      alert("Error: Could not load t-shirt image. Make sure it is in the `public` folder.")
    }
    img.src = '/tshirt.png'
  }, [])

  // Redraw canvas whenever designs or color change
  useEffect(() => {
    redrawCanvas()
  }, [designs, tshirtColor, selectedDesignId])

  const redrawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas || !tshirtImgRef.current) return
    const ctx = canvas.getContext('2d')

    // Set canvas size for high DPI
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Clear and draw
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // --- Draw T-shirt with Color ---
    ctx.drawImage(tshirtImgRef.current, 0, 0, canvas.clientWidth, canvas.clientHeight)
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = tshirtColor
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    ctx.globalCompositeOperation = 'destination-in'
    ctx.drawImage(tshirtImgRef.current, 0, 0, canvas.clientWidth, canvas.clientHeight)
    ctx.globalCompositeOperation = 'source-over' // Reset

    // --- Draw Designs ---
    designs.forEach(design => {
      ctx.save()
      ctx.translate(design.x, design.y)
      ctx.rotate(design.rotation)
      ctx.scale(design.scale, design.scale)
      ctx.drawImage(design.img, -design.img.width / 2, -design.img.height / 2)
      ctx.restore()

      if (design.id === selectedDesignId) {
        // Draw selection border
        ctx.save()
        ctx.strokeStyle = '#007bff'
        ctx.lineWidth = 2
        ctx.strokeRect(
          design.x - (design.img.width / 2) * design.scale,
          design.y - (design.img.height / 2) * design.scale,
          design.img.width * design.scale,
          design.img.height * design.scale
        )
        ctx.restore()
      }
    })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const newDesign = {
            id: Date.now(),
            img: img,
            x: 300,
            y: 300,
            scale: 0.2, // Smaller default size
            rotation: 0,
          }
          setDesigns(prev => [...prev, newDesign])
          setSelectedDesignId(newDesign.id)
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    }
  }

  const selectedDesign = designs.find(d => d.id === selectedDesignId)

  const updateSelectedDesign = (prop, value) => {
    setDesigns(designs.map(d => 
      d.id === selectedDesignId ? { ...d, [prop]: value } : d
    ))
  }

  const deleteSelectedDesign = () => {
    setDesigns(designs.filter(d => d.id !== selectedDesignId))
    setSelectedDesignId(null)
  }
  
  const saveDesign = () => {
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = 'tshirt-design.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  // --- Drag and Drop Logic ---
  const getDesignAtCoords = (x, y) => {
    // Return the topmost design under the mouse
    for (let i = designs.length - 1; i >= 0; i--) {
      const d = designs[i]
      const dx = x - d.x
      const dy = y - d.y
      const w = d.img.width * d.scale
      const h = d.img.height * d.scale
      // Undo rotation for hit test
      const angle = -d.rotation
      const rx = dx * Math.cos(angle) - dy * Math.sin(angle)
      const ry = dx * Math.sin(angle) + dy * Math.cos(angle)
      if (
        rx >= -w / 2 && rx <= w / 2 &&
        ry >= -h / 2 && ry <= h / 2
      ) {
        return d
      }
    }
    return null
  }

  // Mouse events
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left)
    const y = (e.clientY - rect.top)
    const d = getDesignAtCoords(x, y)
    if (d) {
      setSelectedDesignId(d.id)
      setIsDragging(true)
      dragOffset.current = { x: x - d.x, y: y - d.y }
    } else {
      setSelectedDesignId(null)
    }
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !selectedDesign) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left)
    const y = (e.clientY - rect.top)
    const newX = x - dragOffset.current.x
    const newY = y - dragOffset.current.y
    setDesigns(designs => designs.map(d =>
      d.id === selectedDesignId ? { ...d, x: newX, y: newY } : d
    ))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch events
  const getTouchPos = (touch) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
  }

  const getTouchesDistance = (touch1, touch2) => {
    const dx = touch2.clientX - touch1.clientX
    const dy = touch2.clientY - touch1.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const getTouchesAngle = (touch1, touch2) => {
    const dx = touch2.clientX - touch1.clientX
    const dy = touch2.clientY - touch1.clientY
    return Math.atan2(dy, dx)
  }

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const { x, y } = getTouchPos(e.touches[0])
      const d = getDesignAtCoords(x, y)
      if (d) {
        setSelectedDesignId(d.id)
        setIsDragging(true)
        dragOffset.current = { x: x - d.x, y: y - d.y }
      } else {
        setSelectedDesignId(null)
      }
      setIsPinching(false)
    } else if (e.touches.length === 2 && selectedDesign) {
      setIsDragging(false)
      setIsPinching(true)
      pinchStartDist.current = getTouchesDistance(e.touches[0], e.touches[1])
      pinchStartScale.current = selectedDesign.scale
      pinchStartAngle.current = getTouchesAngle(e.touches[0], e.touches[1])
      pinchStartRotation.current = selectedDesign.rotation
    }
  }

  const handleTouchMove = (e) => {
    if (isPinching && e.touches.length === 2 && selectedDesign) {
      const newDist = getTouchesDistance(e.touches[0], e.touches[1])
      let newScale = pinchStartScale.current * (newDist / pinchStartDist.current)
      newScale = Math.max(0.01, Math.min(newScale, 2)) // Clamp scale between 0.01 and 2
      const newAngle = getTouchesAngle(e.touches[0], e.touches[1])
      let newRotation = pinchStartRotation.current + (newAngle - pinchStartAngle.current)
      setDesigns(designs => designs.map(d =>
        d.id === selectedDesignId ? { ...d, scale: newScale, rotation: newRotation } : d
      ))
      e.preventDefault()
      return
    }
    if (!isDragging || !selectedDesign || e.touches.length !== 1) return
    const { x, y } = getTouchPos(e.touches[0])
    const newX = x - dragOffset.current.x
    const newY = y - dragOffset.current.y
    setDesigns(designs => designs.map(d =>
      d.id === selectedDesignId ? { ...d, x: newX, y: newY } : d
    ))
    e.preventDefault()
  }

  const handleTouchEnd = (e) => {
    setIsDragging(false)
    setIsPinching(false)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Mouse events
    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
    // eslint-disable-next-line
  }, [designs, selectedDesign, isDragging, isPinching])

  // Helper to get selected design's screen position and size
  const getSelectedDesignRect = () => {
    if (!selectedDesign || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const d = selectedDesign;
    const w = d.img.width * d.scale;
    const h = d.img.height * d.scale;
    // Center of design in canvas coordinates
    const cx = d.x;
    const cy = d.y;
    // Top-left corner
    const left = rect.left + cx - w / 2;
    const top = rect.top + cy - h / 2;
    return {
      left,
      top,
      width: w,
      height: h,
      rotation: d.rotation,
      centerX: rect.left + cx,
      centerY: rect.top + cy,
    };
  };

  // Mouse/touch events for handles
  useEffect(() => {
    if (!handleDrag) return;
    const onMove = (e) => {
      if (!selectedDesign) return;
      const rect = canvasRef.current.getBoundingClientRect();
      let clientX, clientY;
      if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      const d = selectedDesign;
      const cx = d.x;
      const cy = d.y;
      if (handleDrag === 'resize') {
        // Calculate new scale based on drag distance from center
        const dx = clientX - (rect.left + cx);
        const dy = clientY - (rect.top + cy);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const base = Math.max(d.img.width, d.img.height) / 2;
        let newScale = dist / base;
        newScale = Math.max(0.01, Math.min(newScale, 2)); // Allow very small images
        updateSelectedDesign('scale', newScale);
      } else if (handleDrag === 'rotate') {
        // Calculate new rotation based on angle from center
        const dx = clientX - (rect.left + cx);
        const dy = clientY - (rect.top + cy);
        let newAngle = Math.atan2(dy, dx);
        updateSelectedDesign('rotation', newAngle);
      }
    };
    const onUp = () => setHandleDrag(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
  }, [handleDrag, selectedDesign]);

  const designRect = getSelectedDesignRect();

  return (
    <div className="main-app-container">
      <div className="editor-flex-row">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="logo-area">
            <span className="logo-t-sign">T-SIGN</span>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label text-center">colors</div>
            <div className="color-row-bg">
              <div className="color-row">
                {['#ffffff', '#000000', '#0080ff', '#ff0000', '#00bcd4', '#ffc107', '#a259d9'].map(color => (
                  <button
                    key={color}
                    className={`color-circle${tshirtColor === color ? ' selected' : ''}`}
                    style={{ background: color }}
                    onClick={() => setTshirtColor(color)}
                  >
                    {tshirtColor === color && (
                      <span className="color-check"><FaCheckCircle /></span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label text-center">Size</div>
            <div className="size-grid">
              {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((size) => (
                <button
                  key={size}
                  className={`size-btn${selectedSize === size ? ' selected' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >{size}</button>
              ))}
            </div>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label text-center">design</div>
            <div className="design-upload-box">
              <div className="design-upload-content" onClick={() => fileInputRef.current.click()}>
                <span className="upload-icon" role="img" aria-label="upload">📤</span>
                <div className="upload-text">اختيار تصميم - طباعة<br /><span className="upload-sub">أو اسحب التصميم هنا</span></div>
              </div>
              {selectedDesign && (
                <div className="delete-bar">
                  <button className="delete-design-btn" onClick={deleteSelectedDesign} title="Delete"><span role="img" aria-label="delete">🗑️</span></button>
                </div>
              )}
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
          </div>
          <div className="sidebar-section sidebar-actions">
            <button className="sidebar-btn outline">حفظ</button>
            <button className="sidebar-btn filled">اطلب للشراء </button>
          </div>
        </div>
        {/* Main Editor Area */}
        <div className="main-editor-area">
          <div className="editor-header-row">
            <div className="editor-title">Editor</div>
            <div className="top-bar-icons-bg">
              <div className={`top-bar-icon${selectedCloth === 'hoodie' ? ' selected' : ''}`} onClick={() => setSelectedCloth('hoodie')}>
                {selectedCloth === 'hoodie' && <span className="cloth-check"><FaCheckCircle /></span>}
                <PiHoodieThin />
                <div>هودي</div>
              </div>
              <div className={`top-bar-icon ${selectedCloth === 'tshirt' ? ' selected' : ''}`} onClick={() => setSelectedCloth('tshirt')}>
                {selectedCloth === 'tshirt' && <span className="cloth-check"><FaCheckCircle /></span>}
                <PiTShirtLight />
                <div>تيشيرت</div>
              </div>
              <div className={`top-bar-icon${selectedCloth === 'pants' ? ' selected' : ''}`} onClick={() => setSelectedCloth('pants')}>
                {selectedCloth === 'pants' && <span className="cloth-check"><FaCheckCircle /></span>}
                <PiPantsLight />
                <div>بنطلون</div>
              </div>
              <div className={`top-bar-icon${selectedCloth === 'jacket' ? ' selected' : ''}`} onClick={() => setSelectedCloth('jacket')}>
                {selectedCloth === 'jacket' && <span className="cloth-check"><FaCheckCircle /></span>}
                <TbJacket />
                <div>جاكيت</div>
              </div>
            </div>
          </div>
          
          <div className="canvas-area" style={{ position: 'relative' }}>
            {/* Zoom icons */}
            <div className="zoom-icons">
              <button className="zoom-btn"><FaSearchPlus /></button>
              <button className="zoom-btn"><FaSearchMinus /></button>
            </div>
            {/* Camera icon top right */}
            <div className="camera-icon"><IoCameraReverseOutline />
            </div>
            <canvas ref={canvasRef} id="design-canvas" width="600" height="600" />
            {/* HTML handles for selected design */}
            {selectedDesign && designRect && (
              <>
                {/* Resize handle (bottom right) */}
                <div
                  className="design-resize-handle"
                  style={{
                    position: 'fixed',
                    left: designRect.left + designRect.width - 16,
                    top: designRect.top + designRect.height - 16,
                    zIndex: 10,
                    cursor: 'nwse-resize',
                  }}
                  onMouseDown={() => setHandleDrag('resize')}
                  onTouchStart={() => setHandleDrag('resize')}
                >
                  <FaArrowsAlt />
                </div>
                {/* Rotate handle (top center) */}
                <div
                  className="design-rotate-handle"
                  style={{
                    position: 'fixed',
                    left: designRect.left + designRect.width / 2 - 12,
                    top: designRect.top - 32,
                    zIndex: 10,
                    cursor: 'grab',
                  }}
                  onMouseDown={() => setHandleDrag('rotate')}
                  onTouchStart={() => setHandleDrag('rotate')}
                >
                  <FaSyncAlt />
                </div>
              </>
            )}
            {/* Canvas controls bottom left */}
            <div className="canvas-controls">
              <button className="canvas-ctrl-btn"><FaMousePointer /></button>
              <button className="canvas-ctrl-btn"><FaHandPaper /></button>
              <button className="canvas-ctrl-btn"><FaUndo /></button>
            </div>
            {/* Download button bottom right */}
            <button className="download-btn-green" onClick={saveDesign}><FaDownload style={{marginLeft: 4}} /> تنزيل صورة</button>
          </div>

          {showAdBanner && (
            <div className="ad-banner">
              مساحة إعلانية
              <button className="ad-banner-close" aria-label="إغلاق الإعلان" onClick={() => setShowAdBanner(false)}><FaTimes /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
