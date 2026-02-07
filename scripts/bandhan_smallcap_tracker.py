#!/usr/bin/env python3
"""
BANDHAN SMALL CAP FUND - Live Tracker
Fetches live prices from NSE and calculates fund's real-time gain/loss.
"""

import pandas as pd
import yfinance as yf
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Mapping of stock names to NSE ticker symbols
STOCK_TICKER_MAP = {
    "Sobha Ltd": "SOBHA.NS",
    "REC Ltd": "RECLTD.NS",
    "The South Indian Bank Ltd": "SOUTHBANK.NS",
    "LT Foods Ltd": "LTFOODS.NS",
    "Arvind Ltd": "ARVIND.NS",
    "PNB Housing Finance Ltd": "PNBHOUSING.NS",
    "Cholamandalam Financial Holdings Ltd": "CHOLAHLDNG.NS",
    "Info Edge (India) Ltd": "NAUKRI.NS",
    "Apar Industries Ltd": "APARINDS.NS",
    "Karnataka Bank Ltd": "KTKBANK.NS",
    "Yatharth Hospital and Trauma Care Services Ltd": "YATHARTH.NS",
    "DCB Bank Ltd": "DCBBANK.NS",
    "State Bank of India": "SBIN.NS",
    "Jubilant Pharmova Ltd": "JUBLPHARMA.NS",
    "Axis Bank Ltd": "AXISBANK.NS",
    "PCBL Chemical Ltd": "PCBL.NS",
    "TVS Holdings Ltd": "TVSHLTD.NS",
    "Glenmark Pharmaceuticals Ltd": "GLENMARK.NS",
    "TARC Ltd Ordinary Shares": "TARC.NS",
    "Inox Wind Ltd": "INOXWIND.NS",
    "Repco Home Finance Ltd": "REPCOHOME.NS",
    "Great Eastern Shipping Co Ltd": "GESHIP.NS",
    "Power Finance Corp Ltd": "PFC.NS",
    "Shaily Engineering Plastics Ltd": "SHAILY.NS",
    "Rashi Peripherals Ltd": "RPTECH.NS",
    "Piramal Pharma Ltd": "PPLPHARMA.NS",
    "eClerx Services Ltd": "ECLERX.NS",
    "Prestige Estates Projects Ltd": "PRESTIGE.NS",
    "Kirloskar Oil Engines Ltd": "KIRLOSENG.NS",
    "Godrej Industries Ltd": "GODREJIND.NS",
    "Sanathan Textiles Ltd": "SANATHAN.NS",
    "Strides Pharma Science Ltd": "STAR.NS",
    "Cyient Ltd": "CYIENT.NS",
    "Manappuram Finance Ltd": "MANAPPURAM.NS",
    "Godawari Power & Ispat Ltd": "GPIL.NS",
    "Angel One Ltd Ordinary Shares": "ANGELONE.NS",
    "Motilal Oswal Financial Services Ltd": "MOTILALOFS.NS",
    "Nitin Spinners Ltd": "NITINSPIN.NS",
    "SIS Ltd Ordinary Shares": "SIS.NS",
    "P N Gadgil Jewellers Ltd": "PNGJL.NS",
    "IndusInd Bank Ltd": "INDUSINDBK.NS",
    "Tata Communications Ltd": "TATACOMM.NS",
    "Fedbank Financial Services Ltd": "FEDFINA.NS",
    "Senco Gold Ltd": "SENCO.NS",
    "General Insurance Corp of India": "GICRE.NS",
    "Arvind SmartSpaces Ltd": "ARVSMART.NS",
    "Paradeep Phosphates Ltd": "PARADEEP.NS",
    "Vedanta Ltd": "VEDL.NS",
    "Jubilant Ingrevia Ltd Ordinary Shares": "JUBLINGREA.NS",
    "Vintage Coffee & Beverages Ltd": "VINCOFE.NS",
    "Pace Digitek Ltd": "PACEDIGITK.NS",
    "Neuland Laboratories Ltd": "NEULANDLAB.NS",
    "Saatvik Green Energy Ltd": "SAATVIKGL.NS",
    "S H Kelkar & Co Ltd": "SHK.NS",
    "Can Fin Homes Ltd": "CANFINHOME.NS",
    "Deepak Fertilisers & Petrochemicals Corp Ltd": "DEEPAKFERT.NS",
    "Ethos Ltd": "ETHOSLTD.NS",
    "Amara Raja Energy & Mobility Ltd": "ARE&M.NS",
    "Hi-Tech Pipes Ltd": "HITECH.NS",
    "Nuvama Wealth Management Ltd": "NUVAMA.NS",
    "Grasim Industries Ltd": "GRASIM.NS",
    "Kolte-Patil Developers Ltd": "KOLTEPATIL.NS",
    "Signatureglobal (India) Ltd": "SIGNATURE.NS",
    "Bank of Baroda": "BANKBARODA.NS",
    "Aurobindo Pharma Ltd": "AUROPHARMA.NS",
    "Shilpa Medicare Ltd": "SHILPAMED.NS",
    "Mahindra Lifespace Developers Ltd": "MAHLIFE.NS",
    "EPACK Durable Ltd": "EPACK.NS",
    "Aditya Birla Fashion and Retail Ltd": "ABFRL.NS",
    "Akums Drugs and Pharmaceuticals Ltd": "AKUMS.NS",
    "Kewal Kiran Clothing Ltd": "KKCL.NS",
    "Wockhardt Ltd": "WOCKPHARMA.NS",
    "Mastek Ltd": "MASTEK.NS",
    "E2E Networks Ltd Ordinary Shares": "E2E.NS",
    "Epigral Ltd": "EPIGRAL.NS",
    "NCC Ltd": "NCC.NS",
    "Stove Kraft Ltd Ordinary Shares": "STOVEKRAFT.NS",
    "Crompton Greaves Consumer Electricals Ltd": "CROMPTON.NS",
    "Aditya Birla Real Estate Ltd": "ABREL.NS",
    "Birlasoft Ltd": "BSOFT.NS",
    "Kirloskar Ferrous Industries Ltd": "KIRLFER.BO",
    "Jupiter Wagons Ltd": "JWL.NS",
    "Eris Lifesciences Ltd Registered Shs": "ERIS.NS",
    "Sunteck Realty Ltd": "SUNTECK.NS",
    "Juniper Hotels Ltd": "JUNIPER.NS",
    "Styrenix Performance Materials Ltd": "STYRENIX.NS",
    "Eternal Ltd": "ETERNAL.NS",
    "Marksans Pharma Ltd": "MARKSANS.NS",
    "Baazar Style Retail Ltd": "STYLEBAAZA.NS",
    "Sansera Engineering Ltd": "SANSERA.NS",
    "Aptus Value Housing Finance India Ltd": "APTUS.NS",
    "National Aluminium Co Ltd": "NATIONALUM.NS",
    "Cohance Lifesciences Ltd": "COHANCE.NS",
    "KFin Technologies Ltd": "KFINTECH.NS",
    "Tilaknagar Industries Ltd": "TI.NS",
    "Ujjivan Small Finance Bank Ltd Ordinary Shares": "UJJIVANSFB.NS",
    "Computer Age Management Services Ltd Ordinary Shares": "CAMS.NS",
    "Updater Services Ltd": "UDS.NS",
    "EFC (I) Ltd": "EFCIL.NS",
    "Kilburn Engineering Ltd": "KLBRENG-B.BO",
    "Syrma SGS Technology Ltd": "SYRMA.NS",
    "Electronics Mart India Ltd": "EMIL.NS",
    "Vishnu Chemicals Ltd": "VISHNU.NS",
    "Samvardhana Motherson International Ltd": "MOTHERSON.NS",
    "Spicejet Ltd": "SPICEJET.BO",
    "Apeejay Surrendra Park Hotels Ltd": "PARKHOTELS.NS",
    "Star Health and Allied Insurance Co Ltd": "STARHEALTH.NS",
    "AWL Agri Business Ltd": "AWL.NS",
    "KEC International Ltd": "KEC.NS",
    "Lumax Auto Technologies Ltd": "LUMAXTECH.NS",
    "Krsnaa Diagnostics Ltd": "KRSNAA.NS",
    "CESC Ltd": "CESC.NS",
    "GPT Healthcare Ltd": "GPTHEALTH.NS",
    "Aster DM Healthcare Ltd Ordinary Shares": "ASTERDM.NS",
    "NLC India Ltd": "NLCINDIA.NS",
    "RHI Magnesita India Ltd": "RHIM.NS",
    "Sagility Ltd": "SAGILITY.NS",
    "Power Mech Projects Ltd": "POWERMECH.NS",
    "J.B. Chemicals & Pharmaceuticals Ltd": "JBCHEPHARM.NS",
    "Emcure Pharmaceuticals Ltd": "EMCURE.NS",
    "OneSource Specialty Pharma Ltd": "ONESOURCE.NS",
    "Sai Life Sciences Ltd": "SAILIFE.NS",
    "Ecos (India) Mobility & Hospitality Ltd": "ECOSMOBLTY.NS",
    "Blue Star Ltd": "BLUESTARCO.NS",
    "Awfis Space Solutions Ltd": "AWFIS.NS",
    "Triveni Engineering & Industries Ltd": "TRIVENI.NS",
    "Bombay Burmah Trading Corp Ltd": "BBTC.NS",
    "Indus Towers Ltd Ordinary Shares": "INDUSTOWER.NS",
    "Archean Chemical Industries Ltd": "ACI.NS",
    "GMM Pfaudler Ltd": "GMMPFAUDLR.NS",
    "Birla Corp Ltd": "BIRLACORPN.NS",
    "JSW Cement Ltd": "JSWCEMENT.NS",
    "Eureka Forbes Ltd": "EUREKAFORB.NS",
    "Medplus Health Services Ltd": "MEDPLUS.NS",
    "Keystone Realtors Ltd": "RUSTOMJEE.NS",
    "Sky Gold and Diamonds Ltd": "SKYGOLD.NS",
    "Sapphire Foods India Ltd": "SAPPHIRE.NS",
    "Clean Science and Technology Ltd": "CLEAN.NS",
    "Greenply Industries Ltd": "GREENPLY.NS",
    "Ramco Cements Ltd": "RAMCOCEM.NS",
    "Narayana Hrudayalaya Ltd": "NH.NS",
    "JK Tyre & Industries Ltd": "JKTYRE.NS",
    "Trualt Bioenergy Ltd": "TRUALT.NS",
    "Aditya Birla Sun Life AMC Ltd": "ABSLAMC.NS",
    "Alicon Castalloy Ltd": "ALICON.NS",
    "Jyothy Labs Ltd": "JYOTHYLAB.NS",
    "Vikram Solar Ltd": "VIKRAMSOLR.NS",
    "Quess Corp Ltd": "QUESS.NS",
    "Emami Ltd": "EMAMILTD.NS",
    "Usha Martin Ltd": "USHAMART.NS",
    "Pondy Oxides And Chemicals Ltd": "POCL.NS",
    "JK Lakshmi Cement Ltd": "JKLAKSHMI.NS",
    "NTPC Green Energy Ltd": "NTPCGREEN.NS",
    "Kirloskar Pneumatic Co Ltd": "KIRLPNU.NS",
    "Pennar Industries Ltd": "PENIND.NS",
    "Zee Entertainment Enterprises Ltd": "ZEEL.NS",
    "Metropolis Healthcare Ltd": "METROPOLIS.NS",
    "Orchid Pharma Ltd": "ORCHPHARMA.NS",
    "Sterlite Technologies Ltd": "STLTECH.NS",
    "Edelweiss Financial Services Ltd": "EDELWEISS.NS",
    "R R Kabel Ltd": "RRKABEL.NS",
    "UPL Ltd": "UPL.NS",
    "Satin Creditcare Network Ltd": "SATIN.NS",
    "Aarti Industries Ltd": "AARTIIND.NS",
    "Bank of India": "BANKINDIA.NS",
    "Heritage Foods Ltd": "HERITGFOOD.NS",
    "Krishna Institute of Medical Sciences Ltd": "KIMS.NS",
    "Gulf Oil Lubricants India Ltd": "GULFOILLUB.NS",
    "Steel Strips Wheels Ltd": "SSWL.NS",
    "Exide Industries Ltd": "EXIDEIND.NS",
    "Garware Hi-Tech Films Ltd": "GRWRHITECH.NS",
    "Brigade Hotel Ventures Ltd": "BRIGADE.NS",
    "Greenpanel Industries Ltd Ordinary Shares": "GREENPANEL.NS",
    "Rane Holdings Ltd": "RANEHOLDIN.NS",
    "Filatex India Ltd": "FILATEX.NS",
    "Time Technoplast Ltd": "TIMETECHNO.NS",
    "IndiaMART InterMESH Ltd": "INDIAMART.NS",
    "Innova Captab Ltd": "INNOVACAP.NS",
    "FDC Ltd": "FDC.NS",
    "Oswal Pumps Ltd": "OSWALAGRO.NS",
    "VRL Logistics Ltd": "VRLLOG.NS",
    "Vedant Fashions Ltd": "MANYAVAR.NS",
    "Aegis Vopak Terminals Ltd": "AEGISLOG.NS",
    "Artemis Medicare Services Ltd Ordinary Shares": "ARTEMISMED.NS",
    "Bansal Wire Industries Ltd": "BANSALWIRE.NS",
    "Suryoday Small Finance Bank Ltd": "SURYODAY.NS",
    "TBO Tek Ltd": "TBOTEK.NS",
    "Blackbuck Ltd": "BLACKBUCK.NS",
    "Multi Commodity Exchange of India Ltd": "MCX.NS",
    "Concord Enviro Systems Ltd": "CEWATER.NS",
    "All Time Plastics Ltd": "ALLTIME.NS",
    "Max Estates Ltd": "MAXESTATES.NS",
    "Jindal Saw Ltd": "JINDALSAW.NS",
    "Ellenbarrie Industrial Gases Ltd": "ELLEN.NS",
    "Thirumalai Chemicals Ltd": "TIRUMALCHM.NS",
    "Mayur Uniquoters Ltd": "MAYURUNIQ.NS",
    "GE Vernova T&D India Ltd": "GVT&D.NS",
    "Amanta Healthcare Ltd": "AMANTA.NS",
    "Landmark Cars Ltd": "LANDMARK.NS",
    "Flair Writing Industries Ltd": "FLAIR.NS",
    "Jyoti CNC Automation Ltd": "JYOTICNC.NS",
    "Arvind Fashions Ltd": "ARVINDFASN.NS",
    "IRM Energy Ltd": "IRMENERGY.NS",
    "MOIL Ltd": "MOIL.NS",
    "Amber Enterprises India Ltd Ordinary Shares": "AMBER.NS",
    "PG Electroplast Ltd": "PGEL.NS",
    "Windlas Biotech Ltd": "WINDLAS.NS",
    "Godavari Biorefineries Ltd": "GODAVARI.BO",
    "JK Paper Ltd": "JKPAPER.NS",
    "Gujarat State Petronet Ltd": "GSPL.NS",
    "Redington Ltd": "REDINGTON.NS",
    "Chemplast Sanmar Ltd": "CHEMPLASTS.NS",
    "Yatra Online Ltd": "YATRA.NS",
    "STL Networks Ltd": "STLNETWORK.NS",
    "Rishabh Instruments Ltd": "RISHABH.NS",
    "GK Energy Ltd": "GKENERGY.NS",
    "Dam Capital Advisors Ltd": "DCAL.NS",
    "Orient Electric Ltd Ordinary Shares": "ORIENTELEC.NS",
    "GNA Axles Ltd": "GNA.NS",
    "Ventive Hospitality Ltd": "VENTIVE.NS",
    "Butterfly Gandhimathi Appliances Ltd": "BUTTERFLY.NS",
    "Mankind Pharma Ltd": "MANKIND.NS",
    "Sudarshan Chemical Industries Ltd": "SUDARSCHEM.NS",
    "Poly Medicure Ltd": "POLYMED.NS",
    "Bajel Projects Ltd": "BAJEL.NS",
    "Radico Khaitan Ltd": "RADICO.NS",
    "One97 Communications Ltd": "PAYTM.NS",
    "LG Electronics India Ltd": "LGEINDIA.NS",
    "Bharat Forge Ltd": "BHARATFORG.NS",
    # Additional stocks (script will try NSE first, then BSE fallback)
    "Digitide Solutions Ltd": "DIGITIDE.NS",
    "Sudeep Pharma Ltd": "SUDEEPPHRM.NS",
    "Pine Labs Ltd": "PINELABS.NS",
    "Finbud Financial Services Ltd": "FINBUD.NS",
    "Bluspring Enterprises Ltd": "BLUSPRING.NS",
    "M & B Engineering Ltd": "MBEL.NS",
    "Aditya Infotech Ltd": "CPPLUS.NS",
    "Jain Resource Recycling Ltd": "JAINREC.NS",
}


