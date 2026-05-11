package tools

import "testing"

func TestWorkspaceRef(t *testing.T) {
	tests := []struct {
		sessionID string
		path      string
		want      string
	}{
		{"", "report.pdf", "report.pdf"},
		{"sess123", "report.pdf", "sessions/sess123/report.pdf"},
		{"", "sub/dir/file.csv", "sub/dir/file.csv"},
		{"sess456", "sub/dir/file.csv", "sessions/sess456/sub/dir/file.csv"},
	}
	for _, tt := range tests {
		got := workspaceRef(tt.sessionID, tt.path)
		if got != tt.want {
			t.Errorf("workspaceRef(%q, %q) = %q, want %q", tt.sessionID, tt.path, got, tt.want)
		}
	}
}
