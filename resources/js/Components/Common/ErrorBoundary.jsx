import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react"; // Consistent with your preferred icon library

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // Update state so the next render will show the fallback UI
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // Log error details for debugging purposes
  componentCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  // Simple handler to refresh the page and attempt recovery
  handleReset = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-[var(--background)]">
          <div className="max-w-md w-full bg-[var(--card)] border border-[var(--border)] rounded-[2rem] p-10 text-center shadow-sm transition-colors duration-300">
            
            {/* Visual Error Indicator - Soft red theme */}
           <div className="w-16 h-16 rounded-2xl bg-red-50/50 dark:bg-red-950/20 flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-900/30">
  <AlertCircle size={32} className="text-red-500 opacity-90" />
</div>

            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
              Something went wrong
            </h2>
            
            <p className="text-sm text-[var(--muted-foreground)] mb-8 leading-relaxed">
              The system encountered an unexpected issue. Please try refreshing the page or come back later.
            </p>

            {/* Action Button - Matches your primary SaaS style */}
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[var(--primary)] text-white font-semibold hover:brightness-95 active:scale-[0.98] transition-all shadow-sm"
            >
              <RefreshCw size={18} />
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}