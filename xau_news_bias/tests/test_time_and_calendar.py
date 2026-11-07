from datetime import date, datetime, time, timezone

from xnb.live.engine import cadence_seconds
from xnb.live.predictor import checkpoint_for
from xnb.providers.bls import BLSProvider, parse_cpi_table_a
from xnb.timeutil import ny_to_utc, trading_day_ny, xau_market_open


def test_dst_conversion():
    assert ny_to_utc(date(2024, 1, 11), time(8, 30)) == datetime(2024, 1, 11, 13, 30, tzinfo=timezone.utc)
    assert ny_to_utc(date(2024, 7, 11), time(8, 30)) == datetime(2024, 7, 11, 12, 30, tzinfo=timezone.utc)
    # settimana di sfasamento USA/Europa: marzo 2024, USA già in ora legale
    assert ny_to_utc(date(2024, 3, 12), time(8, 30)) == datetime(2024, 3, 12, 12, 30, tzinfo=timezone.utc)


def test_trading_day_rollover_at_17_ny():
    assert trading_day_ny(datetime(2024, 1, 8, 21, 59, tzinfo=timezone.utc)) == date(2024, 1, 8)
    assert trading_day_ny(datetime(2024, 1, 8, 22, 1, tzinfo=timezone.utc)) == date(2024, 1, 9)


def test_market_hours():
    assert not xau_market_open(datetime(2026, 9, 26, 12, 0, tzinfo=timezone.utc))  # sabato
    assert xau_market_open(datetime(2026, 9, 24, 12, 0, tzinfo=timezone.utc))  # giovedì
    assert not xau_market_open(datetime(2026, 9, 24, 21, 30, tzinfo=timezone.utc))  # pausa 17-18 ET


def test_cadence():
    assert cadence_seconds(3 * 86400) == 1800
    assert cadence_seconds(10 * 3600) == 900
    assert cadence_seconds(2 * 3600) == 300
    assert cadence_seconds(30 * 60) == 60


def test_checkpoint_selection():
    assert checkpoint_for(3 * 86400) == "T-3D"
    assert checkpoint_for(20 * 3600) == "T-24H"
    assert checkpoint_for(3 * 3600) == "T-4H"
    assert checkpoint_for(3600) == "T-1H"
    assert checkpoint_for(1800) == "T-30M"
    assert checkpoint_for(120) == "T-5M"


TABLE_2008 = (
    "Table A. Percent changes in CPI for All Urban Consumers (CPI-U) Seasonally adjusted Compound "
    "Un- annual adjusted Expenditure Changes from preceding month rate 12-mos. Category 3-mos. ended "
    "July Aug. Sep. Oct. Nov. Dec. Jan. ended Jan. 2008 Jan. 2008 "
    "All items.......... .2 .0 .4 .3 .9 .4 .4 6.8 4.3 Food and beverages .3 .4 .5 .2 .4 .1 .7 4.6 4.8 "
    "All items less food and energy .2 .2 .2 .2 .2 .2 .3 3.1 2.5 Note: Table B"
)
TABLE_2026 = (
    "Table A. Percent changes in CPI for All Urban Consumers (CPI-U): U.S. city average Seasonally adjusted "
    "changes from preceding month Un- adjusted 12-mos. ended Feb. 2026 Aug. 2025 Sep. 2025 Oct. 2025 "
    "Nov. 2025 Dec. 2025 Jan. 2026 Feb. 2026 All items 0.3 0.3 - - 0.3 0.2 0.3 2.4 Food 0.4 0.2 - - 0.7 0.2 0.4 3.1 "
    "All items less food and energy 0.3 0.2 - - 0.2 0.3 0.2 2.5 Commodities 0.2"
)


def test_cpi_table_a_old_format():
    v = parse_cpi_table_a(TABLE_2008)
    assert v["cpi_mom_0"] == 0.4 and v["cpi_mom_6"] == 0.2 and v["cpi_yoy"] == 4.3
    assert v["core_mom_0"] == 0.3 and v["core_yoy"] == 2.5


def test_cpi_table_a_shutdown_gaps():
    v = parse_cpi_table_a(TABLE_2026)
    assert v["cpi_mom_0"] == 0.3 and v["cpi_yoy"] == 2.4
    assert "cpi_mom_3" not in v and "cpi_mom_4" not in v  # ottobre/novembre 2025 non rilevati
    assert v["core_mom_2"] == 0.2


def test_ref_period():
    assert BLSProvider._ref_period("December 2023 Consumer Price Index") == "2023-12"
