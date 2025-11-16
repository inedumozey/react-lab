// IndexButtons.js

import React, { ReactNode } from "react";

interface DialogButtonsProps {
  // Function to open/activate a modal, passed from your main Index component
  openModal: (id: string, title: string) => void;
  global_modals: any;
  buttons: { id: string; title: string; jsx?: ReactNode }[];
  closed_border_color?: string;
  active_border_color?: string;
  inactive_border_color?: string;
  borderWidth?: string;
}

// Helper function to find the current state of a modal by its ID
const getModalState = (modals: any[], id: string) => {
  // We use any[] for modals array type safety without relying on an import here.
  const modal = modals?.find((m) => m.id === id);
  return {
    isOpen: !!modal,
    isMinimized: modal ? modal.isMinimized : false,
    isActive: modal ? modal.active : false,
  };
};

const DialogButtons: React.FC<DialogButtonsProps> = ({
  openModal,
  buttons,
  global_modals,
  closed_border_color = "white",
  active_border_color = "#1987cf",
  inactive_border_color = "#9ca3af",
  borderWidth = "2px",
}) => {
  return (
    // Example styling for the taskbar container
    <div className="p-3 flex space-x-4">
      {buttons.map((app) => {
        const state = getModalState(global_modals, app.id);

        let borderColor = closed_border_color; // Default: Closed

        if (state.isActive) {
          // Open and Focused (Active)
          borderColor = active_border_color;
        } else if (state.isOpen) {
          // Open but Inactive (Hidden behind another window)
          borderColor = inactive_border_color;
        }

        return (
          <button
            key={app.id}
            // Calling openModal triggers activation/restoration in ModalManager
            onClick={() => openModal(app.id, app.title)}
            className={`rounded transition-all duration-200 relative
            `}
            style={{
              boxShadow: `0 0 0 ${borderWidth} ${borderColor}`,
            }}
          >
            {/* Optional: Visual Icon for Minimized State */}
            {state.isMinimized && (
              <span
                onClick={() => openModal(app.id, app.title)}
                title="Minimized"
                // Small, visible red dot in the corner
                className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 h-2 w-2 bg-red rounded-full"
              ></span>
            )}

            {app.jsx ? app.jsx : app.title}
          </button>
        );
      })}
    </div>
  );
};

export default DialogButtons;
