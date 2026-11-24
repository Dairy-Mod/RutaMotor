import { useEffect, useRef } from "react";
import { Icon } from "./Icons";
export default function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}) {
  const ref = useRef();
  const callback = useRef(onClose);
  callback.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    const close = (e) => {
      e.preventDefault();
      callback.current();
    };
    dialog.addEventListener("cancel", close);
    return () => {
      dialog.removeEventListener("cancel", close);
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={"modal " + (wide ? "wide" : "")}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <header>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          className="icon-button"
          type="button"
          aria-label="Cerrar ventana"
          onClick={onClose}
        >
          <Icon name="x" />
        </button>
      </header>
      {children}
    </dialog>
  );
}
