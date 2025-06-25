'use client'
import { useState, useRef, useEffect } from 'react'
import '../App.css'
import { FaSearchPlus, FaSearchMinus, FaCamera, FaDownload, FaMousePointer, FaHandPaper, FaUndo, FaCheckCircle, FaTimes, FaArrowsAlt, FaSyncAlt } from 'react-icons/fa';
import { IoCameraReverseOutline } from "react-icons/io5";
import { TbJacket } from "react-icons/tb";
import { PiPantsLight, PiHoodieThin, PiTShirtLight } from "react-icons/pi";
import html2canvas from 'html2canvas';
import { GiPoloShirt } from "react-icons/gi";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { CiImageOn } from "react-icons/ci";
import { Formik, Form, Field, ErrorMessage } from 'formik';

function App() {
  const fileInputRef = useRef(null)
  const [designs, setDesigns] = useState([])
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
      icon: 'success',
      title: 'تم الحفظ',
      text: 'تم حفظ التصميم والبيانات بنجاح!'
    });
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

  // --- Drag/Resize/Rotate logic (mouse/touch) ---
  // Helper: get design at coordinates
  const getDesignAtCoords = (x, y) => {
    for (let i = designs.length - 1; i >= 0; i--) {
      const d = designs[i];
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
    setDesigns(designs => designs.map(d =>
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
      setDesigns(designs => designs.map(d =>
        d.id === selectedDesignId ? { ...d, scale: newScale, rotation: newRotation } : d
      ));
      e.preventDefault();
      return;
    }
    if (!isDragging || !selectedDesign || e.touches.length !== 1) return;
    const { x, y } = getTouchPos(e.touches[0]);
    const newX = x - dragOffset.current.x;
    const newY = y - dragOffset.current.y;
    setDesigns(designs => designs.map(d =>
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
      setDesigns(designs => designs.map(d =>
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
    const canvas = await html2canvas(designAreaRef.current, {backgroundColor: null, useCORS: true});
    const link = document.createElement('a');
    link.download = 'tshirt-design.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    setIsExporting(false);
  };

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
              initialValues={{ name: '', email: '', phone: '', address: '' }}
              validate={values => {
                const errors = {};
                if (!values.name) errors.name = 'مطلوب';
                if (!values.phone) errors.phone = 'مطلوب';
                if (!values.address) errors.address = 'مطلوب';
                // Email is optional, but if present, must be valid
                if (values.email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
                  errors.email = 'بريد إلكتروني غير صالح';
                }
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
                  didOpen: () => {},
                  customClass: { popup: 'swal2-loader-popup' },
                });
                setOrderStatus('sending');
                setIsExporting(true);
                await new Promise(r => setTimeout(r, 50));
                let designImage = null;
                if (designAreaRef.current) {
                  const canvas = await html2canvas(designAreaRef.current, {backgroundColor: null, useCORS: true});
                  designImage = canvas.toDataURL('image/png');
                }
                setIsExporting(false);
                const uploadedDesign = designs.length > 0 ? designs[0].src : null;
                try {
                  const res = await fetch('/api/email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      to: 'alysayed208@gmail.com',
                      subject: `طلب جديد - ${values.name}`,
                      text: `\nطلب جديد من العميل:\nالاسم: ${values.name}\nالبريد الإلكتروني: ${values.email}\nرقم الهاتف: ${values.phone}\nالعنوان: ${values.address}\nالمقاس: ${selectedSize}\nاللون: ${selectedColor}\nنوع القماش: ${selectedCloth}`,
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
                            <p><strong>نوع القماش:</strong> ${selectedCloth}</p>
                          </div>
                          <div style="text-align: center; margin: 20px 0;">
                            <img src="${designImage}" alt="تصميم الطلب" style="max-width: 100%; border: 2px solid #ddd; border-radius: 10px;" />
                          </div>
                        </div>
                      `,
                      designImage: designImage,
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
                        designs,
                        lastOrderForm: values,
                      };
                      localStorage.setItem('tshirtEditorSave', JSON.stringify(saveData));
                      Swal.fire({
                        icon: 'success',
                        title: 'تم, لبس الهنا يا غالي ',
                        text: 'سيتم التواصل معك قريباً    .',
                        confirmButtonText: 'حسناً'
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
              {({ isSubmitting }) => (
                <Form  className="order-form">
                  <label className='m-0' style={{display:"inline"}} htmlFor="name"> <span style={{ color: 'red' }}>*</span> الأسم ثلاثي </label>
                  <Field id="name" type="text" name="name" required placeholder="الأسم بالكامل " />
                  <ErrorMessage style={{color:"red"}} name="name" component="div" className="form-error" />
                  <label style={{display:"inline"}} htmlFor="phone">  <span style={{ color: 'red' }}>*</span> رقم الهاتف</label>
                  <Field id="phone" type="tel" name="phone" required placeholder=" ادخل رقم هاتفك"/>
                  <ErrorMessage style={{color:"red"}} name="phone" component="div" className="form-error" />
                  <label style={{display:"inline"}} htmlFor="address"> <span style={{ color: 'red' }}>*</span>العنوان</label>
                  <Field id="address" type="text" name="address" required placeholder="العنوان بالتفصيل" />
                  <ErrorMessage style={{color:"red"}} name="address" component="div" className="form-error" />
                  <label htmlFor="email">البريد الإلكتروني (اختياري)</label>
                  <Field id="email" type="email" name="email" placeholder="example@email.com" />
                  <ErrorMessage style={{color:"red"}} name="email" component="div" className="form-error" />
                  <div className="order-summary-row">
                    <div className="order-summary-color">
                      <span className="color-circle" style={{ background: colorOptions.find(c => c.name === selectedColor)?.hex || '#fff', border: '2px solid #BCBCBC', boxShadow: '0 0 0 2px #BCBCBC' }}></span>
                    </div>
                    <div className="order-summary-size">
                      <button className="size-btn p-2 " style={{ pointerEvents: 'none', margin: 0,backgroundColor:'#BCBCBC' }}>{selectedSize}</button>
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
                  <button type="submit" className="order-submit-btn" disabled={isSubmitting || orderStatus==='sending'}>
                    {orderStatus==='sending' ? 'يتم الإرسال...' : 'إرسال الطلب'}
                  </button>
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
                <span className="upload-icon icon " style={{color:"blue"}} role="img" aria-label="upload"><CiImageOn/></span>
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
          <div className="canvas-area" style={{ position: 'relative' }} ref={designAreaRef} onClick={() => setSelectedDesignId(null)}>
            {/* Zoom icons */}
            {!isExporting && (
              <div className="zoom-icons">
                {/* <button className="zoom-btn"><FaSearchPlus /></button>
                <button className="zoom-btn"><FaSearchMinus /></button> */}
              </div>
            )}
            {/* Camera icon top right (toggle front/back for t-shirt/hoodie) */}
            {!isExporting && (selectedCloth === 'tshirt' || selectedCloth === 'hoodie') && (
              <div className="camera-icon" onClick={e => { e.stopPropagation(); setIsFront(f => !f); }} style={{ cursor: 'pointer' }}>
                <IoCameraReverseOutline />
              </div>
            )}
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
            {designs.map(design => (
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
            ))}
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
                  }}
                  onMouseDown={e => { e.stopPropagation(); setHandleDrag('rotate'); }}
                  onTouchStart={e => { e.stopPropagation(); setHandleDrag('rotate'); }}
                >
                  <FaSyncAlt />
                </div>
              </>
            )}
            {/* Canvas controls bottom left */}
            {!isExporting && (
              <div className="canvas-controls">
                {/* <button className="canvas-ctrl-btn"><FaMousePointer /></button>
                <button className="canvas-ctrl-btn"><FaHandPaper /></button>
                <button className="canvas-ctrl-btn"><FaUndo /></button> */}
              </div>
            )}
            {/* Download button bottom right */}
            {!isExporting && (
              <button className="download-btn-green " onClick={e => { e.stopPropagation(); saveDesign(); }}><FaDownload style={{marginLeft: 4}} /> تنزيل كصورة</button>
            )}
          </div>

          {showAdBanner && (
            <div className=" my-5" style={{height:100}} >
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
