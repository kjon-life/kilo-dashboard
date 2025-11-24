import React from 'react';
interface HeaderProps {
    hostname: string;
    chip: string;
    uptime: string;
    colimaRunning: boolean;
    dockerRunning: boolean;
}
export declare function Header({ hostname, chip, uptime, colimaRunning, dockerRunning }: HeaderProps): React.ReactElement;
export {};
