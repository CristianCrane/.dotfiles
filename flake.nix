{
  description = "dotfiles";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
    # pinned at the merge that puts /bin/true in /bin (NixOS-WSL#1101), which
    # WSL's wsl-mnt-guard.service runs; main's next feature commit (#1120)
    # makes the default user a nix-daemon trusted user, a root route with no
    # sudo in the command, which we leave out while agents run in auto mode.
    # Move past it in a PR of its own.
    nixos-wsl.url = "github:nix-community/NixOS-WSL/8c333e5b3abb693139e4df80988810ce44788b4e";
    home-manager.url = "github:nix-community/home-manager/release-26.05";
    home-manager.inputs.nixpkgs.follows = "nixpkgs";
    nix-claude-code.url = "github:ryoppippi/nix-claude-code";

    herdr = {
      url = "github:herdrdev/herdr/v0.8.0";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, nixos-wsl, home-manager, herdr, nix-claude-code, ... }@inputs: {
    nixosConfigurations."windows" = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";

        specialArgs = { inherit inputs; };

        modules = [
          nixos-wsl.nixosModules.default
	  home-manager.nixosModules.home-manager {
	    home-manager.useGlobalPkgs = true;
	    home-manager.useUserPackages = true;
            home-manager.extraSpecialArgs = { inherit inputs; };
	    home-manager.users.cris = import ./home.nix;
	  }
          ./configuration.nix
        ];
    };
  };
}
