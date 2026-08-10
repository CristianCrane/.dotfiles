{ config, pkgs, ... }: {
	# nixos specific settings
	wsl.enable = true;
	wsl.defaultUser = "cris";

        # enables automatic dynamic linking support for unpatched binaries in $PATH / node
        programs.nix-ld.enable = true;
	
	# general system settings
	system.stateVersion = "26.05";
	
	environment.systemPackages = with pkgs; [
          git
          neovim
          curl
	];

	programs.zsh.enable = true;

	users.users.cris = {
          isNormalUser = true;
          extraGroups = [ "wheel" ];
	  shell = pkgs.zsh;
	};
}
	
