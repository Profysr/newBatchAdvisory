"use client";
import Link from "next/link";
import React, { useEffect, forwardRef } from "react";

export const InputField = forwardRef(
  (
    {
      id,
      name,
      title,
      type = "text",
      placeholder = "",
      className = "",
      value,
      onChange,
      onKeyDown,
      ...props
    },
    ref
  ) => (
    <div className="flex flex-col gap-2" aria-label="Custom Input Component">
      {title && (
        <label className="text-sm" htmlFor={id}>
          {title}
        </label>
      )}
      <input
        className={`${className} w-full px-2 py-3 rounded-md border-2 border-gray-300 focus:border-gray-600 placeholder:opacity-75 placeholder:text-xs text-sm focus:outline-none`}
        required
        placeholder={placeholder}
        id={id}
        name={name}
        type={type}
        value={value} // Controlled input
        onChange={onChange} // Conditionally handle onChange if provided
        onKeyDown={onKeyDown} // Handle onKeyDown
        ref={ref} // Allow ref to be passed for uncontrolled input
        autoComplete="off"
        {...props} // Pass down additional props if needed
      />
    </div>
  )
);

InputField.displayName = "InputField";

export const SearchInput = ({ placeholder }) => {
  return (
    <div
      className="flex gap-4 items-center bg-slate-800 text-gray-400 py-2.5 px-3 rounded-lg w-full max-w-96"
      aria-label="Search Input in CustomInput Component"
    >
      <div className="w-4 h-4 flex justify-center items-center">
        {/* <BsSearch size={16} /> */}
        oo
      </div>
      <input
        type="text"
        id="seachInput"
        name="seachInput"
        className="block w-full text-sm focus:outline-none bg-transparent"
        placeholder={placeholder}
      />
    </div>
  );
};

export const DynamicTextarea = ({
  id,
  name,
  title,
  className,
  placeholder,
  rows,
  value,
  onChange,
}) => {
  // Ref to the textarea element
  const textareaRef = useRef(null);

  // Effect to adjust the height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to scrollHeight
    }
  }, [value]); // Run effect every time content changes

  return (
    <div className="flex flex-col gap-2" aria-label="Custom Input Component">
      <label htmlFor={id}>{title}</label>
      <textarea
        id={id}
        name={name}
        ref={textareaRef}
        value={value}
        onChange={onChange}
        rows={rows} // Initial rows
        placeholder={placeholder}
        className={`${className} w-full px-2 py-3 rounded-md border-2 border-black-100 placeholder:opacity-75 placeholder:text-xs text-sm focus:outline-none`}
      />
    </div>
  );
};

export const Dropdown = ({ items, onSelect, noItemsText, manageLink }) => {
  return (
    <div className="absolute mt-1 max-h-40 overflow-y-auto bg-gray-900 text-white rounded-sm shadow-lg w-48 z-50">
      <ul className="py-1">
        {items?.length > 0 ? (
          items.map((item, idx) => (
            <li
              key={item?.id || idx} // Ensure a unique key for each item
              onClick={() => onSelect(item?.id)} // Trigger onSelect with item id
              className="px-4 py-2 hover:bg-white/5 cursor-pointer text-sm"
            >
              {item?.name}
            </li>
          ))
        ) : (
          <li className="px-4 py-2">
            {noItemsText}.{" "}
            {manageLink && (
              <Link href={manageLink} className="underline font-medium">
                Manage Here
              </Link>
            )}
          </li>
        )}
      </ul>
    </div>
  );
};
