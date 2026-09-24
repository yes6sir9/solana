import type { FC, ReactNode } from "react";

export const Modal: FC<{ open: boolean; onClose: () => void; title: string; children: ReactNode }> = ({
  open,
  onClose,
  title,
  children,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
