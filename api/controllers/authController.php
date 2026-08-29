<?php
class AuthController {
    private $usuario;
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
        $this->usuario = new Usuario($db);
    }
    
    public function register() {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!$data || empty($data->nome) || empty($data->email) || empty($data->senha)) {
            http_response_code(400);
            echo json_encode(["message" => "Nome, email e senha são obrigatórios"]);
            return;
        }

        // Verificar se o e-mail já está cadastrado
        if ($this->usuario->emailExiste($data->email)) {
            http_response_code(400);
            echo json_encode(["message" => "Este e-mail já está cadastrado"]);
            return;
        }
        
        $this->usuario->nome = $data->nome;
        $this->usuario->email = $data->email;
        $this->usuario->senha = $data->senha;
        $this->usuario->plano = $data->plano ?? 'Gratuito';
        
        if ($this->usuario->create()) {
            http_response_code(201);
            echo json_encode(["message" => "Usuário criado com sucesso", "id_usuario" => $this->usuario->id_usuario]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao criar usuário"]);
        }
    }

    public function login() {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!$data || empty($data->email) || empty($data->senha)) {
            http_response_code(400);
            echo json_encode(["message" => "Email e senha são obrigatórios"]);
            return;
        }
        
        if ($this->usuario->findByEmail($data->email)) {
            if (password_verify($data->senha, $this->usuario->senha)) {
                $token = base64_encode($this->usuario->id_usuario . ':' . time());
                
                http_response_code(200);
                echo json_encode([
                    "message" => "Login realizado com sucesso",
                    "token" => $token,
                    "user" => [
                        "id" => $this->usuario->id_usuario,
                        "id_usuario" => $this->usuario->id_usuario,
                        "nome" => $this->usuario->nome,
                        "email" => $this->usuario->email,
                        "plano" => $this->usuario->plano,
                        "tipo_dom" => $this->usuario->tipo_dom
                    ]
                ]);
                return;
            }
        }
        
        http_response_code(401);
        echo json_encode(["message" => "Email ou senha incorretos"]);
    }
}
?>