def load_holdings(csv_path: str) -> pd.DataFrame:
    """Load fund holdings from CSV file."""
    df = pd.read_csv(csv_path)
    df['Weight'] = df['Weightage'].str.replace('%', '').astype(float)
    df['Value'] = df['Value (Cr)'].astype(str).str.replace(',', '').astype(float)
    return df


def get_ticker_symbol(stock_name: str) -> str:
    """Get NSE ticker symbol for a stock name."""
    return STOCK_TICKER_MAP.get(stock_name, None)


def try_fetch_price(ticker: str) -> dict:
    """Try to fetch price for a single ticker."""
    try:
        stock = yf.Ticker(ticker)
        try:
            info = stock.fast_info
            current_price = info.get('lastPrice') or info.get('regularMarketPrice')
            prev_close = info.get('previousClose') or info.get('regularMarketPreviousClose')
            if current_price and prev_close:
                return {
                    'current_price': round(current_price, 2),
                    'prev_close': round(prev_close, 2),
                    'day_change_pct': round(((current_price - prev_close) / prev_close) * 100, 2)
                }
        except:
            pass
        
        hist = stock.history(period='5d')
        if len(hist) >= 2:
            prev_close = hist['Close'].iloc[-2]
            current_price = hist['Close'].iloc[-1]
            return {
                'current_price': round(current_price, 2),
                'prev_close': round(prev_close, 2),
                'day_change_pct': round(((current_price - prev_close) / prev_close) * 100, 2)
            }
        elif len(hist) == 1:
            current_price = hist['Close'].iloc[-1]
            return {
                'current_price': round(current_price, 2),
                'prev_close': round(current_price, 2),
                'day_change_pct': 0.0
            }
    except:
        pass
    return None


