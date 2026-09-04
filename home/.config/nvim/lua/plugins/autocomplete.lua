return {
  "saghen/blink.cmp",
  dependencies = {
    'rafamadriz/friendly-snippets'
  },
  version = "1.*",
  opts = {
    keymap = {
      preset = "super-tab",
    },
    completion = {
      documentation = { auto_show = true, auto_show_delay_ms = 150 },
      menu = {
        draw = {
          columns = { { "kind_icon" }, { "label", "label_description", gap = 1 } },
        },
      },
    },
    sources = {
      default = { "lsp", "path", "snippets", "buffer" },
    },
    fuzzy = { implementation = "prefer_rust_with_warning" }
  },
  opts_extend = { "sources.default" }
}
