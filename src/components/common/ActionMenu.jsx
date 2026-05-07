// src/components/common/ActionMenu.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { MoreVertical } from 'lucide-react';

/**
 * A reusable three-dot action menu dropdown for table rows.
 * Uses a portal + fixed positioning so it is never clipped by overflow containers.
 */
const ActionMenu = ({ actions = [] }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const visibleActions = actions.filter(Boolean);

  // Calculate position from the trigger button
  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuW = 170;
    const menuH = (actions.filter(Boolean).length * 36) + 12; // rough estimate

    let top = rect.bottom + 4;
    let left = rect.right - menuW;

    // If dropdown would go below viewport, open upward
    if (top + menuH > window.innerHeight) {
      top = rect.top - menuH - 4;
    }
    // If dropdown would go off-screen left, push right
    if (left < 8) left = 8;

    setPos({ top, left });
  }, [actions]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Close on scroll (any scrollable ancestor)
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, [open]);

  if (visibleActions.length === 0) return null;

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!open) updatePosition();
    setOpen(v => !v);
  };

  const dropdown = open
    ? ReactDOM.createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] min-w-[160px] bg-white rounded-xl shadow-lg shadow-gray-200/80 border border-gray-100 py-1.5"
          style={{ top: pos.top, left: pos.left }}
        >
          {visibleActions.map((action, i) => {
            const Icon = action.icon;
            const colorCls = action.danger
              ? 'text-red-600 hover:bg-red-50'
              : (action.color || 'text-gray-700 hover:bg-gray-50');
            return (
              <button
                key={action.label || i}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  action.onClick?.();
                }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] font-medium whitespace-nowrap transition-colors ${colorCls}`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none"
        title="Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {dropdown}
    </>
  );
};

export default ActionMenu;