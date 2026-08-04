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
        $headers = getallheaders();
        
        if(!isset($headers['Authorization'])) {
            http_response_code(401);
            echo json_encode(["message" => "Token não fornecido"]);
            exit();
        }
        
        $token = str_replace('Bearer ', '', $headers['Authorization']);
        
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