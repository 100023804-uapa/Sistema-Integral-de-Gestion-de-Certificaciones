param(
    [string]$BaseUrl = 'http://127.0.0.1:3000',
    [string]$Email,
    [string]$Password
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-EdgePath {
    $candidates = @(
        'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
        'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
        'C:\Program Files\Google\Chrome\Application\chrome.exe'
    )

    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) {
            return $candidate
        }
    }

    throw 'No se encontró Edge o Chrome instalado.'
}

function Wait-HttpReady {
    param(
        [string]$Url,
        [int]$TimeoutSeconds = 20
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            Invoke-RestMethod -Uri $Url -UseBasicParsing | Out-Null
            return
        } catch {
            Start-Sleep -Milliseconds 400
        }
    }

    throw "No se pudo conectar a $Url dentro del tiempo esperado."
}

function New-CdpSession {
    param(
        [string]$WebSocketUrl
    )

    $socket = [System.Net.WebSockets.ClientWebSocket]::new()
    $cts = [System.Threading.CancellationTokenSource]::new()
    $socket.ConnectAsync([Uri]$WebSocketUrl, $cts.Token).GetAwaiter().GetResult()

    return [pscustomobject]@{
        Socket = $socket
        Token  = $cts.Token
        NextId = 1
    }
}

function Invoke-Cdp {
    param(
        $Session,
        [string]$Method,
        [hashtable]$Params = @{}
    )

    $messageId = $Session.NextId
    $Session.NextId += 1

    $payload = @{
        id     = $messageId
        method = $Method
        params = $Params
    } | ConvertTo-Json -Compress -Depth 20

    $sendBytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
    $segment = [System.ArraySegment[byte]]::new($sendBytes)
    $Session.Socket.SendAsync(
        $segment,
        [System.Net.WebSockets.WebSocketMessageType]::Text,
        $true,
        $Session.Token
    ).GetAwaiter().GetResult()

    $buffer = New-Object byte[] 65536
    $builder = [System.Text.StringBuilder]::new()

    while ($true) {
        $receiveSegment = [System.ArraySegment[byte]]::new($buffer)
        $result = $Session.Socket.ReceiveAsync($receiveSegment, $Session.Token).GetAwaiter().GetResult()
        if ($result.Count -gt 0) {
            $null = $builder.Append([System.Text.Encoding]::UTF8.GetString($buffer, 0, $result.Count))
        }

        if (-not $result.EndOfMessage) {
            continue
        }

        $message = $builder.ToString()
        $builder.Clear() | Out-Null

        if (-not $message) {
            continue
        }

        $json = $message | ConvertFrom-Json -Depth 50
        if ($null -ne $json.id -and $json.id -eq $messageId) {
            if ($null -ne $json.error) {
                throw ("CDP error en {0}: {1}" -f $Method, $json.error.message)
            }
            return $json.result
        }
    }
}

function Wait-ForExpr {
    param(
        $Session,
        [string]$Expression,
        [int]$TimeoutSeconds = 20
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $result = Invoke-Cdp -Session $Session -Method 'Runtime.evaluate' -Params @{
            expression    = $Expression
            returnByValue = $true
        }

        if ($result.result.value) {
            return
        }

        Start-Sleep -Milliseconds 400
    }

    throw "La condición no se cumplió a tiempo: $Expression"
}

function Navigate-And-Wait {
    param(
        $Session,
        [string]$Url,
        [string]$ReadyExpression = 'document.readyState === "complete"',
        [int]$TimeoutSeconds = 20
    )

    Invoke-Cdp -Session $Session -Method 'Page.navigate' -Params @{ url = $Url } | Out-Null
    Wait-ForExpr -Session $Session -Expression $ReadyExpression -TimeoutSeconds $TimeoutSeconds
}

function Save-Screenshot {
    param(
        $Session,
        [string]$OutputPath
    )

    $directory = Split-Path -Parent $OutputPath
    New-Item -ItemType Directory -Force -Path $directory | Out-Null

    $capture = Invoke-Cdp -Session $Session -Method 'Page.captureScreenshot' -Params @{
        format      = 'png'
        fromSurface = $true
    }

    [System.IO.File]::WriteAllBytes(
        $OutputPath,
        [Convert]::FromBase64String($capture.data)
    )
}

