#!/usr/bin/env python3
"""
HDFC MIDCAP OPPORTUNITIES FUND - Live Tracker
Fetches live prices from NSE and calculates fund's real-time gain/loss.
"""

import pandas as pd
import yfinance as yf
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Mapping of stock names to NSE ticker symbols
STOCK_TICKER_MAP = {
    "Max Financial Services Ltd": "MFSL.NS",
    "AU Small Finance Bank Ltd": "AUBANK.NS",
    "The Federal Bank Ltd": "FEDERALBNK.NS",
    "Indian Bank": "INDIANB.NS",
    "Balkrishna Industries Ltd": "BALKRISIND.NS",
    "Coforge Ltd": "COFORGE.NS",
    "Ipca Laboratories Ltd": "IPCALAB.NS",
    "Fortis Healthcare Ltd": "FORTIS.NS",
    "Hindustan Petroleum Corp Ltd": "HINDPETRO.NS",
    "Glenmark Pharmaceuticals Ltd": "GLENMARK.NS",
    "Mahindra & Mahindra Financial Services Ltd": "M&MFIN.NS",
    "Apollo Tyres Ltd": "APOLLOTYRE.NS",
    "Persistent Systems Ltd": "PERSISTENT.NS",
    "Vishal Mega Mart Ltd": "VMM.NS",
    "Tata Communications Ltd": "TATACOMM.NS",
    "Cummins India Ltd": "CUMMINSIND.NS",
    "Marico Ltd": "MARICO.NS",
    "Aurobindo Pharma Ltd": "AUROPHARMA.NS",
    "Jindal Steel Ltd": "JINDALSTEL.NS",
    "Union Bank of India": "UNIONBANK.NS",
    "Bosch Ltd": "BOSCHLTD.NS",
    "PB Fintech Ltd": "POLICYBZR.NS",
    "Delhivery Ltd": "DELHIVERY.NS",
    "AIA Engineering Ltd": "AIAENG.NS",
    "Dabur India Ltd": "DABUR.NS",
    "Mphasis Ltd": "MPHASIS.NS",
    "Indian Hotels Co Ltd": "INDHOTEL.NS",
    "Hexaware Technologies Ltd Ordinary Shares": "HEXT.NS",
    "Eternal Ltd": "ETERNAL.NS",
    "Coromandel International Ltd": "COROMANDEL.NS",
    "Gland Pharma Ltd": "GLAND.NS",
    "Alkem Laboratories Ltd": "ALKEM.NS",
    "Indraprastha Gas Ltd": "IGL.NS",
    "Star Health and Allied Insurance Co Ltd": "STARHEALTH.NS",
    "Redington Ltd": "REDINGTON.NS",
    "Karur Vysya Bank Ltd": "KARURVYSYA.NS",
    "Bharat Forge Ltd": "BHARATFORG.NS",
    "Escorts Kubota Ltd": "ESCORTS.NS",
    "ACC Ltd": "ACC.NS",
    "Nippon Life India Asset Management Ltd Ordinary Shares": "NAM-INDIA.NS",
    "IndusInd Bank Ltd": "INDUSINDBK.NS",
    "Godrej Consumer Products Ltd": "GODREJCP.NS",
    "Crompton Greaves Consumer Electricals Ltd": "CROMPTON.NS",
    "Dixon Technologies (India) Ltd": "DIXON.NS",
    "City Union Bank Ltd": "CUB.NS",
    "Timken India Ltd": "TIMKEN.NS",
    "Sundaram Fasteners Ltd": "SUNDRMFAST.NS",
    "KEC International Ltd": "KEC.NS",
    "United Spirits Ltd": "UNITDSPR.NS",
    "Supreme Industries Ltd": "SUPREMEIND.NS",
    "Sona BLW Precision Forgings Ltd": "SONACOMS.NS",
    "Gujarat Fluorochemicals Ltd Ordinary Shares": "FLUOROCHEM.NS",
    "SKF India Ltd": "SKFINDIA.NS",
    "Cholamandalam Financial Holdings Ltd": "CHOLAHLDNG.NS",
    "Emami Ltd": "EMAMILTD.NS",
    "Greenlam Industries Ltd": "GREENLAM.NS",
    "Vesuvius India Ltd": "VESUVIUS.NS",
    "Ceat Ltd": "CEATLTD.NS",
    "Symphony Ltd": "SYMPHONY.NS",
    "Vardhman Textiles Ltd": "VTL.NS",
    "Aarti Industries Ltd": "AARTIIND.NS",
    "Arvind Ltd": "ARVIND.NS",
    "Oracle Financial Services Software Ltd": "OFSS.NS",
    "ICICI Lombard General Insurance Co Ltd": "ICICIGI.NS",
    "Bharti Hexacom Ltd": "BHARTIHEXA.NS",
    "Navneet Education Ltd": "NAVNETEDUL.NS",
    "Five-Star Business Finance Ltd": "FIVESTAR.NS",
    "Colgate-Palmolive (India) Ltd": "COLPAL.NS",
    "KNR Constructions Ltd": "KNRCON.NS",
    "LG Electronics India Ltd": "LGEINDIA.NS",
    "Greenply Industries Ltd": "GREENPLY.NS",
    "Dhanuka Agritech Ltd": "DHANUKA.NS",
    "Greenpanel Industries Ltd Ordinary Shares": "GREENPANEL.NS",
    "Jagran Prakashan Ltd": "JAGRAN.NS",
    "SKF India (Industrial) Limited **": "SKFINDUS.NS",
    "Billionbrains Garage Ventures Ltd": "GROWW.NS",
}


