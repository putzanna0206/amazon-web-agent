import asyncio
from pathlib import Path


def build_report_html(
    title: str,
    date: str,
    sections: list[dict],
) -> str:
    sections_html = ""
    for s in sections:
        sections_html += f'<h2 class="section-title">{s["heading"]}</h2>\n{s["content"]}\n'

    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>{title}</title>
<style>
  @page {{ size: A4; margin: 20mm; }}
  body {{
    font-family: "PingFang SC", "Hiragino Sans GB", "STHeiti", sans-serif;
    font-size: 13px;
    line-height: 1.6;
    color: #1a1a1a;
    max-width: 210mm;
    margin: 0 auto;
    padding: 20mm;
  }}
  h1 {{ font-size: 24px; color: #1a1a1a; border-bottom: 2px solid #2563eb; padding-bottom: 8px; }}
  h2 {{ font-size: 18px; color: #2563eb; margin-top: 24px; }}
  h3 {{ font-size: 15px; color: #374151; }}
  table {{ width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }}
  th {{ background: #f3f4f6; text-align: left; padding: 8px; border: 1px solid #e5e7eb; }}
  td {{ padding: 8px; border: 1px solid #e5e7eb; }}
  tr:nth-child(even) td {{ background: #f9fafb; }}
  .insight {{ background: #eff6ff; border-left: 3px solid #3b82f6; padding: 12px; margin: 12px 0; }}
  .opportunity {{ color: #059669; font-weight: 600; }}
  .risk {{ color: #dc2626; font-weight: 600; }}
  .date {{ color: #6b7280; font-size: 12px; }}
</style>
</head>
<body>
<h1>{title}</h1>
<p class="date">{date}</p>
{sections_html}
</body>
</html>"""


class ReportGenerator:
    CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

    async def html_to_pdf(
        self,
        html_path: Path,
        output_path: Path,
        chrome_path: str | None = None,
    ) -> Path:
        chrome = chrome_path or self.CHROME_PATH
        if not Path(chrome).exists():
            raise FileNotFoundError(f"Chrome not found at {chrome}")

        cmd = [
            chrome,
            "--headless",
            "--disable-gpu",
            f"--print-to-pdf={output_path}",
            "--no-margins",
            "--print-to-pdf-no-header",
            str(html_path),
        ]
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        await proc.communicate()

        if not output_path.exists():
            raise RuntimeError(f"PDF generation failed: {output_path}")
        return output_path

    async def generate_report(
        self,
        title: str,
        date: str,
        sections: list[dict],
        output_dir: Path,
    ) -> Path:
        output_dir.mkdir(parents=True, exist_ok=True)

        html_path = output_dir / f"{title}.html"
        pdf_path = output_dir / f"{title}.pdf"

        html_content = build_report_html(title, date, sections)
        html_path.write_text(html_content, encoding="utf-8")

        await self.html_to_pdf(html_path, pdf_path)
        return pdf_path
