return {
  "Saghen/blink.cmp",
  -- Download pre-built Rust fuzzy matcher binaries from releases
  version = "v0.*",
  event = "InsertEnter",
  opts = {
    -- Keymap preset: 'default' | 'super-tab' | 'enter'
    -- 'default': <C-space> to show, <Tab>/<S-Tab> or <C-n>/<C-p> to navigate, <C-y> to accept
    keymap = { preset = "default" },

    appearance = {
      use_nvim_cmp_as_default = true,
      nerd_font_variant = "mono",
    },

    -- Completion behavior & triggers
    completion = {
      -- Show completion documentation popup automatically when navigating items
      documentation = { auto_show = true, auto_show_delay_ms = 200 },

      -- Render kind icons (Method, Variable, Interface, etc.) in popup
      menu = {
        draw = {
          columns = { { "kind_icon" }, { "label", "label_description", gap = 1 } },
        },
      },
    },

    -- Completion sources (LSP + Snippets + Path + Buffer)
    sources = {
      default = { "lsp", "path", "snippets", "buffer" },
    },
  },
}
