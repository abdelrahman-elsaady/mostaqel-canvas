import { useState, useRef, useEffect } from 'react'
import './App.css'

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
            scale: 0.5, // Start smaller
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
    }
  }

  const handleTouchMove = (e) => {
    if (isPinching && e.touches.length === 2 && selectedDesign) {
      const newDist = getTouchesDistance(e.touches[0], e.touches[1])
      let newScale = pinchStartScale.current * (newDist / pinchStartDist.current)
      newScale = Math.max(0.1, Math.min(newScale, 2)) // Clamp scale between 0.1 and 2
      updateSelectedDesign('scale', newScale)
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

  return (
    <div className="editor-container">
      <div className="canvas-container" style={{ position: 'relative' }}>
        <canvas ref={canvasRef} id="design-canvas" width="600" height="600" />
        {/* Floating label for size and rotation */}
        {selectedDesign && (
          <div className="floating-label">
            <span>Size: {Math.round(selectedDesign.scale * 100)}%</span>
            <span style={{ marginLeft: 12 }}>Rotation: {Math.round(selectedDesign.rotation * 180 / Math.PI)}°</span>
          </div>
        )}
      </div>

      <div className="controls">
        <div className="control-group">
          <h3>T-Shirt Color</h3>
          {['#ffffff', '#ff0000', '#0000ff', '#008000', '#000000', '#ffff00', '#ffc0cb'].map(color => (
            <button key={color} className="color-btn" style={{ background: color }} onClick={() => setTshirtColor(color)} />
          ))}
        </div>
            
        <div className="control-group">
          <h3>Add Design</h3>
          <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
          <button className="btn" onClick={() => fileInputRef.current.click()}>Upload Image</button>
        </div>

        {selectedDesign && (
          <div className="control-group">
            <h3>Selected Design</h3>
            <div className="slider-container">
              <label>Size: {Math.round(selectedDesign.scale * 100)}%</label>
              <input type="range" min="0" max="200" value={selectedDesign.scale * 100}
                     onChange={(e) => updateSelectedDesign('scale', e.target.value / 100)} />
            </div>
            <div className="slider-container">
              <label>Rotation: {Math.round(selectedDesign.rotation * 180 / Math.PI)}°</label>
              <input type="range" min="0" max="360" value={selectedDesign.rotation * 180 / Math.PI}
                     onChange={(e) => updateSelectedDesign('rotation', e.target.value * Math.PI / 180)} />
            </div>
            <button className="btn" onClick={deleteSelectedDesign}>Delete Design</button>
          </div>
        )}

        <div className="control-group">
          <button className="btn" onClick={saveDesign} style={{ background: '#28a745' }}>Save Design</button>
        </div>
      </div>
    </div>
  )
}

export default App
