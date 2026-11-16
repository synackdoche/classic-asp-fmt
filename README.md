# classic-asp-fmt

A formatter for Classic ASP pages — `.asp`, `.asa` and `.inc` — that runs from
the command line, so it can be wired into `treefmt` and gated in CI.

It is the formatter from
[ashtonckj/Classic-ASP-Language-Support](https://github.com/ashtonckj/Classic-ASP-Language-Support),
taken out of the VS Code extension. The extension was the UI; the formatter was
always a pure function, and this fork is the packaging around it. The output is
the upstream formatter's output: a real VBScript parser for the `<% %>` blocks,
Prettier for the HTML, CSS and JavaScript around them, and a masking layer that
verifies every block survived the round trip before anything is written.

## Running it

```console
$ nix run github:synackdoche/classic-asp-fmt -- page.asp
$ nix build github:synackdoche/classic-asp-fmt
$ ./result/bin/classic-asp-fmt --check site/**/*.asp
```

From a checkout, `npm install && npm run build` puts the same CLI at
`out/cli.js`.

```
Usage: classic-asp-fmt [--check] [--config <file>] <file>...

Options:
  --check           Report the files that would change and exit 1; write nothing.
  --config <file>   Read formatter options from a JSON file.
  -h, --help        Show this message.

Exit codes:
  0  every page is formatted, or already was
  1  a page needs formatting (--check), or the formatter refused one
  2  the arguments, the config file or a page could not be read
```

A page the formatter does not format — its server code is JScript, not
VBScript — is reported and skipped, and does not fail the run.

## Configuration

Options are read from a JSON file given with `--config`. Every key is optional;
one that is left out keeps the default shown here, and one that is not listed is
an error rather than silently ignored.

```json
{
  "formatter": {
    "keywordCase": "PascalCase",
    "aspTagsOnSameLine": false,
    "htmlIndentMode": "continuation"
  },
  "prettier": {
    "printWidth": 80,
    "tabWidth": 2,
    "useTabs": false,
    "semi": true,
    "singleQuote": false,
    "bracketSameLine": false,
    "arrowParens": "always",
    "trailingComma": "es5",
    "endOfLine": "auto",
    "htmlWhitespaceSensitivity": "css"
  }
}
```

`keywordCase` is `lowercase`, `UPPERCASE` or `PascalCase`; `htmlIndentMode` is
`flat` (the `<%` and `%>` delimiters go to column 0) or `continuation` (they
follow the indent of the HTML around them). The `prettier` group is Prettier's
own options, under Prettier's own names.

Each file is written back with its own line endings and its own byte order mark,
unless `endOfLine` names another ending.

## treefmt

```toml
[formatter.classic-asp]
command = "classic-asp-fmt"
includes = ["*.asp", "*.asa", "*.inc"]
```

`treefmt --fail-on-change` is the CI gate. Run `classic-asp-fmt --check` first on
a tree that has never been formatted: a page whose tags or blocks do not pair up
is refused rather than rewritten, and a `<div>` opened in one `#include` and
closed in another is one the formatter cannot see whole.

## Development

```console
$ npm test                    # tsc, then the whole suite under mocha
$ nix build .#checks.x86_64-linux.tests
$ nix build .#checks.x86_64-linux.pre-commit
$ nix fmt
```

## Upstream

MIT. The copyright notice and upstream attribution are in `LICENSE`. The
formatter's behaviour is the upstream project's; this fork tracks it for
formatter fixes and keeps its own divergence to packaging and the settings
boundary.
