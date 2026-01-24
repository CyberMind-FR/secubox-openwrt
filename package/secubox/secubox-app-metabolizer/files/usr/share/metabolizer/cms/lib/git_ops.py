"""
Metabolizer CMS - Git Operations Library
Handles Git interactions with local Gitea instance
"""
import subprocess
import os
from pathlib import Path
from typing import Optional, Tuple, Dict, List


class GitOps:
    """Git operations wrapper for Metabolizer"""

    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path)

    def _run(self, cmd: List[str], cwd: Optional[Path] = None) -> Tuple[bool, str, str]:
        """Run a git command and return (success, stdout, stderr)"""
        try:
            result = subprocess.run(
                cmd,
                cwd=cwd or self.repo_path,
                capture_output=True,
                text=True
            )
            return result.returncode == 0, result.stdout, result.stderr
        except Exception as e:
            return False, "", str(e)

    def init(self) -> bool:
        """Initialize a new git repository"""
        self.repo_path.mkdir(parents=True, exist_ok=True)
        success, _, _ = self._run(['git', 'init'])
        return success

    def clone(self, url: str, branch: str = "main") -> bool:
        """Clone a repository"""
        parent = self.repo_path.parent
        parent.mkdir(parents=True, exist_ok=True)
        success, _, _ = self._run(
            ['git', 'clone', '--branch', branch, url, str(self.repo_path)],
            cwd=parent
        )
        return success

    def pull(self, remote: str = "origin", branch: str = "main") -> Tuple[bool, str]:
        """Pull latest changes"""
        success, stdout, stderr = self._run(['git', 'pull', remote, branch])
        return success, stdout if success else stderr

    def push(self, remote: str = "origin", branch: str = "main") -> Tuple[bool, str]:
        """Push changes to remote"""
        success, stdout, stderr = self._run(['git', 'push', remote, branch])
        return success, stdout if success else stderr

    def add(self, files: str = "-A") -> bool:
        """Stage files for commit"""
        success, _, _ = self._run(['git', 'add', files])
        return success

    def commit(self, message: str) -> Tuple[bool, str]:
        """Create a commit"""
        success, stdout, stderr = self._run(['git', 'commit', '-m', message])
        return success, stdout if success else stderr

    def status(self, short: bool = True) -> Dict:
        """Get repository status"""
        cmd = ['git', 'status', '--porcelain'] if short else ['git', 'status']
        success, stdout, stderr = self._run(cmd)

        if not success:
            return {'error': stderr}

        result = {
            'clean': len(stdout.strip()) == 0,
            'modified': [],
            'added': [],
            'deleted': [],
            'untracked': []
        }

        for line in stdout.strip().split('\n'):
            if not line:
                continue
            status = line[:2]
            filepath = line[3:]

            if status[0] == 'M' or status[1] == 'M':
                result['modified'].append(filepath)
            elif status[0] == 'A':
                result['added'].append(filepath)
            elif status[0] == 'D' or status[1] == 'D':
                result['deleted'].append(filepath)
            elif status[0] == '?':
                result['untracked'].append(filepath)

        return result

    def log(self, count: int = 10) -> List[Dict]:
        """Get recent commits"""
        success, stdout, _ = self._run([
            'git', 'log', f'-{count}',
            '--format=%H|%an|%ae|%at|%s'
        ])

        if not success:
            return []

        commits = []
        for line in stdout.strip().split('\n'):
            if not line:
                continue
            parts = line.split('|', 4)
            if len(parts) == 5:
                commits.append({
                    'hash': parts[0],
                    'author': parts[1],
                    'email': parts[2],
                    'timestamp': int(parts[3]),
                    'message': parts[4]
                })

        return commits

    def branch(self) -> str:
        """Get current branch name"""
        success, stdout, _ = self._run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'])
        return stdout.strip() if success else "unknown"

    def remote_url(self, remote: str = "origin") -> str:
        """Get remote URL"""
        success, stdout, _ = self._run(['git', 'remote', 'get-url', remote])
        return stdout.strip() if success else ""

    def set_remote(self, name: str, url: str) -> bool:
        """Set or update remote URL"""
        # Try to add, if fails try to set-url
        success, _, _ = self._run(['git', 'remote', 'add', name, url])
        if not success:
            success, _, _ = self._run(['git', 'remote', 'set-url', name, url])
        return success

    def config(self, key: str, value: str, local: bool = True) -> bool:
        """Set git config value"""
        scope = '--local' if local else '--global'
        success, _, _ = self._run(['git', 'config', scope, key, value])
        return success


def commit_and_push(repo_path: str, message: str,
                   remote: str = "origin", branch: str = "main") -> Tuple[bool, str]:
    """Convenience function to add all, commit, and push"""
    git = GitOps(repo_path)

    if not git.add():
        return False, "Failed to stage changes"

    success, result = git.commit(message)
    if not success:
        # No changes to commit is OK
        if "nothing to commit" in result:
            return True, "No changes to commit"
        return False, f"Commit failed: {result}"

    success, result = git.push(remote, branch)
    if not success:
        return False, f"Push failed: {result}"

    return True, "Changes committed and pushed"


def sync_from_remote(repo_path: str, remote: str = "origin",
                    branch: str = "main") -> Tuple[bool, str]:
    """Pull latest changes from remote"""
    git = GitOps(repo_path)
    return git.pull(remote, branch)
