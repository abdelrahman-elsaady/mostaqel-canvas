'use client'
import { useState, useRef, useEffect } from 'react'
import '../App.css'
import { FaSearchPlus, FaSearchMinus, FaCamera, FaDownload, FaRedo, FaMousePointer, FaHandPaper, FaUndo, FaCheckCircle, FaTimes, FaArrowsAlt, FaSyncAlt } from 'react-icons/fa';
import { IoCameraReverseOutline } from "react-icons/io5";
import { TbJacket } from "react-icons/tb";
import { PiPantsLight, PiHoodieThin, PiTShirtLight } from "react-icons/pi";
import html2canvas from 'html2canvas';
import { GiPoloShirt } from "react-icons/gi";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { CiImageOn } from "react-icons/ci";
import { Formik, Form, Field, ErrorMessage } from 'formik';
import CustomDesignModal from './CustomDesignModal';
import { LiaMousePointerSolid } from "react-icons/lia";

function App() {
  const fileInputRef = useRef(null)
  const [selectedDesignId, setSelectedDesignId] = useState(null)
  const [selectedColor, setSelectedColor] = useState('white') // Default to white
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
  // Front/back toggle
  const [isFront, setIsFront] = useState(true);

  // Order form state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null); // 'sending', 'success', 'error'

  // Color options and mapping
  const colorOptions = [
    { name: 'white', hex: '#ffffff' },
    { name: 'black', hex: '#000000' },
    { name: 'blue', hex: '#0080ff' },
    { name: 'red', hex: '#ff0000' },
    { name: 'Baby green blue', hex: '#00bcd4' },
    { name: 'mustard', hex: '#ffc107' },
    { name: 'purple', hex: '#a259d9' },
  ];
  // For pants, no white
  const pantsColors = colorOptions.filter(c => c.name !== 'white');

  // Add this at the top of the App function, after useState declarations
  const [lastOrderForm, setLastOrderForm] = useState({ name: '', phone: '', address: '', email: '' });

  // Helper to revive designs from localStorage (restore img from src)
  function reviveDesigns(designs) {
    if (Array.isArray(designs)) {
      return designs.map(d => ({
        ...d,
        img: (() => {
          const image = new window.Image();
          image.src = d.src;
          return image;
        })(),
      }));
    } else if (typeof designs === 'object' && designs !== null) {
      // For { front: [], back: [] }
      return {
        front: Array.isArray(designs.front)
          ? designs.front.map(d => ({
              ...d,
              img: (() => {
                const image = new window.Image();
                image.src = d.src;
                return image;
              })(),
            }))
          : [],
        back: Array.isArray(designs.back)
          ? designs.back.map(d => ({
              ...d,
              img: (() => {
                const image = new window.Image();
                image.src = d.src;
                return image;
              })(),
            }))
          : [],
      };
    }
    return designs;
  }

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tshirtEditorSave');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.selectedCloth) setSelectedCloth(data.selectedCloth);
        if (data.selectedColor) setSelectedColor(data.selectedColor);
        if (data.selectedSize) setSelectedSize(data.selectedSize);
        if (typeof data.isFront === 'boolean') setIsFront(data.isFront);
        if (Array.isArray(data.designs)) setDesigns(data.designs);
        if (data.lastOrderForm) setLastOrderForm(data.lastOrderForm);
      } catch {}
    }
  }, []);

  // --- Refactor: Separate designs for front/back for tshirt and hoodie ---
  // designsState: { front: [], back: [] } for tshirt/hoodie, or [] for others
  const initialDesignsState = (cloth) =>
    (cloth === 'tshirt' || cloth === 'hoodie') ? { front: [], back: [] } : [];

  const [designs, setDesigns] = useState(initialDesignsState(selectedCloth));

  // Save handler
  const handleSave = () => {
    const saveData = {
      selectedCloth,
      selectedColor,
      selectedSize,
      isFront,
      designs,
      lastOrderForm,
    };
    localStorage.setItem('tshirtEditorSave', JSON.stringify(saveData));
    Swal.fire({
      html: `
      <div style="position:relative;min-width:260px;max-width:350px;padding:18px 18px 14px 18px;background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(0,0,0,0.08);text-align:center;">
        <span style="position:absolute;top:10px;left:10px;width:14px;height:14px;background:#19d439;border-radius:50%;display:inline-block;"></span>
        
        <span id="swal-custom-close" style="position:absolute;top:10px;right:10px;width:28px;height:28px;background:#0066ff;border:none;border-radius:8px;color:#fff;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">&#10005;</span>

        <div style="font-size:1.25rem;font-weight:500;margin-top:8px;">تم حفظ طلبك بنجاح</div>
      </div>
    `,
      showConfirmButton: false,
      showCloseButton: false,
      background: 'transparent',
      customClass: { popup: 'swal2-loader-popup' }
    });
    setTimeout(() => {
      const closeBtn = document.getElementById('swal-custom-close');
      if (closeBtn) closeBtn.onclick = () => Swal.close();
    }, 0);
  };

  // --- Static image src logic ---
  function getClothImageSrc() {
    if (selectedCloth === 'tshirt') {
      const side = isFront ? 'front' : 'Back';
      return `/T-shirt/${side}/${selectedColor}.png`;
    } else if (selectedCloth === 'hoodie') {
      const side = isFront ? 'front' : 'Back';
      return `/Hoodie/${side}/${selectedColor}.png`;
    } else if (selectedCloth === 'sweatshirt') {
      return `/Sweatshirt/${selectedColor}.png`;
    } else if (selectedCloth === 'pants') {
      return `/pants/${selectedColor}.png`;
    } else if (selectedCloth === 'polo') {
      // Placeholder: use hoodie front as fallback
      return `/polo/${selectedColor}.png`;
    }
    return '';
  }

  // --- Design overlay logic ---
  // Each design has: id, img (Image object), x, y, scale, rotation
  // We'll use absolute positioning over the clothing image
  const designAreaRef = useRef(null);
  const [designAreaSize, setDesignAreaSize] = useState({ width: 600, height: 600 });
  useEffect(() => {
    if (designAreaRef.current) {
      setDesignAreaSize({
        width: designAreaRef.current.offsetWidth,
        height: designAreaRef.current.offsetHeight,
      });
    }
  }, [selectedCloth, selectedColor, isFront]);

  // Helper to get current designs array (front/back or single)
  const getCurrentDesigns = () => {
    if (selectedCloth === 'tshirt' || selectedCloth === 'hoodie') {
      return isFront
        ? Array.isArray(designs.front) ? designs.front : []
        : Array.isArray(designs.back) ? designs.back : [];
    }
    return Array.isArray(designs) ? designs : [];
  };
  const setCurrentDesigns = (newArr) => {
    if (selectedCloth === 'tshirt' || selectedCloth === 'hoodie') {
      setDesigns(d => ({ ...d, [isFront ? 'front' : 'back']: newArr }));
    } else {
      setDesigns(newArr);
    }
  };

  // When changing clothing type, reset designs if needed
  useEffect(() => {
    setDesigns(initialDesignsState(selectedCloth));
    setSelectedDesignId(null);
  }, [selectedCloth]);
  // When flipping front/back, clear selectedDesignId
  useEffect(() => {
    setSelectedDesignId(null);
  }, [isFront]);

  // --- File upload logic ---
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new window.Image()
        img.onload = () => {
          const newDesign = {
            id: Date.now(),
            img: img,
            x: designAreaSize.width / 2,
            y: designAreaSize.height / 2,
            scale: 0.2,
            rotation: 0,
            width: img.width,
            height: img.height,
            src: event.target.result,
          }
          setCurrentDesigns([...getCurrentDesigns(), newDesign]);
          setSelectedDesignId(newDesign.id)
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    }
  }

  // Selected design logic
  const currentDesigns = getCurrentDesigns();
  const selectedDesign = currentDesigns.find(d => d.id === selectedDesignId);

  const updateSelectedDesign = (prop, value) => {
    setCurrentDesigns(currentDesigns.map(d =>
      d.id === selectedDesignId ? { ...d, [prop]: value } : d
    ))
  }

  const deleteSelectedDesign = () => {
    setCurrentDesigns(currentDesigns.filter(d => d.id !== selectedDesignId))
    setSelectedDesignId(null)
  }

  // --- Drag/Resize/Rotate logic (mouse/touch) ---
  // Helper: get design at coordinates
  const getDesignAtCoords = (x, y) => {
    for (let i = currentDesigns.length - 1; i >= 0; i--) {
      const d = currentDesigns[i];
      const dx = x - d.x;
      const dy = y - d.y;
      const w = d.width * d.scale;
      const h = d.height * d.scale;
      // Undo rotation for hit test
      const angle = -d.rotation;
      const rx = dx * Math.cos(angle) - dy * Math.sin(angle);
      const ry = dx * Math.sin(angle) + dy * Math.cos(angle);
      if (
        rx >= -w / 2 && rx <= w / 2 &&
        ry >= -h / 2 && ry <= h / 2
      ) {
        return d;
      }
    }
    return null;
  };

  // Mouse events for drag
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    const rect = designAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const d = getDesignAtCoords(x, y);
    if (d) {
      setSelectedDesignId(d.id);
      setIsDragging(true);
      dragOffset.current = { x: x - d.x, y: y - d.y };
    } else {
      setSelectedDesignId(null);
    }
  };
  const handleMouseMove = (e) => {
    if (!isDragging || !selectedDesign) return;
    const rect = designAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newX = x - dragOffset.current.x;
    const newY = y - dragOffset.current.y;
    setCurrentDesigns(getCurrentDesigns().map(d =>
      d.id === selectedDesignId ? { ...d, x: newX, y: newY } : d
    ));
  };
  const handleMouseUp = () => setIsDragging(false);

  // Touch events for drag
  const getTouchPos = (touch) => {
    const rect = designAreaRef.current.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  };
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const { x, y } = getTouchPos(e.touches[0]);
      const d = getDesignAtCoords(x, y);
      if (d) {
        setSelectedDesignId(d.id);
        setIsDragging(true);
        dragOffset.current = { x: x - d.x, y: y - d.y };
      } else {
        setSelectedDesignId(null);
      }
      setIsPinching(false);
    } else if (e.touches.length === 2 && selectedDesign) {
      setIsDragging(false);
      setIsPinching(true);
      pinchStartDist.current = getTouchesDistance(e.touches[0], e.touches[1]);
      pinchStartScale.current = selectedDesign.scale;
      pinchStartAngle.current = getTouchesAngle(e.touches[0], e.touches[1]);
      pinchStartRotation.current = selectedDesign.rotation;
    }
  };
  const getTouchesDistance = (touch1, touch2) => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };
  const getTouchesAngle = (touch1, touch2) => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.atan2(dy, dx);
  };
  const handleTouchMove = (e) => {
    if (isPinching && e.touches.length === 2 && selectedDesign) {
      const newDist = getTouchesDistance(e.touches[0], e.touches[1]);
      let newScale = pinchStartScale.current * (newDist / pinchStartDist.current);
      newScale = Math.max(0.01, Math.min(newScale, 2));
      const newAngle = getTouchesAngle(e.touches[0], e.touches[1]);
      let newRotation = pinchStartRotation.current + (newAngle - pinchStartAngle.current);
      setCurrentDesigns(getCurrentDesigns().map(d =>
        d.id === selectedDesignId ? { ...d, scale: newScale, rotation: newRotation } : d
      ));
      e.preventDefault();
      return;
    }
    if (!isDragging || !selectedDesign || e.touches.length !== 1) return;
    const { x, y } = getTouchPos(e.touches[0]);
    const newX = x - dragOffset.current.x;
    const newY = y - dragOffset.current.y;
    setCurrentDesigns(getCurrentDesigns().map(d =>
      d.id === selectedDesignId ? { ...d, x: newX, y: newY } : d
    ));
    e.preventDefault();
  };
  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsPinching(false);
  };

  // Helper to get selected design's screen position and size (relative to designAreaRef)
  const getSelectedDesignRect = () => {
    if (!selectedDesign || !designAreaRef.current) return null;
    const d = selectedDesign;
    const w = d.width * d.scale;
    const h = d.height * d.scale;
    // Center of design in design area coordinates
    const cx = d.x;
    const cy = d.y;
    // Top-left corner
    const left = cx - w / 2;
    const top = cy - h / 2;
    return {
      left,
      top,
      width: w,
      height: h,
      rotation: d.rotation,
      centerX: cx,
      centerY: cy,
    };
  };

  // Mouse/touch events for handles
  useEffect(() => {
    if (!handleDrag) return;
    const onMove = (e) => {
      if (!selectedDesign || !designAreaRef.current) return;
      const rect = designAreaRef.current.getBoundingClientRect();
      let clientX, clientY;
      if (e.touches) {
        clientX = e.touches[0].clientX - rect.left;
        clientY = e.touches[0].clientY - rect.top;
      } else {
        clientX = e.clientX - rect.left;
        clientY = e.clientY - rect.top;
      }
      const d = selectedDesign;
      const cx = d.x;
      const cy = d.y;
      if (handleDrag === 'resize') {
        // Calculate new scale based on drag distance from center
        const dx = clientX - cx;
        const dy = clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const base = Math.max(d.width, d.height) / 2;
        let newScale = dist / base;
        newScale = Math.max(0.01, Math.min(newScale, 2)); // Allow very small images
        updateSelectedDesign('scale', newScale);
      } else if (handleDrag === 'rotate') {
        // Calculate new rotation based on angle from center
        const dx = clientX - cx;
        const dy = clientY - cy;
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

  // Move logic for dragging the design itself
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      if (!selectedDesign || !designAreaRef.current) return;
      const rect = designAreaRef.current.getBoundingClientRect();
      let clientX, clientY;
      if (e.touches) {
        clientX = e.touches[0].clientX - rect.left;
        clientY = e.touches[0].clientY - rect.top;
      } else {
        clientX = e.clientX - rect.left;
        clientY = e.clientY - rect.top;
      }
      const newX = clientX - dragOffset.current.x;
      const newY = clientY - dragOffset.current.y;
      setCurrentDesigns(getCurrentDesigns().map(d =>
        d.id === selectedDesignId ? { ...d, x: newX, y: newY } : d
      ));
    };
    const onUp = () => setIsDragging(false);
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
  }, [isDragging, selectedDesign, selectedDesignId]);

  const designRect = getSelectedDesignRect();

  // --- Download composed image ---
  const [isExporting, setIsExporting] = useState(false);

  const saveDesign = async () => {
    setIsExporting(true);
    await new Promise(r => setTimeout(r, 50)); // Allow UI to update
    if (!designAreaRef.current) return;
    const canvas = await html2canvas(designAreaRef.current, { backgroundColor: null, useCORS: true });
    const link = document.createElement('a');
    link.download = 'tshirt-design.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    setIsExporting(false);
  };

  const [showCustomModal, setShowCustomModal] = useState(false);

  // --- Zoom state ---
  const [zoom, setZoom] = useState(1);
  const handleZoomIn = () => {
    undoStackRef.current.push(JSON.stringify({ designs, zoom }));
    setZoom(z => Math.min(z + 0.1, 2));
  };
  const handleZoomOut = () => {
    undoStackRef.current.push(JSON.stringify({ designs, zoom }));
    setZoom(z => Math.max(z - 0.1, 0.5));
  };

  // --- Undo/Redo stacks ---
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);

  // Helper to compare state deeply
  const stateEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  // Save to undo stack only on real change (designs or zoom)
  useEffect(() => {
    const prev = undoStackRef.current[undoStackRef.current.length - 1];
    const currentState = { designs, zoom };
    if (!prev || !stateEqual(JSON.parse(prev), currentState)) {
      undoStackRef.current.push(JSON.stringify(currentState));
      // Clear redo stack on new change
      redoStackRef.current = [];
    }
  }, [designs, zoom]);

  const handleUndo = () => {
    if (undoStackRef.current.length > 1) {
      // Pop current state
      const current = undoStackRef.current.pop();
      // Get previous state
      const prev = JSON.parse(undoStackRef.current[undoStackRef.current.length - 1]);
      // Push current to redo stack
      redoStackRef.current.push(current);
      setDesigns(prev.designs);
      setZoom(prev.zoom);
    }
  };
  const handleRedo = () => {
    if (redoStackRef.current.length > 0) {
      const next = JSON.parse(redoStackRef.current.pop());
      undoStackRef.current.push(JSON.stringify(next));
      setDesigns(next.designs);
      setZoom(next.zoom);
    }
  };

  // --- Focus design ---
  const justFocusedRef = useRef(false);

  const handleFocusDesign = () => {
    const arr = getCurrentDesigns();
    if (arr.length > 0) {
      setSelectedDesignId(arr[0].id);
      justFocusedRef.current = true;
    }
  };

  // Before rendering currentDesigns
  console.log('selectedCloth:', selectedCloth, 'isFront:', isFront, 'currentDesigns:', currentDesigns);

  // --- Render ---
  return (
    <div className="main-app-container container-fluid">
      {/* Order Modal */}
      {showOrderModal && (
        <div className="modal-backdrop" onClick={() => setShowOrderModal(false)}>
          <div className="order-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowOrderModal(false)}><FaTimes /></button>
            <h2 className="modal-title"> شراء</h2>
            <Formik
              initialValues={{ name: '', email: '', phone: '', address: '', designType: '' }}
              validate={values => {
                const errors = {};
                if (!values.name) errors.name = 'مطلوب';
                if (!values.phone) errors.phone = 'مطلوب';
                if (!values.address) errors.address = 'مطلوب';
                // Email is optional, but if present, must be valid
                if (values.email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
                  errors.email = 'بريد إلكتروني غير صالح';
                }
                if (!values.designType) errors.designType = ' (تطريز-طباعة)يجب اختيار نوع التصميم';
                return errors;
              }}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                Swal.fire({
                  title: 'يرجى الانتظار... جارٍ إرسال الطلب',
                  allowOutsideClick: false,
                  showConfirmButton: false,
                  html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;">
                    <img src="/logo.png" alt="logo" style="width:64px;height:64px;animation:swal-spin 1.2s linear infinite;" />
                  </div>`,
                  didOpen: () => { },
                  customClass: { popup: 'swal2-loader-popup' },
                });
                setOrderStatus('sending');
                setIsExporting(true);
                await new Promise(r => setTimeout(r, 50));
                let designImage = null;
                let designImageFront = null;
                let designImageBack = null;
                let designImageFrontOriginals = [];
                let designImageBackOriginals = [];
                // For t-shirt/hoodie, capture both front and back if present
                if ((selectedCloth === 'tshirt' || selectedCloth === 'hoodie') && designAreaRef.current) {
                  const prevIsFront = isFront;
                  // Front
                  if (Array.isArray(designs.front) && designs.front.length > 0) {
                    setIsFront(true);
                    await new Promise(r => setTimeout(r, 50));
                    designImageFront = await html2canvas(designAreaRef.current, { backgroundColor: null, useCORS: true }).then(canvas => canvas.toDataURL('image/png'));
                    designImageFrontOriginals = designs.front.map(d => d.src);
                  }
                  // Back
                  if (Array.isArray(designs.back) && designs.back.length > 0) {
                    setIsFront(false);
                    await new Promise(r => setTimeout(r, 50));
                    designImageBack = await html2canvas(designAreaRef.current, { backgroundColor: null, useCORS: true }).then(canvas => canvas.toDataURL('image/png'));
                    designImageBackOriginals = designs.back.map(d => d.src);
                  }
                  setIsFront(prevIsFront);
                  designImage = designImageFront || designImageBack;
                } else if (designAreaRef.current) {
                  const canvas = await html2canvas(designAreaRef.current, { backgroundColor: null, useCORS: true });
                  designImage = canvas.toDataURL('image/png');
                  designImageFrontOriginals = currentDesigns.map(d => d.src);
                }
                setIsExporting(false);
                const uploadedDesign = currentDesigns.length > 0 ? currentDesigns[0].src : null;
                try {
                  const res = await fetch('/api/email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      to: 'alysayed208@gmail.com',
                      subject: `طلب جديد - ${values.name} - نوع التصميم: ${values.designType === 'print' ? 'طباعة' : values.designType === 'embroidery' ? 'تطريز' : ''}`,
                      text: `\nطلب جديد من العميل:\nالاسم: ${values.name}\nالبريد الإلكتروني: ${values.email}\nرقم الهاتف: ${values.phone}\nالعنوان: ${values.address}\nالمقاس: ${selectedSize}\nاللون: ${selectedColor}\nنوع القماش: ${selectedCloth}\nنوع التصميم: ${values.designType === 'print' ? 'طباعة' : values.designType === 'embroidery' ? 'تطريز' : ''}`,
                      html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                          <h2 style="color: #2a6cff;">طلب جديد من العميل</h2>
                          <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <h3 style="color: #333; margin-top: 0;">تفاصيل العميل:</h3>
                            <p><strong>الاسم:</strong> ${values.name}</p>
                            <p><strong>البريد الإلكتروني:</strong> ${values.email}</p>
                            <p><strong>رقم الهاتف:</strong> ${values.phone}</p>
                            <p><strong>العنوان:</strong> ${values.address}</p>
                          </div>
                          <div style="background: #e6f0ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <h3 style="color: #333; margin-top: 0;">تفاصيل الطلب:</h3>
                            <p><strong>المقاس:</strong> ${selectedSize}</p>
                            <p><strong>اللون:</strong> <span style=" padding: 5px 10px; border-radius: 5px; ">${selectedColor}</span></p>
                            <p><strong>النوع :</strong> ${selectedCloth}</p>
                            <p><strong>نوع التصميم:</strong> ${values.designType === 'print' ? 'طباعة' : values.designType === 'embroidery' ? 'تطريز' : ''}</p>
                          </div>
                          <div style="text-align: center; margin: 20px 0;">
                            ${designImageFront ? `<div>تصميم الوجه الأمامي:<br/><img src="${designImageFront}" alt="تصميم الوجه الأمامي" style="max-width: 100%; border: 2px solid #ddd; border-radius: 10px; margin-bottom: 10px;" /></div>` : ''}
                            ${designImageBack ? `<div>تصميم الظهر:<br/><img src="${designImageBack}" alt="تصميم الظهر" style="max-width: 100%; border: 2px solid #ddd; border-radius: 10px; margin-bottom: 10px;" /></div>` : ''}
                            ${!designImageFront && !designImageBack && designImage ? `<img src="${designImage}" alt="تصميم الطلب" style="max-width: 100%; border: 2px solid #ddd; border-radius: 10px;" />` : ''}
                          </div>
                        </div>
                      `,
                      designImage,
                      designImageFront,
                      designImageBack,
                      designImageFrontOriginals,
                      designImageBackOriginals,
                      designUpload: uploadedDesign,
                    }),
                  });
                  if (res.ok) {
                    const result = await res.json();
                    if (result.success) {
                      setOrderStatus('success');
                      resetForm();
                      setLastOrderForm(values); // Save last order form
                      // Save to localStorage as well
                      const saveData = {
                        selectedCloth,
                        selectedColor,
                        selectedSize,
                        isFront,
                        designs: currentDesigns,
                        lastOrderForm: values,
                      };
                      localStorage.setItem('tshirtEditorSave', JSON.stringify(saveData));
                      Swal.fire({
                        html: `
                          <div style="font-family: 'Cairo', Arial, sans-serif; text-align: center;">
                            <div style="position: relative; border-radius: 16px; box-shadow: 0 2px 8px #bfc9db; background: #fff; padding: 24px 12px 12px 12px;">
                              <div style="font-size: 2rem; font-weight: 500; margin-bottom: 12px;">لبس العافية يا غالي</div>
                              <div style="font-size: 1.2rem; margin-bottom: 8px;">تم ارسال طلبك بنجاح</div>
                              <div style="font-size: 1rem; color: #444; margin-bottom: 18px;">شكراً لاختيارك لنا - اختيار جامد الصراحة</div>
                            </div>
                            <div style="margin-top: 18px; border-radius: 12px; border: 1.5px solid #bfc9db; background: #fff; font-size: 1rem; color: #444; padding: 10px 0;">
                              سيتم التواصل معك من 4/5 أيام عمل
                            </div>
                          </div>
                        `,
                        showConfirmButton: false,
                        showCloseButton: true,
                        allowOutsideClick: true,
                        background: 'transparent',
                        customClass: {
                          popup: 'swal2-loader-popup',
                        }
                      });
                      setShowOrderModal(false);
                    } else {
                      setOrderStatus('error');
                      Swal.fire({
                        icon: 'error',
                        title: 'حدث خطأ أثناء الإرسال',
                        text: 'يرجى المحاولة مرة أخرى أو التواصل معنا مباشرة.',
                        confirmButtonText: 'حسناً'
                      });
                    }
                  } else {
                    setOrderStatus('error');
                    Swal.fire({
                      icon: 'error',
                      title: 'حدث خطأ أثناء الإرسال',
                      text: 'يرجى المحاولة مرة أخرى أو التواصل معنا مباشرة.',
                      confirmButtonText: 'حسناً'
                    });
                  }
                } catch (error) {
                  setOrderStatus('error');
                  Swal.fire({
                    icon: 'error',
                    title: 'حدث خطأ أثناء الإرسال',
                    text: 'يرجى المحاولة مرة أخرى أو التواصل معنا مباشرة.',
                    confirmButtonText: 'حسناً'
                  });
                }
                setSubmitting(false);
              }}
            >
              {({ isSubmitting, values, setFieldValue, errors, touched }) => (
                <Form className="order-form">
                  <label className='m-0' style={{ display: "inline" }} htmlFor="name"> <span style={{ color: 'red' }}>*</span> الأسم ثلاثي </label>
                  <Field id="name" type="text" name="name" required placeholder="الأسم بالكامل " />
                  <ErrorMessage style={{ color: "red" }} name="name" component="div" className="form-error" />
                  <label style={{ display: "inline" }} htmlFor="phone">  <span style={{ color: 'red' }}>*</span> رقم الهاتف</label>
                  <Field id="phone" type="tel" name="phone" required placeholder=" ادخل رقم هاتفك" />
                  <ErrorMessage style={{ color: "red" }} name="phone" component="div" className="form-error" />
                  <label style={{ display: "inline" }} htmlFor="address"> <span style={{ color: 'red' }}>*</span>العنوان</label>
                  <Field id="address" type="text" name="address" required placeholder="العنوان بالتفصيل" />
                  <ErrorMessage style={{ color: "red" }} name="address" component="div" className="form-error" />
                  <label htmlFor="email">البريد الإلكتروني (اختياري)</label>
                  <Field id="email" type="email" name="email" placeholder="example@email.com" />
                  <ErrorMessage style={{ color: "red" }} name="email" component="div" className="form-error" />

                  {/* Radio group for design type */}

                  <div className='row'>


                    <div className='col-6'>
                      <div className="order-summary-row">


                        <div className="order-summary-color">
                          <span className="color-circle" style={{ background: colorOptions.find(c => c.name === selectedColor)?.hex || '#fff', border: '2px solid #BCBCBC', boxShadow: '0 0 0 2px #BCBCBC' }}></span>
                        </div>


                        <div className="order-summary-size">
                          <button className="size-btn p-2 " style={{ pointerEvents: 'none', margin: 0, backgroundColor: '#BCBCBC' }}>{selectedSize}</button>
                        </div>


                        <div className="order-summary-cloth">
                          <button className="top-bar-icon selected" style={{ pointerEvents: 'none', margin: 0, background: '#BCBCBC', border: 'none', boxShadow: '0 0 0 2px #1976d2' }}>
                            {selectedCloth === 'hoodie' && <PiHoodieThin />}
                            {selectedCloth === 'tshirt' && <PiTShirtLight />}
                            {selectedCloth === 'pants' && <PiPantsLight />}
                            {selectedCloth === 'polo' && <GiPoloShirt />}
                          </button>
                        </div>

                      </div>


                    </div>
                    <div className='col-6'>

                      <div className="order-radio-group">
                        {[{ value: 'print', label: 'طباعة', img: '/print.png' }, { value: 'embroidery', label: 'تطريز', img: '/embroidery.png' }].map(opt => (
                          <label
                            key={opt.value}
                            className={`order-radio-option${values.designType === opt.value ? ' selected' : ''}`}
                            htmlFor={`designType-${opt.value}`}
                          >
                            <input
                              type="radio"
                              id={`designType-${opt.value}`}
                              name="designType"
                              value={opt.value}
                              checked={values.designType === opt.value}
                              onChange={() => setFieldValue('designType', opt.value)}
                              style={{ display: 'none' }}
                            />
                            <img src={opt.img} alt={opt.label} className="order-radio-img" />
                            <span className="order-radio-label">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                      <ErrorMessage name="designType" component="div" className="order-radio-error " />


                    </div>

                  </div>




                  <button type="submit" className="order-submit-btn" disabled={isSubmitting || orderStatus === 'sending'}>
                    {orderStatus === 'sending' ? 'يتم الإرسال...' : 'إرسال الطلب'}
                  </button>
                  <p  style={{textDecoration:'underline',fontSize:'15px',textAlign:'center'}}>هذا الطلب مخصص لك انت فقط سيتم إرساله لموظفينا حتى يتم مراجعته وتنفيذه بعد دفع مقدم 20% من سعر المنتج حتى يتم تأكيد طلبك</p>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}
      <div className="editor-flex-row">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="logo-area">
            <img src="/logo.png" alt="T-SIGN logo" style={{ width: '50%', display: 'block', margin: '0 auto' }} />
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label text-center">colors</div>
            <div className="color-row-bg">
              <div className="color-row">
                {(selectedCloth === 'pants' ? pantsColors : colorOptions).map(color => (
                  <button
                    key={color.name}
                    className={`color-circle${selectedColor === color.name ? ' selected' : ''}`}
                    style={{ background: color.hex }}
                    onClick={() => setSelectedColor(color.name)}
                  >
                    {selectedColor === color.name && (
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
              {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((size) => {
                const isDisabled = size === 'XXL' || size === 'XXXL';
                if (isDisabled) {
                  return (
                    <div key={size} className="unavailable-tooltip-wrapper">
                      <button
                        className={`size-btn disabled`}
                        disabled
                        tabIndex={0}
                        title="غير متوفر حالياً"
                      >{size}</button>
                      <div className="size-btn-unavailable-tooltip">
                        <span className="red-dot"></span>
                        هذا الخيار غير متوفر حالياً
                      </div>
                    </div>
                  );
                }
                return (
                  <button
                    key={size}
                    className={`size-btn${selectedSize === size ? ' selected' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >{size}</button>
                );
              })}
            </div>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label text-center">design</div>
            <div className="design-upload-box">
              <div className="design-upload-content" onClick={() => fileInputRef.current.click()}>
                <span className="upload-icon icon " style={{ color: "blue" }} role="img" aria-label="upload"><CiImageOn /></span>
                <div className="upload-text">اختيار تصميم - طباعة<br /><span className="upload-sub">أو اسحب التصميم هنا</span></div>
              </div>
              {selectedDesign && (
                <div className="delete-bar">
                  <button className="delete-design-btn" onClick={deleteSelectedDesign} title="Delete"><span role="img" aria-label="delete">🗑️</span></button>
                </div>
              )}
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
            {/* Custom Design Button */}
            <button className="custom-design-btn" style={{ width: '100%', marginTop: 8, background: '#8DEA7A', color: '#222', fontWeight: '', border: 'dotted #bdbdbd', borderRadius: 8, padding: '10px 0', fontSize: '1.1rem', cursor: 'pointer' }} onClick={() => setShowCustomModal(true)}>
              تصميم مخصص
            </button>
            <CustomDesignModal show={showCustomModal} onClose={() => setShowCustomModal(false)} />
          </div>
          <div className="sidebar-section sidebar-actions">
            <button className="sidebar-btn outline" onClick={handleSave} type="button">حفظ</button>
            <button className="sidebar-btn filled w-70" onClick={() => setShowOrderModal(true)}> شراء </button>
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
              <div className={`top-bar-icon${selectedCloth === 'polp' ? ' selected' : ''}`} onClick={() => setSelectedCloth('polo')}>
                {selectedCloth === 'polo' && <span className="cloth-check"><FaCheckCircle /></span>}
                <GiPoloShirt />
                <div>بولو </div>
              </div>
            </div>
          </div>
          <div className="canvas-area" style={{ position: 'relative' }} ref={designAreaRef} onClick={() => {
            if (justFocusedRef.current) {
              justFocusedRef.current = false;
              return;
            }
            setSelectedDesignId(null);
          }}>
            {/* Zoom icons */}
            {!isExporting && (
              <div className="zoom-icons">
                <button className="zoom-btn" onClick={handleZoomIn}><FaSearchPlus /></button>
                <button className="zoom-btn" onClick={handleZoomOut}><FaSearchMinus /></button>
              </div>
            )}
            {/* Camera icon top right (toggle front/back for t-shirt/hoodie) */}
            {!isExporting && (selectedCloth === 'tshirt' || selectedCloth === 'hoodie') && (
              <div className="camera-icon " onClick={e => { e.stopPropagation(); setIsFront(f => !f); }} style={{ cursor: 'pointer' }}>
                <IoCameraReverseOutline />
              </div>
            )}
            {/* --- ZOOM WRAPPER START --- */}
            <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, transform: `scale(${zoom})`, transformOrigin: 'center center', pointerEvents: 'none' }}>
              {/* Static clothing image */}
              <img
                src={getClothImageSrc()}
                alt={selectedCloth}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 1,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
                draggable={false}
              />
              {/* Overlay user designs as absolutely positioned images */}
              {currentDesigns.map(design => {
                console.log('Rendering design src:', design.src);
                return (
                  <img
                    key={design.id}
                    src={design.src}
                    alt="design"
                    style={{
                      position: 'absolute',
                      left: design.x - (design.width * design.scale) / 2,
                      top: design.y - (design.height * design.scale) / 2,
                      width: design.width * design.scale,
                      height: design.height * design.scale,
                      transform: `rotate(${design.rotation}rad)` + (design.id === selectedDesignId ? ' scale(1.05)' : ''),
                      zIndex: 2,
                      cursor: design.id === selectedDesignId ? 'move' : 'pointer',
                      boxShadow: design.id === selectedDesignId ? '0 0 0 2px #1976d2' : 'none',
                      transition: 'box-shadow 0.2s',
                      pointerEvents: 'auto',
                    }}
                    onMouseDown={e => { e.stopPropagation(); setSelectedDesignId(design.id); setIsDragging(true); dragOffset.current = { x: e.nativeEvent.offsetX - (design.width * design.scale) / 2, y: e.nativeEvent.offsetY - (design.height * design.scale) / 2 }; }}
                    onClick={e => { e.stopPropagation(); setSelectedDesignId(design.id); }}
                    draggable={false}
                  />
                );
              })}
              {/* Only show handles if a design is selected and not exporting */}
              {selectedDesign && designRect && !isExporting && (
                <>
                  {/* Resize handle (bottom right) */}
                  <div
                    className="design-resize-handle"
                    style={{
                      position: 'absolute',
                      left: designRect.left + designRect.width - 16,
                      top: designRect.top + designRect.height - 16,
                      zIndex: 10,
                      cursor: 'nwse-resize',
                      touchAction: 'none',
                      pointerEvents: 'auto',
                    }}
                    onMouseDown={e => { e.stopPropagation(); setHandleDrag('resize'); }}
                    onTouchStart={e => { e.stopPropagation(); setHandleDrag('resize'); }}
                  >
                    <FaArrowsAlt />
                  </div>
                  {/* Rotate handle (top center) */}
                  <div
                    className="design-rotate-handle"
                    style={{
                      position: 'absolute',
                      left: designRect.left + designRect.width / 2 - 12,
                      top: designRect.top - 32,
                      zIndex: 10,
                      cursor: 'grab',
                      touchAction: 'none',
                      pointerEvents: 'auto',
                    }}
                    onMouseDown={e => { e.stopPropagation(); setHandleDrag('rotate'); }}
                    onTouchStart={e => { e.stopPropagation(); setHandleDrag('rotate'); }}
                  >
                    <FaSyncAlt />
                  </div>
                </>
              )}
            </div>
            {/* --- ZOOM WRAPPER END --- */}
            {/* Canvas controls bottom left */}
            {!isExporting && (
              <div className="canvas-controls">
                <button className="canvas-ctrl-btn " style={{ color: "#000000" }} onClick={handleFocusDesign}> <LiaMousePointerSolid /></button>
                {/* <button className="canvas-ctrl-btn"><FaHandPaper /></button> */}
                <button className="canvas-ctrl-btn text-muted" style={{ color: "#000000" }} onClick={handleRedo}><FaRedo /></button>
                <button className="canvas-ctrl-btn text-muted" style={{ color: "#000000" }} onClick={handleUndo}><FaUndo /></button>
              </div>
            )}
            {/* Download button bottom right */}
            {!isExporting && (
              <button className="download-btn-green " onClick={e => { e.stopPropagation(); saveDesign(); }}><FaDownload style={{ marginLeft: 4 }} /> تنزيل كصورة</button>
            )}
          </div>

          {showAdBanner && (
            <div className=" my-5" style={{ height: 100 }} >
              {/* مساحة إعلانية */}
              {/* <button className="ad-banner-close" aria-label="إغلاق الإعلان" onClick={() => setShowAdBanner(false)}><FaTimes /></button> */}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
