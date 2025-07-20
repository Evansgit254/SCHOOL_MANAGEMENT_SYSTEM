import React from "react";

const InputField = React.forwardRef<HTMLInputElement, any>(
  ({ label, error, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium">{label}</label>}
      <input ref={ref} {...props} className="border rounded p-2" />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
  );

export default InputField;