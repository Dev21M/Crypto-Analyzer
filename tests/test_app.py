"""
Tests for CryptoAnalyzer Streamlit Application (Phase 10)
"""
import pytest
from pathlib import Path
import sys

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))


class TestAppStructure:
    """Test that the Streamlit app structure is valid."""
    
    def test_app_file_exists(self):
        """Test that app.py exists."""
        app_path = Path(__file__).parent.parent / "src" / "crypto_analyzer" / "app.py"
        assert app_path.exists(), "app.py not found"
    
    def test_app_has_required_imports(self):
        """Test that app.py has required imports."""
        app_path = Path(__file__).parent.parent / "src" / "crypto_analyzer" / "app.py"
        content = app_path.read_text(encoding='utf-8')
        
        required_imports = [
            "import streamlit as st",
            "import pandas as pd",
            "import numpy as np",
            "import plotly",
            "import json"
        ]
        
        for imp in required_imports:
            assert imp in content, f"Missing import: {imp}"
    
    def test_app_has_disclaimer(self):
        """Test that app contains scientific disclaimer."""
        app_path = Path(__file__).parent.parent / "src" / "crypto_analyzer" / "app.py"
        content = app_path.read_text(encoding='utf-8')
        
        assert "DISCLAIMER" in content or "disclaimer" in content.lower()
        assert "RESEARCH" in content or "research" in content.lower()
        assert "NOT financial advice" in content or "not financial advice" in content.lower()
    
    def test_app_has_page_config(self):
        """Test that app has streamlit page config."""
        app_path = Path(__file__).parent.parent / "src" / "crypto_analyzer" / "app.py"
        content = app_path.read_text(encoding='utf-8')
        
        assert "st.set_page_config" in content
    
    def test_app_has_navigation(self):
        """Test that app has navigation structure."""
        app_path = Path(__file__).parent.parent / "src" / "crypto_analyzer" / "app.py"
        content = app_path.read_text(encoding='utf-8')
        
        # Check for sidebar navigation
        assert "st.sidebar" in content
        assert "radio" in content or "selectbox" in content
    
    def test_app_has_data_loading(self):
        """Test that app has data loading functions."""
        app_path = Path(__file__).parent.parent / "src" / "crypto_analyzer" / "app.py"
        content = app_path.read_text(encoding='utf-8')
        
        assert "@st.cache_data" in content
        assert "load_raw_data" in content
        assert "load_ablation_results" in content
        assert "load_regime_results" in content
    
    def test_app_has_chart_functions(self):
        """Test that app has chart creation functions."""
        app_path = Path(__file__).parent.parent / "src" / "crypto_analyzer" / "app.py"
        content = app_path.read_text(encoding='utf-8')
        
        assert "create_price_chart" in content
        assert "create_metric_comparison_chart" in content
        assert "create_regime_comparison_chart" in content
    
    def test_app_has_pages(self):
        """Test that app has all required pages."""
        app_path = Path(__file__).parent.parent / "src" / "crypto_analyzer" / "app.py"
        content = app_path.read_text(encoding='utf-8')
        
        required_pages = [
            "Data Explorer",
            "Model Performance",
            "Regime Analysis",
            "Statistical Tests",
            "Reports"
        ]
        
        for page in required_pages:
            assert page in content, f"Missing page: {page}"
    
    def test_run_script_exists(self):
        """Test that run_app.py exists."""
        run_path = Path(__file__).parent.parent / "scripts" / "run_app.py"
        assert run_path.exists(), "run_app.py not found"
    
    def test_run_script_executable(self):
        """Test that run script is properly structured."""
        run_path = Path(__file__).parent.parent / "scripts" / "run_app.py"
        content = run_path.read_text(encoding='utf-8')
        
        assert "streamlit" in content
        assert "run" in content
        assert "subprocess" in content


class TestAppDependencies:
    """Test that required dependencies are available."""
    
    def test_streamlit_importable(self):
        """Test that streamlit can be imported."""
        import streamlit
        assert streamlit.__version__ is not None
    
    def test_plotly_importable(self):
        """Test that plotly can be imported."""
        import plotly
        assert plotly.__version__ is not None
    
    def test_pandas_numpy_importable(self):
        """Test that pandas and numpy work."""
        import pandas as pd
        import numpy as np
        assert pd.__version__ is not None
        assert np.__version__ is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])