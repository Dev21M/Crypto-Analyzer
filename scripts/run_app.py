#!/usr/bin/env python
"""
Run script for CryptoAnalyzer Streamlit Dashboard (Phase 10)
"""
import subprocess
import sys
from pathlib import Path

def main():
    """Launch the Streamlit application."""
    app_path = Path(__file__).parent.parent / "src" / "crypto_analyzer" / "app.py"
    
    if not app_path.exists():
        print(f"Error: App not found at {app_path}")
        sys.exit(1)
    
    print("Starting CryptoAnalyzer Streamlit Dashboard...")
    print(f"App: {app_path}")
    print("Press Ctrl+C to stop")
    
    # Run streamlit
    subprocess.run([
        sys.executable, "-m", "streamlit", "run",
        str(app_path),
        "--server.port", "8501",
        "--server.address", "localhost",
        "--browser.gatherUsageStats", "false"
    ])

if __name__ == "__main__":
    main()