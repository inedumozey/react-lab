"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

// --- Icon Definitions ---
const MaximizeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
    <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
  </svg>
);
const RestoreIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
    <path d="M16 3h3a2 2 0 0 1 2 2v3" />
    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);
const MinimizeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14" />
  </svg>
);
const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const MIN_WIDTH = 300;
const MIN_HEIGHT = 200;

interface ModalProps {
  title: string;
  id: string;
  onClose: () => void;

  //Add the last known windowed position to the update signature
  onUpdate: (
    id: string,
    newPosition: Position,
    isMaximized: boolean,
    isMinimized: boolean,
    lastWindowedPosition: {
      x: number;
      y: number;
      width: number;
      height: number;
    }
  ) => void;
  active?: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  onClick: () => void;
  isMaximizedInitial: boolean;
  isMinimizedInitial: boolean;
  savedX: number;
  savedY: number;
  savedWidth: number;
  savedHeight: number;
  children?: React.ReactNode;
  title_active_bg_color?: string;
  title_active_text_color?: string;
  title_inactive_bg_color?: string;
  title_inactive_text_color?: string;
  title_position?: string;
}

const Modal: React.FC<ModalProps> = ({
  title,
  id,
  onClose,
  onUpdate,
  active = true,
  zIndex = 2000,
  x,
  y,
  width,
  height,
  onClick,
  isMaximizedInitial = false,
  isMinimizedInitial = false,
  savedX,
  savedY,
  savedWidth,
  savedHeight,
  children,
  title_active_bg_color,
  title_active_text_color,
  title_inactive_bg_color,
  title_inactive_text_color,
  title_position,
}) => {
  const [isMaximized, setIsMaximized] = useState(isMaximizedInitial);
  const [isMinimized, setIsMinimized] = useState(isMinimizedInitial);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | false>(false);

  const [position, setPosition] = useState<Position>(() => {
    // Initial position is based on active coordinates (x, y, width, height)
    return {
      width,
      height,
      x,
      y,
      isMaximized: isMaximizedInitial,
    };
  });

  // savedPositionRef initialized using props received from Manager
  const savedPositionRef = useRef<Position>({
    width: savedWidth,
    height: savedHeight,
    x: savedX,
    y: savedY,
    isMaximized: false,
  });

  // Syncing props to state and setting savedPositionRef correctly on load
  useEffect(() => {
    setIsMaximized(isMaximizedInitial);
    setIsMinimized(isMinimizedInitial);

    // Sync the visual position from props
    setPosition({ width, height, x, y, isMaximized: isMaximizedInitial });

    // Sync saved position from manager props (survives refresh)
    savedPositionRef.current = {
      width: savedWidth,
      height: savedHeight,
      x: savedX,
      y: savedY,
      isMaximized: false,
    };
  }, [
    isMaximizedInitial,
    isMinimizedInitial,
    width,
    height,
    x,
    y,
    savedWidth,
    savedHeight,
    savedX,
    savedY,
  ]);

  const offsetRef = useRef({
    clientX: 0,
    clientY: 0,
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  const getClientCoords = (
    e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent
  ) => {
    if ("touches" in e && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return {
      clientX: (e as MouseEvent | React.MouseEvent).clientX || 0,
      clientY: (e as MouseEvent | React.MouseEvent).clientY || 0,
    };
  };

  const updateModalState = useCallback(
    (
      newPosition: Position,
      newIsMaximized: boolean,
      newIsMinimized: boolean,
      // Pass the saved position explicitly
      savedPos: { x: number; y: number; width: number; height: number }
    ) => {
      setPosition(newPosition);
      setIsMaximized(newIsMaximized);
      setIsMinimized(newIsMinimized);
      // Pass savedPos to the external onUpdate
      onUpdate(id, newPosition, newIsMaximized, newIsMinimized, savedPos);
    },
    [id, onUpdate]
  );

  // --- Maximize/Restore Logic ---
  const handleToggleMaximize = useCallback(() => {
    if (isMinimized) return;

    let newPosition: Position;
    let newIsMaximized: boolean;
    let currentSavedPosition = savedPositionRef.current; // Snapshot for sending

    if (isMaximized) {
      // Restore
      newPosition = currentSavedPosition;
      newIsMaximized = false;
    } else {
      // Maximize
      // Save current windowed position BEFORE maximizing
      savedPositionRef.current = {
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height,
        isMaximized: false,
      };
      // Use the newly saved position for the update payload
      currentSavedPosition = savedPositionRef.current;

      const margin = 20;
      newPosition = {
        x: margin,
        y: margin,
        width: window.innerWidth - margin * 2,
        height: window.innerHeight - margin * 2,
        isMaximized: true,
      };
      newIsMaximized = true;
    }

    // Pass the new state/position and the last windowed position to the manager
    updateModalState(newPosition, newIsMaximized, false, currentSavedPosition);
    setIsDragging(false);
    setIsResizing(false);
  }, [isMaximized, isMinimized, position, updateModalState]);

  // --- Minimize/Restore Logic ---
  const handleToggleMinimize = useCallback(() => {
    let newIsMinimized: boolean;
    let newIsMaximized = isMaximized; // Preserve the current isMaximized state for restoration
    let newPosition = position;
    let currentSavedPosition = savedPositionRef.current; // Snapshot for sending

    if (isMinimized) {
      // RESTORE from minimized
      newIsMinimized = false;

      // CRITICAL FIX: If the modal was maximized before minimizing, restore to the MAXIMIZED position,
      // NOT the saved position. The isMaximized flag ensures the button icon is correct.
      if (isMaximized) {
        const margin = 20;
        newPosition = {
          x: margin,
          y: margin,
          width: window.innerWidth - margin * 2,
          height: window.innerHeight - margin * 2,
          isMaximized: true,
        };
      } else {
        // Restore to the windowed position
        newPosition = currentSavedPosition;
      }

      // 1. Update state locally and notify manager
      updateModalState(
        newPosition,
        newIsMaximized,
        newIsMinimized,
        currentSavedPosition
      );

      // 2. Trigger Z-index update (activate modal)
      onClick();
    } else {
      // MINIMIZE
      newIsMinimized = true;
      newIsMaximized = isMaximized; // Keep state

      // 1. Save the current position before minimizing if it wasn't maximized
      if (!isMaximized) {
        savedPositionRef.current = {
          x: position.x,
          y: position.y,
          width: position.width,
          height: position.height,
          isMaximized: false,
        };
      }
      currentSavedPosition = savedPositionRef.current;

      // 2. Update state locally and notify manager
      updateModalState(
        newPosition,
        newIsMaximized,
        newIsMinimized,
        currentSavedPosition
      );
    }
  }, [isMinimized, isMaximized, position, onClick, updateModalState]);

  // --- Drag/Resize Handlers ---
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if (isMaximized || isMinimized) return;

      if (
        e.target !== e.currentTarget &&
        (e.target as HTMLElement).closest(".drag-exempt")
      )
        return;

      const { clientX, clientY } = getClientCoords(e);
      setIsDragging(true);
      offsetRef.current = {
        clientX,
        clientY,
        left: position.x,
        top: position.y,
        width: position.width,
        height: position.height,
      };
      e.preventDefault();
      onClick();
    },
    [isMaximized, isMinimized, position, onClick]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, direction: string) => {
      e.stopPropagation();
      if (isMaximized || isMinimized) return;
      const { clientX, clientY } = getClientCoords(e);
      setIsResizing(direction);
      offsetRef.current = {
        clientX,
        clientY,
        left: position.x,
        top: position.y,
        width: position.width,
        height: position.height,
      };
      e.preventDefault();
      e.stopPropagation();
      onClick();
    },
    [isMaximized, isMinimized, position, onClick]
  );

  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (e instanceof TouchEvent) {
        e.preventDefault();
      }
      const { clientX, clientY } = getClientCoords(e);
      const dx = clientX - offsetRef.current.clientX;
      const dy = clientY - offsetRef.current.clientY;

      if (isDragging) {
        setPosition((prev) => ({
          ...prev,
          x: offsetRef.current.left + dx,
          y: offsetRef.current.top + dy,
        }));
      } else if (isResizing) {
        let { left, top, width, height } = offsetRef.current;
        let newWidth = width;
        let newHeight = height;
        let newX = left;
        let newY = top;

        if (isResizing.includes("e"))
          newWidth = Math.max(MIN_WIDTH, width + dx);
        if (isResizing.includes("w")) {
          newWidth = Math.max(MIN_WIDTH, width - dx);
          newX =
            newWidth === MIN_WIDTH ? left + (width - MIN_WIDTH) : left + dx;
        }
        if (isResizing.includes("s"))
          newHeight = Math.max(MIN_HEIGHT, height + dy);
        if (isResizing.includes("n")) {
          newHeight = Math.max(MIN_HEIGHT, height - dy);
          newY =
            newHeight === MIN_HEIGHT ? top + (height - MIN_HEIGHT) : top + dy;
        }
        newX = Math.max(0, Math.min(newX, window.innerWidth - newWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - newHeight));

        setPosition((prev) => ({
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
          isMaximized: prev.isMaximized,
        }));
      }
    },
    [isDragging, isResizing]
  );

  const handleStop = useCallback(() => {
    if (isDragging || isResizing) {
      // Report final position, maximized state, minimized state, and saved position
      onUpdate(id, position, isMaximized, isMinimized, {
        x: savedPositionRef.current.x,
        y: savedPositionRef.current.y,
        width: savedPositionRef.current.width,
        height: savedPositionRef.current.height,
      });
    }
    setIsDragging(false);
    setIsResizing(false);
  }, [
    isDragging,
    isResizing,
    id,
    position,
    isMaximized,
    isMinimized,
    onUpdate,
  ]);

  useEffect(() => {
    const passive = isDragging || isResizing ? { passive: false } : undefined;

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleStop);
      document.addEventListener("touchmove", handleMove, passive);
      document.addEventListener("touchend", handleStop);
    }

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleStop);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleStop);
    };
  }, [isDragging, isResizing, handleMove, handleStop]);

  // Save position only when not maximized/minimized/dragging/resizing
  useEffect(() => {
    if (!isMaximized && !isMinimized && !isDragging && !isResizing) {
      savedPositionRef.current = {
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height,
        isMaximized: false,
      };
    }
  }, [position, isMaximized, isMinimized, isDragging, isResizing]);

  const ResizeHandle: React.FC<{
    direction: string;
    cursor: string;
    onMouseDown: (e: any, direction: string) => void;
    style?: React.CSSProperties;
  }> = ({ direction, cursor, onMouseDown, style }) => (
    <div
      className="absolute z-30 opacity-0 md:opacity-100"
      style={{ ...style, cursor }}
      onMouseDown={(e) => onMouseDown(e, direction)}
      onTouchStart={(e) => onMouseDown(e, direction)}
    />
  );

  const modalStyles: React.CSSProperties = {
    zIndex: zIndex,
    ...(isMaximized
      ? {
          // Maximize to nearly full screen (20px margin)
          width: `${window.innerWidth - 40}px`,
          height: `${window.innerHeight - 40}px`,
          left: "20px",
          top: "20px",
          borderColor: active ? title_active_bg_color : title_inactive_bg_color,
          transition: "0.3s ease-out",
        }
      : {
          // Normal windowed position
          width: `${position.width}px`,
          height: `${position.height}px`,
          left: `${position.x}px`,
          top: `${position.y}px`,
          borderColor: active ? title_active_bg_color : title_inactive_bg_color,
          transition: isDragging || isResizing ? "none" : "0.3s ease-out",
        }),
    borderRadius: isMaximized ? "8px" : "16px",

    // Hide the element with CSS, keeping it mounted in the DOM
    visibility: isMinimized ? "hidden" : "visible",
    pointerEvents: isMinimized ? "none" : "auto", // Ensures no clicks pass through hidden modal
  };

  return ReactDOM.createPortal(
    <div
      className={`fixed flex flex-col border-4 drop-shadow-2xl overflow-hidden min-w-[300px] min-h-[200px]`}
      style={modalStyles} // <-- Applies the visibility styles
      onMouseDown={onClick}
      onTouchStart={onClick}
    >
      {/* Hide resize handles if maximized */}
      {!isMaximized && (
        <>
          <ResizeHandle
            direction="n"
            cursor="ns-resize"
            onMouseDown={handleResizeStart}
            style={{ top: -5, left: 0, right: 0, height: 10 }}
          />
          <ResizeHandle
            direction="s"
            cursor="ns-resize"
            onMouseDown={handleResizeStart}
            style={{ bottom: -5, left: 0, right: 0, height: 10 }}
          />
          <ResizeHandle
            direction="e"
            cursor="ew-resize"
            onMouseDown={handleResizeStart}
            style={{ top: 0, bottom: 0, right: -5, width: 10 }}
          />
          <ResizeHandle
            direction="w"
            cursor="ew-resize"
            onMouseDown={handleResizeStart}
            style={{ top: 0, bottom: 0, left: -5, width: 10 }}
          />
          <ResizeHandle
            direction="nw"
            cursor="nwse-resize"
            onMouseDown={handleResizeStart}
            style={{ top: -5, left: -5, width: 15, height: 15 }}
          />
          <ResizeHandle
            direction="ne"
            cursor="nesw-resize"
            onMouseDown={handleResizeStart}
            style={{ top: -5, right: -5, width: 15, height: 15 }}
          />
          <ResizeHandle
            direction="sw"
            cursor="nesw-resize"
            onMouseDown={handleResizeStart}
            style={{ bottom: -5, left: -5, width: 15, height: 15 }}
          />
          <ResizeHandle
            direction="se"
            cursor="nwse-resize"
            onMouseDown={handleResizeStart}
            style={{ bottom: -5, right: -5, width: 15, height: 15 }}
          />
        </>
      )}

      {title_position == "left" ? (
        <div
          id="modal-header"
          className={`flex justify-between items-center px-4 py-2 select-none ${
            isMaximized ? "cursor-default" : "cursor-move"
          }`}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onDoubleClick={handleToggleMaximize}
          style={{
            color: active ? title_active_text_color : title_inactive_text_color,
            background: active
              ? title_active_bg_color
              : title_inactive_bg_color,
          }}
        >
          <div className="flex space-x-2 drag-exempt">
            {/* Close Button */}
            <button
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 hover bg-red rounded transition-colors drag-exempt"
            >
              <XIcon />
            </button>

            {/* Minimize Button */}
            <button
              onClick={handleToggleMinimize}
              className="p-1 bg-[#ffba4e] hover rounded transition-colors drag-exempt"
            >
              <MinimizeIcon />
            </button>

            {/* Maximize/Restore Button */}
            <button
              onClick={handleToggleMaximize}
              className="p-1 hover bg-[#00c757] rounded transition-colors drag-exempt"
            >
              {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
            </button>
          </div>
          <span
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            onDoubleClick={handleToggleMaximize}
            className="font-extrabold text-lg truncate drag-exempt"
          >
            {title}
          </span>
        </div>
      ) : (
        <div
          id="modal-header"
          className={`flex justify-between items-center px-4 py-2 select-none ${
            isMaximized ? "cursor-default" : "cursor-move"
          }`}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onDoubleClick={handleToggleMaximize}
          style={{
            color: active ? title_active_text_color : title_inactive_text_color,
            background: active
              ? title_active_bg_color
              : title_inactive_bg_color,
          }}
        >
          <div className="flex space-x-2 drag-exempt">
            {/* Close Button */}
            <button
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 hover bg-red rounded transition-colors drag-exempt"
            >
              <XIcon />
            </button>

            {/* Minimize Button */}
            <button
              onClick={handleToggleMinimize}
              className="p-1 bg-[#ffba4e] hover rounded transition-colors drag-exempt"
            >
              <MinimizeIcon />
            </button>

            {/* Maximize/Restore Button */}
            <button
              onClick={handleToggleMaximize}
              className="p-1 hover bg-[#00c757] rounded transition-colors drag-exempt"
            >
              {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
            </button>
          </div>
          <span
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            onDoubleClick={handleToggleMaximize}
            className="font-extrabold text-lg truncate drag-exempt"
          >
            {title}
          </span>
        </div>
      )}

      {children}
    </div>,
    document.body
  );
};
export default Modal;
