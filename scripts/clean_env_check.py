#!/usr/bin/env python
"""
Clean Environment Installation and Execution Check for CryptoAnalyzer

This script verifies that the project can be installed and run from scratch
in a clean environment.
"""
import subprocess
import sys
import tempfile
import shutil
from pathlib import Path


def run_command(cmd, cwd=None, check=True):
    """Run a command and return result."""
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if result.stdout:
        print(result.stdout[:500])
    if result.stderr:
        print(result.stderr[:500])
    if check and result.returncode != 0:
        print(f"Command failed with return code {result.returncode}")
    return result


def main():
    """Main clean environment check."""
    project_root = Path(__file__).parent.parent
    
    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)
        print(f"Testing in temporary directory: {tmpdir}")
        
        # 1. Copy project to temp directory (excluding large data/experiments)
        print("\n=== Copying project ===")
        dest = tmpdir / "CryptoAnalyzer"
        shutil.copytree(project_root, dest, 
            ignore=shutil.ignore_patterns(
                '__pycache__', '.git', '.venv', 'htmlcov', 
                'data/raw/*', 'data/processed/*', 
                'experiments/results/*', 'models/checkpoints/*',
                '*.pyc', '*.log'
            ))
        
        # 2. Create virtual environment
        print("\n=== Creating virtual environment ===")
        venv_path = dest / ".venv"
        run_command([sys.executable, "-m", "venv", str(venv_path)], cwd=dest)
        
        # 3. Install dependencies
        print("\n=== Installing dependencies ===")
        pip_path = venv_path / "Scripts" / "pip.exe"
        run_command([str(pip_path), "install", "-r", "requirements.txt"], cwd=dest)
        
        # 4. Run unit tests (excluding integration tests that need data)
        print("\n=== Running unit tests ===")
        python_path = venv_path / "Scripts" / "python.exe"
        test_cmd = [
            str(python_path), "-m", "pytest", 
            "tests/test_app.py",
            "tests/test_baselines.py",
            "tests/test_data_pipeline.py",
            "tests/test_dl_models.py",
            "tests/test_features.py",
            "tests/test_sequences.py",
            "tests/test_targets.py",
            "tests/test_research_spec.py",
            "tests/test_environment.py",
            "-v", "--tb=short"
        ]
        result = run_command(test_cmd, cwd=dest, check=False)
        
        if result.returncode == 0:
            print("\n[OK] All unit tests PASSED")
        else:
            print("\n[FAIL] Some unit tests FAILED")
            return False
        
        # 5. Verify app imports
        print("\n=== Verifying app imports ===")
        import_cmd = [str(python_path), "-c", "import sys; sys.path.insert(0, 'src'); from crypto_analyzer import app; print('App imports OK')"]
        result = run_command(import_cmd, cwd=dest, check=False)
        
        if result.returncode == 0:
            print("[OK] App imports successfully")
        else:
            print("[FAIL] App import failed")
            return False
        
        # 6. Run ruff check
        print("\n=== Running code quality check (ruff) ===")
        ruff_cmd = [str(venv_path / "Scripts" / "ruff.exe"), "check", "src/"]
        result = run_command(ruff_cmd, cwd=dest, check=False)
        
        if result.returncode == 0:
            print("[OK] Code quality check PASSED")
        else:
            print("[FAIL] Code quality check FAILED")
            return False
        
        print("\n=== CLEAN ENVIRONMENT CHECK: PASSED ===")
        return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)