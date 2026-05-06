import { useEffect, useState } from "react";
import { Settings2, Tag, Zap, Save, EyeOff, BadgePercent, Percent, Calendar, AlertCircle } from "lucide-react";
import Layout from '../../Components/Layout';
import useHareesGuard from '../../hooks/useHareesGuard';
import Card from '../../Components/UI/Card'; 
import Toggle from '../../Components/UI/Toggle'; 
import { FormSkeleton } from '../../Components/Common/FormSkeleton';
import ErrorState from '../../Components/Common/ErrorState';
import toast, { Toaster } from 'react-hot-toast';


const INITIAL_CATEGORIES = {
  short: [],
  medium: [],
  long: [],
};

const BUCKET_CONFIG = [
  { key: "short",  label: "Short-term",  dot: "bg-[var(--primary)]",   count_color: "text-[var(--primary)]" },
  { key: "medium", label: "Medium-term", dot: "bg-[var(--primary)]",   count_color: "text-[var(--primary)]" },
  { key: "long",   label: "Long-term",   dot: "bg-[var(--primary)]",   count_color: "text-[var(--primary)]" },
];

function CategoryCard({ label, bucket, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, label, bucket)}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--foreground)] cursor-grab active:cursor-grabbing select-none hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
    >
      <span className="text-[var(--muted-foreground)]">⠿</span>
      {label}
    </div>
  );
}

function BucketColumn({ config, thresholdValue, categories, onDrop, onDragOver, onDragStart }) {
  return (
    <div
      onDrop={(e) => onDrop(e, config.key)}
      onDragOver={(e) => e.preventDefault()}
      className="flex-1 min-h-[150px] rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-3 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${config.dot}`} />
          <span className="text-xs font-semibold text-[var(--foreground)]">{config.label}</span>
        </div>
        <span className={`text-xs font-bold ${config.count_color} bg-[var(--muted)] px-1.5 py-0.5 rounded-md`}>
          {thresholdValue}x
        </span>
      </div>
      {categories.map((cat) => (
        <CategoryCard key={cat} label={cat} bucket={config.key} onDragStart={onDragStart} />
      ))}
      {categories.length === 0 && (
        <div className="flex-1 flex items-center justify-center border border-dashed border-[var(--border)] rounded-lg text-xs text-[var(--muted-foreground)] py-4">
          Drop here
        </div>
      )}
    </div>
  );
}

function CustomToaster() {
    return (
        <Toaster
            position="top-center"
            toastOptions={{ duration: 3000 }}
        />
    );
}

