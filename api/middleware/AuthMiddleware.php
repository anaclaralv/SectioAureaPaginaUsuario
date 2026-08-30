<?php
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

class AuthMiddleware {
    
    public static function validarToken($db) {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = null;
        
        if (!empty($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
        } elseif (!empty($headers['authorization'])) {
            $authHeader = $headers['authorization'];
        } elseif (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } elseif (!empty($_SERVER['Authorization'])) {
            $authHeader = $_SERVER['Authorization'];
        } elseif (function_exists('apache_request_headers')) {
            $apacheHeaders = apache_request_headers();
            if (!empty($apacheHeaders['Authorization'])) {
                $authHeader = $apacheHeaders['Authorization'];
            } elseif (!empty($apacheHeaders['authorization'])) {
                $authHeader = $apacheHeaders['authorization'];
            }
        }
        
        if (!$authHeader) {
            http_response_code(401);
            echo json_encode(["message" => "Token não fornecido"]);
            exit();
        }
        
        $token = str_ireplace('Bearer ', '', trim($authHeader));
        
        // Decodifica o token (formato: id_usuario:timestamp)
        $decoded = base64_decode($token);
        $parts = explode(':', $decoded);
        
        if(count($parts) != 2) {
            http_response_code(401);
            echo json_encode(["message" => "Token inválido"]);
            exit();
        }
        
        $id_usuario = $parts[0];
        
        // Verifica se o usuário existe e está ativo
        $usuario = new Usuario($db);
        $usuario->id_usuario = $id_usuario;
        
        if(!$usuario->readOne()) {
            http_response_code(401);
            echo json_encode(["message" => "Usuário não encontrado ou inativo"]);
            exit();
        }
        
        return $id_usuario;
    }
}
?>