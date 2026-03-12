// Ticker Component
import { useState, useEffect } from "react";
import { TICKER_DATA as BASE_TICKER_DATA } from "../data/mock";

export function Ticker() {
  const [tickerData, setTickerData] = useState(BASE_TICKER_DATA);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerData((prev) =>
        prev.map((item) => {
          // Only update crypto prices, not summary items
          if (item.sym === "SOL" || item.sym === "BTC" || item.sym === "ETH") {
            const currentPrice = parseFloat(item.price.replace(/,/g, ""));
            const pctChange = Math.random() * 0.006 - 0.003; // ±0.3%
            const newPrice = currentPrice * (1 + pctChange);
            return {
              ...item,
              price: newPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
              change: `${pctChange >= 0 ? "+" : ""}${(pctChange * 100).toFixed(
                1
              )}%`,
              down: pctChange < 0,
            };
          }
          return item;
        })
      );
    }, 12000); // Update every 12 seconds

    return () => clearInterval(interval);
  }, []);

  const items = [...tickerData, ...tickerData];

  return (
    <div className="ticker-bar">
      <div className="ticker-track">
        {items.map((t, i) => (
          <div className="ticker-item" key={i}>
            <span style={{ color: "#4a7a4c", fontSize: "0.65rem" }}>●</span>
            <span style={{ color: "var(--text)", fontWeight: 500 }}>
              {t.sym}
            </span>
            <span>${t.price}</span>
            <span className={t.down ? "down" : ""}>{t.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Ticker;
