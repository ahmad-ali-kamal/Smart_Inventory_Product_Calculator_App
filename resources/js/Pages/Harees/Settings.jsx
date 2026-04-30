import { useEffect, useState } from "react";
import { Settings2, Tag, Zap, Save, EyeOff, BadgePercent, Bell, Lightbulb } from "lucide-react";
import Layout from '../../Components/Layout';
import useHareesGuard from '../../hooks/useHareesGuard';
import Card from '../../Components/UI/Card'; 
import Toggle from '../../Components/UI/Toggle'; 

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
      onDragOver={handleDragOver}
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

const handleDragOver = (e) => e.preventDefault();

export default function Settings() {
  useHareesGuard();

  const [unassigned, setUnassigned] = useState([]);
  const [thresholds, setThresholds] = useState({ short: 10, medium: 10, long: 10 });
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [automation, setAutomation] = useState({
    autoHide: false,
    autoDiscount: false,
    enableNotifications: true,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/harees/api/settings', {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        const settings = data.settings || data;

        setThresholds({
          short: settings.short_term_days ?? 10,
          medium: settings.medium_term_days ?? 10,
          long: settings.long_term_days ?? 10,
        });

        setAutomation({
          autoHide: Boolean(settings.auto_hide_expired),
          autoDiscount: Boolean(settings.discount_auto),
          enableNotifications: Boolean(settings.notifications_enabled ?? true),
        });

        if (data.category_mapping) {
          setCategories({
            short: data.category_mapping.short || [],
            medium: data.category_mapping.medium || [],
            long: data.category_mapping.long || [],
          });
        }

        if (data.unassigned_categories) {
          setUnassigned(data.unassigned_categories);
        }
      })
      .catch(err => console.error('Settings fetch error:', err));
  }, []);

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

      setCategories((prev) => ({
        ...prev,
        [toBucket]: [...prev[toBucket], label],
      }));
    } else {
      setCategories((prev) => ({
        ...prev,
        [from]: prev[from].filter((c) => c !== label),
        [toBucket]: [...prev[toBucket], label],
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);

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
          discount_auto: automation.autoDiscount,
          category_mapping: categories,
        }),
      });

      if (!res.ok) throw new Error('Save failed');

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Settings save error:', err);
      alert('فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const AUTOMATION_ITEMS = [
    {
      key: "autoHide",
      icon: <EyeOff size={18} className="text-[var(--muted-foreground)]" />,
      title: "Auto-Hide Expired Products",
      desc: "Automatically hide products from your store when they reach expired status",
    },
    {
      key: "autoDiscount",
      icon: <BadgePercent size={18} className="text-[var(--muted-foreground)]" />,
      title: "Auto Discounts",
      desc: "Auto-apply a set discount to all Yellow-status products the moment they hit the threshold",
    },
    {
      key: "enableNotifications",
      icon: <Bell size={18} className="text-[var(--muted-foreground)]" />,
      title: "Enable Notifications",
      desc: "Receive alerts when products enter the Warning (Yellow) or Expired (Red) state",
    },
  ];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-5 pb-10">
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)] flex-shrink-0">
              <Settings2 size={15} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Alert Thresholds</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Set how many days before expiry each product tier should trigger a warning
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {["short", "medium", "long"].map((key) => (
              <div key={key}>
                <label className="text-xs text-[var(--muted-foreground)] block mb-1.5 capitalize">{key}-term</label>
                <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[var(--muted)] border border-[var(--border)] focus-within:border-[var(--muted-foreground)] transition-all ring-0 outline-none">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={thresholds[key]}
                    onChange={(e) =>
                      setThresholds((p) => ({ ...p, [key]: Number(e.target.value) }))
                    }
                    className="w-full bg-transparent text-sm font-semibold text-[var(--foreground)] focus:outline-none border-none p-0 appearance-none"
                  />
                  <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0">days</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)] flex-shrink-0">
              <Tag size={15} />
            </div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Category Mapping</p>
          </div>

          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
            <Lightbulb size={16} className="text-[var(--primary)] flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-[var(--foreground)] leading-relaxed font-medium">
              Tip: Drag a category card from one bucket to another to change which alert threshold applies to it.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {unassigned.map((cat) => (
              <div
                key={cat}
                draggable
                onDragStart={(e) => handleDragStart(e, cat, "unassigned")}
                className="px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs cursor-grab"
              >
                {cat}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            {BUCKET_CONFIG.map((config) => (
              <BucketColumn
                key={config.key}
                config={config}
                thresholdValue={thresholds[config.key]}
                categories={categories[config.key]}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)] flex-shrink-0">
              <Zap size={15} />
            </div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Automation</p>
          </div>

          {AUTOMATION_ITEMS.map(({ key, icon, title, desc }) => (
            <div
              key={key}
              className="flex items-start justify-between gap-4 py-3 border-b border-[var(--border)] last:border-0"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0">{icon}</span>
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
              <div className="flex-shrink-0 mt-0.5">
                <Toggle
                  checked={automation[key]}
                  onChange={(val) => setAutomation((p) => ({ ...p, [key]: val }))}
                />
              </div>
            </div>
          ))}
        </Card>

        <div className="flex items-center justify-center pt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center justify-center gap-2 w-full max-w-md py-4 rounded-xl text-base font-bold transition-all shadow-sm ${
              saved
                ? "bg-emerald-500 text-white"
                : saving
                ? "bg-[var(--primary)] text-white opacity-70 cursor-not-allowed"
                : "bg-[var(--primary)] text-white hover:brightness-95 active:scale-[0.99]"
            }`}
          >
            <Save size={18} />
            {saved ? "Saved Successfully!" : saving ? "Saving..." : "Save All Settings"}
          </button>
        </div>
      </div>
    </Layout>
  );
}