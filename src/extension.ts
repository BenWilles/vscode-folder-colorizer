import * as vscode from "vscode";
import {
  checkIfItFirstTimeRun,
  getColorOptions,
  getPathColors,
  getUpdatedPathColors,
  updateConfigPathColors,
  userPathLessPath,
} from "./utils";
import { PathsColors } from "./types";

let colorDisposable: vscode.Disposable;

const colorize = () => {
  if (colorDisposable) {
    colorDisposable.dispose();
  }

  let pathColors = getPathColors();

  let provider: vscode.FileDecorationProvider = {
    provideFileDecoration: (
      uri: vscode.Uri,
      token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.FileDecoration> => {
      const projectPath = userPathLessPath(uri.fsPath);

      const matchingPaths = pathColors
        .filter((item) => projectPath.includes(item.folderPath))
        .sort((a, b) => b.folderPath.length - a.folderPath.length);

      const bestFit = matchingPaths[0];
      const bestFitColor = matchingPaths.find((item) => item.color)?.color;
      const bestFitBadge = matchingPaths.find((item) => item.badge)?.badge;

      const newColor = bestFitColor
        ? new vscode.ThemeColor(bestFitColor)
        : undefined;

      const newBadge = bestFitBadge ? bestFitBadge : undefined;

      if (bestFit) {
        return new vscode.FileDecoration(newBadge, "", newColor);
      }

      return new vscode.FileDecoration();
    },
  };

  colorDisposable = vscode.window.registerFileDecorationProvider(provider);
};

const changeConfig = (pathColor: Partial<PathsColors>, toRemove = false) => {
  const pathColors = getUpdatedPathColors(pathColor, toRemove);
  updateConfigPathColors(pathColors);
  colorize();
};

const registerContextMenu = (context: vscode.ExtensionContext) => {
  let setColorDisposable = vscode.commands.registerCommand(
    "folder-color.setColor",
    (_, context2: vscode.Uri[]) => {
      const options = getColorOptions(context);

      vscode.window
        .showQuickPick(options, {
          placeHolder: "Choose a color: ",
        })
        .then((selected) => {
          if (!selected) {
            return;
          }

          changeConfig({
            folderPath: context2.map((item) => userPathLessPath(item.fsPath)),
            color: selected.description,
          });
        });
    }
  );

  let clearColorizerDisposable = vscode.commands.registerCommand(
    "folder-color.clearColorizer",
    function (_, context2: vscode.Uri[]) {
      vscode.window;

      changeConfig(
        {
          folderPath: context2.map((item) => userPathLessPath(item.fsPath)),
        },
        true
      );
    }
  );

  context.subscriptions.push(setColorDisposable);
  context.subscriptions.push(clearColorizerDisposable);
};

export function activate(context: vscode.ExtensionContext) {
  checkIfItFirstTimeRun(context);
  const workspace = vscode?.workspace?.workspaceFolders?.[0];

  if (!workspace) {
    return;
  }

  registerContextMenu(context);
  colorize();

  vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("folder-color.pathColors")) {
      colorize();
    }
  });
}

export function deactivate() {}
