import * as vscode from "vscode";
import {
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

      const bestFitColor = matchingPaths.find((item) => item.color)?.color;

      const newColor = bestFitColor
        ? new vscode.ThemeColor(bestFitColor)
        : undefined;

      if (newColor) {
        return new vscode.FileDecoration(undefined, undefined, newColor);
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
    "vs-rainbow-folders.setColor",
    (_, context2: vscode.Uri[]) => {
      const colorOptions = getColorOptions(context);
      const pathColors = getPathColors();
      
      // Get current color of the first selected folder
      const firstFolderPath = context2[0] ? userPathLessPath(context2[0].fsPath) : "";
      const currentColorEntry = pathColors.find(item => item.folderPath === firstFolderPath);
      const currentColorId = currentColorEntry?.color;
      
      // Find the color name from colorOptions
      let currentColorName = "";
      if (currentColorId) {
        const colorOption = colorOptions.find(opt => opt.description === currentColorId);
        currentColorName = colorOption?.label || currentColorId.replace("foldercolorizer.color_", "#");
      }
      
      // Add "Clear color" option at the top with current color info
      const clearOption: vscode.QuickPickItem = {
        label: "$(close) Clear color",
        description: "CLEAR_COLOR",
        detail: currentColorName ? `Current: ${currentColorName}` : "No color set",
      };
      
      const options = [clearOption, ...colorOptions];

      vscode.window
        .showQuickPick(options, {
          placeHolder: "Choose a color or clear existing color: ",
        })
        .then((selected) => {
          if (!selected) {
            return;
          }

          if (selected.description === "CLEAR_COLOR") {
            // Clear the color
            changeConfig(
              {
                folderPath: context2.map((item) => userPathLessPath(item.fsPath)),
              },
              true
            );
          } else {
            // Set the color
            changeConfig({
              folderPath: context2.map((item) => userPathLessPath(item.fsPath)),
              color: selected.description,
            });
          }
        });
    }
  );

  context.subscriptions.push(setColorDisposable);
};

export function activate(context: vscode.ExtensionContext) {
  const workspace = vscode?.workspace?.workspaceFolders?.[0];

  if (!workspace) {
    return;
  }

  registerContextMenu(context);
  colorize();

  vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("vs-rainbow-folders.pathColors")) {
      colorize();
    }
  });
}

export function deactivate() {}
