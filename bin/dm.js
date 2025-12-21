#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { Dashboard } from './components/Dashboard.js';
import { StatusView } from './components/StatusView.js';
import { CleanupView } from './components/CleanupView.js';
import { ContainersView } from './components/ContainersView.js';
import { ColimaView } from './components/ColimaView.js';
import { SculptorView } from './components/SculptorView.js';
const program = new Command();
program
    .name('dm')
    .description('macOS → Colima VM → Docker resource hierarchy monitor')
    .version('0.0.1');
program
    .command('dashboard')
    .alias('d')
    .description('Interactive resource dashboard (auto-refreshing)')
    .action(() => {
    render(React.createElement(Dashboard));
});
program
    .command('status')
    .alias('s')
    .description('Quick resource status (non-interactive)')
    .action(() => {
    render(React.createElement(StatusView));
});
program
    .command('containers')
    .alias('c')
    .description('View and manage containers')
    .action(() => {
    render(React.createElement(ContainersView));
});
program
    .command('clean')
    .alias('prune')
    .description('Interactive cleanup wizard')
    .option('-y, --yes', 'Auto-confirm default selections')
    .action((options) => {
    render(React.createElement(CleanupView, { autoConfirm: options.yes }));
});
program
    .command('colima')
    .description('View Colima VM metrics and disk usage')
    .action(() => {
    render(React.createElement(ColimaView));
});
program
    .command('sculptor')
    .description('Analyze and clean up Sculptor snapshot images')
    .option('--older-than <days>', 'Show images older than N days', '14')
    .option('--clean', 'Auto-clean old Sculptor images')
    .action((options) => {
    const olderThanDays = parseInt(options.olderThan) || 14;
    render(React.createElement(SculptorView, {
        olderThanDays,
        autoClean: options.clean,
    }));
});
// Default to status if no command specified
program
    .action(() => {
    render(React.createElement(StatusView));
});
program.parse();
