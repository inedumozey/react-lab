"use client";

import React, { useState, useEffect, ReactNode, useCallback } from "react";
import Modal, { Position as ModalPosition } from "./Modal";
import ModalTray from "./ModalTray";
export type Position = ModalPosition;

export interface ModalMeta extends Position {
  id: string;
  title: string;
  active: boolean;
  zIndex: number;
  index: number;
  isMinimized: boolean;
  savedPosition: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Define the structure for the persistent data store
type AppDataStore = { [modalId: string]: any };

export interface IStackableDialogs {
  id: string | null;
  title: string | null;
  set_global_modals: any;
  modal_label: string;
  modal_data: string;
  activationKey: number;
  onClose?: (x: string) => void;
  getContent: (
    modalId: string,
    data: any,
    updateData: (data: any) => void
  ) => ReactNode;
  title_active_bg_color?: string;
  title_active_text_color?: string;
  title_inactive_bg_color?: string;
  title_inactive_text_color?: string;
  title_position?: string;
}

// --- Initial Position Calculation ---
const getInitialPosition = (index: number = 0): Position => {
  if (typeof window === "undefined") {
    return { x: 0, y: 0, width: 800, height: 600, isMaximized: false };
  }
  const initialWidth = Math.min(Math.floor(window.innerWidth * 0.8), 1200);
  const initialHeight = Math.min(Math.floor(window.innerHeight * 0.7), 800);

  const offset = index * 20;
  const initialLeft =
    Math.floor((window.innerWidth - initialWidth) / 2) + offset;
  const initialTop =
    Math.floor((window.innerHeight - initialHeight) / 2) + offset;

  return {
    x: initialLeft,
    y: initialTop,
    width: initialWidth,
    height: initialHeight,
    isMaximized: false,
  };
};

const StackableDialogs: React.FC<IStackableDialogs> = ({
  id,
  title,
  modal_data,
  set_global_modals,
  modal_label,
  activationKey = 0,
  onClose = () => {},
  getContent,
  title_active_bg_color = "#1987cf",
  title_active_text_color = "white",
  title_inactive_bg_color = "#9ca3af",
  title_inactive_text_color = "white",
  title_position = "left",
}) => {
  const [modals, setModals] = useState<ModalMeta[]>([]);

  // 1. State for all persistent form data
  const [appData, setAppData] = useState<AppDataStore>({});

  // Helper to sync modal state to local storage
  const syncModalsToLocalStorage = useCallback(
    (currentModals: ModalMeta[]) => {
      try {
        localStorage.setItem(modal_label, JSON.stringify(currentModals));
      } catch (error) {
        console.error("Error saving modals to localStorage:", error);
      }
    },
    [modal_label]
  );

  // 2. Load modal and form data from local storage on mount
  useEffect(() => {
    try {
      const storedModals = localStorage.getItem(modal_label);
      if (storedModals) {
        let parsedModals: ModalMeta[] = JSON.parse(storedModals);

        if (parsedModals.length > 0) {
          const maxZ = parsedModals.reduce(
            (max, m) => Math.max(max, m.zIndex),
            0
          );

          parsedModals = parsedModals.map((m) => {
            const defaultPos = getInitialPosition();
            return {
              ...m,
              isMinimized: m.isMinimized === undefined ? false : m.isMinimized,
              savedPosition: m.savedPosition || {
                x: m.x || defaultPos.x,
                y: m.y || defaultPos.y,
                width: m.width || defaultPos.width,
                height: m.height || defaultPos.height,
              },
            };
          });

          const correctedModals = parsedModals.map((m) => ({
            ...m,
            active: m.zIndex === maxZ && !m.isMinimized,
          }));
          setModals(correctedModals);
        }
      }

      const storedAppData = localStorage.getItem(modal_data);
      if (storedAppData) {
        setAppData(JSON.parse(storedAppData));
      }
    } catch (error) {
      console.error("Error loading state from localStorage:", error);
      localStorage.removeItem(modal_label);
      localStorage.removeItem(modal_data);
    }
  }, [modal_label]);

  // 3. Function to update data for a specific modal and persist it
  const updateModalData = useCallback((modalId: string, newData: any) => {
    setAppData((prevData) => {
      const updatedData = {
        ...prevData,
        [modalId]: newData,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(modal_data, JSON.stringify(updatedData));
      }
      return updatedData;
    });
  }, []);

  const activateModalLogic = useCallback(
    (prevModals: ModalMeta[], activatedId: string): ModalMeta[] => {
      const maxZ =
        prevModals.length > 0
          ? Math.max(...prevModals.map((m) => m.zIndex))
          : 2000;

      const updatedModals = prevModals.map((m) => {
        if (m.id === activatedId) {
          return {
            ...m,
            active: true,
            zIndex: maxZ + 1,
            isMinimized: false,
          };
        } else {
          return { ...m, active: false };
        }
      });
      return updatedModals;
    },
    []
  );

  const activateModal = useCallback(
    (activatedId: string) => {
      setModals((prevModals) => {
        const updatedModals = activateModalLogic(prevModals, activatedId);
        syncModalsToLocalStorage(updatedModals);
        return updatedModals;
      });
    },
    [activateModalLogic, syncModalsToLocalStorage]
  );

  const openModal = useCallback(
    (newId: string, newTitle: string) => {
      setModals((prevModals) => {
        const exist = prevModals.some((modal) => modal.id === newId);
        if (exist) {
          return activateModalLogic(prevModals, newId);
        }

        const maxZ =
          prevModals.length > 0
            ? Math.max(...prevModals.map((m) => m.zIndex))
            : 1999;

        const newIndex =
          prevModals.length > 0
            ? Math.max(...prevModals.map((m) => m.index)) + 1
            : 1;

        const initialPos = getInitialPosition(prevModals.length);

        const newModal: ModalMeta = {
          id: newId,
          title: newTitle,
          active: true,
          zIndex: maxZ + 1,
          index: newIndex,
          isMinimized: false,
          ...initialPos,
          savedPosition: {
            x: initialPos.x,
            y: initialPos.y,
            width: initialPos.width,
            height: initialPos.height,
          },
        };

        const deactivatedModals = prevModals.map((m) => ({
          ...m,
          active: false,
        }));

        const updatedModals = [...deactivatedModals, newModal];
        syncModalsToLocalStorage(updatedModals);
        return updatedModals;
      });
    },
    [activateModalLogic, syncModalsToLocalStorage]
  );

  const closeModal = useCallback(
    (closedId: string) => {
      setModals((prevModals) => {
        const remainingModals = prevModals.filter((m) => m.id !== closedId);
        if (remainingModals.length === 0) {
          localStorage.removeItem(modal_label);
          onClose(closedId);
          return [];
        }
        const maxZ = remainingModals.reduce(
          (max, m) => Math.max(max, m.zIndex),
          0
        );
        const updatedModals = remainingModals.map((m) => ({
          ...m,
          active: m.zIndex === maxZ && !m.isMinimized,
        }));
        syncModalsToLocalStorage(updatedModals);
        onClose(closedId);
        return updatedModals;
      });
    },
    [modal_label, onClose, syncModalsToLocalStorage]
  );

  const updateModalPosition = useCallback(
    (
      updatedId: string,
      newPosition: Position,
      newIsMaximized: boolean,
      newIsMinimized: boolean,
      lastWindowedPosition: {
        x: number;
        y: number;
        width: number;
        height: number;
      }
    ) => {
      setModals((prevModals) => {
        const updatedModals = prevModals.map((m) => {
          if (m.id === updatedId) {
            const newActive = newIsMinimized ? false : m.active;

            return {
              ...m,
              ...newPosition,
              isMaximized: newIsMaximized,
              isMinimized: newIsMinimized,
              active: newActive,
              savedPosition: lastWindowedPosition,
            };
          }
          return m;
        });
        syncModalsToLocalStorage(updatedModals);
        return updatedModals;
      });
    },
    [syncModalsToLocalStorage]
  );

  useEffect(() => {
    if (id && title) {
      openModal(id, title);
    }
  }, [id, title, openModal, activationKey]);

  const minimizedModals = modals.filter((m) => m.isMinimized);

  useEffect(() => {
    set_global_modals(modals);
  }, [modals]);

  // Render all open modals AND the tray
  return (
    <>
      {modals.map((modal) => {
        // Get the specific data slice and create the bound updater function
        const modalData = appData[modal.id] || {};
        const setModalData = (newData: any) =>
          updateModalData(modal.id, newData);

        return (
          <Modal
            key={modal.id}
            id={modal.id}
            title={modal.title}
            active={modal.active}
            zIndex={modal.zIndex}
            onClose={() => closeModal(modal.id)}
            onUpdate={(
              updatedId,
              pos,
              isMaximized,
              isMinimized,
              lastWindowedPosition
            ) =>
              updateModalPosition(
                updatedId,
                pos,
                isMaximized,
                isMinimized,
                lastWindowedPosition
              )
            }
            x={modal.x}
            y={modal.y}
            width={modal.width}
            height={modal.height}
            title_active_bg_color={title_active_bg_color}
            title_active_text_color={title_active_text_color}
            title_inactive_bg_color={title_inactive_bg_color}
            title_inactive_text_color={title_inactive_text_color}
            title_position={title_position}
            isMaximizedInitial={modal.isMaximized}
            isMinimizedInitial={modal.isMinimized}
            savedX={modal.savedPosition.x}
            savedY={modal.savedPosition.y}
            savedWidth={modal.savedPosition.width}
            savedHeight={modal.savedPosition.height}
            onClick={() => {
              const maxZ = modals.reduce(
                (max, m) => Math.max(max, m.zIndex),
                0
              );
              if (modal.zIndex !== maxZ || modal.isMinimized) {
                activateModal(modal.id);
              }
            }}
          >
            {getContent(modal.id, modalData, setModalData)}
          </Modal>
        );
      })}

      <ModalTray
        minimizedModals={minimizedModals}
        activateModal={activateModal}
      />
    </>
  );
};

export default StackableDialogs;
