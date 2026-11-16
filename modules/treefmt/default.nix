{ flake, ... }:
{
  config,
  lib,
  pkgs,
  ...
}:
let
  cfg = config.programs.classic-asp-fmt;
  configPath =
    if cfg.config != null && cfg.configFile != null then
      throw "programs.classic-asp-fmt: set either `config` or `configFile`, not both"
    else if cfg.config != null then
      pkgs.writeText "classic-asp-fmt.json" (builtins.toJSON cfg.config)
    else if cfg.configFile != null then
      pkgs.writeText "classic-asp-fmt.json" (builtins.readFile cfg.configFile)
    else
      null;
in
{
  config = lib.mkIf cfg.enable {
    settings.formatter.classic-asp-fmt = {
      inherit (cfg) includes;
      command = lib.getExe cfg.package;
      options = lib.optionals (configPath != null) [
        "--config"
        "${configPath}"
      ];
    }
    // lib.optionalAttrs (cfg.excludes != [ ]) { inherit (cfg) excludes; }
    // lib.optionalAttrs (cfg.priority != null) { inherit (cfg) priority; };
  };

  options.programs.classic-asp-fmt = {
    config = lib.mkOption {
      default = null;
      description = ''
        The formatter options as an attrset, written to JSON and passed as
        `--config`. The shape is the CLI's configuration file; it is validated
        by the CLI, so a key it does not know fails the run rather than being
        ignored.
      '';
      example = lib.literalExpression ''
        {
          formatter.keywordCase = "lowercase";
          prettier.printWidth = 100;
        }
      '';
      type = lib.types.nullOr (lib.types.attrsOf lib.types.anything);
    };
    configFile = lib.mkOption {
      default = null;
      description = ''
        A JSON options file passed as `--config`, for a file that already
        exists. Its content is copied into the store. Set either this or
        `config`, not both.
      '';
      type = lib.types.nullOr lib.types.path;
    };
    enable = lib.mkEnableOption "classic-asp-fmt, the Classic ASP formatter";
    excludes = lib.mkOption {
      default = [ ];
      description = "Path / file patterns to exclude.";
      example = [ "legacy/*.asp" ];
      type = lib.types.listOf lib.types.str;
    };
    includes = lib.mkOption {
      default = [
        "*.asp"
        "*.asa"
        "*.inc"
      ];
      description = "Path / file patterns to include.";
      type = lib.types.listOf lib.types.str;
    };
    package = lib.mkOption {
      default = flake.packages.${pkgs.stdenv.hostPlatform.system}.default;
      defaultText = lib.literalExpression "classic-asp-fmt.packages.\${system}.default";
      description = "The classic-asp-fmt package to run.";
      type = lib.types.package;
    };
    priority = lib.mkOption {
      default = null;
      description = "treefmt priority, for ordering relative to other formatters on the same files.";
      type = lib.types.nullOr lib.types.int;
    };
  };
}
