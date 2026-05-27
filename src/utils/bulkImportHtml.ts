export const bulkImportHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bulk Product Importer - Megaman CMS</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #f8fafc;
            --card-bg: rgba(255, 255, 255, 0.9);
            --border-color: rgba(226, 232, 240, 0.8);
            --text-main: #0f172a;
            --text-muted: #64748b;
            --primary: #0f172a;
            --primary-light: #334155;
            --accent: #2563eb;
            --accent-light: #dbeafe;
            --success: #10b981;
            --warning: #f59e0b;
            --error: #ef4444;
            --radius: 12px;
            --shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02);
            --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            line-height: 1.5;
            padding: 40px 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .container {
            max-width: 900px;
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 24px;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 20px;
        }
        .logo-title {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .logo-dot {
            width: 12px;
            height: 12px;
            background-color: var(--primary);
            border-radius: 50%;
        }
        h1 {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
            color: var(--primary);
        }
        .subtitle {
            font-size: 14px;
            color: var(--text-muted);
            margin-top: 4px;
        }
        .btn-template {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background-color: var(--card-bg);
            color: var(--primary);
            border: 1px solid var(--border-color);
            padding: 10px 16px;
            border-radius: var(--radius);
            font-size: 14px;
            font-weight: 500;
            text-decoration: none;
            cursor: pointer;
            box-shadow: var(--shadow);
            transition: var(--transition);
        }
        .btn-template:hover {
            background-color: var(--primary);
            color: white;
            border-color: var(--primary);
            transform: translateY(-1px);
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 24px;
        }
        @media (min-width: 768px) {
            .grid {
                grid-template-columns: 1.5fr 1fr;
            }
        }
        .card {
            background: var(--card-bg);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            padding: 32px;
            box-shadow: var(--shadow);
            transition: var(--transition);
        }
        .card:hover {
            box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.08);
        }
        .card-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: var(--primary);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        /* Tabs Panel */
        .tabs {
            display: flex;
            gap: 8px;
            border-bottom: 2px solid var(--border-color);
            padding-bottom: 0px;
            margin-bottom: 24px;
        }
        .tab-btn {
            background: none;
            border: none;
            font-family: inherit;
            font-size: 14px;
            font-weight: 600;
            color: var(--text-muted);
            padding: 12px 18px;
            cursor: pointer;
            transition: var(--transition);
            position: relative;
            outline: none;
            border-bottom: 2px solid transparent;
            margin-bottom: -2px;
        }
        .tab-btn:hover {
            color: var(--primary);
        }
        .tab-btn.active {
            color: var(--accent);
            border-bottom: 2px solid var(--accent);
        }

        .dropzone-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        .dropzone {
            border: 2px dashed rgba(203, 213, 225, 1);
            border-radius: var(--radius);
            padding: 30px 20px;
            text-align: center;
            cursor: pointer;
            transition: var(--transition);
            background-color: rgba(255, 255, 255, 0.5);
            position: relative;
        }
        .dropzone:hover, .dropzone.dragover {
            border-color: var(--accent);
            background-color: rgba(37, 99, 235, 0.02);
        }
        .dropzone-icon {
            font-size: 32px;
            margin-bottom: 12px;
            display: block;
        }
        .dropzone-text {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-main);
        }
        .dropzone-hint {
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 4px;
        }
        .file-selected {
            border-color: var(--success);
            background-color: rgba(16, 185, 129, 0.02);
        }
        .btn-submit {
            background-color: var(--primary);
            color: white;
            border: none;
            width: 100%;
            padding: 14px;
            border-radius: var(--radius);
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition);
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
            margin-top: 8px;
        }
        .btn-submit:hover {
            background-color: var(--primary-light);
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(15, 23, 42, 0.2);
        }
        .btn-submit:disabled {
            background-color: var(--text-muted);
            cursor: not-allowed;
            opacity: 0.6;
            transform: none;
            box-shadow: none;
        }
        
        .guidelines ul {
            list-style-type: none;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .guidelines li {
            font-size: 13px;
            color: var(--text-muted);
            position: relative;
            padding-left: 20px;
        }
        .guidelines li::before {
            content: "✓";
            color: var(--accent);
            position: absolute;
            left: 0;
            font-weight: bold;
        }
        .guidelines strong {
            color: var(--text-main);
        }
        .results-card {
            display: none;
            margin-top: 24px;
        }
        .results-summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 24px;
        }
        .summary-stat {
            background: #fff;
            border: 1px solid var(--border-color);
            padding: 16px;
            border-radius: 8px;
            text-align: center;
        }
        .summary-num {
            font-size: 24px;
            font-weight: 700;
            color: var(--primary);
        }
        .summary-label {
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 4px;
            font-weight: 500;
        }
        .progress-container {
            display: none;
            margin-top: 16px;
        }
        .progress-bar-wrapper {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 10px;
            height: 8px;
            overflow: hidden;
            position: relative;
            margin-bottom: 8px;
        }
        .progress-bar {
            background: linear-gradient(90deg, var(--accent) 0%, #3b82f6 100%);
            width: 0%;
            height: 100%;
            transition: width 0.3s ease;
        }
        .progress-text {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: var(--text-muted);
            font-weight: 500;
        }
        .log-box {
            background: #0f172a;
            color: #f8fafc;
            font-family: monospace;
            font-size: 12px;
            padding: 16px;
            border-radius: 8px;
            max-height: 250px;
            overflow-y: auto;
            white-space: pre-wrap;
            border: 1px solid #1e293b;
        }
        .error-banner {
            background-color: rgba(239, 68, 68, 0.08);
            border: 1px solid rgba(239, 68, 68, 0.2);
            color: var(--error);
            padding: 12px 16px;
            border-radius: var(--radius);
            font-size: 14px;
            margin-bottom: 16px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <div class="logo-title">
                    <span class="logo-dot"></span>
                    <h1>Bulk Product Importer</h1>
                </div>
                <p class="subtitle">Import product SKUs and their technical details into Megaman CMS in one step</p>
            </div>
            <a href="/api/products/bulk-import/template" class="btn-template">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Template File
            </a>
        </div>

        <div class="error-banner" id="errorBanner"></div>

        <div class="grid">
            <div class="card">
                <!-- Navigation Tabs -->
                <div class="tabs">
                    <button class="tab-btn active" onclick="switchTab('excel')">📊 Excel & ZIP Import</button>
                    <button class="tab-btn" onclick="switchTab('json')">📋 JSON Fixture Import</button>
                </div>
                
                <form id="importForm" onsubmit="event.preventDefault();">
                    <div class="dropzone-container">
                        <!-- Excel & ZIP Content -->
                        <div id="excelImportContainer" class="tab-content">
                            <div style="display:flex; flex-direction:column; gap:16px;">
                                <!-- XLSX Dropzone -->
                                <div class="dropzone" id="xlsxDropzone" onclick="document.getElementById('xlsxInput').click()">
                                    <input type="file" id="xlsxInput" name="xlsx" accept=".xlsx" style="display: none;" onchange="handleFileSelect(this, 'xlsx')">
                                    <span class="dropzone-icon">📊</span>
                                    <div class="dropzone-text" id="xlsxText">Select product spreadsheet (.xlsx)</div>
                                    <div class="dropzone-hint">Excel file containing general data columns and mapping file names</div>
                                </div>

                                <!-- ZIP Dropzone -->
                                <div class="dropzone" id="zipDropzone" onclick="document.getElementById('zipInput').click()">
                                    <input type="file" id="zipInput" name="zip" accept=".zip" style="display: none;" onchange="handleFileSelect(this, 'zip')">
                                    <span class="dropzone-icon">📦</span>
                                    <div class="dropzone-text" id="zipText">Select assets archive (.zip)</div>
                                    <div class="dropzone-hint">ZIP archive containing images, PDFs, LDT, IES, and Revit BIM files</div>
                                </div>

                                <button type="button" onclick="triggerExcelImport()" class="btn-submit" id="excelSubmitBtn" disabled>Start Bulk Import</button>
                            </div>
                        </div>

                        <!-- JSON Content -->
                        <div id="jsonImportContainer" class="tab-content" style="display: none;">
                            <div style="display:flex; flex-direction:column; gap:16px;">
                                <!-- JSON Dropzone -->
                                <div class="dropzone" id="jsonDropzone" onclick="document.getElementById('jsonInput').click()">
                                    <input type="file" id="jsonInput" name="json" accept=".json" style="display: none;" onchange="handleFileSelect(this, 'json')">
                                    <span class="dropzone-icon">📋</span>
                                    <div class="dropzone-text" id="jsonText">Select product JSON file (.json)</div>
                                    <div class="dropzone-hint">JSON file like fixture_data.json containing product technical attributes</div>
                                </div>

                                <button type="button" onclick="triggerJsonImport()" class="btn-submit" id="jsonSubmitBtn" disabled>Start JSON Import</button>
                            </div>
                        </div>
                    </div>
                </form>

                <div class="progress-container" id="progressContainer">
                    <div class="progress-bar-wrapper">
                        <div class="progress-bar" id="progressBar"></div>
                    </div>
                    <div class="progress-text">
                        <span id="progressStatus">Uploading and processing...</span>
                        <span id="progressPercent">0%</span>
                    </div>
                </div>
            </div>

            <!-- Excel Guidelines -->
            <div class="card guidelines" id="excelGuidelines">
                <h2 class="card-title">Import Guidelines</h2>
                <ul>
                    <li><strong>Required Spreadsheet Fields:</strong> Columns for <code>Model Number</code> (SKU), <code>Category</code>, and <code>Image File</code> are mandatory.</li>
                    <li><strong>Category/Family Auto-Create:</strong> Unmatched categories or families will be created automatically on the fly.</li>
                    <li><strong>Duplications:</strong> Existing product SKUs in the database will be elegantly overwritten and their details updated.</li>
                    <li><strong>ZIP Organization:</strong> Put images and documents anywhere in the ZIP. Sub-folders are searched recursively.</li>
                    <li><strong>File Mapping:</strong> Use standard columns: <code>Image File</code>, <code>Datasheet PDF File</code>, <code>LDT File</code>, <code>IES File</code>, and <code>BIM Revit File</code> mapping directly to file names in the ZIP.</li>
                </ul>
            </div>

            <!-- JSON Guidelines -->
            <div class="card guidelines" id="jsonGuidelines" style="display: none;">
                <h2 class="card-title">JSON Guidelines</h2>
                <ul>
                    <li><strong>File Structure:</strong> Upload a JSON file containing a list of products (like <code>fixture_data.json</code>).</li>
                    <li><strong>Required Fields:</strong> The file must contain product entries with <code>customer_model_no_new</code> or <code>yk_model_no</code> acting as the model SKU.</li>
                    <li><strong>MongoDB Specification Sync:</strong> Specifications are automatically loaded and upserted into the Mongo <code>general_data.luminaire</code> collection for dynamic hook resolving.</li>
                    <li><strong>Images Fallback:</strong> If a media record with a matching model name does not exist, a default placeholder PNG is assigned automatically.</li>
                    <li><strong>Dynamic Resolving:</strong> Categories and Families (mapped from <code>product_type</code> and <code>series_name</code>) are looked up and created automatically.</li>
                </ul>
            </div>
        </div>

        <div class="card results-card" id="resultsCard">
            <h2 class="card-title">Import Summary</h2>
            <div class="results-summary">
                <div class="summary-stat">
                    <div class="summary-num" id="statCreated">0</div>
                    <div class="summary-label">Created</div>
                </div>
                <div class="summary-stat">
                    <div class="summary-num" id="statUpdated">0</div>
                    <div class="summary-label">Updated</div>
                </div>
                <div class="summary-stat">
                    <div class="summary-num" id="statFailed">0</div>
                    <div class="summary-label">Failed/Warnings</div>
                </div>
            </div>
            <h3 style="font-size: 14px; font-weight:600; margin-bottom:12px; color: var(--primary);">Real-time Execution Logs</h3>
            <div class="log-box" id="logBox">Logs will appear here...</div>
        </div>
    </div>

    <script>
        const files = { xlsx: null, zip: null, json: null };
        let activeTab = 'excel';

        function switchTab(tab) {
            activeTab = tab;
            const excelBtn = document.querySelector('.tab-btn[onclick*="excel"]');
            const jsonBtn = document.querySelector('.tab-btn[onclick*="json"]');
            const excelContainer = document.getElementById('excelImportContainer');
            const jsonContainer = document.getElementById('jsonImportContainer');
            const excelGuidelines = document.getElementById('excelGuidelines');
            const jsonGuidelines = document.getElementById('jsonGuidelines');

            if (tab === 'excel') {
                excelBtn.classList.add('active');
                jsonBtn.classList.remove('active');
                excelContainer.style.display = 'block';
                jsonContainer.style.display = 'none';
                excelGuidelines.style.display = 'block';
                jsonGuidelines.style.display = 'none';
            } else {
                excelBtn.classList.remove('active');
                jsonBtn.classList.add('active');
                excelContainer.style.display = 'none';
                jsonContainer.style.display = 'block';
                excelGuidelines.style.display = 'none';
                jsonGuidelines.style.display = 'block';
            }
            
            // Clear status for a fresh view
            document.getElementById('errorBanner').style.display = 'none';
            document.getElementById('resultsCard').style.display = 'none';
            document.getElementById('progressContainer').style.display = 'none';
        }

        // Handle Drag & Drop
        ['xlsxDropzone', 'zipDropzone', 'jsonDropzone'].forEach(id => {
            const dropzone = document.getElementById(id);
            if (!dropzone) return;
            const type = id === 'xlsxDropzone' ? 'xlsx' : id === 'zipDropzone' ? 'zip' : 'json';
            const input = document.getElementById(type + 'Input');

            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });

            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('dragover');
            });

            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                if (e.dataTransfer.files.length) {
                    input.files = e.dataTransfer.files;
                    handleFileSelect(input, type);
                }
            });
        });

        function handleFileSelect(input, type) {
            const file = input.files[0];
            const dropzone = document.getElementById(type + 'Dropzone');
            const textElement = document.getElementById(type + 'Text');
            
            if (file) {
                files[type] = file;
                dropzone.classList.add('file-selected');
                textElement.innerText = file.name + ' (' + formatSize(file.size) + ')';
            } else {
                files[type] = null;
                dropzone.classList.remove('file-selected');
                textElement.innerText = type === 'xlsx' ? 'Select product spreadsheet (.xlsx)' : 
                                      type === 'zip' ? 'Select assets archive (.zip)' : 
                                      'Select product JSON file (.json)';
            }
            
            // Enable button if conditions met
            document.getElementById('excelSubmitBtn').disabled = !(files.xlsx && files.zip);
            document.getElementById('jsonSubmitBtn').disabled = !files.json;
        }

        function formatSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        }

        async function uploadAndProcess(url, formData, submitBtnId) {
            const submitBtn = document.getElementById(submitBtnId);
            const progressContainer = document.getElementById('progressContainer');
            const progressBar = document.getElementById('progressBar');
            const progressStatus = document.getElementById('progressStatus');
            const progressPercent = document.getElementById('progressPercent');
            const resultsCard = document.getElementById('resultsCard');
            const errorBanner = document.getElementById('errorBanner');
            const logBox = document.getElementById('logBox');

            // Reset states
            errorBanner.style.display = 'none';
            resultsCard.style.display = 'none';
            submitBtn.disabled = true;
            progressContainer.style.display = 'block';
            progressBar.style.width = '0%';
            progressPercent.innerText = '0%';
            progressStatus.innerText = 'Uploading files...';
            logBox.innerText = '';

            try {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', url, true);

                xhr.upload.onprogress = function(e) {
                    if (e.lengthComputable) {
                        const pct = Math.round((e.loaded / e.total) * 50); // Upload is 50%
                        progressBar.style.width = pct + '%';
                        progressPercent.innerText = pct + '%';
                        if (pct === 50) {
                            progressStatus.innerText = 'Processing file and syncing records (this can take a moment)...';
                        }
                    }
                };

                xhr.onload = function() {
                    progressContainer.style.display = 'none';
                    submitBtn.disabled = false;
                    
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const res = JSON.parse(xhr.responseText);
                            resultsCard.style.display = 'block';
                            
                            progressBar.style.width = '100%';
                            progressPercent.innerText = '100%';

                            document.getElementById('statCreated').innerText = res.created || 0;
                            document.getElementById('statUpdated').innerText = res.updated || 0;
                            document.getElementById('statFailed').innerText = res.warnings ? res.warnings.length : 0;

                            let logHtml = '=== IMPORT STARTED ===\\n';
                            if (res.logs && res.logs.length) {
                                logHtml += res.logs.join('\\n') + '\\n';
                            }
                            if (res.warnings && res.warnings.length) {
                                logHtml += '\\n=== WARNINGS / ERRORS ===\\n' + res.warnings.join('\\n') + '\\n';
                            }
                            logHtml += '\\n=== IMPORT COMPLETED SUCCESSFULLY ===';
                            logBox.innerText = logHtml;
                            logBox.scrollTop = logBox.scrollHeight;
                        } catch (e) {
                            showError('Failed to parse importer response: ' + xhr.responseText);
                        }
                    } else {
                        showError('Server returned an error (' + xhr.status + '): ' + xhr.responseText);
                    }
                };

                xhr.onerror = function() {
                    progressContainer.style.display = 'none';
                    submitBtn.disabled = false;
                    showError('Network error occurred during import.');
                };

                xhr.send(formData);

            } catch (error) {
                progressContainer.style.display = 'none';
                submitBtn.disabled = false;
                showError('Error initiating upload: ' + error.message);
            }
        }

        function triggerExcelImport() {
            const formData = new FormData();
            formData.append('xlsx', files.xlsx);
            formData.append('zip', files.zip);
            uploadAndProcess('/api/products/bulk-import', formData, 'excelSubmitBtn');
        }

        function triggerJsonImport() {
            const formData = new FormData();
            formData.append('json', files.json);
            uploadAndProcess('/api/products/json-import', formData, 'jsonSubmitBtn');
        }

        function showError(msg) {
            const banner = document.getElementById('errorBanner');
            banner.innerText = msg;
            banner.style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    </script>
</body>
</html>
`;
