import { Loader2, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export const LoadingSpinner = ({ 
  size = "md", 
  className, 
  text 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className={cn(
        "gradient-primary rounded-full flex items-center justify-center animate-pulse mb-4",
        size === "sm" && "w-8 h-8",
        size === "md" && "w-16 h-16", 
        size === "lg" && "w-24 h-24"
      )}>
        <Loader2 className={cn("text-white animate-spin", sizeClasses[size])} />
      </div>
      {text && (
        <p className="text-muted-foreground text-sm animate-pulse">{text}</p>
      )}
    </div>
  );
};

interface FullPageLoadingProps {
  text?: string;
}

export const FullPageLoading = ({ text = "Loading..." }: FullPageLoadingProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
};

interface SmartLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export const SmartLoading = ({ 
  isLoading, 
  children, 
  loadingText, 
  className 
}: SmartLoadingProps) => {
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <LoadingSpinner text={loadingText} />
      </div>
    );
  }

  return <>{children}</>;
};