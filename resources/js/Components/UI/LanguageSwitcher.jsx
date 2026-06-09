import { useLang } from '@/Hooks/useLang';

export default function LanguageSwitcher() {
  const { lang, toggle, isAr } = useLang();
  // Show the language to switch to (the opposite of current)
  const label = isAr ? 'ENGLISH' : 'العربية';
  return (
    <button
      className="lang-btn"
      onClick={toggle}
      aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
      lang={isAr ? 'en' : 'ar'}
      style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "'Changa', sans-serif", color: 'white' }}
    >
      {label}
    </button>
  );
}
