{
  inputs,
  pkgs,
  ...
}:
inputs.self.packages.${pkgs.stdenv.hostPlatform.system}.default.overrideAttrs (_previous: {
  checkPhase = ''
    runHook preCheck
    npm test
    runHook postCheck
  '';
  doCheck = true;
})
