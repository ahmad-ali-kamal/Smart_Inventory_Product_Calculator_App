import { useLang } from '@/Hooks/useLang';

export default function LanguageSwitcher() {
  const { lang, toggle, isAr } = useLang();
  // Show the language to switch to (the opposite of current)
  const label = isAr ? 'ENGLISH' : 'العربية';
  return (
    <button
      className="lang-btn"
      onClick={toggle}
      style={{ fontFamily: isAr ? "'Cormorant Garamond', serif" : "'Almarai', sans-serif" }}
    >
      {label}
    </button>
  );
}