def load_holdings(csv_path: str) -> pd.DataFrame:
    """Load fund holdings from CSV file."""
    df = pd.read_csv(csv_path)
    
    # Clean weightage column - remove % and convert to float
    df['Weight'] = df['Weightage'].str.replace('%', '').astype(float)
    
    # Clean value column - remove commas
    df['Value'] = df['Value (Cr)'].astype(str).str.replace(',', '').astype(float)
    
    return df


def get_ticker_symbol(stock_name: str) -> str:
    """Get NSE ticker symbol for a stock name."""
    return STOCK_TICKER_MAP.get(stock_name, None)


def fetch_live_prices(tickers: list) -> dict:
    """Fetch live prices for all tickers."""
    prices = {}
    
    print(f"\n📈 Fetching live prices for {len(tickers)} stocks...")
    print("-" * 60)
    
    for i, ticker in enumerate(tickers):
        if ticker is None:
            continue
            
        try:
            stock = yf.Ticker(ticker)
            
            # Try fast_info first
            try:
                info = stock.fast_info
                current_price = info.get('lastPrice') or info.get('regularMarketPrice')
                prev_close = info.get('previousClose') or info.get('regularMarketPreviousClose')
                
                if current_price and prev_close:
                    day_change = ((current_price - prev_close) / prev_close) * 100
                    prices[ticker] = {
                        'current_price': round(current_price, 2),
                        'prev_close': round(prev_close, 2),
                        'day_change_pct': round(day_change, 2)
                    }
                    continue
            except:
                pass
            
            # Fallback to history
            hist = stock.history(period='5d')
            if len(hist) >= 2:
                prev_close = hist['Close'].iloc[-2]
                current_price = hist['Close'].iloc[-1]
                day_change = ((current_price - prev_close) / prev_close) * 100
                prices[ticker] = {
                    'current_price': round(current_price, 2),
                    'prev_close': round(prev_close, 2),
                    'day_change_pct': round(day_change, 2)
                }
            elif len(hist) == 1:
                current_price = hist['Close'].iloc[-1]
                prices[ticker] = {
                    'current_price': round(current_price, 2),
                    'prev_close': round(current_price, 2),
                    'day_change_pct': 0.0
                }
                
        except Exception as e:
            print(f"  ⚠️  Error fetching {ticker}: {str(e)[:50]}")
    
    print(f"✅ Successfully fetched prices for {len(prices)} stocks")
    return prices


def calculate_fund_performance(holdings: pd.DataFrame, prices: dict) -> dict:
    """Calculate weighted fund performance."""
    
    results = []
    total_weighted_change = 0
    total_weight_tracked = 0
    
    for _, row in holdings.iterrows():
        stock_name = row['Stock Name']
        weight = row['Weight']
        sector = row['Sector'] if pd.notna(row['Sector']) else ''
        
        # Skip non-stock holdings
        if stock_name in ['Treps - Tri-Party Repo', 'Net Current Assets']:
            continue
        
        ticker = get_ticker_symbol(stock_name)
        
        if ticker and ticker in prices:
            price_data = prices[ticker]
            day_change = price_data['day_change_pct']
            contribution = (weight / 100) * day_change
            
            results.append({
                'Stock': stock_name[:35] + '...' if len(stock_name) > 35 else stock_name,
                'Ticker': ticker.replace('.NS', ''),
                'Sector': sector[:20] if sector else '',
                'Weight': weight,
                'Price': price_data['current_price'],
                'Prev Close': price_data['prev_close'],
                'Day Change %': day_change,
                'Contribution %': round(contribution, 4)
            })
            
            total_weighted_change += contribution
            total_weight_tracked += weight
    
    return {
        'holdings': pd.DataFrame(results),
        'fund_change_pct': round(total_weighted_change, 4),
        'weight_tracked': round(total_weight_tracked, 2)
    }


