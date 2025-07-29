# Classic Offset Project Cleanup Script
# Run this script in PowerShell from the project root directory

Write-Host "🧹 Starting Classic Offset Project Cleanup..." -ForegroundColor Green

# 1. Remove obsolete SQL files
$sqlFiles = @(
    "corrected_remote_schema.sql",
    "crm_database_setup.sql", 
    "local_backup.sql",
    "local_schema.sql",
    "loyalty_program_setup.sql",
    "loyalty_program_setup_fixed.sql",
    "MANUAL_SCHEMA_SYNC.sql",
    "remote_data.sql",
    "sample_data.sql", 
    "schema_dump.sql",
    "simple_crm_setup.sql",
    "sync_database.sql",
    "check_materials_structure.sql",
    "add_smart_inventory_columns.sql"
)

Write-Host "🗑️ Removing obsolete SQL files..." -ForegroundColor Yellow
foreach ($file in $sqlFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "   ✅ Deleted: $file" -ForegroundColor Red
    }
}

# 2. Remove obsolete JavaScript files
$jsFiles = @(
    "final-sync.js",
    "inspect-database.js", 
    "inspect-local.js",
    "minimal-sync.js",
    "smart-sync.js",
    "sync-database.js"
)

Write-Host "🗑️ Removing obsolete JavaScript files..." -ForegroundColor Yellow
foreach ($file in $jsFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "   ✅ Deleted: $file" -ForegroundColor Red
    }
}

# 3. Remove development/debug files
$devFiles = @(
    "analyse.html",
    "pglite-debug.log",
    "DEVELOPMENT.md",
    "deno.json",
    "deno.lock", 
    "migrate_db.sh",
    "vite.config.js"
)

Write-Host "🗑️ Removing development/debug files..." -ForegroundColor Yellow
foreach ($file in $devFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "   ✅ Deleted: $file" -ForegroundColor Red
    }
}

# 4. Remove duplicate components
$duplicateComponents = @(
    "src\components\CustomerSelect.tsx",
    "src\components\WhatsAppDashboard.tsx",
    "src\components\WhatsAppModal.tsx"
)

Write-Host "🗑️ Removing duplicate components..." -ForegroundColor Yellow
foreach ($file in $duplicateComponents) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "   ✅ Deleted: $file" -ForegroundColor Red
    }
}

# 5. Remove backup migration folders
$backupFolders = @(
    "supabase\migrations_backup",
    "supabase\migrations_backup_old",
    "supabase\.temp",
    "supabase\.branches"
)

Write-Host "🗑️ Removing backup migration folders..." -ForegroundColor Yellow
foreach ($folder in $backupFolders) {
    if (Test-Path $folder) {
        Remove-Item $folder -Recurse -Force
        Write-Host "   ✅ Deleted folder: $folder" -ForegroundColor Red
    }
}

# 6. Remove obsolete enhancement files
$enhancementFiles = @(
    "supabase\enhancement_schema.sql",
    "supabase\enhancement_schema_fixed.sql"
)

Write-Host "🗑️ Removing obsolete enhancement files..." -ForegroundColor Yellow
foreach ($file in $enhancementFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "   ✅ Deleted: $file" -ForegroundColor Red
    }
}

# 7. Remove build artifacts (optional - they can be regenerated)
Write-Host "🗑️ Removing build artifacts..." -ForegroundColor Yellow
$buildFiles = @("tsconfig.tsbuildinfo", "tsconfig.node.tsbuildinfo")
foreach ($file in $buildFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "   ✅ Deleted: $file" -ForegroundColor Red
    }
}

# Ask about dist folder
if (Test-Path "dist") {
    $response = Read-Host "🤔 Remove dist/ folder? (It can be regenerated with 'npm run build') [y/N]"
    if ($response -eq "y" -or $response -eq "Y") {
        Remove-Item "dist" -Recurse -Force
        Write-Host "   ✅ Deleted folder: dist/" -ForegroundColor Red
    }
}

Write-Host "✨ Project cleanup completed!" -ForegroundColor Green
Write-Host "📊 Summary of what was cleaned:" -ForegroundColor Cyan
Write-Host "   • 14 obsolete SQL files" -ForegroundColor White
Write-Host "   • 6 obsolete JavaScript files" -ForegroundColor White  
Write-Host "   • 7 development/debug files" -ForegroundColor White
Write-Host "   • 3 duplicate components" -ForegroundColor White
Write-Host "   • 4 backup migration folders" -ForegroundColor White
Write-Host "   • 2 obsolete enhancement files" -ForegroundColor White
Write-Host "   • Build artifacts" -ForegroundColor White

Write-Host "🎯 Your project is now clean and organized!" -ForegroundColor Green
