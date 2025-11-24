#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { Dashboard } from './components/Dashboard.js';
import { StatusView } from './components/StatusView.js';
import { CleanupView } from './components/CleanupView.js';
import { ContainersView } from './components/ContainersView.js';
const program = new Command();
program
    .name('dm')
    .description('macOS → Colima VM → Docker resource hierarchy monitor')
    .version('0.0.0');
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
// Default to status if no command specified
program
    .action(() => {
    render(React.createElement(StatusView));
});
program.parse();
