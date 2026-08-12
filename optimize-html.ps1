# dist/ 내 모든 HTML 파일 렌더링 블로킹 최적화 스크립트
# 1. <script src=...> → <script src=... defer>  (defer 없는 경우만)
# 2. <head> 직후에 preconnect 태그 주입 (이미 있으면 스킵)

$distPath = "dist"
$files = Get-ChildItem -Path $distPath -Recurse -Filter "*.html"
$total = $files.Count
$count = 0
$modified = 0

$preconnectBlock = @'
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
'@

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $original = $content
    $changed = $false

    # 1. <script src=... > 에 defer 추가 (이미 defer/async 있으면 스킵)
    # 패턴: <script src="..." > 또는 <script src='...' > (defer/async 없는 것만)
    $newContent = [regex]::Replace($content,
        '(<script\s+src=["''][^"'']+["''])(\s*>)',
        {
            param($m)
            $full = $m.Value
            # 이미 defer 또는 async가 있으면 그대로
            if ($full -match 'defer|async') {
                return $full
            }
            # src 속성 닫는 따옴표 뒤, > 앞에 defer 삽입
            return $m.Groups[1].Value + ' defer' + $m.Groups[2].Value
        },
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )

    if ($newContent -ne $content) {
        $content = $newContent
        $changed = $true
    }

    # 2. preconnect 주입 (아직 없는 경우만)
    if ($content -notmatch 'preconnect.*fonts\.googleapis\.com') {
        # <head> 직후에 삽입
        $newContent = [regex]::Replace($content,
            '(<head[^>]*>)',
            '$1' + "`n" + $preconnectBlock,
            [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
        )
        if ($newContent -ne $content) {
            $content = $newContent
            $changed = $true
        }
    }

    if ($changed) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        $modified++
    }

    $count++
    if ($count % 1000 -eq 0) {
        Write-Host ".. $count / $total 처리 완료 (수정: $modified)"
    }
}

Write-Host ""
Write-Host "완료: 전체 $total 개 파일 중 $modified 개 수정됨"
