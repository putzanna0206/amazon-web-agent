package agent

import (
	"testing"
)

// --- isUserFacingFile (allowlist) ---

func TestIsUserFacingFile_Allowlist(t *testing.T) {
	mustPass := []string{
		"report.pdf", "chart.png", "photo.jpg", "photo.jpeg",
		"data.csv", "sheet.xlsx", "notes.txt", "readme.md",
		"slide.pptx", "video.mp4", "archive.zip",
		"image.gif", "image.bmp", "image.svg", "image.webp",
		"data.json", "data.xml", "data.tsv",
		"audio.mp3", "audio.wav", "archive.tar.gz",
	}
	for _, name := range mustPass {
		if !isUserFacingFile(name) {
			t.Errorf("expected %q to be user-facing", name)
		}
	}
}

func TestIsUserFacingFile_DenySourceCode(t *testing.T) {
	mustFail := []string{
		"script.py", "run.sh", "app.js", "index.ts", "main.go",
		"app.rb", "Main.java", "prog.c", "prog.cpp", "main.rs",
		"query.sql", "run.bash", "setup.ps1", "build.bat",
		"analyze.R", "model.m", "app.scala", "app.kt", "app.swift",
	}
	for _, name := range mustFail {
		if isUserFacingFile(name) {
			t.Errorf("expected %q to be filtered (source code)", name)
		}
	}
}

func TestIsUserFacingFile_DenyIntermediateArtifacts(t *testing.T) {
	mustFail := []string{
		"NotoSansSC.ttf", "font.otf", "font.woff", "font.woff2",
		"output.log", "temp.tmp", "cache.pyc", "data.pyo",
		"config.yaml", "config.toml", "config.ini", "config.env",
		"Makefile", "Dockerfile", ".gitignore", ".env",
		"go.mod", "go.sum",
		"report.tex", "style.css", "app.html",
	}
	// Note: .json and .txt are intentionally in the allowlist — they're
	// ambiguous (can be user data OR config). Prefer showing them over hiding
	// a user's data export.
	for _, name := range mustFail {
		if isUserFacingFile(name) {
			t.Errorf("expected %q to be filtered (intermediate artifact)", name)
		}
	}
}

func TestIsUserFacingFile_CaseInsensitive(t *testing.T) {
	if !isUserFacingFile("Report.PDF") {
		t.Error("extension matching should be case-insensitive")
	}
	if !isUserFacingFile("Chart.PnG") {
		t.Error("extension matching should be case-insensitive")
	}
	if isUserFacingFile("Script.PY") {
		t.Error("extension matching should be case-insensitive for deny too")
	}
}

func TestIsUserFacingFile_NoExtension(t *testing.T) {
	if isUserFacingFile("Makefile") {
		t.Error("files without extensions should be filtered")
	}
	if isUserFacingFile("README") {
		t.Error("files without extensions should be filtered")
	}
}

// --- extractWorkspaceFileRefs ---

func TestExtractWorkspaceFileRefs(t *testing.T) {
	output := "Written 18 bytes to report.md\nMEDIA_WORKSPACE:report.md"
	paths := extractWorkspaceFileRefs(output)
	if len(paths) != 1 || paths[0] != "report.md" {
		t.Errorf("expected [report.md], got %v", paths)
	}
}

func TestExtractWorkspaceFileRefs_Multiple(t *testing.T) {
	output := "Written 10 bytes to a.csv\nMEDIA_WORKSPACE:a.csv\nMEDIA_WORKSPACE:b.pdf"
	paths := extractWorkspaceFileRefs(output)
	if len(paths) != 2 || paths[0] != "a.csv" || paths[1] != "b.pdf" {
		t.Errorf("expected [a.csv b.pdf], got %v", paths)
	}
}

func TestExtractWorkspaceFileRefs_None(t *testing.T) {
	output := "Written 10 bytes to file.py"
	paths := extractWorkspaceFileRefs(output)
	if len(paths) != 0 {
		t.Errorf("expected no paths, got %v", paths)
	}
}

func TestExtractWorkspaceFileRefs_IgnoresMediaPrefix(t *testing.T) {
	output := "MEDIA:/absolute/path/file.txt\nMEDIA_WORKSPACE:relative.txt"
	paths := extractWorkspaceFileRefs(output)
	if len(paths) != 1 || paths[0] != "relative.txt" {
		t.Errorf("expected only workspace ref, got %v", paths)
	}
}

// --- sanitizeContent ---

func TestSanitizeContent_AllPaths(t *testing.T) {
	a := &Agent{
		workspacePath: "/Users/test/.fastclaw/workspaces/agt_123",
		homePath:      "/Users/test/.fastclaw/agents/agt_123",
		homeDir:       "/Users/test/.fastclaw",
	}

	content := "文件保存在 /Users/test/.fastclaw/workspaces/agt_123/report.pdf 请查看"
	result := a.sanitizeContent(content)
	if result != "文件保存在 report.pdf 请查看" {
		t.Errorf("workspace path not stripped: %q", result)
	}

	content2 := "路径: /Users/test/.fastclaw/agents/agt_123/data.csv"
	result2 := a.sanitizeContent(content2)
	if result2 != "路径: data.csv" {
		t.Errorf("homePath not stripped: %q", result2)
	}

	content3 := "配置在 /Users/test/.fastclaw/config.json"
	result3 := a.sanitizeContent(content3)
	if result3 != "配置在 config.json" {
		t.Errorf("homeDir not stripped: %q", result3)
	}
}

func TestSanitizeContent_NoPaths(t *testing.T) {
	a := &Agent{
		workspacePath: "/Users/test/.fastclaw/workspaces/agt_123",
		homePath:      "/Users/test/.fastclaw/agents/agt_123",
		homeDir:       "/Users/test/.fastclaw",
	}
	content := "分析完成，bluetooth speaker 月搜索量 659,613"
	result := a.sanitizeContent(content)
	if result != content {
		t.Errorf("should not modify clean content: %q", result)
	}
}

func TestSanitizeContent_EmptyPaths(t *testing.T) {
	a := &Agent{}
	content := "some content"
	result := a.sanitizeContent(content)
	if result != content {
		t.Errorf("empty paths should be no-op: %q", result)
	}
}

func TestSanitizeContent_LongestPathFirst(t *testing.T) {
	// If workspacePath is a substring of homePath, both should be cleaned
	a := &Agent{
		workspacePath: "/home/.fastclaw/workspaces/agt_1",
		homePath:      "/home/.fastclaw/agents/agt_1",
		homeDir:       "/home/.fastclaw",
	}
	content := "A: /home/.fastclaw/workspaces/agt_1/x.pdf B: /home/.fastclaw/agents/agt_1/y.csv C: /home/.fastclaw/z.json"
	result := a.sanitizeContent(content)
	expected := "A: x.pdf B: y.csv C: z.json"
	if result != expected {
		t.Errorf("expected %q, got %q", expected, result)
	}
}
