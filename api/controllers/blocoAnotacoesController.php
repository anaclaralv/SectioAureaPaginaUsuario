<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

class BlocoController {
    private $bloco;
    private $id_usuario_logado;
    
    public function __construct($db, $id_usuario_logado = null) {
        $this->bloco = new Bloco($db);
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
        $stmt = $this->bloco->read($id_usuario);
        
        $blocos = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            array_push($blocos, $row);
        }
        
        echo json_encode($blocos);
    }
    
    public function buscar($id) {
        $id_usuario = $this->getUserId();
        $this->bloco->id_anotacao = $id;
        
        if($this->bloco->readOne() && $this->bloco->id_usuario == $id_usuario) {
            echo json_encode([
                "id_anotacao" => $this->bloco->id_anotacao,
                "conteudo" => $this->bloco->conteudo,
                "cor_nota" => $this->bloco->cor_nota
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Anotação não encontrada"]);
        }
    }
    
    public function criar() {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        if(empty($data->conteudo)) {
            http_response_code(400);
            echo json_encode(["message" => "Conteúdo da anotação é obrigatório"]);
            return;
        }
        
        $this->bloco->conteudo = $data->conteudo;
        $this->bloco->id_usuario = $id_usuario;
        $this->bloco->cor_nota = $data->cor_nota ?? '#FFFF00';
        
        if($this->bloco->create()) {
            http_response_code(201);
            echo json_encode([
                "message" => "Anotação criada com sucesso",
                "id_anotacao" => $this->bloco->id_anotacao
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao criar anotação. Verifique se o usuário existe."]);
        }
    }
    
    public function atualizar($id) {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        $this->bloco->id_anotacao = $id;
        
        if(!$this->bloco->readOne() || $this->bloco->id_usuario != $id_usuario) {
            http_response_code(404);
            echo json_encode(["message" => "Anotação não encontrada"]);
            return;
        }
        
        $this->bloco->conteudo = $data->conteudo ?? $this->bloco->conteudo;
        $this->bloco->cor_nota = $data->cor_nota ?? $this->bloco->cor_nota;
        $this->bloco->id_usuario = $id_usuario;
        
        if($this->bloco->update()) {
            echo json_encode(["message" => "Anotação atualizada com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao atualizar anotação"]);
        }
    }
    
    public function deletar($id) {
        $id_usuario = $this->getUserId();
        
        $this->bloco->id_anotacao = $id;
        
        if(!$this->bloco->readOne() || $this->bloco->id_usuario != $id_usuario) {
            http_response_code(404);
            echo json_encode(["message" => "Anotação não encontrada"]);
            return;
        }
        
        $this->bloco->id_usuario = $id_usuario;
        
        if($this->bloco->delete()) {
            echo json_encode(["message" => "Anotação deletada com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao deletar anotação"]);
        }
    }
}
?>