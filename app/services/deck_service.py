from pathlib import Path
from uuid import uuid4
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE


def create_executive_deck(dashboard: dict, file_name: str = "Dataset") -> Path:
    """Generate a clean, professional widescreen 16:9 executive briefing deck (.pptx)
    summarizing KPIs, rankings, SWOT evaluation, and strategic roadmap.
    """
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    blank_layout = prs.slide_layouts[6]

    # Corporate Color Palette
    COLOR_PRIMARY = RGBColor(15, 23, 42)       # Slate 900
    COLOR_ACCENT = RGBColor(37, 99, 235)       # Blue 600
    COLOR_SUCCESS = RGBColor(16, 185, 129)     # Emerald 500
    COLOR_WARNING = RGBColor(245, 158, 11)     # Amber 500
    COLOR_DANGER = RGBColor(239, 68, 68)       # Red 500
    COLOR_MUTED = RGBColor(100, 116, 139)      # Slate 500
    COLOR_BG_CARD = RGBColor(248, 250, 252)    # Slate 50
    COLOR_WHITE = RGBColor(255, 255, 255)

    is_volume = dashboard.get("metric_mode") == "volume"
    rev = dashboard.get("total_revenue", 0.0)
    profit = dashboard.get("total_profit")
    profit_label = dashboard.get("profit_label") or "Net Profit"
    margin = dashboard.get("profit_margin_pct")
    orders = dashboard.get("total_orders", 0)
    aov = dashboard.get("average_order_value", 0.0)
    top_p = dashboard.get("top_product", "N/A")
    top_r = dashboard.get("top_region", "N/A")
    swot = dashboard.get("swot_analysis", {})

    def add_header(slide, title_text, subtitle_text):
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.7), Inches(1.1))
        tf = tb.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = title_text
        p1.font.bold = True
        p1.font.size = Pt(24)
        p1.font.color.rgb = COLOR_PRIMARY

        p2 = tf.add_paragraph()
        p2.text = subtitle_text
        p2.font.size = Pt(12)
        p2.font.color.rgb = COLOR_MUTED

    # =========================================================================
    # SLIDE 1: Title Slide (Dark Theme)
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    bg1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = COLOR_PRIMARY
    bg1.line.color.rgb = COLOR_PRIMARY

    tb1 = slide1.shapes.add_textbox(Inches(1.2), Inches(2.2), Inches(11.0), Inches(3.2))
    tf1 = tb1.text_frame
    tf1.word_wrap = True

    p_badge = tf1.paragraphs[0]
    p_badge.text = "INSIGHTAI EXECUTIVE INTELLIGENCE BRIEFING"
    p_badge.font.size = Pt(13)
    p_badge.font.bold = True
    p_badge.font.color.rgb = COLOR_ACCENT

    p_title = tf1.add_paragraph()
    p_title.text = f"Business Intelligence Audit:\n{file_name}"
    p_title.font.size = Pt(36)
    p_title.font.bold = True
    p_title.font.color.rgb = COLOR_WHITE
    p_title.space_before = Pt(12)

    p_sub = tf1.add_paragraph()
    p_sub.text = f"Automated Performance Diagnostics • Ground Truth Metrics • Strategic Growth Roadmap"
    p_sub.font.size = Pt(14)
    p_sub.font.color.rgb = RGBColor(148, 163, 184)
    p_sub.space_before = Pt(16)

    # =========================================================================
    # SLIDE 2: Executive KPI Matrix
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_header(slide2, "Executive KPI Matrix", "Core financial, unit economics, and operational throughput benchmarks")

    # 4 Large KPI Cards
    if is_volume:
        kpi_list = [
            ("TOTAL MASTER ENTRIES", f"{orders:,} Records", "Verified Catalog Rows", COLOR_ACCENT),
            ("LEAD ENTITY ANCHOR", str(top_p)[:24], "Highest Frequency Item", COLOR_SUCCESS),
            ("PRIMARY TERRITORY", str(top_r)[:24], "Top Geographic Market", RGBColor(147, 51, 234)),
            ("DATASET DENSITY", "1.0 per Entry", "Record Uniformity Index", COLOR_WARNING),
        ]
    else:
        kpi_list = [
            ("TOTAL REVENUE", f"Rs. {rev:,.2f}", f"{orders:,} Recorded Transactions", COLOR_ACCENT),
            ("NET EARNINGS", f"Rs. {profit:,.2f}" if profit is not None else "N/A", f"{margin}% Margin Yield" if margin is not None else "Financial Turnover", COLOR_SUCCESS),
            ("AVERAGE ORDER VALUE", f"Rs. {aov:,.2f}", "Mean Revenue Per Order", RGBColor(147, 51, 234)),
            ("TOP PRODUCT ANCHOR", str(top_p)[:22], f"Leading Territory: {top_r}", COLOR_WARNING),
        ]

    card_w = Inches(2.7)
    card_h = Inches(4.5)
    start_x = Inches(0.8)
    gap_x = Inches(0.3)
    card_y = Inches(1.8)

    for i, (k_label, k_val, k_sub, k_col) in enumerate(kpi_list):
        x = start_x + (i * (card_w + gap_x))
        card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, card_y, card_w, card_h)
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_BG_CARD
        card.line.color.rgb = RGBColor(226, 232, 240)

        # Header accent bar
        bar = slide2.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, card_y, card_w, Inches(0.12))
        bar.fill.solid()
        bar.fill.fore_color.rgb = k_col
        bar.line.fill.background()

        tb = slide2.shapes.add_textbox(x + Inches(0.2), card_y + Inches(0.4), card_w - Inches(0.4), card_h - Inches(0.8))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = k_label
        p1.font.size = Pt(10)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_MUTED

        p2 = tf.add_paragraph()
        p2.text = k_val
        p2.font.size = Pt(20)
        p2.font.bold = True
        p2.font.color.rgb = COLOR_PRIMARY
        p2.space_before = Pt(16)

        p3 = tf.add_paragraph()
        p3.text = k_sub
        p3.font.size = Pt(11)
        p3.font.color.rgb = COLOR_MUTED
        p3.space_before = Pt(12)

    # =========================================================================
    # SLIDE 3: Top Performance Rankings Table
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_header(slide3, "Performance & Distribution Rankings", "Top-performing catalog items and regional territory contribution")

    prods = dashboard.get("sales_by_product", [])[:5]
    if prods:
        rows = len(prods) + 1
        cols = 4
        table_shape = slide3.shapes.add_table(rows, cols, Inches(0.8), Inches(1.8), Inches(11.7), Inches(4.5))
        tbl = table_shape.table

        headers = ["Rank & Entity Name", "Volume / Turnover", "Profit Yield", "Contribution"]
        for j, h in enumerate(headers):
            cell = tbl.cell(0, j)
            cell.text = h
            cell.fill.solid()
            cell.fill.fore_color.rgb = COLOR_PRIMARY
            p = cell.text_frame.paragraphs[0]
            p.font.bold = True
            p.font.color.rgb = COLOR_WHITE
            p.font.size = Pt(11)

        for i, prod in enumerate(prods, 1):
            val_str = f"{prod['sales']:,} entries" if is_volume else f"Rs. {prod['sales']:,.2f}"
            prof_str = f"Rs. {prod.get('profit', 0.0):,.2f}" if (not is_volume and prod.get("profit") is not None) else "—"
            share = round((prod['sales'] / max(rev, 1.0)) * 100, 1)

            data_cols = [f"#{i}  {prod['name']}", val_str, prof_str, f"{share}%"]
            for j, val in enumerate(data_cols):
                cell = tbl.cell(i, j)
                cell.text = str(val)
                p = cell.text_frame.paragraphs[0]
                p.font.size = Pt(11)
                p.font.color.rgb = COLOR_PRIMARY

    # =========================================================================
    # SLIDE 4: Strategic SWOT Matrix
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_header(slide4, "Strategic SWOT Matrix", "Algorithmic synthesis of organizational strengths, vulnerabilities, and threats")

    swot_boxes = [
        ("STRENGTHS (Internal Drivers)", swot.get("strengths", ["Solid baseline traction."]), Inches(0.8), Inches(1.8), COLOR_SUCCESS),
        ("WEAKNESSES (Internal Vulnerabilities)", swot.get("weaknesses", ["Concentration in top accounts."]), Inches(6.8), Inches(1.8), COLOR_DANGER),
        ("OPPORTUNITIES (Market Growth)", swot.get("opportunities", ["Geographic expansion potential."]), Inches(0.8), Inches(4.4), COLOR_ACCENT),
        ("THREATS (External Headwinds)", swot.get("threats", ["Price elasticity and cost inflation."]), Inches(6.8), Inches(4.4), COLOR_WARNING),
    ]

    for s_title, s_bullets, s_x, s_y, s_col in swot_boxes:
        box = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, s_x, s_y, Inches(5.7), Inches(2.4))
        box.fill.solid()
        box.fill.fore_color.rgb = COLOR_BG_CARD
        box.line.color.rgb = RGBColor(226, 232, 240)

        # Indicator bar
        ibar = slide4.shapes.add_shape(MSO_SHAPE.RECTANGLE, s_x, s_y, Inches(0.1), Inches(2.4))
        ibar.fill.solid()
        ibar.fill.fore_color.rgb = s_col
        ibar.line.fill.background()

        tb = slide4.shapes.add_textbox(s_x + Inches(0.3), s_y + Inches(0.15), Inches(5.2), Inches(2.1))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = s_title
        p_t.font.bold = True
        p_t.font.size = Pt(11)
        p_t.font.color.rgb = s_col

        for b in s_bullets[:3]:
            p_b = tf.add_paragraph()
            p_b.text = f"• {b}"
            p_b.font.size = Pt(10)
            p_b.font.color.rgb = COLOR_PRIMARY
            p_b.space_before = Pt(4)

    # =========================================================================
    # SLIDE 5: Strategic Actionable Roadmap
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_header(slide5, "Priority Strategic Roadmap", "Targeted business initiatives to optimize margins and scale distribution")

    roadmap_steps = [
        ("Initiative 1: Anchor Expansion", f"Leverage brand equity of '{str(top_p)[:22]}' through complementary bundling to increase order volume.", COLOR_ACCENT),
        ("Initiative 2: Territory Playbook", f"Replicate distribution tactics from '{str(top_r)[:22]}' into secondary operational zones.", COLOR_SUCCESS),
        ("Initiative 3: Margin Discipline", "Conduct unit economics audit to eliminate steep discounting on underperforming SKUs.", COLOR_WARNING),
        ("Initiative 4: Retention Engine", "Institute volume discount tiers for enterprise buyers to stabilize recurring revenue.", RGBColor(147, 51, 234)),
    ]

    r_y = Inches(1.8)
    r_h = Inches(1.1)
    for i, (r_title, r_desc, r_col) in enumerate(roadmap_steps):
        curr_y = r_y + (i * Inches(1.25))
        r_box = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), curr_y, Inches(11.7), r_h)
        r_box.fill.solid()
        r_box.fill.fore_color.rgb = COLOR_BG_CARD
        r_box.line.color.rgb = RGBColor(226, 232, 240)

        # Left tag
        tag = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), curr_y + Inches(0.2), Inches(0.7), Inches(0.7))
        tag.fill.solid()
        tag.fill.fore_color.rgb = r_col
        tag.line.fill.background()
        tag_tf = tag.text_frame
        p_tag = tag_tf.paragraphs[0]
        p_tag.text = f"0{i+1}"
        p_tag.alignment = PP_ALIGN.CENTER
        p_tag.font.bold = True
        p_tag.font.size = Pt(14)
        p_tag.font.color.rgb = COLOR_WHITE

        tb = slide5.shapes.add_textbox(Inches(2.0), curr_y + Inches(0.15), Inches(10.2), Inches(0.8))
        tf = tb.text_frame
        tf.word_wrap = True
        p_rt = tf.paragraphs[0]
        p_rt.text = r_title
        p_rt.font.bold = True
        p_rt.font.size = Pt(12)
        p_rt.font.color.rgb = COLOR_PRIMARY

        p_rd = tf.add_paragraph()
        p_rd.text = r_desc
        p_rd.font.size = Pt(10)
        p_rd.font.color.rgb = COLOR_MUTED
        p_rd.space_before = Pt(2)

    # Save to outputs
    base_dir = Path(__file__).resolve().parent.parent.parent
    output_dir = base_dir / "outputs"
    output_dir.mkdir(exist_ok=True)
    filename = f"Executive_Briefing_{uuid4().hex[:8]}.pptx"
    out_path = output_dir / filename
    prs.save(str(out_path))
    return out_path
