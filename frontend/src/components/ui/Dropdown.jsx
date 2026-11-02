import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Dropdown Menu component
 */
export function Dropdown({
  trigger,
  items = [],
  align = 'right',
  className = '',
  closeOnSelect = true,
  ...props
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const toggle = () => setOpen(!open);
  const close = () => setOpen(false);

  const handleItemClick = (item, onClose = closeOnSelect) => {
    item.onClick?.();
    if (onClose) close();
  };

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (
        triggerRef.current?.contains(e.target) ||
        menuRef.current?.contains(e.target)
      ) {
        return;
      }
      close();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  const menuContent = open ? createPortal(
    <div
      ref={menuRef}
      className={clsx(
        'dropdown-menu',
        align === 'right' ? 'dropdown-menu-right' : 'dropdown-menu-left',
        className
      )}
      role="menu"
      tabIndex={-1}
    >
      {items.map((item, index) => {
        if (item.type === 'divider') {
          return <div key={`divider-${index}`} className="dropdown-divider" role="separator" />;
        }
        if (item.type === 'header') {
          return (
            <div key={`header-${index}`} className="dropdown-header" role="heading" aria-level="2">
              {item.label}
            </div>
          );
        }
        return (
          <button
            key={item.key || index}
            className={clsx(
              'dropdown-item',
              item.variant === 'danger' && 'dropdown-item-danger',
              item.disabled && 'dropdown-item-disabled'
            )}
            role="menuitem"
            tabIndex={-1}
            disabled={item.disabled}
            onClick={() => handleItemClick(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleItemClick(item);
              }
            }}
          >
            {item.icon && <span className="dropdown-item-icon" aria-hidden="true">{item.icon}</span>}
            <span className="dropdown-item-label">{item.label}</span>
            {item.shortcut && <span className="dropdown-item-shortcut">{item.shortcut}</span>}
            {item.checked && <Check size={14} className="dropdown-item-check" aria-hidden="true" />}
          </button>
        );
      })}
    </div>,
    document.body
  ) : null;

  return (
    <div className={clsx('dropdown relative inline-block', props.className)} {...props}>
      <span ref={triggerRef} className="dropdown-trigger">
        {React.cloneElement(trigger, {
          onClick: (e) => {
            e.stopPropagation();
            toggle();
            trigger.props.onClick?.(e);
          },
          'aria-haspopup': 'menu',
          'aria-expanded': open,
        })}
      </span>
      {menuContent}
    </div>
  );
}

/**
 * Select Dropdown (for form selects with search)
 */
export function SelectDropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  searchable = false,
  className = '',
  disabled = false,
  multiple = false,
  clearable = false,
  ...props
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  const handleSelect = (option) => {
    if (multiple) {
      const newValue = value.includes(option.value)
        ? value.filter((v) => v !== option.value)
        : [...value, option.value];
      onChange?.(newValue);
    } else {
      onChange?.(option.value);
      setOpen(false);
    }
    if (!multiple) setSearch('');
  };

  const isSelected = (optionValue) => {
    return multiple ? value?.includes(optionValue) : value === optionValue;
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (
        triggerRef.current?.contains(e.target) ||
        menuRef.current?.contains(e.target)
      ) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open, searchable]);

  const displayValue = multiple
    ? value?.map((v) => options.find((o) => o.value === v)?.label).join(', ') || placeholder
    : options.find((o) => o.value === value)?.label || placeholder;

  return (
    <div className={clsx('select-dropdown relative inline-block w-full', className)} {...props}>
      <button
        ref={triggerRef}
        type="button"
        className={clsx(
          'form-select w-full',
          open && 'border-focus shadow-focus',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={clsx('flex-1 text-left', !value && 'text-muted')}>
          {displayValue}
        </span>
        <ChevronDown
          size={16}
          className={clsx('transition-transform', open && 'rotate-180')}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="dropdown-menu dropdown-menu-right w-full max-h-60 overflow-auto"
          role="listbox"
          tabIndex={-1}
        >
          {searchable && (
            <div className="p-2 border-b border-primary">
              <input
                ref={inputRef}
                type="text"
                className="form-input form-input-sm w-full"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          {filteredOptions.length === 0 ? (
            <div className="dropdown-item-disabled p-3 text-center text-muted">
              No options found
            </div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                className={clsx(
                  'dropdown-item w-full',
                  isSelected(option.value) && 'bg-primary-bg text-primary',
                  option.disabled && 'dropdown-item-disabled'
                )}
                role="option"
                aria-selected={isSelected(option.value)}
                disabled={option.disabled}
                onClick={() => handleSelect(option)}
                onMouseDown={(e) => e.preventDefault()}
              >
                {multiple && (
                  <span className="dropdown-item-check">
                    {isSelected(option.value) ? <Check size={14} /> : null}
                  </span>
                )}
                <span className="dropdown-item-label flex-1">{option.label}</span>
              </button>
            ))
          )}
          {clearable && value && (
            <button
              className="dropdown-item dropdown-item-danger w-full"
              onClick={() => {
                onChange(multiple ? [] : null);
                setOpen(false);
              }}
            >
              <span className="dropdown-item-label">Clear selection</span>
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

export default Dropdown;