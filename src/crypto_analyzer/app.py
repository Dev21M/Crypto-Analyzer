"""
CryptoAnalyzer Streamlit Dashboard - Phase 10
Interactive research analyzer for BTC/USDT cryptocurrency prediction.

⚠️ DISCLAIMER: This is a RESEARCH TOOL ONLY. Not financial advice.
All predictions are experimental and should NOT be used for investment decisions.
Past performance does not guarantee future results. Cryptocurrency trading involves substantial risk.
"""

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st
from plotly.subplots import make_subplots

# Add src to path for crypto_analyzer imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Page config
st.set_page_config(
    page_title="CryptoAnalyzer - BTC/USDT Research Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ─── DISCLAIMER BANNER ───
st.markdown("""
<div style="background-color: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
    <h3 style="color: #856404; margin: 0;">⚠️ SCIENTIFIC RESEARCH DISCLAIMER</h3>
    <p style="color: #856404; margin: 0.5rem 0 0 0;"><strong>This is an academic research tool for educational purposes only.</strong> 
    The predictions, models, and analysis presented here are <strong>experimental</strong> and 
    <strong>must NOT be used for financial decisions, trading, or investment advice.</strong> 
    Cryptocurrency markets are highly volatile and unpredictable. 
    Past performance does not guarantee future results. 
    The authors assume no liability for any financial losses.</p>
</div>
""", unsafe_allow_html=True)

# ─── CONSTANTS ───
DATA_DIR = Path("data")
EXPERIMENTS_DIR = Path("experiments/results")
REPORTS_DIR = Path("reports")
MODELS_DIR = Path("models/checkpoints")

EXPERIMENT_CONFIGS = {
    "EXP_A_PRICE": {"name": "Price Only", "features": 4, "color": "#1f77b4"},
    "EXP_B_PRICE_VOL": {"name": "Price + Volume", "features": 5, "color": "#ff7f0e"},
    "EXP_C_TECH_IND": {"name": "Price + Volume + Technical Indicators", "features": 19, "color": "#2ca02c"},
    "EXP_D_FULL": {"name": "Full Feature Set (24 features)", "features": 24, "color": "#d62728"},
}

MODEL_FAMILIES = {
    "baselines": ["Naive", "Linear", "RandomForest", "XGBoost"],
    "deep_learning": ["lstm", "gru", "cnn1d"]
}

REGIME_NAMES = {
    "Bull": "📈 Bullish",
    "Bear": "📉 Bearish", 
    "Sideways": "↔️ Sideways",
    "High_Volatility": "⚡ High Volatility"
}

# ─── CACHED DATA LOADERS ───
@st.cache_data(show_spinner=False)
def load_raw_data():
    """Load raw BTC/USDT 5-minute candle data."""
    raw_path = DATA_DIR / "raw" / "btcusdt_5m_raw.csv"
    if not raw_path.exists():
        return None
    df = pd.read_csv(raw_path)
    df['timestamp'] = pd.to_datetime(df['timestamp'], utc=True)
    return df.sort_values('timestamp').reset_index(drop=True)

@st.cache_data(show_spinner=False)
def load_feature_data():
    """Load processed feature data."""
    feat_path = DATA_DIR / "processed" / "btcusdt_5m_features.csv"
    if not feat_path.exists():
        return None
    df = pd.read_csv(feat_path)
    df['timestamp'] = pd.to_datetime(df['timestamp'], utc=True)
    return df.sort_values('timestamp').reset_index(drop=True)

@st.cache_data(show_spinner=False)
def load_ablation_results():
    """Load ablation study results."""
    path = EXPERIMENTS_DIR / "ablation_results_final.json"
    if not path.exists():
        return None
    with open(path, 'r') as f:
        return json.load(f)

@st.cache_data(show_spinner=False)
def load_regime_results():
    """Load regime analysis results."""
    path = EXPERIMENTS_DIR / "regime_analysis_results.json"
    if not path.exists():
        return None
    with open(path, 'r') as f:
        return json.load(f)

@st.cache_data(show_spinner=False)
def load_statistical_results():
    """Load statistical significance results."""
    path = EXPERIMENTS_DIR / "statistical_significance.json"
    if not path.exists():
        return None
    with open(path, 'r') as f:
        return json.load(f)

@st.cache_data(show_spinner=False)
def get_available_figures():
    """Get list of available figure files."""
    figs = {}
    if REPORTS_DIR.exists():
        for fig_file in REPORTS_DIR.rglob("*.png"):
            figs[fig_file.stem] = fig_file
    return figs

# ─── HELPER FUNCTIONS ───
def format_metric(value, decimals=4):
    """Format metric value for display."""
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return "N/A"
    return f"{value:.{decimals}f}"

def create_price_chart(df, indicators=None, height=600):
    """Create interactive candlestick chart with optional indicators."""
    fig = make_subplots(
        rows=2, cols=1,
        shared_xaxes=True,
        vertical_spacing=0.03,
        row_heights=[0.7, 0.3],
        subplot_titles=("BTC/USDT Price (5-min candles)", "Volume")
    )
    
    # Candlestick
    fig.add_trace(
        go.Candlestick(
            x=df['timestamp'],
            open=df['open'],
            high=df['high'],
            low=df['low'],
            close=df['close'],
            name="Price",
            increasing_line_color='#2ca02c',
            decreasing_line_color='#d62728'
        ),
        row=1, col=1
    )
    
    # Add indicators if provided
    if indicators:
        for name in indicators:
            if name in df.columns:
                fig.add_trace(
                    go.Scatter(
                        x=df['timestamp'],
                        y=df[name],
                        name=name,
                        mode='lines',
                        line={"width": 1}
                    ),
                    row=1, col=1
                )
    
    # Volume bars
    colors = ['#2ca02c' if c >= o else '#d62728' for o, c in zip(df['open'], df['close'])]
    fig.add_trace(
        go.Bar(
            x=df['timestamp'],
            y=df['volume'],
            name="Volume",
            marker_color=colors,
            opacity=0.7
        ),
        row=2, col=1
    )
    
    fig.update_layout(
        height=height,
        xaxis_rangeslider_visible=False,
        template="plotly_white",
        legend={"orientation": "h", "yanchor": "bottom", "y": 1.02, "xanchor": "right", "x": 1},
        margin={"l": 50, "r": 50, "t": 50, "b": 50}
    )
    
    fig.update_yaxes(title_text="Price (USDT)", row=1, col=1)
    fig.update_yaxes(title_text="Volume", row=2, col=1)
    
    return fig

def create_metric_comparison_chart(results, experiment, metric="mae", task="regression"):
    """Create bar chart comparing models on a specific metric."""
    models_data = []
    
    # Baselines
    for model_name, model_data in results.get("baselines", {}).items():
        val = model_data.get("test", {}).get(metric)
        if val is not None and not np.isnan(val):
            models_data.append({
                "Model": model_name,
                "Family": "Baseline",
                metric.upper(): val
            })
    
    # Deep Learning
    for model_name, model_data in results.get("deep_learning", {}).items():
        val = model_data.get("test", {}).get(metric)
        if val is not None and not np.isnan(val):
            models_data.append({
                "Model": model_name.upper(),
                "Family": "Deep Learning",
                metric.upper(): val
            })
    
    if not models_data:
        return None
    
    df = pd.DataFrame(models_data)
    df = df.sort_values(metric.upper(), ascending=(metric in ["mae", "rmse", "mape"]))
    
    colors = ['#1f77b4' if f == "Baseline" else '#d62728' for f in df["Family"]]
    
    fig = go.Figure(data=[
        go.Bar(
            x=df["Model"],
            y=df[metric.upper()],
            marker_color=colors,
            text=[format_metric(v) for v in df[metric.upper()]],
            textposition='auto'
        )
    ])
    
    fig.update_layout(
        title=f"{metric.upper()} Comparison - {EXPERIMENT_CONFIGS[experiment]['name']} ({task.title()})",
        xaxis_title="Model",
        yaxis_title=metric.upper(),
        template="plotly_white",
        height=400,
        margin={"l": 50, "r": 50, "t": 60, "b": 50}
    )
    
    return fig

def create_regime_comparison_chart(regime_results, experiment, metric="mae"):
    """Create chart showing model performance across regimes."""
    data = regime_results.get("by_feature_set", {}).get(experiment, {})
    if not data:
        return None
    
    regimes = []
    baseline_vals = {}
    dl_vals = {}
    
    for regime_key, regime_label in REGIME_NAMES.items():
        # Baselines - find best
        best_baseline_val = None
        for model_name, model_data in data.get("baseline_metrics_by_regime", {}).items():
            if model_name == "Naive":  # Use Naive as reference
                val = model_data.get(regime_key, {}).get(metric)
                if val is not None and not np.isnan(val):
                    best_baseline_val = val
                    break
        
        # DL - use the reported best DL
        _ = data.get("best_dl", "lstm")  # Not used but kept for reference
        dl_val = data.get("dl_metrics_by_regime", {}).get(regime_key, {}).get(metric)
        
        if best_baseline_val is not None or (dl_val is not None and not np.isnan(dl_val)):
            regimes.append(regime_label)
            baseline_vals[regime_label] = best_baseline_val
            dl_vals[regime_label] = dl_val if dl_val is not None and not np.isnan(dl_val) else None
    
    if not regimes:
        return None
    
    fig = go.Figure()
    
    # Baseline trace
    baseline_y = [baseline_vals.get(r) for r in regimes]
    if any(v is not None for v in baseline_y):
        fig.add_trace(go.Bar(
            x=regimes,
            y=baseline_y,
            name="Naive Baseline",
            marker_color='#1f77b4',
            text=[format_metric(v) if v else "N/A" for v in baseline_y],
            textposition='auto'
        ))
    
    # DL trace
    dl_y = [dl_vals.get(r) for r in regimes]
    if any(v is not None for v in dl_y):
        fig.add_trace(go.Bar(
            x=regimes,
            y=dl_y,
            name=f"Best DL ({data.get('best_dl', 'lstm').upper()})",
            marker_color='#d62728',
            text=[format_metric(v) if v else "N/A" for v in dl_y],
            textposition='auto'
        ))
    
    fig.update_layout(
        title=f"{metric.upper()} by Market Regime - {EXPERIMENT_CONFIGS[experiment]['name']}",
        xaxis_title="Market Regime",
        yaxis_title=metric.upper(),
        template="plotly_white",
        height=400,
        barmode='group',
        margin={"l": 50, "r": 50, "t": 60, "b": 50}
    )
    
    return fig

# ─── SIDEBAR ───
st.sidebar.title("🔬 CryptoAnalyzer")
st.sidebar.markdown("**BTC/USDT 5-min Prediction Research**")

page = st.sidebar.radio(
    "Navigation",
    ["📈 Data Explorer", "🤖 Model Performance", "📊 Regime Analysis", "📋 Statistical Tests", "📚 Reports"],
    index=0
)

# ─── MAIN APP EXECUTION ───
# Only run main app logic when executing under Streamlit (not during import)
def main():
    """Main Streamlit app entry point."""
    # Load data
    raw_data = load_raw_data()
    feature_data = load_feature_data()
    ablation_results = load_ablation_results()
    regime_results = load_regime_results()
    statistical_results = load_statistical_results()
    available_figures = get_available_figures()

    # ─── PAGE: DATA EXPLORER ───
    if page == "📈 Data Explorer":
        st.header("📈 BTC/USDT Data Explorer")
        
        if raw_data is None:
            st.error("Raw data not found. Please run Phase 2 data pipeline first.")
            st.stop()
        
        # Data overview
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Total Candles", f"{len(raw_data):,}")
        with col2:
            st.metric("Date Range", f"{raw_data['timestamp'].min().strftime('%Y-%m-%d')} to {raw_data['timestamp'].max().strftime('%Y-%m-%d')}")
        with col3:
            st.metric("Price Range", f"${raw_data['low'].min():,.2f} - ${raw_data['high'].max():,.2f}")
        with col4:
            st.metric("Avg Volume", f"{raw_data['volume'].mean():,.0f}")
        
        # Time range selector
        st.subheader("📅 Time Range Selection")
        date_range = st.date_input(
            "Select date range",
            value=(raw_data['timestamp'].min().date(), raw_data['timestamp'].max().date()),
            min_value=raw_data['timestamp'].min().date(),
            max_value=raw_data['timestamp'].max().date()
        )
        
        if len(date_range) == 2:
            start_date = pd.Timestamp(date_range[0], tz='UTC')
            end_date = pd.Timestamp(date_range[1], tz='UTC') + pd.Timedelta(days=1)
            mask = (raw_data['timestamp'] >= start_date) & (raw_data['timestamp'] < end_date)
            display_data = raw_data[mask].copy()
            
            if len(display_data) > 0:
                # Downsample for performance if too many points
                max_points = 5000
                if len(display_data) > max_points:
                    step = len(display_data) // max_points
                    display_data = display_data.iloc[::step].copy()
                    st.info(f"Downsampled to {max_points} points for performance.")
                
                # Indicator selection
                st.subheader("📊 Technical Indicators")
                available_indicators = []
                if feature_data is not None:
                    indicator_cols = [c for c in feature_data.columns if c not in ['timestamp', 'open', 'high', 'low', 'close', 'volume']]
                    available_indicators = indicator_cols[:20]  # Limit display
                    
                selected_indicators = st.multiselect(
                    "Select indicators to overlay",
                    available_indicators,
                    default=[],
                    help="Select up to 5 indicators for clarity"
                )[:5]
                
                indicators_dict = {}
                if feature_data is not None and selected_indicators:
                    # Merge selected indicators
                    feat_subset = feature_data[feature_data['timestamp'].between(start_date, end_date)]
                    for ind in selected_indicators:
                        if ind in feat_subset.columns:
                            indicators_dict[ind] = feat_subset[ind].values
                
                # Plot
                fig = create_price_chart(display_data, indicators_dict)
                st.plotly_chart(fig, use_container_width=True)
                
                # Data table
                with st.expander("📋 Raw Data Preview"):
                    st.dataframe(display_data.tail(20), use_container_width=True)
            else:
                st.warning("No data in selected range.")

    # ─── PAGE: MODEL PERFORMANCE ───
    elif page == "🤖 Model Performance":
        st.header("🤖 Model Performance Comparison")
        
        if ablation_results is None:
            st.error("Ablation results not found. Please run Phase 7 and Phase 9 first.")
            st.stop()
        
        # Experiment selector
        experiment = st.selectbox(
            "Select Feature Set (Experiment)",
            list(EXPERIMENT_CONFIGS.keys()),
            format_func=lambda x: f"{EXPERIMENT_CONFIGS[x]['name']} (K={EXPERIMENT_CONFIGS[x]['features']})",
            index=3
        )
        
        exp_data = ablation_results.get("experiments", {}).get(experiment, {})
        if not exp_data:
            st.error(f"No data for {experiment}")
            st.stop()
        
        # Task selector
        task = st.radio("Task Type", ["regression", "classification"], horizontal=True)
        
        # Metrics selector
        if task == "regression":
            metrics = ["mae", "rmse", "mape"]
        else:
            metrics = ["accuracy", "precision", "recall", "f1", "directional_accuracy"]
        
        selected_metric = st.selectbox("Primary Metric", metrics, index=0)
        
        # ─── METRICS TABLE ───
        st.subheader("📊 Test Set Metrics Table")
        
        table_data = []
        
        # Baselines
        for model_name, model_data in exp_data.get("baselines", {}).items():
            test_metrics = model_data.get("test", {})
            row = {"Model": model_name, "Type": "Baseline"}
            for m in metrics:
                row[m.upper()] = format_metric(test_metrics.get(m))
            table_data.append(row)
        
        # Deep Learning
        for model_name, model_data in exp_data.get("deep_learning", {}).items():
            test_metrics = model_data.get("test", {})
            row = {"Model": model_name.upper(), "Type": "Deep Learning"}
            for m in metrics:
                row[m.upper()] = format_metric(test_metrics.get(m))
            row["Params"] = f"{model_data.get('n_params', 0):,}"
            table_data.append(row)
        
        if table_data:
            df_table = pd.DataFrame(table_data)
            st.dataframe(df_table, use_container_width=True, hide_index=True)
        
        # ─── COMPARISON CHART ───
        st.subheader(f"📈 {selected_metric.upper()} Comparison")
        
        fig = create_metric_comparison_chart(exp_data, experiment, selected_metric, task)
        if fig:
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.warning("No data available for selected metric.")
        
        # ─── ALL METRICS RADAR CHART ───
        st.subheader("🎯 Multi-Metric Radar Comparison (Top Models)")
        
        # Select top 3 models by primary metric
        model_scores = []
        for model_name, model_data in exp_data.get("baselines", {}).items():
            val = model_data.get("test", {}).get(selected_metric)
            if val is not None and not np.isnan(val):
                model_scores.append((model_name, "Baseline", val))
        for model_name, model_data in exp_data.get("deep_learning", {}).items():
            val = model_data.get("test", {}).get(selected_metric)
            if val is not None and not np.isnan(val):
                model_scores.append((model_name.upper(), "Deep Learning", val))
        
        model_scores.sort(key=lambda x: x[2], reverse=(selected_metric not in ["mae", "rmse", "mape"]))
        top_models = model_scores[:4]
        
        if top_models:
            fig_radar = go.Figure()
            
            for model_name, model_type, _ in top_models:
                # Get model data
                if model_type == "Baseline":
                    mdata = exp_data["baselines"][model_name].get("test", {})
                else:
                    mdata = exp_data["deep_learning"][model_name.lower()].get("test", {})
                
                values = [mdata.get(m, 0) for m in metrics]
                # Normalize for radar (0-1 scale)
                max_vals = {"mae": 2, "rmse": 2, "mape": 2000, "accuracy": 1, "precision": 1, "recall": 1, "f1": 1, "directional_accuracy": 1}
                norm_values = [min(v / max_vals.get(m, 1), 1) for v, m in zip(values, metrics)]
                
                fig_radar.add_trace(go.Scatterpolar(
                    r=norm_values,
                    theta=[m.upper() for m in metrics],
                    fill='toself',
                    name=f"{model_name} ({model_type})",
                    opacity=0.6
                ))
            
            fig_radar.update_layout(
                polar={"radialaxis": {"visible": True, "range": [0, 1]}},
                template="plotly_white",
                height=500,
                title="Normalized Metric Comparison (higher=better for all)"
            )
            st.plotly_chart(fig_radar, use_container_width=True)

    # ─── PAGE: REGIME ANALYSIS ───
    elif page == "📊 Regime Analysis":
        st.header("📊 Market Regime Analysis")
        
        if regime_results is None:
            st.error("Regime analysis results not found. Please run Phase 8 first.")
            st.stop()
        
        # Regime distribution
        st.subheader("📈 Overall Regime Distribution (Full Dataset)")
        dist = regime_results.get("regime_distribution", {})
        
        if dist:
            regime_df = pd.DataFrame([
                {
                    "Regime": REGIME_NAMES.get(k, k),
                    "Count": v.get("count", 0),
                    "Percentage": f"{v.get('percentage', 0):.1f}%",
                    "Avg Return": format_metric(v.get("avg_return", 0), 4),
                    "Avg Volatility": format_metric(v.get("avg_volatility", 0), 4)
                }
                for k, v in dist.items() if v.get("count", 0) > 0
            ])
            st.dataframe(regime_df, use_container_width=True, hide_index=True)
            
            # Pie chart
            fig_pie = go.Figure(data=[go.Pie(
                labels=[REGIME_NAMES.get(k, k) for k, v in dist.items() if v.get("count", 0) > 0],
                values=[v.get("count", 0) for k, v in dist.items() if v.get("count", 0) > 0],
                hole=0.4,
                marker_colors=['#2ca02c', '#d62728', '#7f7f7f', '#ff7f0e', '#9467bd'][:len(dist)]
            )])
            fig_pie.update_layout(title="Market Regime Distribution", height=400)
            st.plotly_chart(fig_pie, use_container_width=True)
        
        # Experiment selector for regime breakdown
        st.subheader("🔍 Model Performance by Regime")
        experiment = st.selectbox(
            "Select Feature Set",
            list(EXPERIMENT_CONFIGS.keys()),
            format_func=lambda x: EXPERIMENT_CONFIGS[x]['name'],
            index=3,
            key="regime_exp"
        )
        
        exp_regime_data = regime_results.get("by_feature_set", {}).get(experiment, {})
        if not exp_regime_data:
            st.error(f"No regime data for {experiment}")
            st.stop()
        
        # Test regime counts
        test_counts = exp_regime_data.get("test_regime_counts", {})
        if test_counts:
            st.write("**Test Partition Regime Counts:**")
            test_df = pd.DataFrame([
                {"Regime": REGIME_NAMES.get(k, k), "Test Samples": v}
                for k, v in test_counts.items() if v > 0
            ])
            st.dataframe(test_df, use_container_width=True, hide_index=True)
        
        # Metric selector
        regime_metric = st.selectbox(
            "Metric",
            ["mae", "rmse", "mape", "accuracy", "f1", "directional_accuracy"],
            index=0,
            key="regime_metric"
        )
        
        fig_regime = create_regime_comparison_chart(regime_results, experiment, regime_metric)
        if fig_regime:
            st.plotly_chart(fig_regime, use_container_width=True)
        else:
            st.warning("No regime comparison data available.")
        
        # Detailed regime tables
        with st.expander("📋 Detailed Regime Metrics"):
            st.write("**Baseline Models by Regime**")
            baseline_regime = exp_regime_data.get("baseline_metrics_by_regime", {})
            for model_name in exp_regime_data.get("baselines", {}):
                if model_name in baseline_regime:
                    st.write(f"**{model_name}**")
                    model_regime_df = pd.DataFrame([
                        {
                            "Regime": REGIME_NAMES.get(r, r),
                            "MAE": format_metric(m.get("mae")),
                            "RMSE": format_metric(m.get("rmse")),
                            "Accuracy": format_metric(m.get("accuracy")),
                            "F1": format_metric(m.get("f1")),
                            "Dir. Acc": format_metric(m.get("directional_accuracy"))
                        }
                        for r, m in baseline_regime[model_name].items() if m.get("count", 0) > 0
                    ])
                    if not model_regime_df.empty:
                        st.dataframe(model_regime_df, use_container_width=True, hide_index=True)
            
            st.write("**Deep Learning Models by Regime**")
            dl_regime = exp_regime_data.get("dl_metrics_by_regime", {})
            for model_name in ["lstm", "gru", "cnn1d"]:
                if model_name in exp_regime_data.get("deep_learning", {}):
                    st.write(f"**{model_name.upper()}**")
                    if model_name in dl_regime:
                        model_regime_df = pd.DataFrame([
                            {
                                "Regime": REGIME_NAMES.get(r, r),
                                "MAE": format_metric(m.get("mae")),
                                "RMSE": format_metric(m.get("rmse")),
                                "Accuracy": format_metric(m.get("accuracy")),
                                "F1": format_metric(m.get("f1")),
                                "Dir. Acc": format_metric(m.get("directional_accuracy"))
                            }
                            for r, m in dl_regime[model_name].items() if m.get("count", 0) > 0
                        ])
                        if not model_regime_df.empty:
                            st.dataframe(model_regime_df, use_container_width=True, hide_index=True)

    # ─── PAGE: STATISTICAL TESTS ───
    elif page == "📋 Statistical Tests":
        st.header("📋 Statistical Significance Tests")
        st.markdown("""
        Paired Wilcoxon signed-rank tests with Holm step-down correction (α=0.05).
        Tests compare model performance differences on the test partition (N=1,282 samples).
        """)
        
        if statistical_results is None:
            st.warning("Statistical significance results not yet generated. Run Phase 9 scripts to compute.")
            st.info("Expected file: `experiments/results/statistical_significance.json`")
        else:
            # Feature ablation significance
            st.subheader("🔬 Feature Ablation Significance (H2: Feature Efficacy)")
            feat_tests = statistical_results.get("feature_ablation", {})
            
            if feat_tests:
                for comparison, results in feat_tests.items():
                    with st.expander(f"📊 {comparison}"):
                        for task in ["regression", "classification"]:
                            if task in results:
                                st.write(f"**{task.title()}**")
                                task_data = results[task]
                                sig_df = pd.DataFrame([
                                    {
                                        "Metric": m,
                                        "Statistic": format_metric(v.get("statistic")),
                                        "P-value": format_metric(v.get("p_value"), 6),
                                        "Significant": "✅ Yes" if v.get("significant") else "❌ No",
                                        "Effect Size": format_metric(v.get("effect_size"), 4)
                                    }
                                    for m, v in task_data.items()
                                ])
                                st.dataframe(sig_df, use_container_width=True, hide_index=True)
            
            # Model comparison significance
            st.subheader("🏗️ Model Architecture Significance (H2: Architecture Efficacy)")
            model_tests = statistical_results.get("model_comparison", {})
            
            if model_tests:
                for comparison, results in model_tests.items():
                    with st.expander(f"📊 {comparison}"):
                        for task in ["regression", "classification"]:
                            if task in results:
                                st.write(f"**{task.title()}**")
                                task_data = results[task]
                                sig_df = pd.DataFrame([
                                    {
                                        "Metric": m,
                                        "Statistic": format_metric(v.get("statistic")),
                                        "P-value": format_metric(v.get("p_value"), 6),
                                        "Significant": "✅ Yes" if v.get("significant") else "❌ No",
                                        "Effect Size": format_metric(v.get("effect_size"), 4)
                                    }
                                    for m, v in task_data.items()
                                ])
                                st.dataframe(sig_df, use_container_width=True, hide_index=True)

    # ─── PAGE: REPORTS ───
    elif page == "📚 Reports":
        st.header("📚 Generated Reports & Figures")
        
        # Tables
        st.subheader("📋 Markdown Tables")
        tables_dir = REPORTS_DIR / "tables"
        if tables_dir.exists():
            table_files = sorted(tables_dir.glob("*.md"))
            for table_file in table_files:
                with st.expander(f"📄 {table_file.name}"):
                    with open(table_file, 'r') as f:
                        content = f.read()
                    st.markdown(content)
        else:
            st.info("No markdown tables found in reports/tables/")
        
        # Figures
        st.subheader("📈 Generated Figures")
        if available_figures:
            cols = st.columns(2)
            for idx, (name, path) in enumerate(available_figures.items()):
                with cols[idx % 2]:
                    st.image(str(path), caption=name.replace('_', ' ').title(), use_container_width=True)
        else:
            st.info("No figures found in reports/figures/")
        
        # Summary files
        st.subheader("📄 Summary Files")
        summary_files = list(EXPERIMENTS_DIR.glob("*summary*.txt"))
        for sf in summary_files:
            with st.expander(f"📄 {sf.name}"), open(sf, 'r') as f:
                st.text(f.read())

    # ─── FOOTER ───
    st.markdown("---")
    st.markdown("""
    <div style="text-align: center; color: #666; padding: 1rem;">
        <p><strong>CryptoAnalyzer</strong> - BTC/USDT 1-Hour Horizon Prediction Research</p>
        <p>Phases 0-9 Complete | Phase 10: Interactive Dashboard</p>
        <p style="font-size: 0.85rem;">📅 Data: Binance Spot BTC/USDT 5-min candles | 
        🔬 Models: 7 architectures × 4 feature sets × 2 tasks | 
        ⚠️ <strong>Research Only - Not Financial Advice</strong></p>
    </div>
    """, unsafe_allow_html=True)


# Execute main app when running under Streamlit
if __name__ == "__main__" or hasattr(st, '_is_running_with_streamlit'):
    main()