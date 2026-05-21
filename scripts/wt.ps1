#!/usr/bin/env pwsh
# =============================================================================
# wt.ps1 — organized git worktree helper for the yls repo
# =============================================================================
# WHY: parallel Claude Code / dev sessions must each work in their OWN worktree
# (separate working tree + HEAD) so concurrent branch operations cannot collide.
# A shared tree caused a mid-task checkout collision on 2026-05-18 (see ylsbrain
# feedback memory: concurrent-sessions-worktrees).
#
# ORGANIZATION GUARANTEE: this script is the ONLY sanctioned way to create
# worktrees for this project. It enforces:
#   * ONE container — a sibling dir "yls.worktrees/" next to the repo
#     (never inside the repo, so tooling/hooks never recurse into it)
#   * ONE subfolder per branch, name = branch with '/' and '\' replaced by '-'
#       feature/crm   -> yls.worktrees/feature-crm
#       bugfix/login  -> yls.worktrees/bugfix-login
#
# USAGE:
#   ./scripts/wt.ps1 new  <branch> [<base=develop>]   # create/attach a worktree
#   ./scripts/wt.ps1 list                              # list all worktrees
#   ./scripts/wt.ps1 rm   <branch> [-Force]            # remove a worktree
#   ./scripts/wt.ps1 help
#
# Removing a worktree never deletes the branch ref or any commits.
# =============================================================================

[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [ValidateSet('new', 'list', 'rm', 'help')]
  [string]$Command = 'help',

  [Parameter(Position = 1)]
  [string]$Branch,

  [Parameter(Position = 2)]
  [string]$Base = 'develop',

  [switch]$Force
)

$ErrorActionPreference = 'Stop'

function Get-RepoRoot {
  $root = git rev-parse --show-toplevel 2>$null
  if (-not $root) { throw "Not inside a git repo. Run this from within the yls repo." }
  return (Resolve-Path $root).Path
}

function Get-Container {
  param([string]$RepoRoot)
  $parent = Split-Path -Parent $RepoRoot
  $c = Join-Path $parent 'yls.worktrees'
  if (-not (Test-Path $c)) { New-Item -ItemType Directory -Path $c | Out-Null }
  return (Resolve-Path $c).Path
}

function Get-Slug {
  param([string]$b)
  if (-not $b) { throw "Branch name required." }
  return ($b -replace '[\\/]', '-')
}

function Show-Usage {
  Write-Host ""
  Write-Host "wt.ps1 — organized git worktrees (one container: ../yls.worktrees)" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "  ./scripts/wt.ps1 new  <branch> [<base=develop>]"
  Write-Host "  ./scripts/wt.ps1 list"
  Write-Host "  ./scripts/wt.ps1 rm   <branch> [-Force]"
  Write-Host ""
  Write-Host "  branch feature/crm  ->  yls.worktrees/feature-crm" -ForegroundColor DarkGray
  Write-Host ""
}

$repo = Get-RepoRoot
$container = Get-Container -RepoRoot $repo

switch ($Command) {

  'list' {
    git worktree list
  }

  'new' {
    if (-not $Branch) { Show-Usage; throw "Usage: wt.ps1 new <branch> [<base>]" }
    $slug = Get-Slug $Branch
    $path = Join-Path $container $slug
    if (Test-Path $path) { throw "Worktree path already exists: $path" }

    git rev-parse --verify --quiet "refs/heads/$Branch" *> $null
    $localExists = ($LASTEXITCODE -eq 0)
    $remoteExists = [bool](git ls-remote --heads origin $Branch 2>$null)

    if ($localExists) {
      git worktree add $path $Branch
    }
    elseif ($remoteExists) {
      git worktree add --track -b $Branch $path "origin/$Branch"
    }
    else {
      git rev-parse --verify --quiet "refs/heads/$Base" *> $null
      if ($LASTEXITCODE -ne 0) { throw "Base branch '$Base' not found locally." }
      git worktree add -b $Branch $path $Base
    }
    if ($LASTEXITCODE -ne 0) { throw "git worktree add failed." }

    Write-Host ""
    Write-Host "Worktree ready:" -ForegroundColor Green
    Write-Host "  branch : $Branch"
    Write-Host "  path   : $path"
    Write-Host "  open   : Set-Location `"$path`""
  }

  'rm' {
    if (-not $Branch) { Show-Usage; throw "Usage: wt.ps1 rm <branch> [-Force]" }
    $slug = Get-Slug $Branch
    $path = Join-Path $container $slug
    if (-not (Test-Path $path)) { throw "No worktree at: $path" }

    if ($Force) { git worktree remove --force $path }
    else { git worktree remove $path }
    if ($LASTEXITCODE -ne 0) {
      throw "git worktree remove failed (uncommitted changes? re-run with -Force if intentional)."
    }
    git worktree prune
    Write-Host "Removed worktree: $path" -ForegroundColor Yellow
    Write-Host "(branch '$Branch' and all commits are kept — delete the ref separately if you want)"
  }

  default { Show-Usage }
}