if (-not $Email -or -not $Password) {
    throw 'Debes enviar Email y Password.'
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$artifactsDir = Join-Path $repoRoot 'docs\manual_assets'
$profileDir = Join-Path $artifactsDir 'edge_profile_manual'
$devtoolsPort = 9222
$edgePath = Get-EdgePath

if (Test-Path -LiteralPath $profileDir) {
    Remove-Item -LiteralPath $profileDir -Recurse -Force
}

$edgeArgs = @(
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1440,1600',
    "--remote-debugging-port=$devtoolsPort",
    "--user-data-dir=$profileDir",
    'about:blank'
)

$process = Start-Process -FilePath $edgePath -ArgumentList $edgeArgs -PassThru

try {
    Wait-HttpReady -Url "http://127.0.0.1:$devtoolsPort/json/version"

    $target = Invoke-RestMethod -Uri "http://127.0.0.1:$devtoolsPort/json/new?$BaseUrl/login" -Method PUT -UseBasicParsing
    $session = New-CdpSession -WebSocketUrl $target.webSocketDebuggerUrl

    Invoke-Cdp -Session $session -Method 'Page.enable' | Out-Null
    Invoke-Cdp -Session $session -Method 'Runtime.enable' | Out-Null
    Invoke-Cdp -Session $session -Method 'Emulation.setDeviceMetricsOverride' -Params @{
        width             = 1440
        height            = 1600
        deviceScaleFactor = 1
        mobile            = $false
    } | Out-Null

    Wait-ForExpr -Session $session -Expression 'document.querySelector("#email") && document.querySelector("#password")'
    Save-Screenshot -Session $session -OutputPath (Join-Path $artifactsDir 'manual_login_2026-04-03.png')

    Invoke-Cdp -Session $session -Method 'Runtime.evaluate' -Params @{
        expression = @"
(() => {
  const adminButton = Array.from(document.querySelectorAll('button')).find((button) => button.textContent && button.textContent.includes('Administrador'));
  if (adminButton) adminButton.click();
  return true;
})()
"@
        awaitPromise = $false
    } | Out-Null

    Start-Sleep -Milliseconds 800

    Invoke-Cdp -Session $session -Method 'Runtime.evaluate' -Params @{
        expression = @"
(() => {
  const email = document.querySelector('#email');
  const password = document.querySelector('#password');
  if (!email || !password) return false;
  email.value = '$Email';
  email.dispatchEvent(new Event('input', { bubbles: true }));
  password.value = '$Password';
  password.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
})()
"@
    } | Out-Null

    Start-Sleep -Milliseconds 500

    Invoke-Cdp -Session $session -Method 'Runtime.evaluate' -Params @{
        expression = @"
(() => {
  const submit = document.querySelector('form button[type="submit"]');
  if (submit) submit.click();
  return true;
})()
"@
    } | Out-Null

    Wait-ForExpr -Session $session -Expression 'location.pathname.startsWith("/dashboard")' -TimeoutSeconds 35
    Start-Sleep -Milliseconds 1500

    $captures = @(
        @{ Path = '/dashboard'; Name = 'manual_dashboard_2026-04-03.png'; Ready = 'document.body && document.body.innerText.includes("Resumen")' },
        @{ Path = '/dashboard/campuses'; Name = 'manual_campuses_2026-04-03.png'; Ready = 'document.body && document.body.innerText.includes("Recintos")' },
        @{ Path = '/dashboard/signers'; Name = 'manual_signers_2026-04-03.png'; Ready = 'document.body && document.body.innerText.includes("Firmantes Autorizados")' },
        @{ Path = '/dashboard/certificate-templates'; Name = 'manual_templates_2026-04-03.png'; Ready = 'document.body && document.body.innerText.includes("Plantillas de Certificado")' },
        @{ Path = '/dashboard/programs'; Name = 'manual_programs_2026-04-03.png'; Ready = 'document.body && document.body.innerText.includes("Programas Académicos")' },
        @{ Path = '/dashboard/graduates'; Name = 'manual_participants_2026-04-03.png'; Ready = 'document.body && document.body.innerText.includes("Participantes")' },
        @{ Path = '/dashboard/graduates/import'; Name = 'manual_participants_import_2026-04-03.png'; Ready = 'document.body && document.body.innerText.includes("Importacion de Participantes")' },
        @{ Path = '/dashboard/certificates'; Name = 'manual_certificates_2026-04-03.png'; Ready = 'document.body && document.body.innerText.includes("Certificados")' },
        @{ Path = '/dashboard/certificates/create'; Name = 'manual_certificates_create_2026-04-03.png'; Ready = 'document.body && document.body.innerText.includes("Nuevo Certificado")' },
        @{ Path = '/dashboard/certificates/import'; Name = 'manual_certificates_import_2026-04-03.png'; Ready = 'document.body && document.body.innerText.includes("Carga Masiva de Certificados")' },
        @{ Path = '/dashboard/certificate-states'; Name = 'manual_certificate_states_2026-04-03.png'; Ready = 'document.body && document.body.innerText.includes("Estados de Certificados")' },
        @{ Path = '/dashboard/users'; Name = 'manual_users_2026-04-03.png'; Ready = 'document.body && document.body.innerText.includes("Usuarios Internos")' },
        @{ Path = '/dashboard/data-integrity'; Name = 'manual_integrity_2026-04-03.png'; Ready = 'document.body && document.body.innerText.includes("Integridad de Datos")' }
    )

    foreach ($capture in $captures) {
        Navigate-And-Wait -Session $session -Url "$BaseUrl$($capture.Path)" -ReadyExpression $capture.Ready -TimeoutSeconds 25
        Start-Sleep -Milliseconds 1200
        Save-Screenshot -Session $session -OutputPath (Join-Path $artifactsDir $capture.Name)
    }

    Write-Output $artifactsDir
}
finally {
    if ($null -ne $process -and -not $process.HasExited) {
        Stop-Process -Id $process.Id -Force
    }
}
