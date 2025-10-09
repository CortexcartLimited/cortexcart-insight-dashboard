'use client';

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, children }) {
    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
            onClick={onClose} // Optional: close modal by clicking on the background
        >
            <div 
                className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full"
                onClick={e => e.stopPropagation()} // Prevent modal from closing when clicking inside it
            >
                <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
                <div className="text-gray-600 mb-6">
                    {children}
                </div>
                <div className="flex justify-end gap-4">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="px-4 py-2 font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Confirm Delete
                    </button>
                </div>
            </div>
        </div>
    );
}