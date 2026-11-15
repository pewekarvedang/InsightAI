import { useState, useMemo } from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Tooltip from "@mui/material/Tooltip";
import Alert from "@mui/material/Alert";
import TuneIcon from "@mui/icons-material/Tune";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SpeedIcon from "@mui/icons-material/Speed";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ScenarioSimulator({ dashboard }) {
  if (!dashboard) return null;

  const isVolume = dashboard.metric_mode === "volume";

  // Base values from dataset
  const baseRevenue = Number(dashboard.total_revenue || 0);
  const baseOrders = Number(dashboard.total_orders || 0);

  // If cost/profit is not explicitly present, approximate standard operating margin of 18%
  const hasActualProfit =
    dashboard.total_profit !== null &&
    dashboard.total_profit !== undefined &&
    dashboard.total_profit !== 0;

  const baseProfit = hasActualProfit
    ? Number(dashboard.total_profit)
    : isVolume
    ? 0
    : Math.round(baseRevenue * 0.18);

  const baseCost = Math.max(0, baseRevenue - baseProfit);
  const baseMarginPct = baseRevenue > 0 ? (baseProfit / baseRevenue) * 100 : 0;

  // Sliders state (percentages)
  const [priceChange, setPriceChange] = useState(0);       // -30% to +30%
  const [discountChange, setDiscountChange] = useState(0); // -30% to +30%
  const [costChange, setCostChange] = useState(0);         // -30% to +30%
  const [volumeChange, setVolumeChange] = useState(0);     // -50% to +50%

  // Simulation calculations
  const simulation = useMemo(() => {
    // Effective price factor = (1 + priceChange/100) * (1 - discountChange/100)
    const effectivePriceFactor = (1 + priceChange / 100) * (1 - discountChange / 100);
    const volumeFactor = 1 + volumeChange / 100;
    const costFactor = 1 + costChange / 100;

    const projectedRevenue = Math.max(0, baseRevenue * effectivePriceFactor * volumeFactor);
    const projectedCost = Math.max(0, baseCost * costFactor * volumeFactor);
    const projectedProfit = projectedRevenue - projectedCost;
    const projectedMarginPct = projectedRevenue > 0 ? (projectedProfit / projectedRevenue) * 100 : 0;
    const projectedOrders = Math.round(baseOrders * volumeFactor);

    const revenueDelta = projectedRevenue - baseRevenue;
    const revenueDeltaPct = baseRevenue > 0 ? (revenueDelta / baseRevenue) * 100 : 0;

    const profitDelta = projectedProfit - baseProfit;
    const profitDeltaPct = baseProfit !== 0 ? (profitDelta / Math.abs(baseProfit)) * 100 : 0;

    const marginShiftBps = (projectedMarginPct - baseMarginPct) * 100;

    // Breakeven Volume required to sustain base profit at new pricing & cost
    // Profit = Volume * (UnitRev - UnitCost) => Volume_req = BaseProfit / (UnitRev_new - UnitCost_new)
    let breakevenVolumeDeltaPct = 0;
    const effectiveUnitMargin = (baseRevenue * effectivePriceFactor - baseCost * costFactor) / Math.max(baseOrders, 1);
    if (effectiveUnitMargin > 0 && baseProfit > 0) {
      const requiredOrders = baseProfit / effectiveUnitMargin;
      breakevenVolumeDeltaPct = ((requiredOrders - baseOrders) / baseOrders) * 100;
    }

    return {
      projectedRevenue,
      projectedProfit,
      projectedMarginPct,
      projectedOrders,
      revenueDelta,
      revenueDeltaPct,
      profitDelta,
      profitDeltaPct,
      marginShiftBps,
      breakevenVolumeDeltaPct,
    };
  }, [baseRevenue, baseProfit, baseCost, baseMarginPct, baseOrders, priceChange, discountChange, costChange, volumeChange]);

  const handleReset = () => {
    setPriceChange(0);
    setDiscountChange(0);
    setCostChange(0);
    setVolumeChange(0);
  };

  const applyPreset = (preset) => {
    if (preset === "growth") {
      setPriceChange(-5);
      setDiscountChange(8);
      setCostChange(0);
      setVolumeChange(25);
    } else if (preset === "margin") {
      setPriceChange(10);
      setDiscountChange(-5);
      setCostChange(2);
      setVolumeChange(-4);
    } else if (preset === "inflation") {
      setPriceChange(8);
      setDiscountChange(-4);
      setCostChange(12);
      setVolumeChange(-3);
    } else if (preset === "promo") {
      setPriceChange(-10);
      setDiscountChange(15);
      setCostChange(0);
      setVolumeChange(35);
    }
  };

  const chartData = [
    {
      metric: "Revenue",
      Baseline: Math.round(baseRevenue),
      Simulated: Math.round(simulation.projectedRevenue),
    },
    {
      metric: "Net Profit",
      Baseline: Math.round(baseProfit),
      Simulated: Math.round(simulation.projectedProfit),
    },
  ];

  return (
    <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header Banner */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: 3,
          backgroundColor: "#ffffff",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              background: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
            }}
          >
            <TuneIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} color="#1e293b">
              Interactive "What-If" Margin & Pricing Simulator
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Simulate pricing shifts, promotional discounts, cost inflation, and elasticity to project profit and margin deltas in real time.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => applyPreset("growth")}
            sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600, fontSize: "0.8rem" }}
          >
            🚀 Volume Surge
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => applyPreset("margin")}
            sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600, fontSize: "0.8rem" }}
          >
            💎 Margin Defense
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => applyPreset("inflation")}
            sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600, fontSize: "0.8rem" }}
          >
            🛡️ Inflation Pass-through
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => applyPreset("promo")}
            sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600, fontSize: "0.8rem" }}
          >
            🏷️ Flash Sale Promo
          </Button>
          <Button
            size="small"
            variant="text"
            color="secondary"
            onClick={handleReset}
            startIcon={<RestartAltIcon />}
            sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
          >
            Reset
          </Button>
        </Box>
      </Paper>

      {/* Sliders Grid */}
      <Paper
        elevation={2}
        sx={{
          p: 3.5,
          borderRadius: 3,
          backgroundColor: "#ffffff",
          border: "1px solid rgba(0, 0, 0, 0.05)",
        }}
      >
        <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ mb: 3 }}>
          🎛️ Scenario Levers & Parameter Controls
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr 1fr" },
            gap: 3.5,
          }}
        >
          {/* Lever 1: Price Adjustment */}
          <Box sx={{ p: 2, borderRadius: 2.5, backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="body2" fontWeight={700} color="#334155">
                Base Price Shift
              </Typography>
              <Chip
                label={`${priceChange > 0 ? "+" : ""}${priceChange}%`}
                size="small"
                color={priceChange > 0 ? "primary" : priceChange < 0 ? "warning" : "default"}
                sx={{ fontWeight: 700 }}
              />
            </Box>
            <Slider
              value={priceChange}
              min={-30}
              max={30}
              step={1}
              onChange={(e, val) => setPriceChange(val)}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${v}%`}
              sx={{ color: "#2563eb" }}
            />
            <Typography variant="caption" color="text.secondary">
              Direct list price change across SKUs
            </Typography>
          </Box>

          {/* Lever 2: Discount Rate */}
          <Box sx={{ p: 2, borderRadius: 2.5, backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="body2" fontWeight={700} color="#334155">
                Discount Variation
              </Typography>
              <Chip
                label={`${discountChange > 0 ? "+" : ""}${discountChange}%`}
                size="small"
                color={discountChange > 0 ? "error" : discountChange < 0 ? "success" : "default"}
                sx={{ fontWeight: 700 }}
              />
            </Box>
            <Slider
              value={discountChange}
              min={-30}
              max={30}
              step={1}
              onChange={(e, val) => setDiscountChange(val)}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${v}%`}
              sx={{ color: "#f59e0b" }}
            />
            <Typography variant="caption" color="text.secondary">
              Promotional markdown allowance
            </Typography>
          </Box>

          {/* Lever 3: Cost Inflation / COGS */}
          <Box sx={{ p: 2, borderRadius: 2.5, backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="body2" fontWeight={700} color="#334155">
                COGS / Supply Cost
              </Typography>
              <Chip
                label={`${costChange > 0 ? "+" : ""}${costChange}%`}
                size="small"
                color={costChange > 0 ? "error" : costChange < 0 ? "success" : "default"}
                sx={{ fontWeight: 700 }}
              />
            </Box>
            <Slider
              value={costChange}
              min={-30}
              max={30}
              step={1}
              onChange={(e, val) => setCostChange(val)}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${v}%`}
              sx={{ color: "#ef4444" }}
            />
            <Typography variant="caption" color="text.secondary">
              Raw materials, logistics & wholesale costs
            </Typography>
          </Box>

          {/* Lever 4: Volume Elasticity */}
          <Box sx={{ p: 2, borderRadius: 2.5, backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="body2" fontWeight={700} color="#334155">
                Volume / Elasticity
              </Typography>
              <Chip
                label={`${volumeChange > 0 ? "+" : ""}${volumeChange}%`}
                size="small"
                color={volumeChange > 0 ? "success" : volumeChange < 0 ? "warning" : "default"}
                sx={{ fontWeight: 700 }}
              />
            </Box>
            <Slider
              value={volumeChange}
              min={-50}
              max={50}
              step={1}
              onChange={(e, val) => setVolumeChange(val)}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${v}%`}
              sx={{ color: "#10b981" }}
            />
            <Typography variant="caption" color="text.secondary">
              Consumer demand change in unit volume
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Real-Time Projected Impact Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr 1fr" },
          gap: 2.5,
        }}
      >
        {/* Card 1: Projected Revenue */}
        <Paper
          elevation={2}
          sx={{
            p: 2.8,
            borderRadius: 3,
            backgroundColor: "#ffffff",
            border: "1px solid rgba(0, 0, 0, 0.05)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
            <Typography variant="body2" fontWeight={700} color="text.secondary">
              Projected Revenue
            </Typography>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                backgroundColor: "rgba(37, 99, 235, 0.1)",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MonetizationOnIcon fontSize="small" />
            </Box>
          </Box>
          <Typography variant="h5" fontWeight={800} color="#0f172a">
            ₹{Math.round(simulation.projectedRevenue).toLocaleString("en-IN")}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
            <Chip
              icon={simulation.revenueDelta >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              label={`${simulation.revenueDelta >= 0 ? "+" : ""}${simulation.revenueDeltaPct.toFixed(1)}%`}
              size="small"
              color={simulation.revenueDelta >= 0 ? "success" : "error"}
              sx={{ fontWeight: 700, height: 22 }}
            />
            <Typography variant="caption" color="text.secondary">
              Base: ₹{Math.round(baseRevenue).toLocaleString("en-IN")}
            </Typography>
          </Box>
        </Paper>

        {/* Card 2: Projected Net Profit */}
        <Paper
          elevation={2}
          sx={{
            p: 2.8,
            borderRadius: 3,
            backgroundColor: "#ffffff",
            border: "1px solid rgba(0, 0, 0, 0.05)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
            <Typography variant="body2" fontWeight={700} color="text.secondary">
              Projected Net Profit
            </Typography>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AccountBalanceWalletIcon fontSize="small" />
            </Box>
          </Box>
          <Typography
            variant="h5"
            fontWeight={800}
            color={simulation.projectedProfit >= 0 ? "#0f172a" : "#dc2626"}
          >
            ₹{Math.round(simulation.projectedProfit).toLocaleString("en-IN")}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
            <Chip
              icon={simulation.profitDelta >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              label={`${simulation.profitDelta >= 0 ? "+" : ""}${simulation.profitDeltaPct.toFixed(1)}%`}
              size="small"
              color={simulation.profitDelta >= 0 ? "success" : "error"}
              sx={{ fontWeight: 700, height: 22 }}
            />
            <Typography variant="caption" color="text.secondary">
              Δ ₹{Math.round(simulation.profitDelta).toLocaleString("en-IN")}
            </Typography>
          </Box>
        </Paper>

        {/* Card 3: Projected Margin */}
        <Paper
          elevation={2}
          sx={{
            p: 2.8,
            borderRadius: 3,
            backgroundColor: "#ffffff",
            border: "1px solid rgba(0, 0, 0, 0.05)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
            <Typography variant="body2" fontWeight={700} color="text.secondary">
              Profit Margin %
            </Typography>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                backgroundColor: "rgba(139, 92, 246, 0.1)",
                color: "#8b5cf6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SpeedIcon fontSize="small" />
            </Box>
          </Box>
          <Typography variant="h5" fontWeight={800} color="#0f172a">
            {simulation.projectedMarginPct.toFixed(1)}%
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
            <Chip
              label={`${simulation.marginShiftBps >= 0 ? "+" : ""}${Math.round(simulation.marginShiftBps)} bps`}
              size="small"
              color={simulation.marginShiftBps >= 0 ? "success" : "error"}
              sx={{ fontWeight: 700, height: 22 }}
            />
            <Typography variant="caption" color="text.secondary">
              Base: {baseMarginPct.toFixed(1)}%
            </Typography>
          </Box>
        </Paper>

        {/* Card 4: Projected Orders */}
        <Paper
          elevation={2}
          sx={{
            p: 2.8,
            borderRadius: 3,
            backgroundColor: "#ffffff",
            border: "1px solid rgba(0, 0, 0, 0.05)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
            <Typography variant="body2" fontWeight={700} color="text.secondary">
              Projected Orders
            </Typography>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                color: "#f59e0b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShoppingBagIcon fontSize="small" />
            </Box>
          </Box>
          <Typography variant="h5" fontWeight={800} color="#0f172a">
            {simulation.projectedOrders.toLocaleString()}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
            <Chip
              label={`${volumeChange >= 0 ? "+" : ""}${volumeChange}%`}
              size="small"
              color={volumeChange >= 0 ? "success" : "default"}
              sx={{ fontWeight: 700, height: 22 }}
            />
            <Typography variant="caption" color="text.secondary">
              Base: {baseOrders.toLocaleString()}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Visual Chart & Strategic Breakeven Feedback */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.2fr 0.8fr" },
          gap: 3,
        }}
      >
        {/* Comparison Bar Chart */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 3,
            backgroundColor: "#ffffff",
            border: "1px solid rgba(0, 0, 0, 0.05)",
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ mb: 0.5 }}>
            📊 Baseline vs. Simulated Financial Outcome
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
            Visual delta between current operational metrics and simulated parameter adjustments
          </Typography>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="metric" stroke="#64748b" tick={{ fontWeight: 600 }} />
              <YAxis
                stroke="#64748b"
                tickFormatter={(v) => (v >= 1000000 ? `₹${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
              />
              <RechartsTooltip
                formatter={(val) => [`₹${Number(val).toLocaleString("en-IN")}`]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
              />
              <Legend />
              <Bar dataKey="Baseline" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Simulated" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        {/* Strategic Analysis & Breakeven Box */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 3,
            backgroundColor: "#ffffff",
            border: "1px solid rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ mb: 1 }}>
              🎯 Breakeven & Sensitivity Assessment
            </Typography>

            {simulation.projectedProfit <= 0 ? (
              <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
                <strong>Margin Inversion Warning:</strong> At this combination of pricing and cost inflation, your business generates net losses. Consider reducing discount allowance or passing cost increases to list price.
              </Alert>
            ) : simulation.marginShiftBps < -300 ? (
              <Alert severity="warning" sx={{ borderRadius: 2, mb: 2 }}>
                <strong>Margin Erosion Alert:</strong> Profit margin drops by more than 300 bps. High volume elasticity is required to offset this compression.
              </Alert>
            ) : (
              <Alert severity="success" sx={{ borderRadius: 2, mb: 2 }}>
                <strong>Healthy Unit Economics:</strong> The scenario maintains positive operating margins and favorable financial health.
              </Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, mt: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.8, borderBottom: "1px solid #f1f5f9" }}>
                <Typography variant="body2" color="text.secondary">
                  Breakeven Volume Delta:
                </Typography>
                <Typography variant="body2" fontWeight={700} color={simulation.breakevenVolumeDeltaPct > 0 ? "#dc2626" : "#166534"}>
                  {simulation.breakevenVolumeDeltaPct > 0 ? `+${simulation.breakevenVolumeDeltaPct.toFixed(1)}% needed` : "Within Safe Buffer"}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.8, borderBottom: "1px solid #f1f5f9" }}>
                <Typography variant="body2" color="text.secondary">
                  Net Profit Variance:
                </Typography>
                <Typography variant="body2" fontWeight={700} color={simulation.profitDelta >= 0 ? "#166534" : "#dc2626"}>
                  {simulation.profitDelta >= 0 ? "+" : ""}₹{Math.round(simulation.profitDelta).toLocaleString("en-IN")}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.8, borderBottom: "1px solid #f1f5f9" }}>
                <Typography variant="body2" color="text.secondary">
                  Operating Leverage:
                </Typography>
                <Typography variant="body2" fontWeight={700} color="#1e293b">
                  {Math.abs(simulation.profitDeltaPct / Math.max(Math.abs(simulation.revenueDeltaPct), 0.1)).toFixed(1)}x
                </Typography>
              </Box>
            </Box>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", mt: 1 }}>
            💡 Insight: Price changes flow 100% to gross profit, whereas volume adjustments carry variable unit production and logistics costs.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
