import React from 'react';
interface ResourceBarProps {
    label: string;
    used: number;
    total: number;
    width?: number;
    showBytes?: boolean;
    formatFn?: (bytes: number) => string;
}
export declare function ResourceBar({ label, used, total, width, showBytes, formatFn }: ResourceBarProps): React.ReactElement;
interface MiniBarProps {
    percent: number;
    width?: number;
}
export declare function MiniBar({ percent, width }: MiniBarProps): React.ReactElement;
export {};
