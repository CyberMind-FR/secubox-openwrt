# SecuBox SBOM Pipeline Makefile
# Convenience targets for CRA Annex I compliance
#
# Usage:
#   make sbom          - Generate full SBOM (all sources)
#   make sbom-quick    - Generate SBOM without rebuilding
#   make sbom-validate - Validate existing SBOM
#   make sbom-scan     - CVE scan only
#   make sbom-audit    - Audit feed packages for metadata
#   make sbom-prereqs  - Check prerequisites
#   make sbom-clean    - Clean SBOM outputs
#   make sbom-help     - Show this help

.PHONY: sbom sbom-quick sbom-validate sbom-scan sbom-audit sbom-prereqs sbom-clean sbom-help

# Default version (can be overridden: make sbom VERSION=0.20)
VERSION ?= $(shell cat version 2>/dev/null || git describe --tags --always 2>/dev/null || echo "dev")
ARCH ?= aarch64_cortex-a53
SBOM_DIR ?= dist/sbom

sbom: sbom-prereqs
	@echo "=== Generating Full SBOM ==="
	./scripts/sbom-generate.sh --version "$(VERSION)" --arch "$(ARCH)"

sbom-quick:
	@echo "=== Generating Quick SBOM (no rebuild) ==="
	./scripts/sbom-generate.sh --version "$(VERSION)" --arch "$(ARCH)"

sbom-validate:
	@echo "=== Validating SBOM ==="
	@if command -v cyclonedx-cli >/dev/null 2>&1; then \
		cyclonedx-cli validate --input-file "$(SBOM_DIR)/secubox-$(VERSION).cdx.json" \
			--input-format json --input-version v1_6 || true; \
	else \
		echo "cyclonedx-cli not found. Install with:"; \
		echo "  curl -sSfL -o ~/.local/bin/cyclonedx-cli https://github.com/CycloneDX/cyclonedx-cli/releases/latest/download/cyclonedx-linux-x64"; \
		echo "  chmod +x ~/.local/bin/cyclonedx-cli"; \
	fi

sbom-scan:
	@echo "=== Running CVE Scan ==="
	@if command -v grype >/dev/null 2>&1; then \
		grype sbom:"$(SBOM_DIR)/secubox-$(VERSION).cdx.json" \
			--output table \
			--output json="$(SBOM_DIR)/secubox-$(VERSION)-cve-report.json"; \
	else \
		echo "grype not found. Install with:"; \
		echo "  curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b ~/.local/bin"; \
	fi

sbom-audit:
	@echo "=== Auditing Feed Packages ==="
	./scripts/sbom-audit-feed.sh

sbom-prereqs:
	@echo "=== Checking Prerequisites ==="
	./scripts/check-sbom-prereqs.sh

sbom-clean:
	@echo "=== Cleaning SBOM Outputs ==="
	rm -rf "$(SBOM_DIR)"
	@echo "Cleaned: $(SBOM_DIR)"

sbom-help:
	@echo "SecuBox SBOM Pipeline Targets"
	@echo "=============================="
	@echo ""
	@echo "  make sbom          - Generate full SBOM (all sources)"
	@echo "  make sbom-quick    - Generate SBOM without rebuilding"
	@echo "  make sbom-validate - Validate existing SBOM"
	@echo "  make sbom-scan     - CVE scan only"
	@echo "  make sbom-audit    - Audit feed packages for metadata"
	@echo "  make sbom-prereqs  - Check prerequisites"
	@echo "  make sbom-clean    - Clean SBOM outputs"
	@echo ""
	@echo "Variables:"
	@echo "  VERSION=$(VERSION)"
	@echo "  ARCH=$(ARCH)"
	@echo "  SBOM_DIR=$(SBOM_DIR)"
	@echo ""
	@echo "Examples:"
	@echo "  make sbom VERSION=0.20"
	@echo "  make sbom-scan VERSION=0.20"
