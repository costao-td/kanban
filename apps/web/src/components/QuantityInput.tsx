import { twMerge } from "tailwind-merge";

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  className?: string;
}

export default function QuantityInput({
  value,
  onChange,
  disabled = false,
  min = 1,
  max,
  className,
}: QuantityInputProps) {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - 1);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = max ? Math.min(max, value + 1) : value + 1;
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) {
      onChange(min);
      return;
    }
    val = Math.max(min, val);
    if (max) val = Math.min(max, val);
    onChange(val);
  };

  return (
    <div className={twMerge("flex items-center gap-1.5", className)}>
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={handleDecrement}
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border border-light-300 bg-white text-neutral-700 transition-colors hover:bg-light-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-300 dark:hover:bg-dark-600"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={handleInputChange}
        className="w-12 flex-shrink-0 rounded border border-light-300 bg-white px-2 py-0.5 text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none dark:border-dark-600 dark:bg-dark-700 dark:text-gray-100"
      />
      <button
        type="button"
        disabled={disabled || (max !== undefined && value >= max)}
        onClick={handleIncrement}
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border border-light-300 bg-white text-neutral-700 transition-colors hover:bg-light-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-300 dark:hover:bg-dark-600"
      >
        +
      </button>
    </div>
  );
}
