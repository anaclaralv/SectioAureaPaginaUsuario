<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

class MateriaController {
    private $materia;
    private $id_usuario_logado;
    
    public function __construct($db, $id_usuario_logado = null) {
        $this->materia = new Materia($db);
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
        $stmt = $this->materia->read($id_usuario);
        
        $materias = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            array_push($materias, $row);
        }
        
        echo json_encode($materias);
    }
    
    public function buscar($id) {
        $id_usuario = $this->getUserId();
        $this->materia->id_materia = $id;
        
        if($this->materia->readOne() && $this->materia->id_usuario == $id_usuario) {
            echo json_encode([
                "id_materia" => $this->materia->id_materia,
                "nome" => $this->materia->nome,
                "cor" => $this->materia->cor
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Matéria não encontrada"]);
        }
    }
    
    public function criar() {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        if(empty($data->nome)) {
            http_response_code(400);
            echo json_encode(["message" => "Nome da matéria é obrigatório"]);
            return;
        }
        
        $this->materia->nome = $data->nome;
        $this->materia->cor = $data->cor ?? '#FFFFFF';
        $this->materia->id_usuario = $id_usuario;
        
        if($this->materia->create()) {
            http_response_code(201);
            echo json_encode([
                "message" => "Matéria criada com sucesso",
                "id_materia" => $this->materia->id_materia
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao criar matéria. Verifique se o usuário existe."]);
        }
    }
    
    public function atualizar($id) {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        $this->materia->id_materia = $id;
        
        if(!$this->materia->readOne() || $this->materia->id_usuario != $id_usuario) {
            http_response_code(404);
            echo json_encode(["message" => "Matéria não encontrada"]);
            return;
        }
        
        $this->materia->nome = $data->nome ?? $this->materia->nome;
        $this->materia->cor = $data->cor ?? $this->materia->cor;
        
        if($this->materia->update()) {
            echo json_encode(["message" => "Matéria atualizada com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao atualizar matéria"]);
        }
    }
    
    public function deletar($id) {
        $id_usuario = $this->getUserId();
        
        $this->materia->id_materia = $id;
        
        if(!$this->materia->readOne() || $this->materia->id_usuario != $id_usuario) {
            http_response_code(404);
            echo json_encode(["message" => "Matéria não encontrada"]);
            return;
        }
        
        $this->materia->id_usuario = $id_usuario;
        
        if($this->materia->delete()) {
            echo json_encode(["message" => "Matéria deletada com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao deletar matéria"]);
        }
    }
}
?>