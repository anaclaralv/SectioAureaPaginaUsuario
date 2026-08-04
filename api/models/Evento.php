<?php
// Carregar arquivos com os nomes padronizados (após renomear)
require_once 'config/database.php';
require_once 'models/Usuario.php';
require_once 'models/Materia.php';
require_once 'models/Bloco.php';
require_once 'models/Cronograma.php';
require_once 'models/Cronometro.php';
require_once 'models/Evento.php';
require_once 'models/Flash.php';
require_once 'models/Inteligencias.php';
require_once 'models/Tarefa.php';
require_once 'controllers/AuthController.php';
require_once 'controllers/UsuarioController.php';
require_once 'controllers/MateriaController.php';
require_once 'controllers/BlocoController.php';
require_once 'controllers/CronogramaController.php';
require_once 'controllers/CronometroController.php';
require_once 'controllers/EventoController.php';
require_once 'controllers/FlashController.php';
require_once 'controllers/TarefaController.php';
require_once 'middleware/AuthMiddleware.php';
require_once 'routes/api.php';

// Headers CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$db = $database->getConnection();

// Extrai o endpoint corretamente (funciona com pastas que têm espaço)
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pos = strpos($path, '/api/');
$endpoint = ($pos !== false) ? trim(substr($path, $pos + 5), '/') : '';

rotear($_SERVER['REQUEST_METHOD'], $endpoint, $db);
?>