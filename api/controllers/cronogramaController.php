<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

class CronogramaController {
    private $cronograma;
    private $id_usuario_logado;
    
    public function __construct($db, $id_usuario_logado = null) {
        $this->cronograma = new Cronograma($db);
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
        $stmt = $this->cronograma->read($id_usuario);
        
        $cronogramas = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            array_push($cronogramas, $row);
        }
        
        echo json_encode($cronogramas);
    }
    
    public function criar() {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        if(empty($data->id_materia) || empty($data->dia_semana) || 
           empty($data->hora_inicio) || empty($data->hora_final)) {
            http_response_code(400);
            echo json_encode(["message" => "Matéria, dia da semana, hora início e hora final são obrigatórios"]);
            return;
        }
        
        $this->cronograma->id_usuario = $id_usuario;
        $this->cronograma->id_materia = $data->id_materia;
        $this->cronograma->dia_semana = $data->dia_semana;
        $this->cronograma->hora_inicio = $data->hora_inicio;
        $this->cronograma->hora_final = $data->hora_final;
        
        if($this->cronograma->create()) {
            http_response_code(201);
            echo json_encode([
                "message" => "Cronograma criado com sucesso",
                "id_cronograma" => $this->cronograma->id_cronograma
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao criar cronograma. Verifique se o usuário e a matéria existem."]);
        }
    }
    
    public function atualizar($id) {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        $this->cronograma->id_cronograma = $id;
        $this->cronograma->id_usuario = $id_usuario;
        
        $this->cronograma->id_materia = $data->id_materia ?? null;
        $this->cronograma->dia_semana = $data->dia_semana ?? null;
        $this->cronograma->hora_inicio = $data->hora_inicio ?? null;
        $this->cronograma->hora_final = $data->hora_final ?? null;
        
        if($this->cronograma->update()) {
            echo json_encode(["message" => "Cronograma atualizado com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao atualizar cronograma"]);
        }
    }
    
    public function deletar($id) {
        $id_usuario = $this->getUserId();
        
        $this->cronograma->id_cronograma = $id;
        $this->cronograma->id_usuario = $id_usuario;
        
        if($this->cronograma->delete()) {
            echo json_encode(["message" => "Cronograma deletado com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao deletar cronograma"]);
        }
    }
}
?>