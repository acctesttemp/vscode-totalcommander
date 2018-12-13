'use strict';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as child from 'child_process';

// tslint:disable-next-line:no-var-requires
const pkg = require('../../package.json');

const isCompatiblePlatform = process.platform === 'win32';

export function activate(context: vscode.ExtensionContext) {
	if (!isCompatiblePlatform) {
		vscode.window.showInformationMessage(messages.WindowsOnly, messages.ShowInfo).then(btn => {
			if (btn === messages.ShowInfo) {
				child.exec(`start ${messages.ReadmeUrl}`).unref();
			}
		});
	}

	context.subscriptions.push(vscode.commands.registerCommand('vscode.totalcommander', (uri?: vscode.Uri) => {
		// tslint:disable-next-line:curly
		if (!isCompatiblePlatform || !checkConfiguration()) return;

		if (uri && uri.fsPath && uri.scheme !== "untitled") {
			runTotalCommander(uri.fsPath);
		} else if (vscode.window.activeTextEditor && !vscode.window.activeTextEditor.document.isUntitled) {
			runTotalCommander(vscode.window.activeTextEditor.document.uri.fsPath);
		} else if (vscode.workspace.rootPath) {
			runTotalCommander(vscode.workspace.rootPath);
		}
	}));
}

const runTotalCommander = (path: string) => {
	const config = getConfig();
	const quote = (p: string) => p.includes(" ") ? `"${p}"` : p;
	const args: string[] = [];

	// if (config.reuseInstance) {
	// 	args.push("/O");
	// }

	// if (config.panel === "left") {
	// 	args.push(`/L=${quote(path)}`);
	// } else {
	// 	args.push(`/R=${quote(path)}`);
	// }

	// if (config.createNewTab) {
	// 	args.push("/T");
	// }
	args.push("/OPEN");
	args.push(`"${quote(path)}"`);
	child.exec(`${quote(config.path)} ${args.join(' ')}`, (error: Error, _stdout: string, stderr: string) => {
		if (error || stderr) {
			const outputChannel = vscode.window.createOutputChannel(pkg.displayName);

			if (error) {
				outputChannel.appendLine(error.message);
			}

			if (stderr) {
				outputChannel.appendLine(stderr);
			}

			outputChannel.show();
		}
	});
};

const checkConfiguration = () => {
	const config = getConfig();

	if (!config.path) {
		const path = process.env.COMMANDER_EXE;
		if (path) {
			const cfg = vscode.workspace.getConfiguration("TotalCommander");
			cfg.update("path", path, true);
			vscode.window.showInformationMessage(messages.TotalCommanderPathDetected + path, messages.OpenSettings).then(openSettingsCallback);
			return true;
		}

		vscode.window.showInformationMessage(messages.TotalCommanderPathNotConfigured, messages.OpenSettings).then(openSettingsCallback);
		return false;
	}

	if (!fs.existsSync(config.path)) {
		vscode.window.showInformationMessage(messages.TotalCommanderPathInvalid, messages.OpenSettings).then(openSettingsCallback);
		return false;
	}

	return true;
};

const getConfig = () => vscode.workspace.getConfiguration("TotalCommander") as any as IConfig;

const openSettingsCallback = (btn) => {
	if (btn === messages.OpenSettings) {
		vscode.commands.executeCommand("workbench.action.openGlobalSettings");
	}
};
interface IConfig {
	path: string;
	reuseInstance: boolean;
	createNewTab: boolean;
	panel: "left" | "right";
}

const messages = {
	WindowsOnly: "This extension works only on Windows, sorry",
	ShowInfo: "Show Info",
	ReadmeUrl: "https://github.com/ipatalas/vscode-totalcommander/blob/master/README.md",
	TotalCommanderPathNotConfigured: "Total Commander path is not configured. Set proper path in TotalCommander.path setting",
	TotalCommanderPathInvalid: "Total Commander path is invalid, please correct it.",
	TotalCommanderPathDetected: "Total Commander path was auto-detected to ",
	OpenSettings: "Open Settings"
};