def display_results(results: dict):
    """Display fund performance in a nice format."""
    
    print("\n" + "=" * 80)
    print("        💰 HDFC MIDCAP OPPORTUNITIES FUND - LIVE TRACKER 💰")
    print("=" * 80)
    print(f"⏰ Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S IST')}")
    print("=" * 80)
    
    holdings_df = results['holdings']
    
    if holdings_df.empty:
        print("❌ No holdings data available")
        return
    
    # Sort by weight (highest first)
    holdings_df = holdings_df.sort_values('Weight', ascending=False)
    
    # Top Gainers
    print("\n🟢 TOP 10 GAINERS TODAY:")
    print("-" * 80)
    top_gainers = holdings_df.nlargest(10, 'Day Change %')
    for _, row in top_gainers.iterrows():
        change = row['Day Change %']
        if change > 0:
            print(f"   📈 {row['Ticker']:<15} +{change:>6.2f}%  (Weight: {row['Weight']:.2f}%, Contrib: +{row['Contribution %']:.3f}%)")
    
    # Top Losers
    print("\n🔴 TOP 10 LOSERS TODAY:")
    print("-" * 80)
    top_losers = holdings_df.nsmallest(10, 'Day Change %')
    for _, row in top_losers.iterrows():
        change = row['Day Change %']
        if change < 0:
            print(f"   📉 {row['Ticker']:<15} {change:>6.2f}%  (Weight: {row['Weight']:.2f}%, Contrib: {row['Contribution %']:.3f}%)")
    
    # Sector Performance
    print("\n📊 SECTOR BREAKDOWN:")
    print("-" * 80)
    sector_perf = holdings_df.groupby('Sector').agg({
        'Weight': 'sum',
        'Contribution %': 'sum'
    }).sort_values('Weight', ascending=False)
    
    for sector, row in sector_perf.iterrows():
        if sector:
            indicator = "🟢" if row['Contribution %'] >= 0 else "🔴"
            sign = "+" if row['Contribution %'] >= 0 else ""
            print(f"   {indicator} {sector:<25} Weight: {row['Weight']:>5.2f}%  |  Contrib: {sign}{row['Contribution %']:.3f}%")
    
    # Holdings Detail Table
    print("\n📋 HOLDINGS DETAIL (Top 25 by Weight):")
    print("-" * 80)
    print(f"{'Ticker':<12} {'Sector':<18} {'Weight':>7} {'Price':>10} {'Change':>8} {'Contrib':>10}")
    print("-" * 80)
    
    for _, row in holdings_df.head(25).iterrows():
        change = row['Day Change %']
        contrib = row['Contribution %']
        change_str = f"{'+' if change >= 0 else ''}{change:.2f}%"
        contrib_str = f"{'+' if contrib >= 0 else ''}{contrib:.3f}%"
        
        print(f"{row['Ticker']:<12} {row['Sector']:<18} {row['Weight']:>6.2f}% {row['Price']:>9.2f} {change_str:>8} {contrib_str:>10}")
    
    # Final Summary
    print("\n" + "=" * 80)
    print("                        📊 FUND SUMMARY 📊")
    print("=" * 80)
    
    fund_change = results['fund_change_pct']
    weight_tracked = results['weight_tracked']
    
    print(f"\n   📈 Stocks Tracked: {len(holdings_df)} holdings")
    print(f"   📊 Portfolio Coverage: {weight_tracked:.2f}%")
    
    # Big display for fund change
    if fund_change >= 0:
        print(f"\n   {'🟢' * 5}")
        print(f"\n   📈 ESTIMATED FUND DAY CHANGE: +{fund_change:.4f}%")
        print(f"\n   {'🟢' * 5}")
    else:
        print(f"\n   {'🔴' * 5}")
        print(f"\n   📉 ESTIMATED FUND DAY CHANGE: {fund_change:.4f}%")
        print(f"\n   {'🔴' * 5}")
    
    # Calculate approximate NAV impact
    print(f"\n   💡 If NAV was ₹100, today's change would be: ₹{100 + fund_change:.4f}")
    
    print("\n" + "=" * 80)
    print("   ⚠️  Note: This is an estimate based on available price data.")
    print("       Actual NAV may differ due to expenses, timing, and other factors.")
    print("=" * 80)


def main():
    """Main function to run the HDFC Midcap fund tracker."""
    
    # Path to holdings CSV
    csv_path = '/Users/pranavsharda/chess/scripts/fund_holdings.csv'
    
    print("\n🚀 Starting HDFC MIDCAP OPPORTUNITIES FUND Tracker...")
    
    # Step 1: Load holdings
    print("\n📂 Loading holdings from CSV...")
    holdings = load_holdings(csv_path)
    print(f"✅ Loaded {len(holdings)} holdings")
    
    # Step 2: Get ticker symbols
    tickers = []
    for stock_name in holdings['Stock Name']:
        ticker = get_ticker_symbol(stock_name)
        if ticker:
            tickers.append(ticker)
    
    print(f"✅ Mapped {len(tickers)} stocks to NSE tickers")
    
    # Step 3: Fetch live prices
    prices = fetch_live_prices(tickers)
    
    # Step 4: Calculate performance
    print("\n🔢 Calculating fund performance...")
    results = calculate_fund_performance(holdings, prices)
    
    # Step 5: Display results
    display_results(results)
    
    # Return results for further analysis
    return results


if __name__ == "__main__":
    results = main()

