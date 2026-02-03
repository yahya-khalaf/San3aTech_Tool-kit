import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: number;
    text?: string;
}

export function LoadingSpinner({ size = 40, text = 'Loading...' }: LoadingSpinnerProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 p-8">
            <Loader2
                size={size}
                className="text-primary animate-spin"
                strokeWidth={2.5}
            />
            {text && (
                <p className="text-sm font-medium text-gray-500">{text}</p>
            )}
        </div>
    );
}
