'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const registration = registerDocumentSymbolProvider();
    context.subscriptions.push(registration);
}

function registerDocumentSymbolProvider(): vscode.Disposable {

    const _atxPattern = /^(#){1,6}\s+.+/;
    const _settext = /^\s*[-=]+\s*$/;
    const _codeBlockPattern = /^[\`]{3}(.+|)$/;
    const _commentStartPattern = /^<!---$/;
    const _commentEndPattern = /^--->$/;
    const _tagPattern = /^(Tag: )\w+$/;

    return vscode.languages.registerDocumentSymbolProvider('markdown', {

        provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.SymbolInformation[] {

            const result: vscode.SymbolInformation[] = [];
            const lineCount = Math.min(document.lineCount, 10000);

            let inCodeBlock = false;
            let inCommentBlock = false;

            let title = "";

            for (let line = 0; line < lineCount; line++) {
                const {text} = document.lineAt(line);

                if (_codeBlockPattern.test(text)) {
                    inCodeBlock = !inCodeBlock;
                }

                if (inCodeBlock) continue;

                if (inCommentBlock) {
                    if (_commentEndPattern.test(text)) {
                        inCommentBlock = false;
                        continue;
                    } else {
                        if (_tagPattern.test(text)) {
                            let tagText = text.replace("Tag: ", "") + " (" + title + ")";
                            result.push(new vscode.SymbolInformation(tagText, vscode.SymbolKind.File, '',
                                new vscode.Location(document.uri, new vscode.Position(line, 0))));
                        }
                    }
                } else if (_commentStartPattern.test(text)) {
                    inCommentBlock = true;
                    continue;
                }

                if (_atxPattern.test(text)) {
                    if(title === "") {
                        title = text;
                    }

                    // atx-style, 1-6 hash characters
                    result.push(new vscode.SymbolInformation(text, vscode.SymbolKind.File, '',
                        new vscode.Location(document.uri, new vscode.Position(line, 0))));
                } else if (line > 0 && _settext.test(text) && document.lineAt(line - 1).text) {
                    // Settext-style - 'underline'
                    result.push(new vscode.SymbolInformation(document.lineAt(line - 1).text, vscode.SymbolKind.File, '',
                        new vscode.Location(document.uri, new vscode.Position(line - 1, 0))));
                }
            }

            return result;
        }
    });
}
