import React, { forwardRef, useState, useEffect } from 'react';
import { clsx } from 'clsx';

/**
 * Input component with label, error, hint, and icon support
 */
export const Input = forwardRef(function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  clearable = false,
  className = '',
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  required = false,
  readOnly = false,
  autoComplete,
  autoFocus = false,
  'aria-describedby': ariaDescribedBy,
  ...props
}, ref) {
  const [focused, setFocused] = useState(false);
  const [showClear, setShowClear] = useState(false);
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const describedBy = clsx(errorId, hintId, ariaDescribedBy) || undefined;

  useEffect(() => {
    setShowClear(clearable && value && focused && !disabled && !readOnly);
  }, [clearable, value, focused, disabled, readOnly]);

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onChange?.({ target: { name: props.name, value: '' } });
  };

  const handleFocus = (e) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    onBlur?.(e);
  };

  const wrapperClasses = clsx('input-wrapper', {
    'input-wrapper-focused': focused,
    'input-wrapper-error': !!error,
    'input-wrapper-disabled': disabled,
  }, className);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="required" aria-hidden="true">*</span>}
        </label>
      )}
      <div className={wrapperClasses}>
        {leftIcon && (
          <span className="input-icon" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={clsx('form-input', {
            'has-left-icon': !!leftIcon,
            'has-right-icon': !!rightIcon || (clearable && showClear),
          })}
          {...props}
        />
        {(clearable && showClear) && (
          <button
            type="button"
            className="input-action input-clear"
            onClick={handleClear}
            aria-label="Clear input"
            tabIndex={-1}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        {rightIcon && !clearable && (
          <span className="input-action" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} className="form-error" role="alert">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="form-hint">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

/**
 * Textarea component
 */
export const Textarea = forwardRef(function Textarea({
  label,
  error,
  hint,
  className = '',
  id,
  rows = 4,
  ...props
}, ref) {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${textareaId}-error` : undefined;
  const hintId = hint ? `${textareaId}-hint` : undefined;
  const describedBy = clsx(errorId, hintId) || undefined;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={textareaId} className="form-label">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={clsx('form-textarea', className)}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        {...props}
      />
      {error && (
        <p id={errorId} className="form-error" role="alert">{error}</p>
      )}
      {hint && !error && (
        <p id={hintId} className="form-hint">{hint}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

/**
 * Select component
 */
export const Select = forwardRef(function Select({
  label,
  error,
  hint,
  options = [],
  placeholder,
  className = '',
  id,
  multiple = false,
  disabled = false,
  required = false,
  value,
  onChange,
  onBlur,
  onFocus,
  ...props
}, ref) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${selectId}-error` : undefined;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const describedBy = clsx(errorId, hintId) || undefined;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
          {required && <span className="required" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={clsx('form-select', className)}
        multiple={multiple}
        disabled={disabled}
        required={required}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="form-error" role="alert">{error}</p>
      )}
      {hint && !error && (
        <p id={hintId} className="form-hint">{hint}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

/**
 * Checkbox component
 */
export const Checkbox = forwardRef(function Checkbox({
  label,
  description,
  className = '',
  id,
  checked,
  onChange,
  disabled = false,
  required = false,
  indeterminate = false,
  ...props
}, ref) {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={clsx('form-group', className)}>
      <label className="form-switch" htmlFor={checkboxId}>
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className="form-switch-input"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-checked={indeterminate ? 'mixed' : checked}
          {...props}
        />
        <span className="form-switch-track" aria-hidden="true" />
        {(label || description) && (
          <span className="form-switch-label">
            {label && <span className="form-switch-title">{label}</span>}
            {description && <span className="form-switch-desc">{description}</span>}
          </span>
        )}
      </label>
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

/**
 * Radio Group component
 */
export const RadioGroup = forwardRef(function RadioGroup({
  label,
  error,
  hint,
  options = [],
  className = '',
  id,
  value,
  onChange,
  disabled = false,
  required = false,
  inline = false,
  ...props
}, ref) {
  const groupId = id || `radiogroup-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${groupId}-error` : undefined;
  const hintId = hint ? `${groupId}-hint` : undefined;
  const describedBy = clsx(errorId, hintId) || undefined;

  return (
    <div className={clsx('form-group', className)}>
      {label && (
        <fieldset>
          <legend className="form-label">{label}</legend>
          <div className={clsx('radio-group', { 'radio-group-inline': inline })}>
            {options.map((option) => (
              <label key={option.value} className="radio-item">
                <input
                  type="radio"
                  name={groupId}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange?.(e.target.value)}
                  disabled={disabled || option.disabled}
                  required={required}
                  className="form-radio"
                />
                <span className="radio-item-label">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {error && (
        <p id={errorId} className="form-error" role="alert">{error}</p>
      )}
      {hint && !error && (
        <p id={hintId} className="form-hint">{hint}</p>
      )}
    </div>
  );
});

RadioGroup.displayName = 'RadioGroup';

export default Input;