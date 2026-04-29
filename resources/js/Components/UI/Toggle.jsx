// resources/js/Components/UI/Toggle.jsx
import { motion } from 'framer-motion';

export default function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange()}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-500 ${
        checked ? "bg-[var(--primary)]" : "bg-gray-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <motion.span
        // نستخدم animate للتحكم في الإحداثيات مباشرة لضمان السلاسة
        animate={{ 
          x: checked ? 24 : 4 // يتحرك 24 بكسل لليمين في حالة التفعيل
        }}
        transition={{ 
          type: "spring", 
          stiffness: 400, // سرعة الانطلاق
          damping: 25,    // منع الارتداد الزائد (إحساس ناعم)
          mass: 0.8       // إعطاء ثقل بسيط للحركة
        }}
        className="inline-block h-4 w-4 rounded-full bg-white shadow-md"
      />
    </button>
  );
}