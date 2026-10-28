{ config, pkgs, ... }: {
	# nixos specific settings
	wsl.enable = true;
	wsl.defaultUser = "cris";

        # enables automatic dynamic linking support for unpatched binaries in $PATH / node
        programs.nix-ld.enable = true;

        programs.nix-ld.libraries = with pkgs; [
          # headless Chromium for Playwright (browser tests)
          alsa-lib at-spi2-atk at-spi2-core atk dbus expat glib libgbm
            libxkbcommon nspr nss systemd
            libx11 libxcb libxcomposite libxdamage libxext libxfixes libxrandr
        ];
	
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
	
