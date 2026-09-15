import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Xử lý lỗi nạp module động (thường do triển khai phiên bản mới)
window.addEventListener('error', (e) => {
    if (e.message.includes('Failed to fetch dynamically imported module') || 
        e.message.includes('Importing a module script failed')) {
        console.warn("[SYSTEM] Phát hiện lỗi nạp module, tự động làm mới trang...");
        window.location.reload();
    }
}, true);

window.addEventListener('unhandledrejection', (e) => {
    if (e.reason && (
        String(e.reason).includes('Failed to fetch dynamically imported module') ||
        String(e.reason).includes('Importing a module script failed')
    )) {
        console.warn("[SYSTEM] Phát hiện lỗi nạp module (promise), tự động làm mới trang...");
        window.location.reload();
    }
});

// Xử lý loader ngay lập tức bằng JS thuần
const removeLoader = () => {
    const loader = document.getElementById('root-loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 300);
    }
};

// Màn hình báo lỗi "Cứng" nếu React không thể khởi động
const showFatalError = (error: unknown) => {
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = `
            <div style="padding: 40px; font-family: sans-serif; text-align: center; color: #ef4444;">
                <h1 style="font-size: 20px; margin-bottom: 10px;">Hệ thống không thể khởi động</h1>
                <p style="color: #64748b; font-size: 14px;">Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.</p>
                <div style="background: #fee2e2; padding: 20px; border-radius: 12px; margin-top: 20px; text-align: left; font-family: monospace; font-size: 12px; overflow: auto; max-width: 600px; display: inline-block;">
                    ${String(error)}
                </div>
                <div style="margin-top: 20px;">
                    <button onclick="window.location.reload()" style="background: #3b82f6; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: bold;">Tải lại trang</button>
                </div>
            </div>
        `;
    }
};

interface ErrorBoundaryProps {
    children?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Nếu là lỗi nạp module, ép tải lại trang
    if (error.message && (
        error.message.includes('Failed to fetch dynamically imported module') ||
        error.message.includes('Importing a module script failed')
    )) {
      window.location.reload();
    }
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("React Crash:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center bg-slate-50">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 max-w-lg">
             <h1 className="text-2xl font-bold text-slate-800 mb-2">Đã xảy ra lỗi</h1>
             <p className="text-slate-500 mb-6">Ứng dụng gặp sự cố không mong muốn.</p>
             <pre className="bg-red-50 text-red-600 p-4 rounded-xl text-left text-xs overflow-auto mb-6 custom-scrollbar max-h-60">
                {this.state.error?.toString()}
             </pre>
             <button onClick={() => window.location.reload()} className="bg-primary-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200">
                Thử lại ngay
             </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');

if (!rootElement) {
    console.error("Fatal: Root element not found");
} else {
    try {
        console.log("[SYSTEM] App Mounting...");
        const root = ReactDOM.createRoot(rootElement);
        root.render(
          <React.StrictMode>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </React.StrictMode>
        );
        // Gỡ bỏ màn hình chờ sau khi render xong
        removeLoader();
    } catch (e) {
        console.error("Mounting Error:", e);
        removeLoader();
        showFatalError(e);
    }
}