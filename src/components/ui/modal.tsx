import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: number;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 500 }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const modalRoot = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999, // Render on top of everything, including header & sidebar
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="animate-fade-in"
        style={{
          width: "100%",
          maxWidth: maxWidth,
          background: "var(--card)",
          borderRadius: 16,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderBottom: "1px solid var(--border)",
            background: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--foreground)" }}>{title}</h2>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ 
              padding: 6, 
              borderRadius: 8,
              color: "var(--muted-foreground)",
              transition: "all 0.2s",
              border: "none",
              background: "transparent",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--foreground)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--muted-foreground)"}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Modal Body */}
        <div 
          style={{ 
            padding: "24px", 
            overflowY: "auto",
            flex: 1
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalRoot, document.body);
}
