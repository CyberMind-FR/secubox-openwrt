"""
Metabolizer CMS - Hexo API Library
Handles HexoJS build pipeline integration
"""
import subprocess
import json
from pathlib import Path
from typing import Tuple, Dict, List, Optional


class HexoAPI:
    """HexoJS API wrapper for Metabolizer"""

    HEXOCTL = '/usr/sbin/hexoctl'

    def __init__(self, site_path: str = "/srv/hexojs/site"):
        self.site_path = Path(site_path)
        self.source_path = self.site_path / "source" / "_posts"
        self.public_path = self.site_path / "public"

    def _run_hexoctl(self, cmd: str, *args) -> Tuple[bool, str, str]:
        """Run hexoctl command"""
        try:
            result = subprocess.run(
                [self.HEXOCTL, cmd] + list(args),
                capture_output=True,
                text=True
            )
            return result.returncode == 0, result.stdout, result.stderr
        except Exception as e:
            return False, "", str(e)

    def status(self) -> Dict:
        """Get HexoJS status"""
        success, stdout, _ = self._run_hexoctl('status')
        if success:
            try:
                return json.loads(stdout)
            except:
                pass
        return {'status': 'unknown'}

    def clean(self) -> Tuple[bool, str]:
        """Clean build artifacts"""
        success, stdout, stderr = self._run_hexoctl('clean')
        return success, stdout if success else stderr

    def generate(self) -> Tuple[bool, str]:
        """Generate static site"""
        success, stdout, stderr = self._run_hexoctl('generate')
        return success, stdout if success else stderr

    def deploy(self) -> Tuple[bool, str]:
        """Deploy/publish site"""
        success, stdout, stderr = self._run_hexoctl('deploy')
        return success, stdout if success else stderr

    def build(self) -> Tuple[bool, str]:
        """Full build pipeline: clean -> generate"""
        # Clean
        success, msg = self.clean()
        if not success:
            return False, f"Clean failed: {msg}"

        # Generate
        success, msg = self.generate()
        if not success:
            return False, f"Generate failed: {msg}"

        return True, "Build complete"

    def full_pipeline(self, portal_path: str = "/www/blog") -> Tuple[bool, str]:
        """Full pipeline: clean -> generate -> publish to portal"""
        # Build
        success, msg = self.build()
        if not success:
            return False, msg

        # Publish to portal
        success, msg = self.publish(portal_path)
        if not success:
            return False, f"Publish failed: {msg}"

        return True, "Full pipeline complete"

    def publish(self, portal_path: str = "/www/blog") -> Tuple[bool, str]:
        """Copy generated site to portal"""
        portal = Path(portal_path)
        portal.mkdir(parents=True, exist_ok=True)

        if not self.public_path.exists():
            return False, "No generated site found. Run generate first."

        try:
            result = subprocess.run(
                ['rsync', '-av', '--delete',
                 str(self.public_path) + '/',
                 str(portal) + '/'],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                return True, "Published to portal"
            return False, result.stderr
        except Exception as e:
            return False, str(e)

    def list_posts(self) -> List[Dict]:
        """List all posts in source directory"""
        posts = []
        if not self.source_path.exists():
            return posts

        for f in sorted(self.source_path.glob("*.md"), reverse=True):
            posts.append({
                'filename': f.name,
                'path': str(f),
                'size': f.stat().st_size,
                'mtime': f.stat().st_mtime
            })

        return posts

    def get_post_count(self) -> int:
        """Get number of posts"""
        if not self.source_path.exists():
            return 0
        return len(list(self.source_path.glob("*.md")))


class MetabolizerPipeline:
    """Complete Metabolizer pipeline controller"""

    METABOLIZERCTL = '/usr/sbin/metabolizerctl'

    def __init__(self):
        self.hexo = HexoAPI()

    def _run_ctl(self, cmd: str, *args) -> Tuple[bool, str, str]:
        """Run metabolizerctl command"""
        try:
            result = subprocess.run(
                [self.METABOLIZERCTL, cmd] + list(args),
                capture_output=True,
                text=True
            )
            return result.returncode == 0, result.stdout, result.stderr
        except Exception as e:
            return False, "", str(e)

    def status(self) -> Dict:
        """Get full pipeline status"""
        success, stdout, _ = self._run_ctl('status')
        if success:
            try:
                return json.loads(stdout)
            except:
                pass
        return {}

    def sync(self) -> Tuple[bool, str]:
        """Sync content from git"""
        success, stdout, stderr = self._run_ctl('sync')
        return success, stdout if success else stderr

    def build(self) -> Tuple[bool, str]:
        """Run full build pipeline"""
        success, stdout, stderr = self._run_ctl('build')
        return success, stdout if success else stderr

    def publish(self) -> Tuple[bool, str]:
        """Publish to portal"""
        success, stdout, stderr = self._run_ctl('publish')
        return success, stdout if success else stderr

    def mirror(self, github_url: str) -> Tuple[bool, str]:
        """Mirror a GitHub repository"""
        success, stdout, stderr = self._run_ctl('mirror', github_url)
        return success, stdout if success else stderr


# Convenience functions
def get_pipeline_status() -> Dict:
    """Get full pipeline status"""
    pipeline = MetabolizerPipeline()
    return pipeline.status()


def run_full_pipeline() -> Tuple[bool, str]:
    """Run complete pipeline: sync -> build -> publish"""
    pipeline = MetabolizerPipeline()

    # Sync
    success, msg = pipeline.sync()
    if not success:
        return False, f"Sync failed: {msg}"

    # Build and publish
    success, msg = pipeline.build()
    if not success:
        return False, f"Build failed: {msg}"

    return True, "Pipeline complete"
