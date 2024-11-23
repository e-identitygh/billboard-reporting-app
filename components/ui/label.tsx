
// File: components/ui/label.js
import React from "react";

const Label: React.FC<{ children: React.ReactNode }> = ({ children, ...props }) => (
    <label className="block text-sm font-medium text-gray-700" {...props}>
        {children}
    </label>
);

export {Label};
