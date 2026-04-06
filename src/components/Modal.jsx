export default function Modal({ onClose, onOverlayClick, extraClass, children, t }) {
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onOverlayClick}
    >
      <div
        className={`modal-box${extraClass ? ` ${extraClass}` : ''}`}
        onClick={onOverlayClick ? (e) => e.stopPropagation() : undefined}
      >
        <button className="modal-close" onClick={onClose} aria-label={t('cfClose')}>×</button>
        {children}
      </div>
    </div>
  )
}
