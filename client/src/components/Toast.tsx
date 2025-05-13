import React, { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const toastVariants = cva(
  "bg-card shadow-md rounded-lg p-3 flex items-center space-x-3 max-w-md transform transition-all duration-300 w-full",
  {
    variants: {
      variant: {
        default: "",
        success: "",
        error: "",
        info: "",
      },
      visible: {
        true: "translate-x-0 opacity-100",
        false: "translate-x-full opacity-0",
      },
    },
    defaultVariants: {
      variant: "default",
      visible: true,
    },
  }
);

export interface ToastProps extends VariantProps<typeof toastVariants> {
  title: string;
  description?: string;
  onClose?: () => void;
  duration?: number;
  className?: string;
}

const Toast: React.FC<ToastProps> = ({
  title,
  description,
  variant = "default",
  visible = true,
  onClose,
  duration = 5000,
  className,
}) => {
  useEffect(() => {
    if (duration !== Infinity) {
      const timer = setTimeout(() => {
        onClose && onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const renderIcon = () => {
    switch (variant) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "info":
        return <Info className="h-5 w-5 text-primary" />;
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div
      className={cn(toastVariants({ variant, visible, className }))}
      role="alert"
    >
      {renderIcon()}
      <div className="flex-1">
        <h4 className="font-medium text-sm">{title}</h4>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground"
        onClick={onClose}
        aria-label="Close toast"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export interface ToastContainerProps {
  children: React.ReactNode;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  className?: string;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  children,
  position = "bottom-right",
  className,
}) => {
  const positionClasses = {
    "top-right": "fixed top-4 right-4",
    "top-left": "fixed top-4 left-4",
    "bottom-right": "fixed bottom-4 right-4",
    "bottom-left": "fixed bottom-4 left-4",
  };

  return (
    <div
      className={cn(
        "flex flex-col space-y-2 z-50",
        positionClasses[position],
        className
      )}
    >
      {children}
    </div>
  );
};

export { Toast, ToastContainer };
