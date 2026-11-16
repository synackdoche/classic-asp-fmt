{
  inputs,
  pkgs,
  ...
}:
let
  mkTreefmt =
    program:
    inputs.treefmt-nix.lib.evalModule pkgs {
      imports = [ inputs.self.treefmtModules.default ];
      programs.classic-asp-fmt = {
        enable = true;
      }
      // program;
      projectRootFile = "flake.nix";
    };

  fromFile = mkTreefmt { configFile = ../test/fixtures/config/partial.json; };
  fromAttrs = mkTreefmt {
    config = {
      formatter.keywordCase = "lowercase";
    };
  };
  bothSet =
    builtins.tryEval
      (mkTreefmt {
        config = {
          formatter.keywordCase = "lowercase";
        };
        configFile = ../test/fixtures/config/partial.json;
      }).config.settings.formatter.classic-asp-fmt.options;
in
pkgs.runCommand "classic-asp-fmt-treefmt-module" { } ''
  test ${if bothSet.success then "0" else "1"} = 1 || {
    echo "config and configFile were both accepted" >&2
    exit 1
  }

  check() {
    work=$(mktemp -d)
    cp ${../test/fixtures/pages/keyword-case.asp} "$work/page.asp" || exit 1
    chmod u+w "$work/page.asp"
    cd "$work" || exit 1
    touch flake.nix

    if "$1/bin/treefmt" --ci page.asp; then
      echo "the CI gate passed a page that was not formatted ($1)" >&2
      exit 1
    fi
    grep -qx 'if x then' page.asp || exit 1
    grep -qx 'end if' page.asp || exit 1

    "$1/bin/treefmt" --ci page.asp || exit 1
  }

  check ${fromFile.config.build.wrapper}
  check ${fromAttrs.config.build.wrapper}

  test -x ${fromAttrs.config.build.programs.classic-asp-fmt}/bin/classic-asp-fmt || {
    echo "build.programs does not resolve to the configured package" >&2
    exit 1
  }

  touch $out
''
