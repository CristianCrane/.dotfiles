{ config, pkgs, ... }: {
	# nixos specific settings
	wsl.enable = true;
	wsl.defaultUser = "cris";

        # Windows' reg.exe covered, on the Linux side only, by an empty file
        # that can't run. Claude Code on WSL runs reg.exe twice at once
        # through interop, at every start and every 30 minutes, to read
        # Windows' policy for it, and an interop launch now and then leaves a
        # Windows-side wsl.exe or wslhost.exe thread spinning at 100% for good
        # (microsoft/WSL#41173, anthropics/claude-code#108203): a day's worth
        # took half of Windows' CPU. Linux refuses to exec the file, so no
        # launch reaches Windows. Lost: Windows-managed Claude Code policy
        # in WSL (none is set here), and any Linux use of reg.exe, such as
        # Claude Code registering Claude in Chrome from WSL
        systemd.mounts = [{
          description = "Cover Windows' reg.exe on the Linux side (microsoft/WSL#41173)";
          what = "${pkgs.writeText "no-reg.exe" ""}";
          where = "/mnt/c/Windows/System32/reg.exe";
          type = "none";
          options = "bind";
          wantedBy = [ "multi-user.target" ];
        }];

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
	
