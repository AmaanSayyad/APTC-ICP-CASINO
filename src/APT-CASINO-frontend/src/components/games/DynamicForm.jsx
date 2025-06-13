import React, { useState, useEffect } from "react";
import Button from "../Button";

export default function DynamicForm({ config, onSubmit, disabled = false }) {
  const [formData, setFormData] = useState({});

  // Initialize form with default values
  useEffect(() => {
    const initialData = {};
    if (config?.fields) {
      config.fields.forEach((field) => {
        initialData[field.id] = field.defaultValue || "";
      });
    }
    setFormData(initialData);
  }, [config]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!config?.fields) {
    return (
      <div className="text-center py-8">
        <p className="text-white/50">Form configuration not available</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {config.fields.map((field) => (
        <div key={field.id}>
          <label className="block text-sm font-medium mb-2 text-white">
            {field.label}
          </label>

          {field.type === "number" && (
            <input
              type="number"
              name={field.id}
              value={formData[field.id] || ""}
              onChange={handleChange}
              min={field.min}
              max={field.max}
              step={field.step}
              disabled={disabled}
              className="w-full bg-[#250020] border border-white/20 rounded-lg px-3 py-2 text-white focus:border-blue-magic focus:outline-none disabled:opacity-50"
            />
          )}

          {field.type === "select" && (
            <select
              name={field.id}
              value={formData[field.id] || ""}
              onChange={handleChange}
              disabled={disabled}
              className="w-full bg-[#250020] border border-white/20 rounded-lg px-3 py-2 text-white focus:border-blue-magic focus:outline-none disabled:opacity-50"
            >
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {field.type === "checkbox" && (
            <label className="flex items-center">
              <input
                type="checkbox"
                name={field.id}
                checked={formData[field.id] || false}
                onChange={handleChange}
                disabled={disabled}
                className="mr-2"
              />
              <span className="text-sm text-white/70">{field.description}</span>
            </label>
          )}

          {field.description && field.type !== "checkbox" && (
            <p className="text-xs text-white/50 mt-1">{field.description}</p>
          )}
        </div>
      ))}

      <Button
        type="submit"
        disabled={disabled}
        className="w-full bg-gradient-to-r from-red-magic to-blue-magic"
      >
        {config.submitText || "Submit"}
      </Button>
    </form>
  );
}
