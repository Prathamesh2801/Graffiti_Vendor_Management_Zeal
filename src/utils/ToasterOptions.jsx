import {Toaster} from 'react-hot-toast'

export default function ToasterOptions() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          fontFamily: "Barlow, sans-serif",
          fontSize: "13px",
          borderRadius: "12px",
          border: "0.5px solid rgba(26,26,46,0.12)",
          background: "#fff",
          color: "#1A1A2E",
        },
        success: {
          iconTheme: { primary: "#27AE60", secondary: "#fff" },
        },
        error: {
          iconTheme: { primary: "#C92A2A", secondary: "#fff" },
        },
      }}
    />
  );
}
