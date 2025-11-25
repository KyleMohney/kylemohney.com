$files = @(
  "c:\Users\Blackthorn\Desktop\kylemohney.com\rooted-vitality\dashboard\client\pages\my-wellness.html",
  "c:\Users\Blackthorn\Desktop\kylemohney.com\rooted-vitality\dashboard\client\pages\settings.html",
  "c:\Users\Blackthorn\Desktop\kylemohney.com\rooted-vitality\dashboard\pro\pages\coverage-area.html",
  "c:\Users\Blackthorn\Desktop\kylemohney.com\rooted-vitality\dashboard\pro\pages\index.html",
  "c:\Users\Blackthorn\Desktop\kylemohney.com\rooted-vitality\dashboard\pro\pages\match-settings.html",
  "c:\Users\Blackthorn\Desktop\kylemohney.com\rooted-vitality\dashboard\pro\pages\practitioner-profile.html",
  "c:\Users\Blackthorn\Desktop\kylemohney.com\rooted-vitality\dashboard\pro\pages\profile.html",
  "c:\Users\Blackthorn\Desktop\kylemohney.com\rooted-vitality\dashboard\pro\pages\settings.html",
  "c:\Users\Blackthorn\Desktop\kylemohney.com\rooted-vitality\dashboard\practitioner-profile.html",
  "c:\Users\Blackthorn\Desktop\kylemohney.com\rooted-vitality\dashboard\practitioner-signup.html"
)

foreach ($f in $files) {
  $content = Get-Content $f -Raw
  
  # Replace common corruption patterns
  $content = $content -replace 'â€"', '—'
  $content = $content -replace 'â€œ', '"'
  $content = $content -replace 'â€\x9d', '"'
  $content = $content -replace 'â€™', "'"
  $content = $content -replace 'â€"', '–'
  $content = $content -replace 'â€¢', '•'
  $content = $content -replace 'âœ"', '✓'
  $content = $content -replace 'Â', ''
  $content = $content -replace 'â€', ''
  $content = $content -replace 'â–', '•'
  
  Set-Content $f $content -NoNewline
  Write-Host "Cleaned: $(Split-Path $f -Leaf)"
}

Write-Host "All dashboard files cleaned!"
