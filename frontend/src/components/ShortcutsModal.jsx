import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// ShortcutsModal — Interactive hotkey command guide
// ─────────────────────────────────────────────────────────────────────────────

const SHORTCUTS = [
  { key: 'Space', desc: 'Play / Pause simulation animation' },
  { key: 'R', desc: 'Reset simulation & restore all nodes' },
  { key: 'F', desc: 'Switch to Flood simulation mode' },
  { key: 'C', desc: 'Switch to Cyclone simulation mode' },
  { key: '1 - 4', desc: 'Set speed (0.5x, 1x, 2x, 3x)' },
  { key: 'S', desc: 'Open Situation Report (SITREP)' },
  { key: 'Esc', desc: 'Close open dialogs & selection popups' },
  { key: '?', desc: 'Toggle this keyboard shortcuts menu' },
];

export function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-backdrop" onClick={onClose}>
        <motion.div
          className="shortcuts-modal"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
        >
          <div className="sitrep-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>⌨</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                  COMMAND KEYBOARD SHORTCUTS
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  QUICK DISPATCH OPERATIONS
                </div>
              </div>
            </div>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="shortcuts-list">
            {SHORTCUTS.map((s) => (
              <div key={s.key} className="shortcut-row">
                <span className="shortcut-desc">{s.desc}</span>
                <kbd className="shortcut-kbd">{s.key}</kbd>
              </div>
            ))}
          </div>

          <div style={{ padding: '12px 18px', background: 'var(--surface-alt)', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
            <button className="ops-btn primary" onClick={onClose}>
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ShortcutsModal;
