export interface CommandResult {
    stdout: string;
    stderr: string;
    success: boolean;
}
export declare function runCommand(cmd: string): Promise<CommandResult>;
export declare function runCommandSync(cmd: string): string;
export declare function parseBytes(str: string): number;
export declare function formatBytes(bytes: number, decimals?: number): string;
export declare function formatPercent(value: number, total: number): string;
export declare function colorByPercent(percent: number): 'green' | 'yellow' | 'red';
