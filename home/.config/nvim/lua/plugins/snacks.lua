return {
  'folke/snacks.nvim',
  priority = 1000,
  lazy = false,
  opts = {
    picker = { enabled = true },
    notifier = { enabled = true },
    input = { enabled = true },
  },
  keys = {
    { '<leader>b', function() Snacks.picker.buffers() end,         desc = 'Buffers' },
    { 'gd',        function() Snacks.picker.lsp_definitions() end, desc = 'Goto Definition' },
  },
}
