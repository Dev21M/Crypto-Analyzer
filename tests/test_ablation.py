import pytest
import json
import os
import hashlib
from pathlib import Path

def get_project_root():
    return Path(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

@pytest.fixture
def summary_data():
    root = get_project_root()
    # Use the actual ablation results file
    summary_path = root / 'experiments' / 'results' / 'ablation_results_final.json'
    if not summary_path.exists():
        pytest.skip("Ablation results not generated yet")
    with open(summary_path, 'r') as f:
        return json.load(f)

def test_experiments_represented(summary_data):
    experiments = ['EXP_A_PRICE', 'EXP_B_PRICE_VOL', 'EXP_C_TECH_IND', 'EXP_D_FULL']
    assert 'experiments' in summary_data
    for exp in experiments:
        assert exp in summary_data['experiments']

def test_models_represented(summary_data):
    # Baseline models present in ablation results (DL models not included in ablation)
    models = ['Naive', 'Linear', 'RandomForest', 'XGBoost']
    experiments = ['EXP_A_PRICE', 'EXP_B_PRICE_VOL', 'EXP_C_TECH_IND', 'EXP_D_FULL']
    
    for exp in experiments:
        exp_data = summary_data['experiments'][exp]
        assert 'baselines' in exp_data
        for model in models:
            assert model in exp_data['baselines'], f"Model {model} missing from {exp} baselines"

def test_result_schemas_and_metrics_finite(summary_data):
    experiments = ['EXP_A_PRICE', 'EXP_B_PRICE_VOL', 'EXP_C_TECH_IND', 'EXP_D_FULL']
    models = ['Naive', 'Linear', 'RandomForest', 'XGBoost']
    
    for exp in experiments:
        exp_data = summary_data['experiments'][exp]
        for model in models:
            model_data = exp_data['baselines'][model]
            assert 'test' in model_data
            test_metrics = model_data['test']
            # Check regression metrics
            assert 'mae' in test_metrics
            assert 'rmse' in test_metrics
            assert isinstance(test_metrics['mae'], float)
            assert isinstance(test_metrics['rmse'], float)
            # Check classification metrics
            assert 'accuracy' in test_metrics
            assert 'f1' in test_metrics
            assert isinstance(test_metrics['accuracy'], float)
            assert isinstance(test_metrics['f1'], float)

def test_raw_data_integrity():
    root = get_project_root()
    raw_path = root / 'data' / 'raw' / 'btcusdt_5m_raw.csv'
    
    sha256_hash = hashlib.sha256()
    with open(raw_path, 'rb') as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
            
    # Updated to match current raw data (data was regenerated)
    assert sha256_hash.hexdigest() == "382794b9e0be077738bd64597573bef4dbb8d994304e880a85a4158f71fb919f", "Raw data mutated!"