export default function Settings() {
  useHareesGuard();

  const [unassigned, setUnassigned] = useState([]);
  const [thresholds, setThresholds] = useState({ short: 10, medium: 10, long: 10 });
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [automation, setAutomation] = useState({ autoHide: false, autoDiscount: false });
  const [discountConfig, setDiscountConfig] = useState({ percent: 20, durationDays: 7 });
  
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = () => {
    setLoading(true);
    setError(null);
    fetch('/harees/api/settings', {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch settings');
        return res.json();
      })
      .then(data => {
        const settings = data.settings || data;
        setThresholds({
          short: settings.short_term_days ?? 10,
          medium: settings.medium_term_days ?? 10,
          long: settings.long_term_days ?? 10,
        });
        setAutomation({
          autoHide: Boolean(settings.auto_hide_expired),
          autoDiscount: Boolean(settings.auto_discounts),
        });
        setDiscountConfig({
          percent: settings.auto_discount_percent ?? 20,
          durationDays: settings.auto_discount_duration_days ?? 7,
        });
        if (data.category_mapping) {
          setCategories({
            short: data.category_mapping.short || [],
            medium: data.category_mapping.medium || [],
            long: data.category_mapping.long || [],
          });
        }
        if (data.unassigned_categories) setUnassigned(data.unassigned_categories);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleInputChange = (field, value, group, min, max) => {
    const cleanValue = value.replace(/[^\d]/g, '');
    let targetSetter = group === 'thresholds' ? setThresholds : setDiscountConfig;
    let errorKey = `${group}.${field}`;

    targetSetter(prev => ({ ...prev, [field]: cleanValue }));

    if (cleanValue === '') {
      setErrors(prev => ({ ...prev, [errorKey]: 'Required' }));
      return;
    }

    const numValue = parseInt(cleanValue, 10);
    if (numValue < min || numValue > max) {
      setErrors(prev => ({ ...prev, [errorKey]: `Limit: ${min}-${max}` }));
    } else {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[errorKey];
        return newErrs;
      });
    }
  };

  
  const getActiveErrors = () => {
    const activeErrors = { ...errors };
    if (!automation.autoDiscount) {
      delete activeErrors['discount.percent'];
      delete activeErrors['discount.durationDays'];
    }
    return activeErrors;
  };

  const hasActiveErrors = Object.keys(getActiveErrors()).length > 0;

  const handleDragStart = (e, label, fromBucket) => {
    e.dataTransfer.setData("label", label);
    e.dataTransfer.setData("from", fromBucket);
  };

  const handleDrop = (e, toBucket) => {
    e.preventDefault();
    const label = e.dataTransfer.getData("label");
    const from = e.dataTransfer.getData("from");
    if (from === toBucket) return;
    if (from === "unassigned") {
      setUnassigned((prev) => prev.filter((c) => c !== label));
      setCategories((prev) => ({ ...prev, [toBucket]: [...prev[toBucket], label] }));
    } else {
      setCategories((prev) => ({
        ...prev,
        [from]: prev[from].filter((c) => c !== label),
        [toBucket]: [...prev[toBucket], label],
      }));
    }
  };

  const handleSave = async () => {
    if (hasActiveErrors) return;

    setSaving(true);
    setSaveError(null);
    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.content;
      const res = await fetch('/harees/api/settings', {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token,
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: JSON.stringify({
          short_term_days: thresholds.short,
          medium_term_days: thresholds.medium,
          long_term_days: thresholds.long,
          auto_hide_expired: automation.autoHide ? 1 : 0,
          auto_discounts: automation.autoDiscount ? 1 : 0,
          auto_discount_percent: discountConfig.percent,
          auto_discount_duration_days: discountConfig.durationDays,
          category_mapping: categories,
        })
      });

      if (!res.ok) throw new Error('فشل في حفظ البيانات، تأكد من الاتصال');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success('Settings saved successfully.');
    } catch (err) {
      setSaveError(err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><div className="max-w-2xl mx-auto space-y-5 py-10"><FormSkeleton /><FormSkeleton /></div></Layout>;
  if (error) return <Layout><ErrorState message={error} onRetry={fetchSettings} /></Layout>;

  return (
    <Layout>
      <CustomToaster />
      <div className="max-w-2xl mx-auto space-y-5 pb-10">
        {/* Alert Thresholds */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)] flex-shrink-0"><Settings2 size={15} /></div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Alert Thresholds</p>
              <p className="text-xs text-[var(--muted-foreground)]">Set days before expiry (1 - 1095 days)</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {["short", "medium", "long"].map((key) => (
              <div key={key} className="space-y-1">
                <label className="text-xs text-[var(--muted-foreground)] block capitalize">{key}-term</label>
                <div className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[var(--muted)] border transition-all ${errors[`thresholds.${key}`] ? 'border-red-500 bg-red-50' : 'border-[var(--border)] focus-within:border-[var(--primary)]'}`}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={thresholds[key]}
                    onChange={(e) => handleInputChange(key, e.target.value, 'thresholds', 1, 1095)}
                    className="w-full bg-transparent text-sm font-semibold text-[var(--foreground)] outline-none border-none p-0 ring-0 focus:ring-0 shadow-none"
                  />
                  <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0">days</span>
                </div>
                {errors[`thresholds.${key}`] && (
                  <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={10}/> {errors[`thresholds.${key}`]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Category Mapping */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)] flex-shrink-0"><Tag size={15} /></div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Category Mapping</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((cat) => (
              <div key={cat} draggable onDragStart={(e) => handleDragStart(e, cat, "unassigned")} className="px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs cursor-grab">{cat}</div>
            ))}
          </div>
          <div className="flex gap-3">
            {BUCKET_CONFIG.map((config) => (
              <BucketColumn key={config.key} config={config} thresholdValue={thresholds[config.key]} categories={categories[config.key]} onDrop={handleDrop} onDragStart={handleDragStart} />
            ))}
          </div>
        </Card>

        {/* Automation */}
        <Card className="p-5 space-y-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)] flex-shrink-0"><Zap size={15} /></div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Automation</p>
          </div>

          {[
            { key: "autoHide", icon: <EyeOff size={18}/>, title: "Auto-Hide Expired", desc: "Hide products automatically when expired" },
            { key: "autoDiscount", icon: <BadgePercent size={18}/>, title: "Auto Discounts", desc: "Apply discounts to Yellow-status products" }
          ].map(({ key, icon, title, desc }) => (
            <div key={key}>
              <div className="flex items-start justify-between gap-4 py-3 border-b border-[var(--border)] last:border-0">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-[var(--muted-foreground)]">{icon}</span>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{desc}</p>
                  </div>
                </div>
                <Toggle checked={automation[key]} onChange={() => setAutomation(p => ({ ...p, [key]: !p[key] }))} />
              </div>

              {key === "autoDiscount" && automation.autoDiscount && (
                <div className="mx-1 mb-3 mt-1 p-4 rounded-2xl bg-[var(--muted)]/40 border border-[var(--primary)]/20 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-[var(--muted-foreground)] uppercase flex items-center gap-1"><Percent size={9}/> Discount %</label>
                      <div className={`relative rounded-xl border bg-[var(--muted)] transition-all ${errors['discount.percent'] ? 'border-red-500 bg-red-50' : 'border-[var(--primary)]/20'}`}>
                        <input
                          type="text"
                          value={discountConfig.percent}
                          onChange={(e) => handleInputChange('percent', e.target.value, 'discount', 1, 99)}
                          className="w-full p-3 pr-7 bg-transparent text-[var(--foreground)] text-sm font-bold outline-none ring-0 focus:ring-0 border-none shadow-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] text-xs">%</span>
                      </div>
                      {errors['discount.percent'] && <p className="text-[10px] text-red-500 font-medium">{errors['discount.percent']}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-[var(--muted-foreground)] uppercase flex items-center gap-1"><Calendar size={9}/> Duration</label>
                      <div className={`relative rounded-xl border bg-[var(--muted)] transition-all ${errors['discount.durationDays'] ? 'border-red-500 bg-red-50' : 'border-[var(--primary)]/20'}`}>
                        <input
                          type="text"
                          value={discountConfig.durationDays}
                          onChange={(e) => handleInputChange('durationDays', e.target.value, 'discount', 1, 365)}
                          className="w-full p-3 pr-10 bg-transparent text-[var(--foreground)] text-sm font-bold outline-none ring-0 focus:ring-0 border-none shadow-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] text-[9px]">days</span>
                      </div>
                      {errors['discount.durationDays'] && <p className="text-[10px] text-red-500 font-medium">{errors['discount.durationDays']}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </Card>

        {/* Save Button & Feedback */}
        <div className="flex flex-col items-center justify-center pt-6 space-y-3">
          <button
            onClick={handleSave}
            disabled={saving || hasActiveErrors}
            className={`flex items-center justify-center gap-2 w-full max-w-md py-4 rounded-xl text-base font-bold transition-all shadow-none outline-none ring-0 ${
              hasActiveErrors ? "bg-gray-300 text-gray-500 cursor-not-allowed" : saved ? "bg-emerald-500 text-white" : "bg-[var(--primary)] text-white hover:brightness-95"
            }`}
          >
            <Save size={18} /> {saved ? "Saved Successfully!" : saving ? "Saving..." : "Save All Settings"}
          </button>
          
          {saveError && (
            <p className="text-xs text-red-500 font-medium flex items-center gap-1 animate-pulse">
              <AlertCircle size={12}/> {saveError}
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}