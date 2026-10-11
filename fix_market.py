import re

with open(r'D:\CryptoAnalyzer\backend\api\market.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the CIRCULATING_SUPPLY dictionary
content = re.sub(r'# Circulating supply estimates for major coins \(approximate values\)\nCIRCULATING_SUPPLY = \{[^}]+\}\n\n', '', content, flags=re.DOTALL)

# Replace the get_coin_details function
old_func = '''@router.get("/coins/{symbol}")
async def get_coin_details(symbol: str):
    """Get detailed information for a specific coin."""
    try:
        binance_client = BinanceRestClient()
        ticker = binance_client.get_24h_ticker(f"{symbol.upper()}USDT")
        
        if ticker:
            price = float(ticker.get("lastPrice", 0))
            supply = CIRCULATING_SUPPLY.get(symbol.upper(), 0)
            market_cap = price * supply if supply > 0 else 0
            
            return {
                "symbol": symbol.upper(),
                "name": symbol.upper(),
                "price": price,
                "change24h": float(ticker.get("priceChangePercent", 0)),
                "volume24h": float(ticker.get("volume", 0)) * price,
                "high24h": float(ticker.get("highPrice", 0)),
                "low24h": float(ticker.get("lowPrice", 0)),
                "bid": float(ticker.get("bidPrice", 0)),
                "ask": float(ticker.get("askPrice", 0)),
                "marketCap": market_cap,
            }
    except Exception as e:
        logger.warning(f"Failed to get coin details: {e}")
    
    raise HTTPException(status_code=404, detail=f"Coin {symbol} not found")'''

new_func = '''@router.get("/coins/{symbol}")
async def get_coin_details(symbol: str):
    """Get detailed information for a specific coin."""
    try:
        binance_client = BinanceRestClient()
        ticker = binance_client.get_24h_ticker(f"{symbol.upper()}USDT")
        
        if ticker:
            price = float(ticker.get("lastPrice", 0))
            
            return {
                "symbol": symbol.upper(),
                "name": symbol.upper(),
                "price": price,
                "change24h": float(ticker.get("priceChangePercent", 0)),
                "volume24h": float(ticker.get("volume", 0)) * price,
                "high24h": float(ticker.get("highPrice", 0)),
                "low24h": float(ticker.get("lowPrice", 0)),
                "bid": float(ticker.get("bidPrice", 0)),
                "ask": float(ticker.get("askPrice", 0)),
            }
    except Exception as e:
        logger.warning(f"Failed to get coin details: {e}")
    
    raise HTTPException(status_code=404, detail=f"Coin {symbol} not found")'''

content = content.replace(old_func, new_func)

with open(r'D:\CryptoAnalyzer\backend\api\market.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')