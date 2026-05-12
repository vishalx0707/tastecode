export type ShellName = "pwsh" | "bash" | "zsh";

export const DEFAULT_SHIM_PROVIDERS = [
  "claude",
  "codex",
  "cursor-agent",
  "opencode",
  "aider",
];

export const FENCE_START = "# tastecode:start";
export const FENCE_END = "# tastecode:end";

export interface SnippetOptions {
  providers?: string[];
}

export function buildSnippet(
  shell: ShellName,
  opts: SnippetOptions = {},
): string {
  const providers = opts.providers ?? DEFAULT_SHIM_PROVIDERS;
  if (shell === "pwsh") return buildPwsh(providers);
  return buildPosix(providers);
}

function buildPwsh(providers: string[]): string {
  const setItems = providers
    .map(
      (p) =>
        `Set-Item -Path "function:global:${p}" -Value ([scriptblock]::Create("tastecode_wrap ${p} @args"))`,
    )
    .join("\n");
  return `${FENCE_START}
function global:tastecode_wrap {
    param([string]$Provider, [Parameter(ValueFromRemainingArguments)]$Rest)
    if (-not $Rest -or $Rest.Count -eq 0) {
        $cmd = Get-Command -Name $Provider -CommandType Application -ErrorAction SilentlyContinue
        if ($cmd) { & $cmd.Source } else { Write-Error "$Provider not found on PATH" }
        return
    }
    $first = [string]$Rest[0]
    if ($first -eq '--raw') {
        $cmd = Get-Command -Name $Provider -CommandType Application -ErrorAction SilentlyContinue
        $rest2 = @($Rest | Select-Object -Skip 1)
        if ($cmd) { & $cmd.Source @rest2 } else { Write-Error "$Provider not found on PATH" }
        return
    }
    if ($first.StartsWith('-')) {
        $cmd = Get-Command -Name $Provider -CommandType Application -ErrorAction SilentlyContinue
        if ($cmd) { & $cmd.Source @Rest } else { Write-Error "$Provider not found on PATH" }
        return
    }
    tastecode use $Provider ($Rest -join ' ')
}
${setItems}
${FENCE_END}
`;
}

function buildPosix(providers: string[]): string {
  const list = providers.join(" ");
  return `${FENCE_START}
tastecode_wrap() {
    local p="$1"; shift
    if [ $# -eq 0 ]; then command "$p"; return; fi
    case "$1" in
        --raw) shift; command "$p" "$@"; return ;;
        -*)    command "$p" "$@"; return ;;
    esac
    tastecode use "$p" "$*"
}
for cli in ${list}; do
    eval "function $cli() { tastecode_wrap $cli \\"\\$@\\"; }"
done
${FENCE_END}
`;
}

export function profilePath(shell: ShellName): string {
  switch (shell) {
    case "pwsh":
      return "$PROFILE";
    case "bash":
      return "~/.bashrc";
    case "zsh":
      return "~/.zshrc";
  }
}

export function reloadCommand(shell: ShellName): string {
  switch (shell) {
    case "pwsh":
      return ". $PROFILE";
    case "bash":
      return "source ~/.bashrc";
    case "zsh":
      return "source ~/.zshrc";
  }
}
