param(
  [string]$InputPath = (Join-Path $PSScriptRoot 'NEDECEN Development Journey.docx'),
  [string]$OutputPath = (Join-Path $PSScriptRoot '.qa/NEDECEN Development Journey.pdf')
)
$ErrorActionPreference = 'Stop'
$documentPath = [System.IO.Path]::GetFullPath($InputPath)
$pdfPath = [System.IO.Path]::GetFullPath($OutputPath)
$wordApp = $null
$bookDocument = $null
try {
  $wordApp = New-Object -ComObject Word.Application
  $wordApp.Visible = $false
  $wordApp.DisplayAlerts = 0
  $wordApp.AutomationSecurity = 3
  $bookDocument = $wordApp.Documents.Open($documentPath, $false, $false, $false)
  $bookDocument.Fields.Update() | Out-Null
  foreach ($contents in $bookDocument.TablesOfContents) { $contents.Update() }
  $bookDocument.Repaginate()
  foreach ($contents in $bookDocument.TablesOfContents) { $contents.UpdatePageNumbers() }
  $bookDocument.Save()
  $bookDocument.ExportAsFixedFormat($pdfPath, 17)
  Write-Output ('Pages: ' + $bookDocument.ComputeStatistics(2))
  Write-Output ('PDF: ' + $pdfPath)
} finally {
  if ($bookDocument) { $bookDocument.Close(0); [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($bookDocument) }
  if ($wordApp) { $wordApp.Quit(); [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($wordApp) }
}
