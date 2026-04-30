import pytest
from pathlib import Path
from app.report import build_report_html, ReportGenerator


def test_build_report_html_contains_title():
    html = build_report_html(
        title="测试报告",
        date="2026-04-30",
        sections=[
            {"heading": "市场概览", "content": "<p>测试内容</p>"},
        ],
    )
    assert "测试报告" in html
    assert "市场概览" in html
    assert "测试内容" in html


def test_build_report_html_has_styles():
    html = build_report_html(
        title="测试",
        date="2026-04-30",
        sections=[],
    )
    assert "<style>" in html
    assert "PingFang" in html


def test_build_report_html_has_table_styles():
    html = build_report_html(
        title="测试",
        date="2026-04-30",
        sections=[],
    )
    assert "border-collapse" in html
    assert "#f3f4f6" in html


def test_build_report_html_multiple_sections():
    html = build_report_html(
        title="测试",
        date="2026-04-30",
        sections=[
            {"heading": "第一章", "content": "<p>内容1</p>"},
            {"heading": "第二章", "content": "<p>内容2</p>"},
        ],
    )
    assert "第一章" in html
    assert "第二章" in html
    assert "内容1" in html
    assert "内容2" in html


@pytest.mark.asyncio
async def test_generate_pdf_no_chrome(tmp_path):
    gen = ReportGenerator()
    html_path = tmp_path / "test.html"
    html_path.write_text("<h1>test</h1>")

    with pytest.raises(FileNotFoundError):
        await gen.html_to_pdf(html_path, tmp_path / "test.pdf", chrome_path="/nonexistent/chrome")


def test_build_report_html_date():
    html = build_report_html(
        title="测试",
        date="2026-04-30",
        sections=[],
    )
    assert "2026-04-30" in html
