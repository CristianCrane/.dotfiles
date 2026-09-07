{ config, pkgs, ... }: {
	# nixos specific settings
	wsl.enable = true;
	wsl.defaultUser = "cris";

        # enables automatic dynamic linking support for unpatched binaries in $PATH / node
        programs.nix-ld.enable = true;
	
	# general system settings
	system.stateVersion = "26.05";

        # enable docker
        virtualisation.docker = {
          enable = true;
          autoPrune = {
            enable = true;
            dates = "weekly";
          };
        };
	
	environment.systemPackages = with pkgs; [
          git
          neovim
          curl
          docker
          docker-compose
	];

	programs.zsh.enable = true;

	users.users.cris = {
          isNormalUser = true;
          extraGroups = [
              "wheel"
              "docker"
          ];
	  shell = pkgs.zsh;
	};
}
	
