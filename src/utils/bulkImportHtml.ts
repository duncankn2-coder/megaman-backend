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
                <h2 class="card-title">📋 JSON Import & XLSX Converter</h2>
                
                <form id="importForm" onsubmit="event.preventDefault();">
                    <div style="display:flex; flex-direction:column; gap:28px;">
                        <!-- Section 1: Converter & Import -->
                        <div class="import-section">
                            <h3 style="font-size:14px; font-weight:600; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                                <span>🔄</span> Convert & Import XLSX Spreadsheet
                            </h3>
                            <div style="display:flex; flex-direction:column; gap:12px;">
                                <input type="file" id="converterInput" name="converter" accept=".xlsx" style="display: none;">
                                <div class="dropzone" id="converterDropzone">
                                    <span class="dropzone-icon">📊</span>
                                    <div class="dropzone-text" id="converterText">Select general data spreadsheet (.xlsx)</div>
                                    <div class="dropzone-hint">Convert spreadsheet columns and import immediately into CMS</div>
                                </div>
                                <button type="button" onclick="triggerXlsxConvertAndImport()" class="btn-submit" id="converterSubmitBtn" disabled>Convert & Import JSON</button>
                            </div>
                        </div>

                        <div style="border-top: 1px dashed var(--border-color);"></div>

                        <!-- Section 2: Direct JSON Import -->
                        <div class="import-section">
                            <h3 style="font-size:14px; font-weight:600; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                                <span>📋</span> Direct JSON Import
                            </h3>
                            <div style="display:flex; flex-direction:column; gap:12px;">
                                <input type="file" id="jsonInput" name="json" accept=".json" style="display: none;">
                                <div class="dropzone" id="jsonDropzone">
                                    <span class="dropzone-icon">📋</span>
                                    <div class="dropzone-text" id="jsonText">Select product JSON file (.json)</div>
                                    <div class="dropzone-hint">Upload a previously converted JSON or fixture data file</div>
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

            <!-- Consolidated Guidelines -->
            <div class="card guidelines" id="importGuidelines">
                <h2 class="card-title">Import & Conversion Guidelines</h2>
                <div style="display:flex; flex-direction:column; gap:16px;">
                    <div>
                        <h3 style="font-size:13px; font-weight:600; margin-bottom:6px; color:var(--primary); display:flex; align-items:center; gap:4px;">
                            <span>🔄</span> Convert & Import XLSX Spreadsheet
                        </h3>
                        <ul style="list-style-type: none; display: flex; flex-direction: column; gap: 8px;">
                            <li style="font-size: 12px; color: var(--text-muted); position: relative; padding-left: 18px;">
                                <span style="color: var(--accent); position: absolute; left: 0; font-weight: bold;">✓</span>
                                <strong>Spreadsheet Layout:</strong> Upload a <code>.xlsx</code> file structured with columns matching general data fields (like <code>Fixture General data - Hagon 2.xlsx</code>).
                            </li>
                            <li style="font-size: 12px; color: var(--text-muted); position: relative; padding-left: 18px;">
                                <span style="color: var(--accent); position: absolute; left: 0; font-weight: bold;">✓</span>
                                <strong>Auto-Import:</strong> The converter automatically cleans keys, normalizes dates to <code>YYYY-MM-DD</code>, and immediately triggers step 2 to sync records in CMS and MongoDB. No manual download/re-upload needed!
                            </li>
                        </ul>
                    </div>
                    <hr style="border:0; border-top:1px dashed var(--border-color);" />
                    <div>
                        <h3 style="font-size:13px; font-weight:600; margin-bottom:6px; color:var(--primary); display:flex; align-items:center; gap:4px;">
                            <span>📋</span> Direct JSON Import
                        </h3>
                        <ul style="list-style-type: none; display: flex; flex-direction: column; gap: 8px;">
                            <li style="font-size: 12px; color: var(--text-muted); position: relative; padding-left: 18px;">
                                <span style="color: var(--accent); position: absolute; left: 0; font-weight: bold;">✓</span>
                                <strong>JSON Structure:</strong> Upload a JSON array of products (like <code>fixture_data.json</code>) containing product specifications.
                            </li>
                            <li style="font-size: 12px; color: var(--text-muted); position: relative; padding-left: 18px;">
                                <span style="color: var(--accent); position: absolute; left: 0; font-weight: bold;">✓</span>
                                <strong>Specs Syncing:</strong> Automatically upserts specifications into MongoDB <code>general_data.luminaire</code> collection for dynamic hook resolving.
                            </li>
                        </ul>
                    </div>
                </div>
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
        const files = { json: null, converter: null };

        // Handle Click, Change, and Drag & Drop dynamically
        ['json', 'converter'].forEach(type => {
            const dropzone = document.getElementById(type + 'Dropzone');
            const input = document.getElementById(type + 'Input');
            if (!dropzone || !input) return;

            // Trigger file input dialog when dropzone is clicked
            dropzone.addEventListener('click', () => {
                input.click();
            });

            // Handle file input changes
            input.addEventListener('change', () => {
                handleFileSelect(input, type);
            });

            // Drag & Drop
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
                textElement.innerText = type === 'json' ? 'Select product JSON file (.json)' :
                                      'Select general data spreadsheet (.xlsx)';
            }
            
            // Enable buttons if conditions met
            const jsonBtn = document.getElementById('jsonSubmitBtn');
            if (jsonBtn) jsonBtn.disabled = !files.json;
            
            const converterBtn = document.getElementById('converterSubmitBtn');
            if (converterBtn) converterBtn.disabled = !files.converter;
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

                            // Restore default labels
                            document.querySelector('#resultsCard .results-summary div:nth-child(1) .summary-label').innerText = 'Created';
                            document.querySelector('#resultsCard .results-summary div:nth-child(2) .summary-label').innerText = 'Updated';
                            document.querySelector('#resultsCard .results-summary div:nth-child(3) .summary-label').innerText = 'Failed/Warnings';

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

        async function triggerXlsxConvertAndImport() {
            const submitBtn = document.getElementById('converterSubmitBtn');
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
            progressStatus.innerText = 'Step 1/2: Uploading spreadsheet...';
            logBox.innerText = '';

            try {
                const formData = new FormData();
                formData.append('xlsx', files.converter);

                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/products/xlsx-to-json', true);

                xhr.upload.onprogress = function(e) {
                    if (e.lengthComputable) {
                        const pct = Math.round((e.loaded / e.total) * 30); // Conversion is 30% of total
                        progressBar.style.width = pct + '%';
                        progressPercent.innerText = pct + '%';
                    }
                };

                xhr.onload = async function() {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const res = JSON.parse(xhr.responseText);
                            let logHtml = '=== STEP 1: XLSX CONVERSION COMPLETED ===\\n';
                            logHtml += 'Uploaded file: ' + files.converter.name + '\\n';
                            logHtml += 'Parsed sheet successfully.\\n';
                            logHtml += 'Found ' + res.length + ' valid product data rows.\\n\\n';
                            
                            res.forEach((item, idx) => {
                                const model = item.customer_model_no_new || item.yk_model_no || 'UNKNOWN';
                                logHtml += 'Row ' + (idx + 1) + ': Mapped to SKU "' + model + '" successfully.\\n';
                            });
                            logBox.innerText = logHtml;
                            logBox.scrollTop = logBox.scrollHeight;

                            // Update progress for Step 2
                            progressBar.style.width = '50%';
                            progressPercent.innerText = '50%';
                            progressStatus.innerText = 'Step 2/2: Importing converted JSON into CMS...';

                            // Trigger JSON file download in background for convenience
                            const jsonString = JSON.stringify(res, null, 4);
                            const blob = new Blob([jsonString], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            const nameParts = files.converter.name.split('.');
                            const baseName = nameParts.slice(0, -1).join('.') || files.converter.name;
                            a.download = baseName + '_converted.json';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);

                            // Construct file and form data for direct JSON import
                            const jsonFile = new File([blob], baseName + '_converted.json', { type: 'application/json' });
                            const importFormData = new FormData();
                            importFormData.append('json', jsonFile);

                            // Send step 2 import request
                            const importXhr = new XMLHttpRequest();
                            importXhr.open('POST', '/api/products/json-import', true);

                            importXhr.upload.onprogress = function(pe) {
                                if (pe.lengthComputable) {
                                    const pct = 50 + Math.round((pe.loaded / pe.total) * 40); // 50% to 90%
                                    progressBar.style.width = pct + '%';
                                    progressPercent.innerText = pct + '%';
                                }
                            };

                            importXhr.onload = function() {
                                progressContainer.style.display = 'none';
                                submitBtn.disabled = false;

                                if (importXhr.status >= 200 && importXhr.status < 300) {
                                    try {
                                        const importRes = JSON.parse(importXhr.responseText);
                                        resultsCard.style.display = 'block';

                                        progressBar.style.width = '100%';
                                        progressPercent.innerText = '100%';

                                        document.getElementById('statCreated').innerText = importRes.created || 0;
                                        document.getElementById('statUpdated').innerText = importRes.updated || 0;
                                        document.getElementById('statFailed').innerText = importRes.warnings ? importRes.warnings.length : 0;

                                        // Restore default labels
                                        document.querySelector('#resultsCard .results-summary div:nth-child(1) .summary-label').innerText = 'Created';
                                        document.querySelector('#resultsCard .results-summary div:nth-child(2) .summary-label').innerText = 'Updated';
                                        document.querySelector('#resultsCard .results-summary div:nth-child(3) .summary-label').innerText = 'Failed/Warnings';

                                        logHtml += '\\n=== STEP 2: IMPORT STARTED ===\\n';
                                        if (importRes.logs && importRes.logs.length) {
                                            logHtml += importRes.logs.join('\\n') + '\\n';
                                        }
                                        if (importRes.warnings && importRes.warnings.length) {
                                            logHtml += '\\n=== WARNINGS / ERRORS ===\\n' + importRes.warnings.join('\\n') + '\\n';
                                        }
                                        logHtml += '\\n=== CONVERSION & IMPORT COMPLETED SUCCESSFULLY ===';
                                        logBox.innerText = logHtml;
                                        logBox.scrollTop = logBox.scrollHeight;

                                    } catch (ie) {
                                        showError('Failed to parse import response: ' + importXhr.responseText);
                                    }
                                } else {
                                    showError('Step 2 Import Error (' + importXhr.status + '): ' + importXhr.responseText);
                                }
                            };

                            importXhr.onerror = function() {
                                progressContainer.style.display = 'none';
                                submitBtn.disabled = false;
                                showError('Network error occurred during automatic JSON import step.');
                            };

                            importXhr.send(importFormData);

                        } catch (e) {
                            progressContainer.style.display = 'none';
                            submitBtn.disabled = false;
                            showError('Failed to parse conversion response: ' + xhr.responseText);
                        }
                    } else {
                        progressContainer.style.display = 'none';
                        submitBtn.disabled = false;
                        showError('Step 1 Conversion Error (' + xhr.status + '): ' + xhr.responseText);
                    }
                };

                xhr.onerror = function() {
                    progressContainer.style.display = 'none';
                    submitBtn.disabled = false;
                    showError('Network error occurred during conversion step.');
                };

                xhr.send(formData);

            } catch (error) {
                progressContainer.style.display = 'none';
                submitBtn.disabled = false;
                showError('Error initiating upload: ' + error.message);
            }
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