def fetch_live_prices(tickers: list) -> dict:
    """Fetch live prices - try NSE first, fallback to BSE."""
    prices = {}
    bse_fallback_count = 0
    
    print(f"\n📈 Fetching live prices for {len(tickers)} stocks...")
    print("   (Trying NSE first, then BSE fallback)")
    print("-" * 60)
    
    for ticker in tickers:
        if ticker is None:
            continue
        
        # Try NSE first
        nse_ticker = ticker
        price_data = try_fetch_price(nse_ticker)
        
        if price_data:
            prices[ticker] = price_data
        else:
            # Try BSE fallback (replace .NS with .BO)
            bse_ticker = ticker.replace('.NS', '.BO')
            price_data = try_fetch_price(bse_ticker)
            
            if price_data:
                prices[ticker] = price_data
                bse_fallback_count += 1
    
    print(f"✅ Successfully fetched prices for {len(prices)} stocks")
    if bse_fallback_count > 0:
        print(f"   (including {bse_fallback_count} from BSE fallback)")
    return prices


def calculate_fund_performance(holdings: pd.DataFrame, prices: dict) -> dict:
    """Calculate weighted fund performance."""
    results = []
    total_weighted_change = 0
    total_weight_tracked = 0
    
    # Skip list for non-stock holdings
    skip_list = ['Triparty Repo', 'Net Receivables', 'Cash Margin', 'Cash Offset', 
                 'Cash / Bank', 'Future', 'Net Current']
    
    for _, row in holdings.iterrows():
        stock_name = row['Stock Name']
        weight = row['Weight']
        sector = row['Sector'] if pd.notna(row['Sector']) else ''
        
        # Skip non-stock holdings
        if any(skip in stock_name for skip in skip_list):
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
    print("          💰 BANDHAN SMALL CAP FUND - LIVE TRACKER 💰")
    print("=" * 80)
    print(f"⏰ Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S IST')}")
    print("=" * 80)
    
    holdings_df = results['holdings']
    
    if holdings_df.empty:
        print("❌ No holdings data available")
        return
    
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
    
    for sector, row in sector_perf.head(12).iterrows():
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
    
    if fund_change >= 0:
        print(f"\n   {'🟢' * 5}")
        print(f"\n   📈 ESTIMATED FUND DAY CHANGE: +{fund_change:.4f}%")
        print(f"\n   {'🟢' * 5}")
    else:
        print(f"\n   {'🔴' * 5}")
        print(f"\n   📉 ESTIMATED FUND DAY CHANGE: {fund_change:.4f}%")
        print(f"\n   {'🔴' * 5}")
    
    print(f"\n   💡 If NAV was ₹100, today's change would be: ₹{100 + fund_change:.4f}")
    
    print("\n" + "=" * 80)
    print("   ⚠️  Note: This is an estimate based on available price data.")
    print("       Actual NAV may differ due to expenses, timing, and other factors.")
    print("=" * 80)


def main():
    """Main function to run the Bandhan Small Cap fund tracker."""
    csv_path = '/Users/pranavsharda/chess/scripts/bandhan_smallcap_holdings.csv'
    
    print("\n🚀 Starting BANDHAN SMALL CAP FUND Tracker...")
    
    print("\n📂 Loading holdings from CSV...")
    holdings = load_holdings(csv_path)
    print(f"✅ Loaded {len(holdings)} holdings")
    
    tickers = []
    for stock_name in holdings['Stock Name']:
        ticker = get_ticker_symbol(stock_name)
        if ticker:
            tickers.append(ticker)
    
    print(f"✅ Mapped {len(tickers)} stocks to NSE tickers")
    
    prices = fetch_live_prices(tickers)
    
    print("\n🔢 Calculating fund performance...")
    results = calculate_fund_performance(holdings, prices)
    
    display_results(results)
    
    return results


if __name__ == "__main__":
    results = main()

