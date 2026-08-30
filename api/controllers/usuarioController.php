<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

class UsuarioController {
    private $usuario;
    private $id_usuario_logado;
    
    public function __construct($db, $id_usuario_logado = null) {
        $this->usuario = new Usuario($db);
        $this->id_usuario_logado = $id_usuario_logado;
    }
    
    private function getUserId() {
        if(!$this->id_usuario_logado) {
            http_response_code(401);
            echo json_encode(["message" => "Usuário não autenticado"]);
            exit();
        }
        return $this->id_usuario_logado;
    }
    
    public function listar() {
        $id_usuario = $this->getUserId();
        $stmt = $this->usuario->read();
        
        $usuarios = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            array_push($usuarios, $row);
        }
        
        echo json_encode($usuarios);
    }
    
    public function buscar($id) {
        $id_usuario = $this->getUserId();
        
        // Só pode ver o próprio perfil ou se for admin (aqui vou deixar só o próprio)
        if($id != $id_usuario) {
            http_response_code(403);
            echo json_encode(["message" => "Você só pode acessar seu próprio perfil"]);
            return;
        }
        
        $this->usuario->id_usuario = $id;
        
        if($this->usuario->readOne()) {
            echo json_encode([
                "id_usuario" => $this->usuario->id_usuario,
                "nome" => $this->usuario->nome,
                "email" => $this->usuario->email,
                "foto" => $this->usuario->foto,
                "plano" => $this->usuario->plano,
                "tipo_dom" => $this->usuario->tipo_dom,
                "clas_inteli" => !empty($this->usuario->clas_inteli) ? json_decode($this->usuario->clas_inteli) : null
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Usuário não encontrado"]);
        }
    }
    
    public function atualizar() {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        $this->usuario->id_usuario = $id_usuario;
        
        if(!$this->usuario->readOne()) {
            http_response_code(404);
            echo json_encode(["message" => "Usuário não encontrado"]);
            return;
        }
        
        // Impedir que o teste seja refeito caso tipo_dom já esteja definido no banco de dados
        if (isset($data->tipo_dom) || isset($data->clas_inteli)) {
            if (!empty($this->usuario->tipo_dom) && $this->usuario->tipo_dom !== '') {
                http_response_code(400);
                echo json_encode(["message" => "Você já realizou o teste de inteligência e não pode refazê-lo."]);
                return;
            }
        }
        
        $this->usuario->nome = $data->nome ?? $this->usuario->nome;
        $this->usuario->email = $data->email ?? $this->usuario->email;
        $this->usuario->foto = isset($data->foto) ? $data->foto : $this->usuario->foto;
        $this->usuario->plano = $data->plano ?? $this->usuario->plano;
        $this->usuario->tipo_dom = $data->tipo_dom ?? $this->usuario->tipo_dom;
        $this->usuario->clas_inteli = isset($data->clas_inteli) ? json_encode($data->clas_inteli) : $this->usuario->clas_inteli;
        
        if($this->usuario->update()) {
            echo json_encode(["message" => "Usuário atualizado com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao atualizar usuário"]);
        }
    }
    
    public function deletar() {
        $id_usuario = $this->getUserId();
        
        $this->usuario->id_usuario = $id_usuario;
        
        if(!$this->usuario->readOne()) {
            http_response_code(404);
            echo json_encode(["message" => "Usuário não encontrado"]);
            return;
        }
        
        if($this->usuario->delete()) {
            echo json_encode(["message" => "Usuário desativado com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao desativar usuário"]);
        }
    }
}
?>