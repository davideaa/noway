# DATA_ACCESS_LOG broker IBKR (fonte | URL | cosa serviva | esito/stato | data)
IBKR Ireland commissions | https://www.interactivebrokers.ie/en/accounts/fees/commissions.php | commissioni azioni/futures | HTTP 403, non letta (fetch diretto) | 2026-11-14
IBKB PRIIPs Regulation | https://ibkb.interactivebrokers.com/node/2993 | policy KID/ETF USA | HTTP 403 al fetch; contenuto via riepilogo ricerca: SECONDARY_SOURCE | 2026-11-14
IBKR Campus contract details | https://www.interactivebrokers.com/campus/trading-lessons/python-contract-details/ | test accessibilità Campus | HTTP 403, non letta | 2026-11-14
IBKR Campus TWS API doc | https://www.interactivebrokers.com/campus/ibkr-api-page/twsapi-doc/ | limiti storici/pacing | HTTP 403, non letta | 2026-11-14
Ricerca web (PRIIPs/UCITS) | https://www.justetf.com/en/news/etf/us-domiciled-etfs.html | motivo blocco ETF USA | SECONDARY_SOURCE (via riepilogo ricerca) | 2026-11-14
QuantRoutine UCITS su IBKR | https://quantroutine.com/brokers/buy-ucits-etfs-on-interactive-brokers/ | alternative UCITS | SECONDARY_SOURCE (via riepilogo) | 2026-11-14
IBKR .ie commissions stocks/futures/other fees | https://www.interactivebrokers.ie/en/pricing/commissions-stocks.php | tariffe azioni/futures/fee | riepilogo ricerca di pagine ufficiali: SECONDARY_SOURCE; incoerenze tra pagine | 2026-11-14
IBKR TWS API historical limitations | https://interactivebrokers.github.io/tws-api/historical_limitations.html | pacing storico | riepilogo ricerca di doc ufficiale: SECONDARY_SOURCE | 2026-11-14
IBKR margin rates | https://www.interactivebrokers.ie/en/trading/margin-rates.php | tassi margine EUR/USD | riepilogo ricerca: SECONDARY_SOURCE | 2026-11-14
IBKR crypto Ireland press/commissions | https://www.interactivebrokers.ie/en/general/about/mediaRelations/3-31-2026.php | crypto SEE | riepilogo ricerca: SECONDARY_SOURCE | 2026-11-14
IBKR market data pricing | https://www.interactivebrokers.com/en/pricing/market-data-pricing.php | costi dati non-pro | riepilogo ricerca: SECONDARY_SOURCE (pagina datata) | 2026-11-14
IBKR TWS API spreads/combo orders | https://interactivebrokers.github.io/tws-api/spread_contracts.html | ordini BAG | riepilogo ricerca di doc ufficiale: SECONDARY_SOURCE | 2026-11-14
IBIE required minimums/account types | https://www.interactivebrokers.ie/en/index.php?f=minimumDeposits | deposito minimo, tipi conto | riepilogo ricerca: SECONDARY_SOURCE (conflitto con Campus) | 2026-11-14
IBKR short sale cost / availability | https://www.interactivebrokers.com/en/pricing/short-sale-cost.php | borrow fee, tool disponibilità | riepilogo ricerca: SECONDARY_SOURCE | 2026-11-14
IBKR historical data/expired futures | https://www.interactivebrokers.com/campus/ibkr-quant-news/historical-options-futures-data-using-tws-api/ | futures scaduti, profondità | riepilogo ricerca: SECONDARY_SOURCE | 2026-11-14
IBIE CME futures / margini futures | https://www.interactivebrokers.ie/en/trading/cme-futures-trading.php | accesso retail UE CME, margini | riepilogo ricerca: SECONDARY_SOURCE; margini NOT_FOUND | 2026-11-14
IBKR tassazione Italia | https://interactivebrokers.ie/it/support/tax-nonus-initial.php | regime dichiarativo, W-8BEN | riepilogo ricerca + blog italiani: SECONDARY_SOURCE | 2026-11-14
