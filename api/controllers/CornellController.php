<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

class CornellController {
    private $cornell;
    private $id_usuario_logado;
    
    public function __construct($db, $id_usuario_logado = null) {
        $this->cornell = new Cornell($db);
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
        $stmt = $this->cornell->read($id_usuario);
        
        $notas = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $notas[] = $row;
        }
        
        echo json_encode($notas);
    }
    
    public function buscar($id) {
        $id_usuario = $this->getUserId();
        $this->cornell->id_cornell = $id;
        
        if($this->cornell->readOne() && $this->cornell->id_usuario == $id_usuario) {
            echo json_encode([
                "id_cornell" => $this->cornell->id_cornell,
                "titulo" => $this->cornell->titulo,
                "pergunta" => $this->cornell->pergunta,
                "resposta" => $this->cornell->resposta,
                "resumo" => $this->cornell->resumo,
                "data_criacao" => $this->cornell->data_criacao
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Nota Cornell não encontrada"]);
        }
    }
    
    public function criar() {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        $this->cornell->id_usuario = $id_usuario;
        $this->cornell->titulo = $data->titulo ?? 'Nota Cornell';
        $this->cornell->pergunta = $data->pergunta ?? '';
        $this->cornell->resposta = $data->resposta ?? '';
        $this->cornell->resumo = $data->resumo ?? '';
        
        if($this->cornell->create()) {
            http_response_code(201);
            echo json_encode([
                "message" => "Nota Cornell criada com sucesso",
                "id_cornell" => $this->cornell->id_cornell
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao criar nota Cornell"]);
        }
    }
    
    public function atualizar($id) {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        $this->cornell->id_cornell = $id;
        
        if(!$this->cornell->readOne() || $this->cornell->id_usuario != $id_usuario) {
            http_response_code(404);
            echo json_encode(["message" => "Nota Cornell não encontrada"]);
            return;
        }
        
        $this->cornell->id_usuario = $id_usuario;
        $this->cornell->titulo = $data->titulo ?? $this->cornell->titulo;
        $this->cornell->pergunta = $data->pergunta ?? $this->cornell->pergunta;
        $this->cornell->resposta = $data->resposta ?? $this->cornell->resposta;
        $this->cornell->resumo = $data->resumo ?? $this->cornell->resumo;
        
        if($this->cornell->update()) {
            echo json_encode(["message" => "Nota Cornell atualizada com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao atualizar nota Cornell"]);
        }
    }
    
    public function deletar($id) {
        $id_usuario = $this->getUserId();
        $this->cornell->id_cornell = $id;
        
        if(!$this->cornell->readOne() || $this->cornell->id_usuario != $id_usuario) {
            http_response_code(404);
            echo json_encode(["message" => "Nota Cornell não encontrada"]);
            return;
        }
        
        $this->cornell->id_usuario = $id_usuario;
        if($this->cornell->delete()) {
            echo json_encode(["message" => "Nota Cornell excluída com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao excluir nota Cornell"]);
        }
    }
}
?>
