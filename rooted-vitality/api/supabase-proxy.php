<?php
/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: api/supabase-proxy.php                                      ║
║  Purpose: Server-side proxy for Supabase API calls                 ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

This proxy allows client-side code to access Supabase API through the
server, avoiding CORS issues and DNS resolution problems.
*/

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to client
ini_set('log_errors', 1);

// Set response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, apikey, Authorization');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Supabase configuration
const SUPABASE_URL = 'https://nguwgabvfwzwvpykxkdz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ndXdnYWJ2Znd6d3ZweWt4a2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwOTA1OTIsImV4cCI6MjA0NzY2NjU5Mn0.Bpo9u3K_fFmj5yWJKjBnhUSfZAi-6PzJEwlZHQ9qEJI';

try {
    // Get the requested table and parameters
    $table = isset($_GET['table']) ? $_GET['table'] : null;
    $method = $_SERVER['REQUEST_METHOD'];
    $requestBody = file_get_contents('php://input');
    
    if (!$table) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing table parameter']);
        exit;
    }
    
    // Build the Supabase API URL
    $supabaseUrl = SUPABASE_URL . '/rest/v1/' . $table;
    
    // Add query parameters if present
    if ($method === 'GET' && !empty($_GET)) {
        $queryParams = $_GET;
        unset($queryParams['table']); // Remove our custom param
        if (!empty($queryParams)) {
            $supabaseUrl .= '?' . http_build_query($queryParams);
        }
    }
    
    // Prepare headers for Supabase request
    $headers = [
        'apikey: ' . SUPABASE_KEY,
        'Authorization: Bearer ' . SUPABASE_KEY,
        'Content-Type: application/json',
        'Prefer: return=representation'
    ];
    
    // Initialize cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    // Set request method and body
    switch ($method) {
        case 'GET':
            curl_setopt($ch, CURLOPT_HTTPGET, true);
            break;
        case 'POST':
            curl_setopt($ch, CURLOPT_POST, true);
            if (!empty($requestBody)) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
            }
            break;
        case 'PATCH':
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
            if (!empty($requestBody)) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
            }
            break;
        case 'PUT':
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
            if (!empty($requestBody)) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
            }
            break;
        case 'DELETE':
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
            break;
    }
    
    // Execute request
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    // Handle errors
    if ($error) {
        http_response_code(502);
        echo json_encode(['error' => 'Proxy request failed: ' . $error]);
        exit;
    }
    
    // Return Supabase response
    http_response_code($httpCode);
    echo $response;
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
