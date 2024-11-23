import React, { ReactNode, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, children }) => {
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                <button
                    className="absolute top-0 right-0 mt-4 mr-4 text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={onClose}
                >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6.225 4.811a1.5 1.5 0 012.121 0l3.481 3.481 3.481-3.481a1.5 1.5 0 012.121 2.121l-3.481 3.481 3.481 3.481a1.5 1.5 0 01-2.121 2.121l-3.481-3.481-3.481 3.481a1.5 1.5 0 01-2.121-2.121l3.481-3.481-3.481-3.481a1.5 1.5 0 010-2.121z" />
                    </svg>
                </button>
                {children}
            </div>
        </div>,
        document.body
    );
};

export const DialogContent: React.FC<{ children: ReactNode }> = ({ children }) => (
    <div className="dialog-content">{children}</div>
);

export const DialogClose: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <button onClick={onClose}>Close</button>
);