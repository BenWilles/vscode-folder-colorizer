import * as vscode from "vscode";

/**
 * Generates a colored circle SVG icon dynamically as a data URI.
 * No pre-generated SVG files needed.
 */
export function getIconPath(_context: vscode.ExtensionContext, color: string) {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="8" fill="${color}"/></svg>`;
  const base64 = Buffer.from(svgContent).toString("base64");
  return vscode.Uri.parse(`data:image/svg+xml;base64,${base64}`);
}
