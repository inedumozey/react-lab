// ModalTray.tsx (Updated)

"use client";

import React from "react";
import ReactDOM from "react-dom";
import { ModalMeta } from "./StackableDialogs";

interface ModalTrayProps {
  minimizedModals: ModalMeta[];
  activateModal: (id: string) => void;
}

// A simple Icon for the tray item (replace with your preferred icon if needed)
const WindowIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  // ... (Icon definition is unchanged)
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <line x1="3" x2="21" y1="9" y2="9" />
    <line x1="9" x2="9" y1="21" y2="9" />
  </svg>
);

const ModalTray: React.FC<ModalTrayProps> = ({
  minimizedModals,
  activateModal,
}) => {
  if (minimizedModals.length === 0) {
    return null;
  }

  // Render the tray using a Portal to place it at the root of the body, above other content
  return ReactDOM.createPortal(
    <div
      className="fixed overflow-x-auto bottom-0 left-0 right-0 h-10  backdrop-blur-lg border-t border-border 
                 flex items-center justify-start px-4 space-x-2 z-[9999]"
    >
      {minimizedModals.map((modal) => (
        <div
          key={modal.id}
          className="flex items-center space-x-2 p-1.5 rounded-lg text-white text-sm cursor-pointer 
                     bg-red font-bold hover transition-colors shadow-md"
          onClick={() => activateModal(modal.id)}
        >
          <WindowIcon className="w-4 h-4" />
          <span className="truncate max-w-[150px]">{modal.title}</span>
        </div>
      ))}
    </div>,
    document.body
  );
};

export default ModalTray;
