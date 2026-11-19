# =====================================================================
# SERVER.PS1 - Local HTTP Server for WebLich
# Vien Quan ly chat luong va Khao thi
# =====================================================================

$OutputEncoding = [System.Text.Encoding]::UTF8

$rootDir = $PSScriptRoot
if (-not $rootDir) { $rootDir = (Get-Location).Path }

# Get local LAN IP
$localIP = "localhost"
try {
    $ipObj = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback" -and $_.IPAddress -notlike "169.254*" } | Select-Object -First 1
    if ($ipObj) { $localIP = $ipObj.IPAddress }
} catch {}

$port = 8080
$listener = $null
$started = $false

while (-not $started -and $port -le 8095) {
    try {
        $listener = New-Object System.Net.HttpListener
        $listener.Prefixes.Add("http://localhost:$port/")
        $listener.Prefixes.Add("http://127.0.0.1:$port/")
        $listener.Start()
        $started = $true
    } catch {
        $port++
    }
}

if (-not $started) {
    Write-Host "[ERROR] Could not start HTTP server on port 8080-8095" -ForegroundColor Red
    pause
    exit
}

Clear-Host
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "     HE THONG QUAN LY TAI NGUYEN (WEBLICH) - MAY CHU NOI BO           " -ForegroundColor Cyan
Write-Host "           Vien Quan Ly Chat Luong va Khao Thi                         " -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "  [+] Trang thai:      DANG HOAT DONG                                 " -ForegroundColor Green
Write-Host "  [+] Tu dong luu:     GHI TRUC TIEP TUC THI vao sheet_data.js        " -ForegroundColor Yellow
Write-Host "  [+] Xem lich:        http://localhost:$port/                          " -ForegroundColor Cyan
Write-Host "  [+] Trang quan tri:  http://localhost:$port/admin.html               " -ForegroundColor Cyan
if ($localIP -ne "localhost") {
Write-Host "  [+] Link mang LAN:   http://${localIP}:$port/ (cac may khac trong vien)" -ForegroundColor Magenta
}
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  [!] LUU Y: Vui long THU NHO CUA SO NAY xuong Taskbar, KHONG TAT     " -ForegroundColor Yellow
Write-Host "      de he thong luon tu dong ghi moi thay doi vao o cung!           " -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "  Nhat ky hoat dong (Logs):" -ForegroundColor DarkGray

# Open browser
Start-Process "http://localhost:$port/"

$mimeTypes = @{
    ".html"  = "text/html; charset=utf-8"
    ".htm"   = "text/html; charset=utf-8"
    ".css"   = "text/css; charset=utf-8"
    ".js"    = "application/javascript; charset=utf-8"
    ".json"  = "application/json; charset=utf-8"
    ".png"   = "image/png"
    ".jpg"   = "image/jpeg"
    ".jpeg"  = "image/jpeg"
    ".svg"   = "image/svg+xml"
    ".ico"   = "image/x-icon"
    ".csv"   = "text/csv; charset=utf-8"
    ".woff2" = "font/woff2"
    ".woff"  = "font/woff"
    ".ttf"   = "font/ttf"
}

$lastServerUpdate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$backupDir = Join-Path $rootDir "backups"
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # CORS & Private Network Access headers
        $origin = $request.Headers["Origin"]
        if (-not $origin -or $origin -eq "" -or $origin -eq "null") {
            $response.AddHeader("Access-Control-Allow-Origin", "*")
        } else {
            $response.AddHeader("Access-Control-Allow-Origin", $origin)
        }
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Access-Control-Request-Private-Network, *")
        $response.AddHeader("Access-Control-Allow-Private-Network", "true")
        $response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/" -or $urlPath -eq "") { $urlPath = "/index.html" }

        # API: SAVE DIRECTLY TO sheet_data.js
        if ($request.HttpMethod -eq "POST" -and $urlPath -eq "/api/save") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            $reader.Close()

            $targetFile = Join-Path $rootDir "sheet_data.js"
            $backupFile = Join-Path $rootDir "sheet_data.json"
            $historyFile = Join-Path $backupDir "sheet_data_$((Get-Date).ToString('yyyyMMdd_HHmmss')).json"

            try {
                $nowStr = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
                $lastServerUpdate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

                $jsContent = "/**`r`n * SHEET_DATA.JS - Tep Du Lieu Bang Sheet Offline Dung Chung`r`n * Vien Quan Ly Chat Luong va Khao Thi`r`n * Tu dong cap nhat tuc thi luc: $nowStr`r`n */`r`n`r`nwindow.SHARED_SHEET_DATA = $body;`r`n"
                
                [System.IO.File]::WriteAllText($targetFile, $jsContent, [System.Text.Encoding]::UTF8)
                [System.IO.File]::WriteAllText($backupFile, $body, [System.Text.Encoding]::UTF8)
                [System.IO.File]::WriteAllText($historyFile, $body, [System.Text.Encoding]::UTF8)

                Write-Host "  [$(Get-Date -Format 'HH:mm:ss')] [OK] DA TU DONG GHI VAO sheet_data.js" -ForegroundColor Green
                
                $resData = @{ 
                    status = "success"
                    message = "Da tu dong ghi tuc thi vao file sheet_data.js"
                    updatedAt = $lastServerUpdate
                } | ConvertTo-Json
                
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($resData)
                $response.ContentType = "application/json; charset=utf-8"
                $response.StatusCode = 200
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            } catch {
                Write-Host "  [$(Get-Date -Format 'HH:mm:ss')] [ERROR] $_" -ForegroundColor Red
                $resData = @{ status = "error"; message = $_.Exception.Message } | ConvertTo-Json
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($resData)
                $response.ContentType = "application/json; charset=utf-8"
                $response.StatusCode = 500
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
            $response.Close()
            continue
        }

        # API: STATUS & REAL-TIME SYNC
        if ($request.HttpMethod -eq "GET" -and $urlPath -eq "/api/status") {
            $statusData = @{
                status = "running"
                updatedAt = $lastServerUpdate
                serverPort = $port
                localIP = $localIP
                time = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            } | ConvertTo-Json

            $buffer = [System.Text.Encoding]::UTF8.GetBytes($statusData)
            $response.ContentType = "application/json; charset=utf-8"
            $response.StatusCode = 200
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
            continue
        }

        # STATIC FILES
        $cleanPath = $urlPath.TrimStart("/").Replace("/", "\")
        $filePath = Join-Path $rootDir $cleanPath

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = $mimeTypes[$ext]
            if (-not $mime) { $mime = "application/octet-stream" }

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $mime
            $response.StatusCode = 200
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($msg, 0, $msg.Length)
        }
        $response.Close()
    } catch {
        # Ignore client disconnect
    }
}
