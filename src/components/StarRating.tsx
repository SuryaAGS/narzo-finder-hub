import { Star } from "lucide-react";

type Props = {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
  className?: string;
};

export function StarRating({ value, onChange, size = 24, readOnly, className }: Props) {
  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className={`rounded-full p-0.5 transition-transform ${
              readOnly ? "cursor-default" : "hover:scale-110 active:scale-95"
            }`}
          >
            <Star
              width={size}
              height={size}
              className={
                filled
                  ? "fill-warning text-warning"
                  : "fill-transparent text-muted-foreground"
              }
              strokeWidth={1.8}
            />
          </button>
        );
      })}
    </div>
  );
}
