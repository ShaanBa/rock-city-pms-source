#!/usr/bin/env bash
set -euo pipefail

failed=0

tracked_forbidden="$(git ls-files | awk '
  /(^|\/)\.env($|\.)/ && $0 !~ /\.env\.example$/ { print }
  /\.(pem|key|p12|pfx|dump|sql\.gz)$/ { print }
  /(^|\/)(local_backup|credentials)(\.|$)/ { print }
')"

if [[ -n "$tracked_forbidden" ]]; then
  echo "Forbidden tracked files:"
  echo "$tracked_forbidden"
  failed=1
fi

check_pattern() {
  local description="$1"
  local pattern="$2"
  local matches
  matches="$(git grep -I -n -E "$pattern" -- . ':!scripts/check-public-readiness.sh' || true)"
  if [[ -n "$matches" ]]; then
    echo "$description:"
    echo "$matches"
    failed=1
  fi
}

check_pattern "Private key material" 'BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY'
check_pattern "Likely committed Stripe publishable key" 'pk_(test|live)_[A-Za-z0-9]{20,}'
check_pattern "Likely committed Stripe secret key" 'sk_(test|live)_[A-Za-z0-9]{20,}'

# Split known historical values so this scanner does not preserve them as
# contiguous strings in the repository it is protecting.
old_dev_password='shaan''thegoat'
old_windows_path='C:\\Users\\''manji'
old_staff_env='MANJIT''_'
old_notifier='notify''Manjit'
check_pattern "Private operational identifiers" "${old_dev_password}|${old_windows_path}|${old_staff_env}|${old_notifier}"

if [[ "$failed" -ne 0 ]]; then
  exit 1
fi

echo "Public-readiness filename and content checks passed."
