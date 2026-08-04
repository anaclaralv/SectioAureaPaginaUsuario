<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

spl_autoload_register(function ($class_name) {
    $paths = [
        __DIR__ . '/config/' . $class_name . '.php',
        __DIR__ . '/models/' . $class_name . '.php',
        __DIR__ . '/controllers/' . $class_name . '.php',
        __DIR__ . '/middleware/' . $class_name . '.php',
    ];
    foreach ($paths as $path) {
        if (file_exists($path)) {
            require_once $path;
            return;
        }
    }
});

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/routes/api.php';

$database = new Database();
$db = $database->getConnection();

$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$endpoint = '';

// Extrai o que vem depois de /api/
if (preg_match('#/api/(.*)$#', $path, $matches)) {
    $endpoint = $matches[1];
}

rotear($_SERVER['REQUEST_METHOD'], $endpoint, $db);
?>