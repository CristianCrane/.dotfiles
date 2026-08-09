{ config, pkgs, inputs, ... }: 

let
  dotfiles = "${config.home.homeDirectory}/.dotfiles";
in

{
  home.stateVersion = "26.05";

  home.packages = with pkgs; [
    ripgrep	# fast search
    fd		# fast find
    git
    neovim
    curl
    wget 
    fzf		# fuzzy finder
    jq		# json on the command line
    lazygit
    inputs.herdr.packages.${pkgs.system}.default
  ];

  fonts.fontconfig.enable = true;
  home.sessionVariables.EDITOR = "nvim";

  programs.git = {
    enable = true;
    settings.user.name = "Cris Crane";
    settings.user.email = "12250662+CristianCrane@users.noreply.github.com";
    settings.init.defaultBranch = "main";
  };

  programs.zsh = {
    enable = true;
    autosuggestion.enable = true;
    syntaxHighlighting.enable = true;
    initContent = ''
      bindkey '^f' autosuggest-accept
    '';
    shellAliases = {
      ".." = "cd ..";
      add = "git add .";
      push = "git push";
      pull = "git pull";
      rebuild = "~/.dotfiles/rebuild.sh";
    };
  };

  programs.starship = {
    enable = true;
    settings = {
      add_newline = false;
      format = "$directory$git_branch$git_status$cmd_duration$line_break$character";
      character = {
        success_symbol = "[›](purple)";
	error_symbol = "[›](red)";
      };
    };
  };

  home.file.".config/wezterm".source = 
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.config/wezterm";
  
  home.file.".config/nvim".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.config/nvim";

  home.file.".config/herdr".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.config/herdr";
}
