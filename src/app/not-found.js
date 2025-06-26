import Link from 'next/link';
import styles from './notfound.module.css';

export default function NotFound() {
  return (
    <div className={styles.notfoundContainer}>
      <div className={styles.notfoundContent}>
        {/* <div className={styles.notfoundTextBlock}> */}
          {/* <span className={styles.notfound404}>404</span> */}
          {/* <span className={styles.notfoundTSign}>T-SIGN</span> */}
        {/* </div> */}
        <img src="/notfound.png" alt="404 not found" className={styles.notfoundImage} />
        <div className={styles.notfoundMsg}>
          يبدو أن هناك خطأ ما أو ربما تحاول الوصول لصفحة محذوفة أو غير موجودة، يمكنك العودة للصفحة الرئيسية من خلال الزر بالأسفل.
        </div>
        <Link href="/" className={styles.notfoundBtn}>&lt; الرئيسية</Link>
      </div>
    </div>
  );
} 