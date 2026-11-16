{
  pkgs,
  ...
}:
let
  manifest = builtins.fromJSON (builtins.readFile ../package.json);
in
pkgs.buildNpmPackage {
  inherit (manifest) version;
  installPhase = ''
    runHook preInstall

    npm prune --omit=dev --offline

    mkdir -p $out/bin $out/lib/node_modules/${manifest.name}
    cp -r out node_modules package.json $out/lib/node_modules/${manifest.name}/
    cat > $out/bin/${manifest.name} <<EOF
    #!${pkgs.runtimeShell}
    exec ${pkgs.nodejs}/bin/node $out/lib/node_modules/${manifest.name}/out/cli.js "\$@"
    EOF
    chmod +x $out/bin/${manifest.name}

    runHook postInstall
  '';
  meta = {
    inherit (manifest) description;
    license = pkgs.lib.licenses.mit;
    mainProgram = manifest.name;
    platforms = [ "x86_64-linux" ];
  };
  npmDepsHash = "sha256-pnpRrbTsf87hq9ctUeTf4UzHIwt1YnUlbXpSU2PXxHw=";
  pname = manifest.name;
  src = ../.;
}
