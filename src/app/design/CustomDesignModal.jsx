import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import Swal from 'sweetalert2';

const CustomDesignModal = ({ show, onClose }) => {
  if (!show) return null;
  return (
    <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.3)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={onClose}>


      <div  style={{background:'#fff',borderRadius:16,padding:32,width:'60%',boxShadow:'0 4px 24px rgba(0,0,0,0.13)',position:'relative' , maxHeight:'80vh' , overflow:"scroll"}} onClick={e=>e.stopPropagation()} >
        <button onClick={onClose} style={{position:'absolute',top:12,right:12,background:'none',border:'none',fontSize:24,cursor:'pointer',color:'#888'}}>&times;</button>
        <h2 style={{textAlign:'center',color:'#1976d2',marginBottom:18,fontWeight:700,fontSize:'1.4rem'}}>تصميم مخصص</h2>
        <Formik
          initialValues={{ name: '', phone: '', email: '', details: '' }}
          validate={values => {
            const errors = {};
            if (!values.name) errors.name = 'مطلوب';
            if (!values.phone) errors.phone = 'مطلوب';
            if (!values.details) errors.details = 'مطلوب';
            return errors;
          }}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            try {
              await fetch('/api/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: 'alysayed208@gmail.com',
                  subject: `طلب تصميم مخصص - ${values.name}`,
                  text: `طلب تصميم مخصص\nالاسم: ${values.name}\nرقم الهاتف: ${values.phone}\nالبريد الإلكتروني: ${values.email}\nالطلب بالكامل: ${values.details}`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2 style="color: #2a6cff;">طلب تصميم مخصص</h2>
                      <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                        <h3 style="color: #333; margin-top: 0;">تفاصيل العميل:</h3>
                        <p><strong>الاسم:</strong> ${values.name}</p>
                        <p><strong>رقم الهاتف:</strong> ${values.phone}</p>
                        <p><strong>البريد الإلكتروني:</strong> ${values.email}</p>
                      </div>
                      <div style="background: #e6f0ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
                        <h3 style="color: #333; margin-top: 0;">الطلب بالكامل:</h3>
                        <p>${values.details}</p>
                      </div>
                    </div>
                  `
                })
              });
              Swal.fire({
                html: `
                  <div style="position:relative;min-width:260px;max-width:350px;padding:18px 18px 14px 18px;background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(0,0,0,0.08);text-align:center;">
                    <span style="position:absolute;top:10px;left:10px;width:14px;height:14px;background:#19d439;border-radius:50%;display:inline-block;"></span>
                    <span id="swal-custom-close" style="position:absolute;top:10px;right:10px;width:28px;height:28px;background:#0066ff;border:none;border-radius:8px;color:#fff;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">&#10005;</span>
                    <div style="font-size:1.25rem;font-weight:500;margin-top:8px;">تم تلقى طلبك بنجاح</div>
                  </div>
                `,
                showConfirmButton: false,
                showCloseButton: false,
                background: 'transparent',
                customClass: { popup: 'swal2-loader-popup' }
              });
              // Add event listener for custom close button
              setTimeout(() => {
                const closeBtn = document.getElementById('swal-custom-close');
                if (closeBtn) closeBtn.onclick = () => Swal.close();
              }, 0);
              resetForm();
              onClose();
            } catch (e) {
              Swal.fire({icon:'error',title:'خطأ',text:'حدث خطأ أثناء الإرسال. حاول مرة أخرى.'});
            }
            setSubmitting(false);
          }}
        >
          {({ isSubmitting }) => (
            <Form style={{display:'flex',flexDirection:'column',gap:16}}>
              <label style={{textAlign:'right',fontWeight:600}}>الاسم ثلاثي<span style={{color:'red'}}>*</span></label>
              <Field name="name" type="text" placeholder="اكتب هنا اسمك ثلاثي" style={{padding:12,borderRadius:8,border:'1.5px solid #bdbdbd',fontSize:'1rem'}} />
              <ErrorMessage name="name" component="div" style={{color:'red',textAlign:'right'}} />
              <label style={{textAlign:'right',fontWeight:600}}>رقم الهاتف<span style={{color:'red'}}>*</span></label>
              <Field name="phone" type="text" placeholder="اكتب رقم هاتفك" style={{padding:12,borderRadius:8,border:'1.5px solid #bdbdbd',fontSize:'1rem'}} />
              <ErrorMessage name="phone" component="div" style={{color:'red',textAlign:'right'}} />
              <label style={{textAlign:'right',fontWeight:600}}>بريدك الإلكتروني <span style={{color:'#888'}}>(اختياري)</span></label>
              <Field name="email" type="email" placeholder="ضع البريد الإلكتروني" style={{padding:12,borderRadius:8,border:'1.5px solid #bdbdbd',fontSize:'1rem'}} />
              <ErrorMessage name="email" component="div" style={{color:'red',textAlign:'right'}} />
              <label style={{textAlign:'right',fontWeight:600}}>الطلب بالكامل<span style={{color:'red'}}>*</span></label>
              <Field as="textarea" name="details" placeholder="اكتب طلبك - تصميمك هنا وسنقوم بتنفيذه من قبل مصممينا بسعر اضافي" style={{padding:12,borderRadius:8,border:'1.5px solid #bdbdbd',fontSize:'1rem',minHeight:80}} />
              <ErrorMessage name="details" component="div" style={{color:'red',textAlign:'right'}} />
              <button type="submit" disabled={isSubmitting} style={{marginTop:12,background:'#1976d2',color:'#fff',border:'none',borderRadius:8,padding:'12px 0',fontWeight:'bold',fontSize:'1.1rem',cursor:'pointer'}}>
                {isSubmitting ? 'يتم الإرسال...' : 'إرسال'}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default CustomDesignModal; 