using TradingStation.Contracts;

namespace TradingStation.Backtesting.Strategies;

/// <summary>
/// Simple Moving Average Crossover Strategy
/// Buys when short MA crosses above long MA
/// Sells when short MA crosses below long MA
/// </summary>
public class MovingAverageCrossoverStrategy : ITradingStrategy
{
    private readonly int _shortPeriod;
    private readonly int _longPeriod;
    private readonly int _positionSize;
    private readonly StopLossConfig? _stopLoss;
    private readonly List<string> _symbols;

    public MovingAverageCrossoverStrategy(
        List<string> symbols,
        int shortPeriod = 20,
        int longPeriod = 50,
        int positionSize = 100,
        StopLossConfig? stopLoss = null)
    {
        _symbols = symbols;
        _shortPeriod = shortPeriod;
        _longPeriod = longPeriod;
        _positionSize = positionSize;
        _stopLoss = stopLoss;
    }

    public async Task<IEnumerable<TradingSignal>> GenerateSignalsAsync(
        IMarketDataProvider dataProvider,
        DateTime currentDate)
    {
        var signals = new List<TradingSignal>();

        foreach (var symbol in _symbols)
        {
            try
            {
                // Get historical data for MA calculation
                var lookbackDate = currentDate.AddDays(-(_longPeriod * 2)); // Extra buffer
                var historicalPrices = await dataProvider.GetHistoricalPricesAsync(
                    symbol,
                    lookbackDate,
                    currentDate);

                var priceList = historicalPrices.ToList();

                if (priceList.Count < _longPeriod)
                    continue; // Not enough data

                // Calculate moving averages
                var shortMA = CalculateMA(priceList, _shortPeriod);
                var longMA = CalculateMA(priceList, _longPeriod);

                // Get previous day's MAs for crossover detection
                var previousPrices = priceList.Take(priceList.Count - 1).ToList();
                if (previousPrices.Count < _longPeriod)
                    continue;

                var prevShortMA = CalculateMA(previousPrices, _shortPeriod);
                var prevLongMA = CalculateMA(previousPrices, _longPeriod);

                // Detect crossovers
                bool bullishCrossover = prevShortMA <= prevLongMA && shortMA > longMA;
                bool bearishCrossover = prevShortMA >= prevLongMA && shortMA < longMA;

                if (bullishCrossover)
                {
                    signals.Add(new TradingSignal
                    {
                        Symbol = symbol,
                        OrderType = OrderType.Buy,
                        Quantity = _positionSize,
                        StopLoss = _stopLoss,
                        Reason = $"MA{_shortPeriod} crossed above MA{_longPeriod}"
                    });
                }
                else if (bearishCrossover)
                {
                    signals.Add(new TradingSignal
                    {
                        Symbol = symbol,
                        OrderType = OrderType.Sell,
                        Quantity = _positionSize,
                        Reason = $"MA{_shortPeriod} crossed below MA{_longPeriod}"
                    });
                }
            }
            catch
            {
                // Symbol data not available, skip
                continue;
            }
        }

        return signals;
    }

    private decimal CalculateMA(List<StockPriceData> prices, int period)
    {
        var recentPrices = prices.TakeLast(period).ToList();
        return recentPrices.Average(p => p.Close);
    }
}
